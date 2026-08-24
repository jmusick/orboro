/**
 * Regenerates src/lib/assisted-combat-data.json from the raw Assisted Combat
 * research outputs.
 *
 * The inputs are not in this repo. Point the script at them with:
 *   ASSISTED_COMBAT_RESEARCH_ROOT  Wago DB2 export + the SimC comparison run
 *                                  (assisted-combat-<source-build>.md/.csv,
 *                                   simc-comparison-data.json)
 *   ASSISTED_COMBAT_VAULT_ROOT     curated writeups
 *                                  (assisted-combat-whats-missing-by-spec.md,
 *                                   assisted-combat-vs-icy-veins.md)
 *
 * Every number written to the payload is derived from those inputs; only the
 * pinned build/commit identifiers below are typed by hand. The researched
 * 12.1 source build and the current live build have identical Assisted Combat
 * tables; keeping both identifiers makes that provenance explicit.
 */
import fs from "node:fs/promises";
import path from "node:path";

const CURRENT_BUILD = "12.1.0.69404";
const SOURCE_BUILD = "12.1.0.69111";
const SIMC_BRANCH = "midnight";
const SIMC_COMMIT = "a87874b5bfc88afb06922c7012e89b4b94aabc56";
const RESEARCHED_AT = "2026-08-06";
const VERIFIED_AT = "2026-08-24";

const repoRoot = path.resolve(import.meta.dirname, "..");
const researchRoot =
  process.env.ASSISTED_COMBAT_RESEARCH_ROOT
  ?? "C:/Users/JD/Projects/orboro/games/world-of-warcraft/assisted-combat/source-snapshot/2026-08-06";
const vaultRoot =
  process.env.ASSISTED_COMBAT_VAULT_ROOT
  ?? "C:/Users/JD/Vault/Research/Games/World of Warcraft/Assisted Combat";
const outputPath = path.join(repoRoot, "src", "lib", "assisted-combat-data.json");

const buildSlug = (build) => build.replace(/\./g, "-");

