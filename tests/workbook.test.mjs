import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTraceExportBaseName,
  columnValues,
  exportAnalysisWorkbook,
  parseWorkbook,
} from "../apps/electrophysiology-lab/src/io/workbook.js";

function fakeSheetJs(rowsBySheet) {
  return {
    read() {
      return {
        SheetNames: Object.keys(rowsBySheet),
        Sheets: Object.fromEntries(Object.keys(rowsBySheet).map((name) => [name, { name }])),
      };
    },
    utils: {
      sheet_to_json(sheet) {
        return rowsBySheet[sheet.name];
      },
    },
  };
}

function fakeFile(name = "registro.xlsx") {
  return {
    name,
    size: 128,
    async arrayBuffer() {
      return new ArrayBuffer(8);
    },
  };
}

test("workbook parser recognizes a textual header row", async () => {
  const XLSX = fakeSheetJs({ Registro: [["Tiempo (ms)", "Voltaje (mV)"], [0, -0.1], [0.1, -0.2]] });
  const workbook = await parseWorkbook(fakeFile(), XLSX);
  assert.equal(workbook.sheets[0].name, "Registro");
  assert.deepEqual(workbook.sheets[0].headers, ["Tiempo (ms)", "Voltaje (mV)"]);
  assert.deepEqual(columnValues(workbook.sheets[0], 1), [-0.1, -0.2]);
});

test("headerless numeric sheets receive stable column names", async () => {
  const XLSX = fakeSheetJs({ Datos: [[0, 10], [1, 11], [2, 12]] });
  const workbook = await parseWorkbook(fakeFile("sin_cabecera.xlsx"), XLSX);
  assert.deepEqual(workbook.sheets[0].headers, ["Columna A", "Columna B"]);
  assert.deepEqual(workbook.sheets[0].rows, [[0, 10], [1, 11], [2, 12]]);
});

test("empty leading rows are ignored", async () => {
  const XLSX = fakeSheetJs({ Hoja1: [[null, null], ["t", "s"], [0, 1]] });
  const workbook = await parseWorkbook(fakeFile(), XLSX);
  assert.deepEqual(workbook.sheets[0].headers, ["t", "s"]);
  assert.deepEqual(workbook.sheets[0].rows, [[0, 1]]);
});

test("trace export names identify source workbook, sheet, and signal", () => {
  assert.equal(
    buildTraceExportBaseName("PopSpikes.xlsx", "condición F", "Columna F"),
    "simulab_PopSpikes_condicion-F_Columna-F",
  );
});

test("POPS export contains only the active trace and reports rejected responses", async () => {
  let writtenWorkbook;
  let writtenFileName;
  const XLSX = {
    utils: {
      book_new: () => ({ sheets: {} }),
      aoa_to_sheet: (rows) => ({ rows }),
      book_append_sheet: (workbook, sheet, name) => { workbook.sheets[name] = sheet; },
    },
    writeFileXLSX(workbook, fileName) {
      writtenWorkbook = workbook;
      writtenFileName = fileName;
    },
  };
  const artifact = { index: 10, timeMs: 35, value: 1, score: 2, scoreOverThreshold: null };
  const fieldResult = {
    ok: false,
    artifacts: [artifact],
    events: [{ valid: false, eventNumber: 1, artifact, flags: ["p3_prominence_not_met"] }],
    flags: ["p3_prominence_not_met"],
    settings: {
      profile: "paired", smoothing: true, artifactThreshold: 0.3, minimumArtifactDistanceMs: 15,
      p1StartMs: 1, p1EndMs: 10, p2StartMs: 0, p2EndMs: 15,
      p3StartMs: 0, p3EndMs: 20, p3Prominence: 0.3,
    },
  };
  const result = {
    ok: true,
    candidates: [artifact],
    flags: [],
    stats: {
      validRows: 100, missingCount: 0, sampleRateHz: 10000, durationMs: 9.9,
      minimum: -1, maximum: 1, peakToPeak: 2,
    },
  };
  await exportAnalysisWorkbook({
    fileName: "PopSpikes.xlsx",
    sheetName: "condición F",
    timeHeader: "Columna A",
    signalHeader: "Columna B",
    result,
    fieldResult,
    settings: { timeUnit: "s", signalUnit: "mV", sensitivity: 8, refractoryMs: 50, popsExportScope: "active" },
  }, XLSX);

  assert.equal(writtenFileName, "simulab_PopSpikes_condicion-F_Columna-B.xlsx");
  const summary = Object.fromEntries(writtenWorkbook.sheets.Resumen.rows.slice(1));
  assert.equal(summary["Estado"], "Revisar/excluir");
  assert.equal(summary["Trazas POPS exportadas"], 1);
  assert.equal(summary["Eventos POPS para revisión"], 1);
  assert.equal(writtenWorkbook.sheets.Mediciones_POPS.rows.length, 2);
  assert.equal(writtenWorkbook.sheets.Trazas_QC.rows.length, 2);
});
