import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const [inputFile, outputFile] = process.argv.slice(2);
if (!inputFile || !outputFile) {
  throw new Error("Usage: node export-tier-list-source-csv.mjs INPUT.xlsx OUTPUT.csv");
}

function csvCell(value) {
  if (value == null) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[\",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputFile));
const sheet = workbook.worksheets.getItem("Sheet1");
const rows = sheet.getUsedRange(true).values;
const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

await fs.writeFile(outputFile, csv, "utf8");
console.log(`Wrote ${outputFile} (${rows.length} rows)`);
