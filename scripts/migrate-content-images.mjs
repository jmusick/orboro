import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_IMAGES = path.join(ROOT, "public", "images");
const WRANGLER = path.join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const BUCKET = "orboro-net-media";
const LOCAL_BASE = "/media";
const REMOTE_BASE = "https://media.orboro.net";
const args = new Set(process.argv.slice(2));

if (args.has("--help")) {
  console.log(`Migrate content-referenced images from public/images into R2.

Usage:
  node scripts/migrate-content-images.mjs --local [--apply]
  node scripts/migrate-content-images.mjs --remote [--apply]

Without --apply, this prints a dry-run manifest. --local reads/writes the local
D1 and R2 stores used by wrangler dev. --remote reads/writes production D1/R2.
The script uploads objects before updating URLs and never deletes source files.`);
  process.exit(0);
}

const isLocal = args.has("--local");
const isRemote = args.has("--remote");
const apply = args.has("--apply");
if (isLocal === isRemote) {
  throw new Error("Specify exactly one target: --local or --remote.");
}

function runWrangler(wranglerArgs) {
  try {
    return execFileSync(process.execPath, [WRANGLER, ...wranglerArgs], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch (error) {
    process.stderr.write(error.stderr?.toString() ?? "");
    throw new Error(`Wrangler command failed: ${wranglerArgs.join(" ")}`);
  }
}

function parseWranglerJson(output) {
  const start = output.indexOf("[");
  if (start < 0) throw new Error("Wrangler did not return JSON results.");
  return JSON.parse(output.slice(start));
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function extractImages(value) {
  if (!value) return [];
  const found = [];
  const markdown = /!\[[^\]]*\]\(([^)]+)\)/g;
  const htmlImage = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi;
  for (const match of value.matchAll(markdown)) found.push(match[1].trim());
  for (const match of value.matchAll(htmlImage)) found.push(match[1].trim());
  return found;
}

function imagePathFromUrl(value) {
  let parsed;
  try {
    parsed = new URL(value, "https://orboro.net");
  } catch {
    return null;
  }
  if (!["orboro.net", "www.orboro.net", "media.orboro.net"].includes(parsed.hostname)) return null;

  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
  if (pathname.startsWith("/media/images/")) return pathname.slice("/media".length);
  if (pathname.startsWith("/images/")) return pathname;
  return null;
}

function needsUpload(value) {
  try {
    const parsed = new URL(value, "https://orboro.net");
    if (parsed.hostname === "media.orboro.net") return false;
    if (isLocal && parsed.pathname.startsWith("/media/images/")) return false;
    return true;
  } catch {
    return false;
  }
}

function localFileForImage(imagePath) {
  const relative = imagePath.slice("/images/".length);
  const filePath = path.resolve(PUBLIC_IMAGES, ...relative.split("/"));
  if (!filePath.startsWith(`${PUBLIC_IMAGES}${path.sep}`)) return null;
  return filePath;
}

function publicUrl(imagePath, query, hash) {
  const base = isLocal ? LOCAL_BASE : REMOTE_BASE;
  return `${base}${imagePath}${query}${hash}`;
}

function collectRowChanges(row, kind) {
  const candidates = kind === "content"
    ? [row.featured_image_url, ...extractImages(row.markdown)]
    : [row.url];
  const replacements = new Map();
  for (const original of candidates) {
    if (!original) continue;
    let parsed;
    try {
      parsed = new URL(original, "https://orboro.net");
    } catch {
      continue;
    }
    const imagePath = imagePathFromUrl(original);
    if (!imagePath) continue;
    if (isLocal && parsed.hostname === "media.orboro.net") continue;
    const next = publicUrl(imagePath, parsed.search, parsed.hash);
    if (next !== original) replacements.set(original, next);
  }
  return [...replacements.entries()];
}

const targetFlag = isLocal ? "--local" : "--remote";
const query = "SELECT id, slug, page_type, featured_image_url, markdown FROM content; SELECT id, url FROM media;";
const queryOutput = runWrangler(["d1", "execute", "DB", targetFlag, "--json", "--command", query]);
const resultSets = parseWranglerJson(queryOutput);
const contentRows = resultSets[0]?.results ?? [];
const mediaRows = resultSets[1]?.results ?? [];
const assets = new Map();
const contentChanges = [];
const mediaChanges = [];
const unhandled = new Set();

for (const row of contentRows) {
  const candidates = [row.featured_image_url, ...extractImages(row.markdown)];
  for (const candidate of candidates) {
    if (candidate && !imagePathFromUrl(candidate) && /(?:orboro\.net|media\.orboro\.net).*\.(?:png|jpe?g|gif|webp|avif)/i.test(candidate)) {
      unhandled.add(candidate);
    }
    const imagePath = imagePathFromUrl(candidate);
    if (imagePath && needsUpload(candidate)) {
      const filePath = localFileForImage(imagePath);
      if (!filePath) throw new Error(`Unsafe image path: ${imagePath}`);
      assets.set(imagePath.slice(1), filePath);
    }
  }
  for (const [oldUrl, newUrl] of collectRowChanges(row, "content")) {
    contentChanges.push({ id: row.id, oldUrl, newUrl });
  }
}

for (const row of mediaRows) {
  const imagePath = imagePathFromUrl(row.url);
  if (imagePath && needsUpload(row.url)) {
    const filePath = localFileForImage(imagePath);
    if (!filePath) throw new Error(`Unsafe image path: ${imagePath}`);
    assets.set(imagePath.slice(1), filePath);
  }
  for (const [oldUrl, newUrl] of collectRowChanges(row, "media")) {
    mediaChanges.push({ id: row.id, oldUrl, newUrl });
  }
}

const missing = [];
for (const [key, filePath] of assets) {
  try {
    await readFile(filePath);
  } catch {
    missing.push(`${key} (expected ${filePath})`);
  }
}
if (missing.length) {
  throw new Error(`Source images are missing from public/images:\n${missing.join("\n")}`);
}
if (unhandled.size) {
  console.warn(`Unrecognized Orboro image URLs left unchanged:\n${[...unhandled].join("\n")}`);
}

console.log(`Target: ${isLocal ? "local Wrangler D1 + R2" : "remote production D1 + R2"}`);
console.log(`Images to copy: ${assets.size}`);
console.log(`Content rows to update: ${new Set(contentChanges.map((change) => change.id)).size}`);
console.log(`Media records to update: ${new Set(mediaChanges.map((change) => change.id)).size}`);
for (const [key, filePath] of assets) console.log(`  ${key} <= ${path.relative(ROOT, filePath)}`);

if (!apply) {
  console.log("Dry run only. Add --apply to upload these images and update this target database.");
  process.exit(0);
}

for (const [key, filePath] of assets) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
  }[extension];
  if (!contentType) throw new Error(`Unsupported image extension: ${filePath}`);
  runWrangler([
    "r2", "object", "put", `${BUCKET}/${key}`, targetFlag,
    "--file", filePath,
    "--content-type", contentType,
    "--cache-control", "public, max-age=31536000, immutable",
  ]);
}

