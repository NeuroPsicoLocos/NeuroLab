import test from "node:test";
import assert from "node:assert/strict";

import {
  guessTimeUnit,
  isImplausibleTimeScale,
  suggestWorkbookAnalysis,
} from "../apps/electrophysiology-lab/src/core/inference.js";

test("headerless POPS time axis is inferred as seconds", () => {
  const time = Array.from({ length: 9900 }, (_, index) => index * 0.0001);
  assert.equal(guessTimeUnit(time, "Columna A"), "s");
});

test("millisecond labels and typical millisecond axes remain milliseconds", () => {
  assert.equal(guessTimeUnit([0, 0.1, 0.2], "Tiempo (ms)"), "ms");
  assert.equal(guessTimeUnit([0, 0.1, 0.2, 0.3], ""), "ms");
});

test("known POPS books select the correct protocol and whole-workbook export", () => {
  const paired = suggestWorkbookAnalysis({ fileName: "PopSpikes.xlsx", sheets: [{ name: "condicion F" }] });
  assert.deepEqual(
    { mode: paired.mode, profile: paired.profile, exportScope: paired.exportScope },
    { mode: "population-spike", profile: "paired", exportScope: "workbook" },
  );

  const train = suggestWorkbookAnalysis({
    fileName: "registro.xlsx",
    sheets: [{ name: "10 Hz" }, { name: "30 Hz" }, { name: "50 Hz" }],
  });
  assert.equal(train.profile, "train");
  assert.equal(train.mode, "population-spike");
});

test("implausible scales flag the 10 MHz interpretation but accept 10 kHz", () => {
  assert.equal(isImplausibleTimeScale({ sampleRateHz: 10_000_000, validRows: 9900, durationMs: 0.99 }), true);
  assert.equal(isImplausibleTimeScale({ sampleRateHz: 10_000, validRows: 9900, durationMs: 989.9 }), false);
});
