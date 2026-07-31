import test from "node:test";
import assert from "node:assert/strict";

import { columnValues, parseWorkbook } from "../apps/electrophysiology-lab/src/io/workbook.js";

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
