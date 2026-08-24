import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repoRoot, "src", "lib", "midnight-s2-interrupt-data.json");
const sheetId = "122p6pq_9IeUA29ybuUrhTaCB4yLlRrtm2Khd1BbkZbA";
const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`;
const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Cheat%20Sheet`;

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

const response = await fetch(csvUrl, { headers: { "User-Agent": "Orboro data generator" } });
if (!response.ok) throw new Error(`Google Sheets export failed: ${response.status} ${response.statusText}`);

const table = parseCsv(await response.text()).filter((row) => row.some((cell) => cell.trim()));
const header = table.shift();
const expectedHeader = [
  "Dungeon",
  "Area",
  "Enemy / Boss",
  "Ability",
  "Response",
  "Priority",
  "Fallback / Clear",
  "What to do",
  "Verified",
  "Source URL",
];

if (!header || header.length !== expectedHeader.length || header.some((value, index) => value.trim() !== expectedHeader[index])) {
  throw new Error(`Unexpected Cheat Sheet header: ${JSON.stringify(header)}`);
}

const rows = table.map((values, index) => {
  if (values.length !== expectedHeader.length) {
    throw new Error(`Row ${index + 2} has ${values.length} columns; expected ${expectedHeader.length}`);
  }
  const [dungeon, area, enemy, ability, responseType, priority, fallback, action, verified, sourceUrl] = values.map((value) => value.trim());
  if (!dungeon || !enemy || !ability || !responseType || !priority || !action || !sourceUrl) {
    throw new Error(`Row ${index + 2} is missing a required value`);
  }
  return { dungeon, area, enemy, ability, response: responseType, priority, fallback, action, verified, sourceUrl };
});

const dungeons = [...new Set(rows.map((row) => row.dungeon))];
const responseCounts = Object.fromEntries(
  [...new Set(rows.map((row) => row.response))].map((responseType) => [
    responseType,
    rows.filter((row) => row.response === responseType).length,
  ]),
);
const verifiedDates = [...new Set(rows.map((row) => row.verified))];
if (verifiedDates.length !== 1) throw new Error(`Expected one verification date, found: ${verifiedDates.join(", ")}`);

const output = {
  title: "Midnight Season 2 Mythic+ Interrupt & Utility Cheat Sheet",
  sheetUrl,
  generatedAt: new Date().toISOString(),
  verifiedAt: verifiedDates[0],
  dungeons,
  responseCounts,
  rows,
};

await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${rows.length} rows across ${dungeons.length} dungeons to ${path.relative(repoRoot, outputPath)}`);