async function read(root, name, envVar) {
  try {
    return await fs.readFile(path.join(root, name), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    throw new Error(
      `Could not read "${name}" under ${root}.\n`
        + `These research inputs are not checked into the repo — set ${envVar} to the directory that holds them.`
    );
  }
}

const readResearch = (name) => read(researchRoot, name, "ASSISTED_COMBAT_RESEARCH_ROOT");
const readVault = (name) => read(vaultRoot, name, "ASSISTED_COMBAT_VAULT_ROOT");

const [simcJson, missingMd, icyMd, currentMd, currentCsv] = await Promise.all([
  readResearch("simc-comparison-data.json"),
  readVault("assisted-combat-whats-missing-by-spec.md"),
  readVault("assisted-combat-vs-icy-veins.md"),
  readResearch(`assisted-combat-${buildSlug(SOURCE_BUILD)}.md`),
  readResearch(`assisted-combat-${buildSlug(SOURCE_BUILD)}.csv`),
]);

const simcRows = JSON.parse(simcJson);

const roleByKey = new Map();
for (const key of [
  "Death Knight|Blood", "Demon Hunter|Vengeance", "Druid|Guardian", "Monk|Brewmaster",
  "Paladin|Protection", "Warrior|Protection",
]) roleByKey.set(key, "Tank");
for (const key of [
  "Druid|Restoration", "Evoker|Preservation", "Monk|Mistweaver", "Paladin|Holy",
  "Priest|Discipline", "Priest|Holy", "Shaman|Restoration",
]) roleByKey.set(key, "Healer");
roleByKey.set("Evoker|Augmentation", "Support DPS");

/** Minimal RFC 4180 reader — the DB2 exports quote fields containing commas. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
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

/** Steps with no conditions still produce a CSV row, but with a blank RuleID. */
function countRules(csv, label) {
  const rows = parseCsv(csv).filter((row) => row.length > 1);
  const header = rows.shift();
  const ruleIdIndex = header.indexOf("RuleID");
  if (ruleIdIndex === -1) throw new Error(`No RuleID column in the ${label} CSV export.`);
  const ids = new Set();
  for (const row of rows) {
    const id = (row[ruleIdIndex] ?? "").trim();
    if (id) ids.add(id);
  }
  return ids.size;
}

function parseMissing(markdown) {
  const result = new Map();
  let gameClass = "";
  let current = null;
  let bucket = "";
  for (const line of markdown.split(/\r?\n/)) {
    const classMatch = line.match(/^## (.+)$/);
    if (classMatch && classMatch[1] !== "Common omissions") {
      gameClass = classMatch[1];
      continue;
    }
    const specMatch = line.match(/^- \*\*(.+)\*\*$/);
    if (specMatch) {
      current = { actions: [], logic: [], limitation: [] };
      result.set(`${gameClass}|${specMatch[1]}`, current);
      continue;
    }
    if (!current) continue;
    const bucketMatch = line.match(/^  - (Missing actions?|Missing logic|PTR|Not comparable):$/);
    if (bucketMatch) {
      bucket = bucketMatch[1].startsWith("Missing action") ? "actions"
        : bucketMatch[1] === "Missing logic" ? "logic"
        : bucketMatch[1] === "Not comparable" ? "limitation" : "";
      continue;
    }
    const itemMatch = line.match(/^    - (.+)$/);
    if (itemMatch && bucket) current[bucket].push(itemMatch[1]);
  }
  return result;
}

function parseIcy(markdown) {
  const result = new Map();
  const lines = markdown.split(/\r?\n/);
  let gameClass = "";
  for (let i = 0; i < lines.length; i++) {
    const classMatch = lines[i].match(/^## (.+)$/);
    if (classMatch && !["How to read the ratings", "Important scope notes"].includes(classMatch[1])) {
      gameClass = classMatch[1];
      continue;
    }
    const specMatch = lines[i].match(/^### \[([^\]]+)\]\(([^)]+)\) — (.+)$/);
    if (!specMatch) continue;
    const [, spec, url, rating] = specMatch;
    let summary = "";
    for (let j = i + 1; j < lines.length && !/^### |^## /.test(lines[j]); j++) {
      const trimmed = lines[j].trim();
      if (!summary && trimmed && !trimmed.startsWith("**PTR effect:**")) summary = trimmed;
    }
    result.set(`${gameClass}|${spec}`, { rating, url, summary });
  }
  return result;
}

function parseApl(markdown) {
  const result = new Map();
  let gameClass = "";
  let current = null;
  for (const line of markdown.split(/\r?\n/)) {
    const classMatch = line.match(/^## (.+)$/);
    if (classMatch) {
      gameClass = classMatch[1];
      continue;
    }
    const specMatch = line.match(/^### (.+) \(spec (\d+), AssistedCombat (\d+)\)$/);
    if (specMatch) {
      current = {
        gameClass,
        spec: specMatch[1],
        specId: Number(specMatch[2]),
        assistedCombatId: Number(specMatch[3]),
        steps: [],
      };
      result.set(`${gameClass}|${specMatch[1]}`, current);
      continue;
    }
    if (!current) continue;
    const stepMatch = line.match(/^(\d+)\. \*\*(.+?)\*\* — (.+?) _\(step (\d+)\)_$/);
    if (!stepMatch) continue;
    const [, priority, label, condition, stepId] = stepMatch;
    const spellMatch = label.match(/^(.*) \[(\d+)\]$/);
    current.steps.push({
      priority: Number(priority),
      action: spellMatch?.[1] ?? label,
      spellId: spellMatch ? Number(spellMatch[2]) : null,
      condition,
      stepId: Number(stepId),
      automationOnly: condition.includes("automation-only"),
    });
  }
  return result;
}

const missingBySpec = parseMissing(missingMd);
const icyBySpec = parseIcy(icyMd);
const currentApl = parseApl(currentMd);

function currentGuideSummary(summary) {
  return summary
    .replace(/\bcurrent live guide\b/gi, "pinned guide snapshot")
    .replace(/\bLive Assisted Combat\b/g, "Assisted Combat")
    .replace(/\bThe live list\b/g, "The 12.1 list")
    .replace(/\bPTR-only\b/g, "specific to 12.1")
    .replace(/\bPTR’s\b/g, "The 12.1 list’s")
    .replace(/\bPTR's\b/g, "The 12.1 list's")
    .replace(/\bPTR\b/g, "The 12.1 list");
}

function currentMissingActions(items, blizzardActions) {
  const labels = new Set(blizzardActions.map((action) => action.replace(/_/g, " ").toLowerCase()));
  return items.filter((item) => {
    const normalized = item.toLowerCase().replace(/^live /, "").replace(/ handling$/, "");
    return !labels.has(normalized);
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

const specs = simcRows.map((row) => {
  const key = `${row.class}|${row.spec}`;
  const missing = missingBySpec.get(key) ?? { actions: [], logic: [], limitation: [] };
  const icy = icyBySpec.get(key) ?? { rating: "Not comparable", url: "", summary: "" };
  const current = currentApl.get(key);
  if (!current) throw new Error(`Missing parsed APL for ${key}`);
  const usesSeason2SimcProfile = row.has_true_ptr_profile && row.simc_ptr_actions.length > 0;
  const simcActions = usesSeason2SimcProfile ? row.simc_ptr_actions : row.simc_live_actions;
  const simcProfiles = usesSeason2SimcProfile ? row.ptr_profiles : row.live_profiles;
  const simcActionLines = usesSeason2SimcProfile ? row.simc_ptr_entries : row.simc_live_entries;
  const blizzardActions = row.blizzard_ptr_actions;
  const sharedActions = blizzardActions.filter((action) => simcActions.includes(action));
  return {
    gameClass: row.class,
    spec: row.spec,
    specId: current.specId,
    assistedCombatId: current.assistedCombatId,
    role: roleByKey.get(key) ?? "DPS",
    steps: current.steps,
    simcComparable: row.supported,
    overlap: row.supported && blizzardActions.length
      ? Math.round(100 * sharedActions.length / blizzardActions.length)
      : null,
    simcCoverage: row.supported && simcActions.length
      ? Math.round(100 * sharedActions.length / simcActions.length)
      : null,
    sharedActionCount: sharedActions.length,
    blizzardActionCount: blizzardActions.length,
    simcActionCount: simcActions.length,
    alignment: row.alignment,
    simcProfiles,
    simcActionLines,
    usesSeason2SimcProfile,
    blizzardOnlyActions: blizzardActions.filter((action) => !simcActions.includes(action)),
    missingActions: currentMissingActions(missing.actions, blizzardActions),
    missingLogic: missing.logic,
    comparisonLimitation: missing.limitation,
    icyRating: icy.rating,
    icySummary: currentGuideSummary(icy.summary),
    icyUrl: icy.url,
  };
});

const comparableSpecs = specs.filter((spec) => spec.simcComparable);

const payload = {
  researchedAt: RESEARCHED_AT,
  verifiedAt: VERIFIED_AT,
  currentBuild: CURRENT_BUILD,
  sourceBuild: SOURCE_BUILD,
  simcBranch: SIMC_BRANCH,
  simcCommit: SIMC_COMMIT,
  summary: {
    specs: specs.length,
    classes: new Set(specs.map((spec) => spec.gameClass)).size,
    comparableSpecs: comparableSpecs.length,
    medianOverlap: median(comparableSpecs.map((spec) => spec.overlap)),
    medianSimcCoverage: median(comparableSpecs.map((spec) => spec.simcCoverage)),
    currentSteps: specs.reduce((sum, spec) => sum + spec.steps.length, 0),
    currentRules: countRules(currentCsv, "current"),
    // The primary profile per comparable spec, matched against the Blizzard
    // step count for those same specs — the two halves of the headline claim.
    simcActionLines: comparableSpecs.reduce((sum, spec) => sum + (spec.simcActionLines[0] ?? 0), 0),
    comparableBlizzardSteps: comparableSpecs.reduce((sum, spec) => sum + spec.steps.length, 0),
  },
  commonOmissions: [
    "Talent and hero-tree-specific priorities",
    "Separate single-target, cleave, and AoE rotations",
    "Openers and cooldown synchronization",
    "Resource pooling and overcap prevention",
    "Proc, charge, stack, and previous-cast sequencing",
    "Target selection, time-to-die, and incoming-add awareness",
    "Movement and end-of-fight adjustments",
    "Complete mitigation and defensive planning for tanks",
  ],
  sources: {
    wagoCurrent: `https://wago.tools/db2/AssistedCombat?build=${CURRENT_BUILD}`,
    simc: `https://github.com/simulationcraft/simc/tree/${SIMC_COMMIT}/engine/class_modules/apl`,
    simcDocs: "https://github.com/simulationcraft/simc/wiki/ActionLists",
    googleSheet: "https://docs.google.com/spreadsheets/d/1hJo36fYVf36-ubuCwrMRkNQQjqNsc1m2lzy2VaRBff0/edit?usp=sharing",
  },
  specs,
};

await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${specs.length} specs to ${outputPath}`);
console.log(
  `  ${payload.summary.currentRules} current rules, `
    + `${payload.summary.simcActionLines} SimC action lines vs ${payload.summary.comparableBlizzardSteps} Blizzard steps`
);
