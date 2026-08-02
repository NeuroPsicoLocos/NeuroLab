import test from "node:test";
import assert from "node:assert/strict";

import {
  PSP_SCENARIO_SCHEMA,
  biExponentialPeakTimeMs,
  createSeededRandom,
  createStudentScenarioView,
  generatePspScenario,
  normalizedBiExponential,
  normalizePspScenarioConfig,
} from "../apps/electrophysiology-lab/src/core/pspScenario.js";

test("seeded generator is deterministic and distinguishes seeds", () => {
  const first = generatePspScenario({ seed: "same", sweepCount: 2 });
  const second = generatePspScenario({ seed: "same", sweepCount: 2 });
  const different = generatePspScenario({ seed: "different", sweepCount: 2 });

  assert.deepEqual(first, second);
  assert.notDeepEqual(first.sweeps[0].voltageMv, different.sweeps[0].voltageMv);
  assert.equal(first.schema, PSP_SCENARIO_SCHEMA);
});

test("normalized biexponential reaches unit amplitude at analytical peak", () => {
  const peakTime = biExponentialPeakTimeMs(2, 24);
  assert.ok(Math.abs(normalizedBiExponential(peakTime, 2, 24) - 1) < 1e-12);
  assert.equal(normalizedBiExponential(-1, 2, 24), 0);
  assert.throws(() => biExponentialPeakTimeMs(5, 2), /mayor que tauRiseMs/);
});

test("noise-free trace matches the declared primary peak", () => {
  const scenario = generatePspScenario({
    seed: 7,
    sampleRateHz: 50000,
    durationMs: 200,
    sweepCount: 1,
    noiseStdMv: 0,
    baselineMv: -65,
    artifact: { amplitudeMv: 0, tauMs: 0.2 },
    variability: { amplitudeCv: 0, latencyJitterMs: 0, baselineJitterMv: 0 },
    stimuli: [{ timeMs: 50 }],
    response: { amplitudeMv: 5, latencyMs: 3, tauRiseMs: 2, tauDecayMs: 24 },
  });
  const truth = scenario.groundTruth.sweeps[0].events[0];
  const peakIndex = Math.round((truth.peakTimeMs * scenario.metadata.sampleRateHz) / 1000);
  const measuredAmplitude = scenario.sweeps[0].voltageMv[peakIndex] - scenario.groundTruth.sweeps[0].baselineMv;

  assert.ok(Math.abs(measuredAmplitude - 5) < 0.002);
  assert.equal(truth.direction, "positive");
});

test("EPSP and IPSP labels require explicit evidence", () => {
  assert.throws(
    () => normalizePspScenarioConfig({ physiologicalLabel: "EPSP" }),
    /evidencia experimental explícita/,
  );
  const labeled = normalizePspScenarioConfig({
    physiologicalLabel: "IPSP",
    physiologicalEvidence: ["Aislamiento farmacológico declarado por el docente"],
  });
  assert.equal(labeled.physiologicalLabel, "IPSP");
});

test("absence of response remains a valid ground-truth outcome", () => {
  const scenario = generatePspScenario({
    response: { kind: "none" },
    sweepCount: 1,
    noiseStdMv: 0,
    artifact: { amplitudeMv: 0, tauMs: 0.2 },
    variability: { amplitudeCv: 0, latencyJitterMs: 0, baselineJitterMv: 0 },
  });
  assert.equal(scenario.groundTruth.sweeps[0].events[0].amplitudeMv, 0);
  assert.equal(scenario.groundTruth.sweeps[0].events[0].direction, "none");
  assert.ok(scenario.sweeps[0].voltageMv.every((value) => value === scenario.configuration.baselineMv));
});

test("negative, biphasic, paired, and saturated scenarios preserve their truth", () => {
  const scenario = generatePspScenario({
    seed: 99,
    durationMs: 300,
    sweepCount: 1,
    noiseStdMv: 0,
    baselineMv: -65,
    stimuli: [{ timeMs: 50 }, { timeMs: 180, amplitudeScale: 1.5 }],
    response: {
      kind: "biphasic",
      amplitudeMv: -4,
      latencyMs: 2,
      tauRiseMs: 2,
      tauDecayMs: 20,
      secondaryAmplitudeMv: 2,
      secondaryDelayMs: 15,
      secondaryTauRiseMs: 3,
      secondaryTauDecayMs: 30,
    },
    variability: { amplitudeCv: 0, latencyJitterMs: 0, baselineJitterMv: 0 },
    saturation: { minimumMv: -68, maximumMv: -60 },
  });
  const events = scenario.groundTruth.sweeps[0].events;
  assert.equal(events.length, 2);
  assert.equal(events[0].direction, "biphasic");
  assert.equal(events[1].amplitudeMv, events[0].amplitudeMv * 1.5);
  assert.ok(scenario.groundTruth.sweeps[0].clippedSamples > 0);
});

test("student view removes ground truth and physiological evidence", () => {
  const scenario = generatePspScenario({
    physiologicalLabel: "EPSP",
    physiologicalEvidence: ["Bloqueo farmacológico"],
  });
  const student = createStudentScenarioView(scenario);
  assert.equal("groundTruth" in student, false);
  assert.equal("configuration" in student, false);
  assert.deepEqual(student.sweeps[0].voltageMv, scenario.sweeps[0].voltageMv);
});

test("seeded random produces stable numeric sequence", () => {
  const random = createSeededRandom(42);
  assert.deepEqual(
    [random(), random(), random()].map((value) => Number(value.toFixed(8))),
    [0.60110375, 0.44829056, 0.85246579],
  );
});

