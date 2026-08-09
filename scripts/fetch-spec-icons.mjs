/**
 * Downloads the WoW specialization icons used by the Assisted Combat explorer
 * into public/images/wow-spec-icons/, and records the spec -> icon-name map in
 * src/lib/assisted-combat-spec-icons.json.
 *
 *   npm run data:spec-icons              reuse the committed map, fetch missing icons
 *   npm run data:spec-icons -- --resolve re-derive the map from game data
 *   npm run data:spec-icons -- --force   re-download every icon
 *
 * Resolving walks the same chain the rest of the page's data comes from, so the
 * icons stay pinned to the same build:
 *   ChrSpecialization (wago.tools, pinned build) -> SpellIconFileID
 *   community listfile               -> interface/icons/<name>.blp
 *   wow.zamimg.com                   -> <name>.jpg
 * The listfile is ~100 MB, so it is streamed and filtered rather than stored;
 * that is why the resolved map is committed and reused by default.
 */
import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const dataPath = path.join(repoRoot, "src", "lib", "assisted-combat-data.json");
const mapPath = path.join(repoRoot, "src", "lib", "assisted-combat-spec-icons.json");
const iconDir = path.join(repoRoot, "public", "images", "wow-spec-icons");

const LISTFILE_URL = "https://github.com/wowdev/wow-listfile/releases/latest/download/community-listfile.csv";
const ICON_CDN = "https://wow.zamimg.com/images/wow/icons/large";

const args = new Set(process.argv.slice(2));
const forceResolve = args.has("--resolve");
const forceDownload = args.has("--force");

const research = JSON.parse(await fs.readFile(dataPath, "utf8"));
const specs = research.specs.map((spec) => ({
  specId: spec.specId,
  key: `${spec.gameClass}|${spec.spec}`,
}));

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field); field = ""; rows.push(row); row = []; }
    else if (char !== "\r") field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function loadExistingMap() {
  try {
    return JSON.parse(await fs.readFile(mapPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

/** specId -> SpellIconFileID, from the same build the APL data is pinned to. */
async function fetchIconFileIds() {
  const url = `https://wago.tools/db2/ChrSpecialization/csv?build=${research.liveBuild}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ChrSpecialization fetch failed: ${res.status} ${url}`);
  const rows = parseCsv(await res.text());
  const header = rows.shift();
  const idIndex = header.indexOf("ID");
  const iconIndex = header.indexOf("SpellIconFileID");
  if (idIndex === -1 || iconIndex === -1) throw new Error("ChrSpecialization is missing ID/SpellIconFileID columns.");

  const bySpecId = new Map();
  for (const row of rows) {
    if (row.length < 4) continue;
    const fileId = Number(row[iconIndex]);
    if (fileId) bySpecId.set(Number(row[idIndex]), fileId);
  }
  return bySpecId;
}

/** FileDataID -> icon name, by streaming the listfile and keeping only our rows. */
async function fetchIconNames(fileIds) {
  const wanted = new Set(fileIds);
  const found = new Map();
  const res = await fetch(LISTFILE_URL);
  if (!res.ok) throw new Error(`Listfile fetch failed: ${res.status}`);

  let carry = "";
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    carry += decoder.decode(chunk, { stream: true });
    const lines = carry.split("\n");
    carry = lines.pop() ?? "";
    for (const line of lines) {
      const split = line.indexOf(";");
      if (split === -1) continue;
      const fileId = Number(line.slice(0, split));
      if (!wanted.has(fileId)) continue;
      const match = line.slice(split + 1).trim().match(/^interface\/icons\/(.+)\.blp$/i);
      if (match) found.set(fileId, match[1].toLowerCase());
    }
    if (found.size === wanted.size) break;
  }
  return found;
}

async function resolveMap() {
  console.log(`Resolving spec icons from ChrSpecialization @ ${research.liveBuild}…`);
  const fileIdBySpec = await fetchIconFileIds();

  const missingFileId = specs.filter((spec) => !fileIdBySpec.has(spec.specId));
  if (missingFileId.length) {
    throw new Error(`No SpellIconFileID for: ${missingFileId.map((s) => s.key).join(", ")}`);
  }

  console.log("Streaming the community listfile to resolve icon names…");
  const names = await fetchIconNames(specs.map((spec) => fileIdBySpec.get(spec.specId)));

  const map = {};
  const unresolved = [];
  for (const spec of specs) {
    const name = names.get(fileIdBySpec.get(spec.specId));
    if (name) map[spec.specId] = name;
    else unresolved.push(spec.key);
  }
  if (unresolved.length) throw new Error(`No listfile entry for: ${unresolved.join(", ")}`);

  await fs.writeFile(mapPath, `${JSON.stringify(map, null, 2)}\n`, "utf8");
  console.log(`Wrote ${Object.keys(map).length} spec icon names to ${mapPath}`);
  return map;
}

const existing = await loadExistingMap();
const covered = existing && specs.every((spec) => existing[spec.specId]);
const iconMap = forceResolve || !covered ? await resolveMap() : existing;
if (!forceResolve && covered) console.log(`Reusing committed icon map (${Object.keys(iconMap).length} specs). Pass --resolve to re-derive.`);

await fs.mkdir(iconDir, { recursive: true });

let downloaded = 0;
let skipped = 0;
for (const name of [...new Set(Object.values(iconMap))]) {
  const target = path.join(iconDir, `${name}.jpg`);
  if (!forceDownload) {
    try {
      await fs.access(target);
      skipped++;
      continue;
    } catch {
      // not cached yet — fall through and download
    }
  }
  const url = `${ICON_CDN}/${name}.jpg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Icon fetch failed: ${res.status} ${url}`);
  await fs.writeFile(target, Buffer.from(await res.arrayBuffer()));
  downloaded++;
}

const files = (await fs.readdir(iconDir)).filter((file) => file.endsWith(".jpg"));
const total = (await Promise.all(files.map(async (file) => (await fs.stat(path.join(iconDir, file))).size)))
  .reduce((sum, size) => sum + size, 0);
console.log(`Icons: ${downloaded} downloaded, ${skipped} already present — ${files.length} files, ${(total / 1024).toFixed(1)} KB in ${path.relative(repoRoot, iconDir)}`);
