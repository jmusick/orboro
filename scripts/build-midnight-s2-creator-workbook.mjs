import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const [inputDir, outputFile] = process.argv.slice(2);
if (!inputDir || !outputFile) throw new Error("Usage: node build-midnight-s2-creator-workbook.mjs INPUT_DIR OUTPUT.xlsx");

const COLORS = {
  bg: "#070A12", surface: "#0E1424", surface2: "#131B2F",
  line: "#26324D", lineStrong: "#355078", white: "#F8FAFC",
  muted: "#AAB5C9", cyan: "#67E8F9", cyanDark: "#155E75",
  link: "#7DD3FC", s: "#E98178", a: "#E8B36A", b: "#E9D374",
  c: "#9FBE7A", d: "#7EA4D8",
};
const FONT = "Arial";
const ARTICLE_URL = "https://orboro.net/blog/which-wow-creators-predicted-midnight-season-2-mythic-plus-meta-best";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1SRv8znRSX1AWqOHHtU_PKyKqqQG7ldOu0Q6p944P1-0/edit";
const META_URL = "https://mythicstats.com/";

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ""; }
    else if (char === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const headers = rows.shift();
  return rows.filter((values) => values.some((value) => value !== "")).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function tabName(creator) { return creator.replace("Naowh / Robin panel", "Naowh + Robin").slice(0, 31); }
function sourceIdToFile(sourceId) { return `${sourceId.toLowerCase()}-placements.csv`; }

function baseSheet(sheet, range) {
  sheet.showGridLines = false;
  range.format = { fill: COLORS.bg, font: { name: FONT, size: 10, color: COLORS.white }, verticalAlignment: "center" };
}

function titleBlock(sheet, title, subtitle, lastColumn) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A1:${lastColumn}1`).format = {
    fill: "#05060B", font: { name: FONT, size: 18, bold: true, color: COLORS.white },
    verticalAlignment: "center", borders: { bottom: { style: "medium", color: "#1D4ED8" } },
  };
  sheet.getRange(`A2:${lastColumn}2`).format = {
    fill: "#05060B", font: { name: FONT, size: 10, italic: true, color: COLORS.muted }, verticalAlignment: "center",
  };
  sheet.getRange("1:1").format.rowHeight = 30;
  sheet.getRange("2:2").format.rowHeight = 22;
}

function sectionBar(sheet, address, label) {
  sheet.mergeCells(address);
  sheet.getRange(address).values = [[label]];
  sheet.getRange(address).format = {
    fill: COLORS.surface, font: { name: FONT, size: 11, bold: true, color: COLORS.cyan },
    borders: { bottom: { style: "thin", color: COLORS.lineStrong } },
  };
}

function header(range) {
  range.format = {
    fill: "#0B1020", font: { name: FONT, size: 9, bold: true, color: COLORS.white },
    horizontalAlignment: "center", verticalAlignment: "center", wrapText: true,
    borders: { top: { style: "thin", color: COLORS.lineStrong }, bottom: { style: "thin", color: COLORS.lineStrong }, insideVertical: { style: "thin", color: COLORS.line } },
  };
  range.format.rowHeight = 30;
}

function body(range) {
  range.format = {
    fill: COLORS.surface, font: { name: FONT, size: 10, color: COLORS.white }, verticalAlignment: "center",
    borders: { bottom: { style: "thin", color: COLORS.line }, insideVertical: { style: "thin", color: "#1A243A" } },
  };
  range.format.rowHeight = 23;
}

function applyGradeColors(range) {
  range.conditionalFormats.addCustom('=LEFT(C8,1)="S"', { fill: COLORS.s, font: { bold: true, color: "#130B0A" } });
  range.conditionalFormats.addCustom('=LEFT(C8,1)="A"', { fill: COLORS.a, font: { bold: true, color: "#171006" } });
  range.conditionalFormats.addCustom('=LEFT(C8,1)="B"', { fill: COLORS.b, font: { bold: true, color: "#171306" } });
  range.conditionalFormats.addCustom('=LEFT(C8,1)="C"', { fill: COLORS.c, font: { bold: true, color: "#0E1608" } });
  range.conditionalFormats.addCustom('=LEFT(C8,1)="D"', { fill: COLORS.d, font: { bold: true, color: "#08111C" } });
}

function sourceFormula(tab, cell) { return `='${tab.replaceAll("'", "''")}'!${cell}`; }
function sourceReference(tab, cell) { return `'${tab.replaceAll("'", "''")}'!${cell}`; }

const ranking = JSON.parse(await fs.readFile(path.join(inputDir, "creator-ranking.json"), "utf8"));
const actualRows = parseCsv(await fs.readFile(path.join(inputDir, "actual-meta.csv"), "utf8"));
const placementsById = {};
for (const creator of ranking) {
  placementsById[creator.source_id] = parseCsv(await fs.readFile(path.join(inputDir, sourceIdToFile(creator.source_id)), "utf8"));
}

const workbook = Workbook.create();

for (const creator of ranking) {
  const name = tabName(creator.creator);
  const sheet = workbook.worksheets.add(name);
  sheet.tabColor = COLORS.cyanDark;
  const rows = placementsById[creator.source_id];
  const endRow = 13 + rows.length;
  baseSheet(sheet, sheet.getRange(`A1:J${Math.max(endRow + 3, 58)}`));
  const timingLabel = creator.creator === "Dorki" ? "pre-benchmark prediction" : "pre-season prediction";
  titleBlock(sheet, `${creator.creator}: ${timingLabel}`, `${creator.source_format} • ${creator.scope} • compared with MythicStats weeks 1–5`, "J");

  sheet.getRange("A4:A8").values = [["Forecast"], ["Published"], ["Source"], ["Coverage class"], ["Benchmark"]];
  sheet.getRange("B4:B8").values = [[creator.title], [new Date(`${creator.published}T00:00:00`)], [creator.url], [creator.coverage >= 35 ? "Full / near-full board" : "Complete DPS board"], ["MythicStats periods 1077–1081"]];
  for (let row = 4; row <= 8; row += 1) sheet.mergeCells(`B${row}:C${row}`);
  sheet.getRange("A4:A8").format.font = { name: FONT, size: 9, bold: true, color: COLORS.cyan };
  sheet.getRange("B4:C8").format = { fill: COLORS.surface, font: { name: FONT, size: 9, color: COLORS.white }, wrapText: true, borders: { bottom: { style: "thin", color: COLORS.line } } };
  sheet.getRange("B5").format.numberFormat = "mmm d, yyyy";
  sheet.getRange("4:8").format.rowHeight = 28;

  sheet.getRange("D4:D11").values = [["Ranked specs"], ["Tank accuracy"], ["Healer accuracy"], ["DPS accuracy"], ["Raw agreement"], ["Coverage multiplier"], ["Final accuracy"], ["Grade"]];
  sheet.getRange("D4:D11").format.font = { name: FONT, size: 9, bold: true, color: COLORS.cyan };
  sheet.getRange("E4").formulas = [[`=COUNTA(A14:A${endRow})`]];
  sheet.getRange("E5").formulas = [[`=IF(COUNTIF(B14:B${endRow},"Tank")=0,"",MAX(0,100-2*SUMIF(B14:B${endRow},"Tank",G14:G${endRow})/COUNTIF(B14:B${endRow},"Tank")))`]];
  sheet.getRange("E6").formulas = [[`=IF(COUNTIF(B14:B${endRow},"Healer")=0,"",MAX(0,100-2*SUMIF(B14:B${endRow},"Healer",G14:G${endRow})/COUNTIF(B14:B${endRow},"Healer")))`]];
  sheet.getRange("E7").formulas = [[`=IF(COUNTIF(B14:B${endRow},"DPS")=0,"",MAX(0,100-2*SUMIF(B14:B${endRow},"DPS",G14:G${endRow})/COUNTIF(B14:B${endRow},"DPS")))`]];
  sheet.getRange("E8").formulas = [["=SUM(E5:E7)/COUNT(E5:E7)"]];
  sheet.getRange("E9").formulas = [["=0.85+0.15*(E4/40)"]];
  sheet.getRange("E10").formulas = [["=E8*E9"]];
  sheet.getRange("E11").formulas = [[`=IF(E10>=80,"S",IF(E10>=65,"A",IF(E10>=50,"B",IF(E10>=35,"C","D"))))`]];
  sheet.getRange("E4:E11").format = { fill: COLORS.surface2, font: { name: FONT, size: 10, bold: true, color: COLORS.white }, horizontalAlignment: "center", borders: { bottom: { style: "thin", color: COLORS.line } } };
  sheet.getRange("E5:E8").format.numberFormat = "0.0";
  sheet.getRange("E9").format.numberFormat = "0.0%";
  sheet.getRange("E10").format.numberFormat = "0.0";
  for (const [grade, color, textColor] of [["S", COLORS.s, "#130B0A"], ["A", COLORS.a, "#171006"], ["B", COLORS.b, "#171306"], ["C", COLORS.c, "#0E1608"], ["D", COLORS.d, "#08111C"]]) {
    sheet.getRange("E11").conditionalFormats.addCustom(`=E11="${grade}"`, { fill: color, font: { bold: true, color: textColor } });
  }
  const creatorGradeColors = { S: COLORS.s, A: COLORS.a, B: COLORS.b, C: COLORS.c, D: COLORS.d };
  sheet.getRange("E11").format.fill = creatorGradeColors[creator.tier];
  sheet.getRange("E11").format.font = { name: FONT, size: 10, bold: true, color: "#101018" };

  sectionBar(sheet, "A12:J12", "EXTRACTED PREDICTION VS. FIVE-WEEK META");
  sheet.getRange("A13:G13").values = [["Spec", "Role", "Predicted tier", "Prediction percentile", "Actual avg. representation", "Actual percentile", "Absolute error"]];
  header(sheet.getRange("A13:G13"));
  const values = rows.map((row) => [row.spec, row.role, row.predicted_tier, Number(row.predicted_percentile), Number(row.actual_representation) / 100, Number(row.actual_percentile), null]);
  sheet.getRange(`A14:G${endRow}`).values = values;
  sheet.getRange(`G14:G${endRow}`).formulas = rows.map((_, index) => [`=ABS(D${14 + index}-F${14 + index})`]);
  body(sheet.getRange(`A14:G${endRow}`));
  sheet.getRange(`A14:B${endRow}`).conditionalFormats.addCustom("=MOD(ROW(),2)=1", { fill: COLORS.surface2 });
  sheet.getRange(`D14:G${endRow}`).conditionalFormats.addCustom("=MOD(ROW(),2)=1", { fill: COLORS.surface2 });
  for (const [grade, color, textColor] of [["S", COLORS.s, "#130B0A"], ["A", COLORS.a, "#171006"], ["B", COLORS.b, "#171306"], ["C", COLORS.c, "#0E1608"], ["D", COLORS.d, "#08111C"]]) {
    sheet.getRange(`C14:C${endRow}`).conditionalFormats.addCustom(`=LEFT(C14,1)="${grade}"`, { fill: color, font: { bold: true, color: textColor } });
  }
  sheet.getRange(`D14:D${endRow}`).format.numberFormat = "0.0";
  sheet.getRange(`E14:E${endRow}`).format.numberFormat = "0.00%";
  sheet.getRange(`F14:G${endRow}`).format.numberFormat = "0.0";
  sheet.getRange(`F14:F${endRow}`).conditionalFormats.add("dataBar", { color: COLORS.cyan, gradient: true });
  sheet.getRange(`G14:G${endRow}`).conditionalFormats.add("colorScale", { colors: ["#173B35", "#735A1D", "#7F1D1D"], thresholds: ["min", "50%", "max"] });
  sheet.getRange("A:A").format.columnWidth = 27;
  sheet.getRange("B:B").format.columnWidth = 12;
  sheet.getRange("C:C").format.columnWidth = 25;
  sheet.getRange("D:G").format.columnWidth = 19;
  sheet.getRange("H:J").format.columnWidth = 11;
  sheet.freezePanes.freezeRows(13);
}

const overview = workbook.worksheets.add("Overview");
overview.tabColor = "#1D4ED8";
baseSheet(overview, overview.getRange("A1:L30"));
titleBlock(overview, "Midnight Season 2 Mythic+ Creator Prediction Accuracy", `${ranking.length} qualifying creator forecasts • MythicStats weeks 1–5 • updated September 17, 2026`, "L");
overview.mergeCells("A4:L4");
overview.getRange("A4").values = [["Who read the pre-season meta most accurately? Every forecast is normalized inside its own role, compared with the same five-week benchmark, then adjusted slightly for coverage."]];
overview.getRange("A4:L4").format = { fill: COLORS.surface, font: { name: FONT, size: 10, color: COLORS.white }, wrapText: true, borders: { top: { style: "thin", color: COLORS.line }, bottom: { style: "thin", color: COLORS.line } } };
overview.getRange("4:4").format.rowHeight = 34;
overview.mergeCells("A5:L5");
overview.getRange("A5").values = [[`Full Orboro.net analysis: ${ARTICLE_URL}`]];
overview.getRange("A5:L5").format = { fill: COLORS.surface, font: { name: FONT, size: 10, color: COLORS.link, underline: true } };
sectionBar(overview, "A6:L6", "CREATOR ACCURACY TIER LIST");
overview.getRange("A7:L7").values = [["Rank", "Creator", "Grade", "Final accuracy", "Raw agreement", "Specs", "Tank", "Healer", "DPS", "Format", "Published", "Forecast source"]];
header(overview.getRange("A7:L7"));
const overviewEnd = 7 + ranking.length;
overview.getRange(`A8:L${overviewEnd}`).values = ranking.map((creator, index) => [index + 1, creator.creator, null, null, null, null, null, null, null, creator.source_format, new Date(`${creator.published}T00:00:00`), creator.url]);
for (let i = 0; i < ranking.length; i += 1) {
  const row = 8 + i;
  const tab = tabName(ranking[i].creator);
  const tank = sourceReference(tab, "E5");
  const healer = sourceReference(tab, "E6");
  const dps = sourceReference(tab, "E7");
  overview.getRange(`C${row}:I${row}`).formulas = [[
    sourceFormula(tab, "E11"), sourceFormula(tab, "E10"), sourceFormula(tab, "E8"), sourceFormula(tab, "E4"),
    `=IF(${tank}="","",${tank})`, `=IF(${healer}="","",${healer})`, `=IF(${dps}="","",${dps})`,
  ]];
}
body(overview.getRange(`A8:L${overviewEnd}`));
overview.getRange(`A8:B${overviewEnd}`).conditionalFormats.addCustom("=MOD(ROW(),2)=1", { fill: COLORS.surface2 });
overview.getRange(`D8:L${overviewEnd}`).conditionalFormats.addCustom("=MOD(ROW(),2)=1", { fill: COLORS.surface2 });
applyGradeColors(overview.getRange(`C8:C${overviewEnd}`));
const overviewGradeColors = { S: COLORS.s, A: COLORS.a, B: COLORS.b, C: COLORS.c, D: COLORS.d };
for (let i = 0; i < ranking.length; i += 1) {
  overview.getRange(`C${8 + i}`).format = { fill: overviewGradeColors[ranking[i].tier], font: { name: FONT, size: 10, bold: true, color: "#101018" }, horizontalAlignment: "center" };
}
overview.getRange(`D8:E${overviewEnd}`).format.numberFormat = "0.0";
overview.getRange(`F8:F${overviewEnd}`).format.numberFormat = "0";
overview.getRange(`G8:I${overviewEnd}`).format.numberFormat = "0.0";
overview.getRange(`K8:K${overviewEnd}`).format.numberFormat = "mmm d, yyyy";
overview.getRange(`D8:D${overviewEnd}`).conditionalFormats.add("dataBar", { color: COLORS.cyan, gradient: true });
overview.getRange(`A8:A${overviewEnd}`).format.horizontalAlignment = "center";
overview.getRange(`C8:K${overviewEnd}`).format.horizontalAlignment = "center";

const bandsRow = overviewEnd + 3;
sectionBar(overview, `A${bandsRow}:L${bandsRow}`, "GRADE BANDS");
overview.getRange(`A${bandsRow + 1}:J${bandsRow + 1}`).values = [["S", "80–100", "A", "65–79.9", "B", "50–64.9", "C", "35–49.9", "D", "Below 35"]];
for (const [cell, color] of [[`A${bandsRow + 1}`, COLORS.s], [`C${bandsRow + 1}`, COLORS.a], [`E${bandsRow + 1}`, COLORS.b], [`G${bandsRow + 1}`, COLORS.c], [`I${bandsRow + 1}`, COLORS.d]]) {
  overview.getRange(cell).format = { fill: color, font: { name: FONT, size: 10, bold: true, color: "#101018" }, horizontalAlignment: "center" };
}
overview.getRange(`B${bandsRow + 1}:J${bandsRow + 1}`).format.font = { name: FONT, size: 9, color: COLORS.white };
overview.mergeCells(`A${bandsRow + 3}:L${bandsRow + 3}`);
overview.getRange(`A${bandsRow + 3}`).values = [["Eligibility: published before the first MythicStats benchmark capture, explicitly Mythic+, and at least 26 of 40 specs ranked. Six- and seven-spec role lists remain useful context but are not on this leaderboard."]];
overview.getRange(`A${bandsRow + 3}:L${bandsRow + 3}`).format = { fill: COLORS.surface, font: { name: FONT, size: 9, italic: true, color: COLORS.muted }, wrapText: true };
overview.getRange(`${bandsRow + 3}:${bandsRow + 3}`).format.rowHeight = 32;
overview.getRange("A:A").format.columnWidth = 7;
overview.getRange("B:B").format.columnWidth = 24;
overview.getRange("C:C").format.columnWidth = 8;
overview.getRange("D:I").format.columnWidth = 12;
overview.getRange("J:J").format.columnWidth = 12;
overview.getRange("K:K").format.columnWidth = 14;
overview.getRange("L:L").format.columnWidth = 46;
overview.freezePanes.freezeRows(7);

const actual = workbook.worksheets.add("Actual Meta");
actual.tabColor = COLORS.cyan;
baseSheet(actual, actual.getRange("A1:F52"));
titleBlock(actual, "Actual meta: MythicStats weeks 1–5", "Average specialization share in the top 2,000 keys for periods 1077–1081", "F");
actual.mergeCells("A4:F4");
actual.getRange("A4").values = [["Representation measures what the high-key field selected and completed with. It is a meta proxy, not a claim about theoretical output or ordinary pug viability."]];
actual.getRange("A4:F4").format = { fill: COLORS.surface, font: { name: FONT, size: 10, italic: true, color: COLORS.muted }, wrapText: true };
actual.getRange("4:4").format.rowHeight = 34;
actual.mergeCells("A5:F5");
actual.getRange("A5").values = [[`Live source: ${META_URL}`]];
actual.getRange("A5:F5").format.font = { name: FONT, size: 10, color: COLORS.link, underline: true };
sectionBar(actual, "A6:F6", "FIVE-WEEK BENCHMARK");
actual.getRange("A7:D7").values = [["Spec", "Role", "Weeks 1–5 avg. representation", "Within-role percentile"]];
header(actual.getRange("A7:D7"));
const actualValues = actualRows.map((row) => [row.spec, row.role, Number(row.weeks_1_5_representation) / 100, Number(row.actual_percentile)]);
const actualEnd = 7 + actualValues.length;
actual.getRange(`A8:D${actualEnd}`).values = actualValues;
body(actual.getRange(`A8:D${actualEnd}`));
actual.getRange(`A8:D${actualEnd}`).conditionalFormats.addCustom("=MOD(ROW(),2)=1", { fill: COLORS.surface2 });
actual.getRange(`C8:C${actualEnd}`).format.numberFormat = "0.00%";
actual.getRange(`D8:D${actualEnd}`).format.numberFormat = "0.0";
actual.getRange(`C8:C${actualEnd}`).conditionalFormats.add("dataBar", { color: COLORS.cyan, gradient: true });
actual.getRange("A:A").format.columnWidth = 28;
actual.getRange("B:B").format.columnWidth = 14;
actual.getRange("C:C").format.columnWidth = 30;
actual.getRange("D:D").format.columnWidth = 22;
actual.getRange("E:F").format.columnWidth = 12;
actual.freezePanes.freezeRows(7);

const method = workbook.worksheets.add("Method");
method.tabColor = COLORS.muted;
baseSheet(method, method.getRange("A1:F42"));
titleBlock(method, "How the creator scores are calculated", "One scale for differently named tier lists, one benchmark for every creator", "F");
method.mergeCells("A4:F4");
method.getRange("A4").values = [["Short version: turn every board into a within-role 0–100 ordering, compare it with the same five-week ordering, average the misses, then apply a small coverage adjustment."]];
method.getRange("A4:F4").format = { fill: COLORS.surface, font: { name: FONT, size: 10, color: COLORS.white }, wrapText: true };
method.getRange("4:4").format.rowHeight = 38;
sectionBar(method, "A6:F6", "THE CALCULATION, STEP BY STEP");
method.getRange("A7:C7").values = [["Step", "What we do", "Why it matters"]];
header(method.getRange("A7:C7"));
method.getRange("A8:C17").values = [
  ["1. Qualify the forecast", "Published before the first MythicStats benchmark capture, explicitly about Mythic+, and at least 26 of 40 specs ranked.", "A complete DPS board counts as ‘most specs’; short tank- or healer-only lists do not."],
  ["2. Keep each creator’s ties", "The creator’s own tiers stay intact. Specs tied in the same tier receive the same midpoint rank.", "A five-tier board is not punished for using fewer labels than a seven-tier board."],
  ["3. Put predictions on 0–100", "Inside each role, the top predicted position becomes 100, the bottom becomes 0, and tied specs share the midpoint.", "Tank, healer and DPS ordering can now be compared on the same scale."],
  ["4. Build the actual benchmark", "Average each spec’s MythicStats representation across periods 1077–1081, the first five weekly snapshots.", "One unusual week cannot decide the result."],
  ["5. Put actual results on 0–100", "Convert the five-week averages to the same within-role percentile scale.", "Prediction and result now use identical units."],
  ["6. Measure every miss", "Absolute error = |prediction percentile − actual percentile|.", "Being 20 points too high and 20 points too low are equally wrong."],
  ["7. Score each covered role", "Role accuracy = max(0, 100 − 2 × mean absolute error).", "Perfect ordering scores 100; a 25-point average miss scores 50."],
  ["8. Average roles fairly", "Raw agreement is the equal average of every role the creator fully covered.", "A full board’s 27 DPS do not drown out its tank and healer calls."],
  ["9. Adjust for coverage", "Final accuracy = raw agreement × [0.85 + 0.15 × (ranked specs ÷ 40)].", "A 40-spec board keeps 100%; a 27-spec DPS board keeps 95.1%."],
  ["10. Assign a grade", "S 80+, A 65–79.9, B 50–64.9, C 35–49.9, D below 35.", "The grade is a readable band; the decimal score preserves the ordering."],
];
body(method.getRange("A8:C17"));
method.getRange("A8:A17").format.font = { name: FONT, size: 10, bold: true, color: COLORS.cyan };
method.getRange("B8:C17").format.wrapText = true;
method.getRange("8:17").format.rowHeight = 48;
sectionBar(method, "A19:F19", "WORKED EXAMPLE");
method.getRange("A20:B24").values = [
  ["Prediction", "A spec is placed at the 80th percentile."],
  ["Actual", "Its five-week result is the 60th percentile."],
  ["Spec error", "|80 − 60| = 20 points."],
  ["Role score", "If the role’s average error is 15, accuracy = 100 − 2×15 = 70."],
  ["Coverage", "If the creator ranked 27 specs, multiplier = 85% + 15%×(27/40) = 95.1%; final = 70×95.1% = 66.6."],
];
body(method.getRange("A20:B24"));
method.getRange("A20:A24").format.font = { name: FONT, size: 10, bold: true, color: COLORS.cyan };
method.getRange("B20:B24").format.wrapText = true;
method.getRange("20:24").format.rowHeight = 36;
sectionBar(method, "A26:F26", "WHAT THE SCORE DOES AND DOES NOT SAY");
method.mergeCells("A27:F27");
method.getRange("A27").values = [["It measures resemblance to the early high-key selection meta. It does not prove that a spec was intrinsically weak, that it was bad in ordinary keys, or that later tuning did not change the picture."]];
method.getRange("A27:F27").format = { fill: COLORS.surface, font: { name: FONT, size: 10, italic: true, color: COLORS.muted }, wrapText: true };
method.getRange("27:27").format.rowHeight = 42;
method.getRange("A29:B31").values = [["Links", ""], ["Orboro.net article", ARTICLE_URL], ["Shared Google Sheet", SHEET_URL]];
method.getRange("A29:B29").format = { fill: COLORS.surface2, font: { name: FONT, size: 10, bold: true, color: COLORS.cyan } };
method.getRange("A30:A31").format.font = { name: FONT, size: 10, bold: true, color: COLORS.white };
method.getRange("B30:B31").format.font = { name: FONT, size: 10, color: COLORS.link, underline: true };
method.getRange("A:A").format.columnWidth = 30;
method.getRange("B:B").format.columnWidth = 70;
method.getRange("C:C").format.columnWidth = 60;
method.getRange("D:F").format.columnWidth = 12;

overview.position = 0;
workbook.recalculate();

const checks = [["Overview", `A1:L${bandsRow + 3}`], ...ranking.map((creator) => [tabName(creator.creator), "A1:G24"]), ["Actual Meta", "A1:D20"], ["Method", "A1:C31"]];
for (const [sheetName, range] of checks) {
  const inspection = await workbook.inspect({ kind: "table", range: `${sheetName}!${range}`, include: "values,formulas", tableMaxRows: 32, tableMaxCols: 12 });
  console.log(inspection.ndjson);
}
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 100 }, summary: "final formula error scan" });
console.log(errors.ndjson);

await fs.mkdir(path.dirname(outputFile), { recursive: true });
for (const [sheetName] of checks) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const safeName = sheetName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await fs.writeFile(path.join(path.dirname(outputFile), `preview-${safeName}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputFile);
console.log(`Wrote ${outputFile}`);