const statements = [];
for (const row of contentRows) {
  const changes = contentChanges.filter((change) => change.id === row.id);
  if (!changes.length) continue;
  let featured = "featured_image_url";
  let markdown = "markdown";
  for (const { oldUrl, newUrl } of changes) {
    featured = `replace(${featured}, ${sqlString(oldUrl)}, ${sqlString(newUrl)})`;
    markdown = `replace(${markdown}, ${sqlString(oldUrl)}, ${sqlString(newUrl)})`;
  }
  statements.push(`UPDATE content SET featured_image_url = ${featured}, markdown = ${markdown} WHERE id = ${sqlString(row.id)};`);
}
for (const row of mediaRows) {
  const changes = mediaChanges.filter((change) => change.id === row.id);
  if (!changes.length) continue;
  let url = "url";
  for (const { oldUrl, newUrl } of changes) {
    url = `replace(${url}, ${sqlString(oldUrl)}, ${sqlString(newUrl)})`;
  }
  statements.push(`UPDATE media SET url = ${url} WHERE id = ${sqlString(row.id)};`);
}

if (statements.length) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "orboro-media-migration-"));
  const sqlFile = path.join(tempDirectory, "rewrite-content-media.sql");
  try {
    await writeFile(sqlFile, statements.join("\n"), "utf8");
    runWrangler(["d1", "execute", "DB", targetFlag, "--file", sqlFile]);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

console.log("Migration complete. Source images were kept in public/images.");
