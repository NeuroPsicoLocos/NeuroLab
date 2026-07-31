import test from "node:test";
import assert from "node:assert/strict";

import {
  detectLegacyArtifacts,
  measurePopulationSpikes,
  smoothSavitzkyGolay11x3,
} from "../apps/electrophysiology-lab/src/core/fieldPotential.js";
import { createDemoTrace } from "../apps/electrophysiology-lab/src/core/signal.js";

test("Savitzky–Golay profile preserves a cubic polynomial in the central region", () => {
  const signal = Array.from({ length: 31 }, (_, index) => 2 + 0.3 * index - 0.02 * index ** 2 + 0.001 * index ** 3);
  const smoothed = smoothSavitzkyGolay11x3(signal);
  for (let index = 5; index < signal.length - 5; index += 1) {
    assert.ok(Math.abs(smoothed[index] - signal[index]) < 1e-10);
  }
  assert.deepEqual(signal, Array.from({ length: 31 }, (_, index) => 2 + 0.3 * index - 0.02 * index ** 2 + 0.001 * index ** 3));
});

test("legacy artifact profile detects the ten synthetic stimuli", () => {
  const demo = createDemoTrace();
  const smoothed = smoothSavitzkyGolay11x3(demo.signal);
  const artifacts = detectLegacyArtifacts(demo.timeMs, smoothed);
  assert.equal(artifacts.length, 10);
  assert.deepEqual(artifacts.map((artifact) => Math.round(artifact.timeMs)), demo.stimulusTimesMs);
});

test("population-spike detector returns ordered points and positive amplitudes", () => {
  const demo = createDemoTrace();
  const result = measurePopulationSpikes(demo.timeMs, demo.signal);
  assert.equal(result.ok, true);
  assert.equal(result.events.length, 10);
  for (const event of result.events) {
    assert.equal(event.valid, true);
    assert.ok(event.p1.timeMs < event.p2.timeMs);
    assert.ok(event.p2.timeMs < event.p3.timeMs);
    assert.ok(event.amplitude > 0);
    assert.ok(event.confidence >= 0 && event.confidence <= 100);
  }
});

test("short and non-monotonic traces are rejected", () => {
  assert.equal(measurePopulationSpikes([0, 1], [0, 1]).ok, false);
  const time = Array.from({ length: 20 }, (_, index) => index);
  time[10] = time[9];
  assert.deepEqual(measurePopulationSpikes(time, time).flags, ["non_monotonic_time"]);
});

test("invalid physiological windows are rejected explicitly", () => {
  const demo = createDemoTrace();
  const result = measurePopulationSpikes(demo.timeMs, demo.signal, { p1StartMs: 10, p1EndMs: 3 });
  assert.equal(result.ok, false);
  assert.deepEqual(result.flags, ["invalid_parameters"]);
});

test("paired POPS profile reproduces two fixed artifact search windows", () => {
  const timeMs = Array.from({ length: 2000 }, (_, index) => index / 10);
  const signal = Array.from({ length: 2000 }, () => 0);
  signal[350] = 4;
  signal[400] = 1;
  signal[450] = -2;
  signal[500] = 1;
  signal[950] = 6;
  signal[1000] = 1;
  signal[1050] = -2;
  signal[1100] = 1;
  const result = measurePopulationSpikes(timeMs, signal, { profile: "paired", smoothing: false });
  assert.deepEqual(result.artifacts.map((artifact) => Math.round(artifact.timeMs)), [35, 95]);
  assert.equal(result.events.filter((event) => event.valid).length, 2);
});

test("paired POPS rejects responses whose P3 does not meet minimum prominence", () => {
  const timeMs = Array.from({ length: 2000 }, (_, index) => index / 10);
  const signal = Array.from({ length: 2000 }, () => 0);
  signal[350] = 4;
  signal[351] = -4;
  signal[950] = 6;
  signal[951] = -6;
  const result = measurePopulationSpikes(timeMs, signal, { profile: "paired", smoothing: false });
  assert.deepEqual(result.artifacts.map((artifact) => Math.round(artifact.timeMs)), [35, 95]);
  assert.equal(result.events.filter((event) => event.valid).length, 0);
  assert.ok(result.events.every((event) => event.flags.includes("p3_prominence_not_met")));
  assert.ok(result.flags.includes("p3_prominence_not_met"));
});
