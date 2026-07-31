import test from "node:test";
import assert from "node:assert/strict";

import { analyzeTrace, createDemoTrace, median, medianAbsoluteDeviation } from "../apps/electrophysiology-lab/src/core/signal.js";

test("robust summary helpers handle odd and even arrays", () => {
  assert.equal(median([9, 1, 3]), 3);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(medianAbsoluteDeviation([1, 2, 3], 2), 1);
});

test("synthetic demo is deterministic and exposes ten stimulus artifacts", () => {
  const first = createDemoTrace();
  const second = createDemoTrace();
  assert.deepEqual(first.signal, second.signal);

  const result = analyzeTrace(first.timeMs, first.signal);
  assert.equal(result.ok, true);
  assert.equal(result.stats.validRows, 11000);
  assert.ok(Math.abs(result.stats.sampleRateHz - 10000) < 0.01);
  assert.equal(result.candidates.length, 10);
  assert.deepEqual(result.candidates.map((candidate) => Math.round(candidate.timeMs)), first.stimulusTimesMs);
});

test("missing values are counted and flagged without mutating valid values", () => {
  const result = analyzeTrace([0, 1, 2, 3], [0, null, 2, 3]);
  assert.equal(result.stats.missingCount, 1);
  assert.equal(result.stats.validRows, 3);
  assert.ok(result.flags.some((flag) => flag.code === "missing_values"));
});

test("non-monotonic time is excluded", () => {
  const result = analyzeTrace([0, 2, 1, 3], [0, 1, 2, 3]);
  assert.equal(result.ok, false);
  assert.ok(result.flags.some((flag) => flag.code === "non_monotonic_time" && flag.level === "exclude"));
});

test("configured saturation limits produce a review flag", () => {
  const result = analyzeTrace([0, 1, 2, 3], [0, 1, 5, 1], { saturationMin: -5, saturationMax: 5 });
  assert.equal(result.stats.saturatedCount, 1);
  assert.ok(result.flags.some((flag) => flag.code === "possible_saturation"));
});

test("invalid saturation limits are rejected", () => {
  const result = analyzeTrace([0, 1, 2, 3], [0, 1, 2, 3], { saturationMin: 5, saturationMax: -5 });
  assert.equal(result.ok, false);
  assert.ok(result.flags.some((flag) => flag.code === "invalid_saturation_limits"));
});
