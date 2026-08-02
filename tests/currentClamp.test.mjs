import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PSP_PROFILE,
  measureEvokedPsps,
  measurePspEvent,
} from "../apps/electrophysiology-lab/src/core/currentClamp.js";
import { generatePspScenario } from "../apps/electrophysiology-lab/src/core/pspScenario.js";

function deterministicScenario(overrides = {}) {
  return generatePspScenario({
    seed: 101,
    durationMs: 400,
    sweepCount: 1,
    noiseStdMv: 0,
    artifact: { amplitudeMv: 0, tauMs: 0.2 },
    variability: { amplitudeCv: 0, latencyJitterMs: 0, baselineJitterMv: 0 },
    ...overrides,
  });
}

test("noise-free positive PSP recovers amplitude and peak without assigning EPSP", () => {
  const scenario = deterministicScenario();
  const originalVoltage = [...scenario.sweeps[0].voltageMv];
  const truth = scenario.groundTruth.sweeps[0].events[0];
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, truth.stimulusTimeMs);

  assert.equal(result.ok, true);
  assert.equal(result.status, "response_detected");
  assert.equal(result.detected, true);
  assert.equal(result.classification.direction, "positive");
  assert.equal(result.classification.physiologicalLabel, "PSP_unclassified");
  assert.ok(Math.abs(result.metrics.signedAmplitudeMv - truth.amplitudeMv) < 0.002);
  assert.ok(Math.abs(result.points.peak.timeMs - truth.peakTimeMs) < 0.11);
  assert.ok(result.points.onset.timeMs >= truth.onsetTimeMs);
  assert.deepEqual(scenario.sweeps[0].voltageMv, originalVoltage);
});

test("negative PSP preserves electrical direction without inferring inhibition", () => {
  const scenario = deterministicScenario({
    seed: 102,
    noiseStdMv: 0.08,
    response: { amplitudeMv: -3 },
  });
  const truth = scenario.groundTruth.sweeps[0].events[0];
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, truth.stimulusTimeMs);

  assert.equal(result.status, "response_detected");
  assert.equal(result.classification.direction, "negative");
  assert.equal(result.classification.physiologicalLabel, "PSP_unclassified");
  // Selecting the raw extreme has a predictable noise-selection bias; the
  // tolerance is bounded at less than four baseline standard deviations.
  assert.ok(Math.abs(result.metrics.signedAmplitudeMv - truth.amplitudeMv) < 0.3);
  assert.ok(result.metrics.amplitudeSnr > 10);
});

test("an unexpected direction is reported instead of being suppressed", () => {
  const scenario = deterministicScenario({ response: { amplitudeMv: -3 } });
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, 100, {
    expectedDirection: "positive",
  });

  assert.equal(result.detected, true);
  assert.equal(result.classification.direction, "negative");
  assert.ok(result.flags.some((flag) => flag.code === "unexpected_response_direction"));
});

test("no response is a valid outcome under baseline noise", () => {
  const scenario = deterministicScenario({
    seed: 103,
    noiseStdMv: 0.12,
    artifact: { amplitudeMv: 0.8, tauMs: 0.18 },
    response: { kind: "none" },
  });
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, 100);

  assert.equal(result.ok, true);
  assert.equal(result.detected, false);
  assert.equal(result.status, "no_response_detectable");
  assert.equal(result.classification.eventType, "no_response_detectable");
});

test("paired stimuli are measured independently and preserve amplitude ratio", () => {
  const scenario = deterministicScenario({
    seed: 104,
    noiseStdMv: 0.03,
    stimuli: [{ timeMs: 60 }, { timeMs: 210, amplitudeScale: 1.5 }],
  });
  const result = measureEvokedPsps(scenario.timeMs, scenario.sweeps[0].voltageMv, [60, 210]);

  assert.equal(result.ok, true);
  assert.equal(result.events.length, 2);
  assert.ok(result.events.every((event) => event.detected));
  const ratio = result.events[1].metrics.signedAmplitudeMv / result.events[0].metrics.signedAmplitudeMv;
  assert.ok(Math.abs(ratio - 1.5) < 0.04);
});

test("linear baseline correction handles drift but keeps a review flag", () => {
  const scenario = deterministicScenario({
    seed: 105,
    noiseStdMv: 0.05,
    driftMvPerSecond: 20,
  });
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, 100, {
    baselineCorrection: "linear",
  });

  assert.equal(result.detected, true);
  assert.equal(result.classification.direction, "positive");
  assert.ok(Math.abs(result.metrics.signedAmplitudeMv - 4) < 0.15);
  assert.ok(Math.abs(result.metrics.baselineDriftMvPerSecond - 20) < 2);
  assert.ok(result.flags.some((flag) => flag.code === "baseline_drift"));
});

test("biphasic responses are flagged while retaining their primary measurement", () => {
  const scenario = deterministicScenario({
    seed: 106,
    noiseStdMv: 0.03,
    response: {
      kind: "biphasic",
      amplitudeMv: 3,
      secondaryAmplitudeMv: -2,
      secondaryDelayMs: 25,
    },
  });
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, 100);

  assert.equal(result.status, "response_detected");
  assert.equal(result.classification.direction, "biphasic");
  assert.ok(result.metrics.oppositePhaseAmplitudeMv > 1);
  assert.ok(result.flags.some((flag) => flag.code === "biphasic_response"));
  assert.equal(result.reviewRequired, true);
});

test("the first sustained phase remains primary when the opposite phase is larger", () => {
  const scenario = deterministicScenario({
    seed: 107,
    noiseStdMv: 0.02,
    response: {
      kind: "biphasic",
      amplitudeMv: 1,
      secondaryAmplitudeMv: -4,
      secondaryDelayMs: 25,
    },
  });
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, 100);

  assert.equal(result.detected, true);
  assert.equal(result.classification.direction, "biphasic");
  assert.ok(result.metrics.signedAmplitudeMv > 0);
  assert.ok(result.metrics.oppositePhaseAmplitudeMv > result.metrics.absoluteAmplitudeMv);
  assert.ok(result.points.onset.latencyMs < 10);
});

test("configured saturation makes a response non-evaluable", () => {
  const scenario = deterministicScenario({
    saturation: { minimumMv: -70, maximumMv: -62 },
  });
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, 100, {
    saturationMinimumMv: -70,
    saturationMaximumMv: -62,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.metrics.saturationCount > 0);
  assert.ok(result.flags.some((flag) => flag.code === "saturation_in_response" && flag.level === "exclude"));
});

test("spike-like contamination invalidates primary PSP amplitude", () => {
  const scenario = deterministicScenario();
  const voltage = [...scenario.sweeps[0].voltageMv];
  const spikeIndex = Math.round((112 * scenario.metadata.sampleRateHz) / 1000);
  voltage[spikeIndex] += 40;
  const result = measurePspEvent(scenario.timeMs, voltage, 100);

  assert.equal(result.detected, true);
  assert.equal(result.status, "contaminated_response");
  assert.equal(result.classification.eventType, "PSP_contaminated_by_spike");
  assert.equal(result.metrics.primaryAmplitudeValid, false);
  assert.ok(result.flags.some((flag) => flag.code === "possible_action_potential"));
});

test("invalid traces, windows, and stimulus lists fail explicitly", () => {
  const nonMonotonic = measurePspEvent([0, 2, 1, 3, 4], [-65, -65, -65, -64, -65], 2);
  assert.equal(nonMonotonic.ok, false);
  assert.ok(nonMonotonic.flags.some((flag) => flag.code === "non_monotonic_time"));

  const invalidWindows = measurePspEvent([0, 1, 2, 3, 4], [-65, -65, -65, -64, -65], 2, {
    baselineStartMs: -2,
    baselineEndMs: 0,
  });
  assert.ok(invalidWindows.flags.some((flag) => flag.code === "invalid_parameters"));

  const invalidStimuli = measureEvokedPsps([0, 1, 2], [-65, -65, -65], [2, 1]);
  assert.equal(invalidStimuli.ok, false);
  assert.ok(invalidStimuli.flags.some((flag) => flag.code === "invalid_stimulus_times"));
});

test("missing samples and irregular sampling remain visible as QC flags", () => {
  const scenario = deterministicScenario();
  const voltageWithMissing = [...scenario.sweeps[0].voltageMv];
  voltageWithMissing[700] = null;
  const missingResult = measurePspEvent(scenario.timeMs, voltageWithMissing, 100);
  assert.equal(missingResult.ok, true);
  assert.equal(missingResult.metrics.missingCount, 1);
  assert.ok(missingResult.flags.some((flag) => flag.code === "missing_values"));

  const irregularTime = scenario.timeMs.map((time, index) => time + (index % 2 ? 0.02 : 0));
  const irregularResult = measurePspEvent(irregularTime, scenario.sweeps[0].voltageMv, 100);
  assert.equal(irregularResult.ok, true);
  assert.ok(irregularResult.flags.some((flag) => flag.code === "irregular_sampling"));
});

test("fixed synthetic benchmark reports sensitivity and false positives", () => {
  let truePositives = 0;
  let falsePositives = 0;
  const scenarioCount = 40;

  for (let seed = 1; seed <= scenarioCount; seed += 1) {
    const response = generatePspScenario({
      seed,
      sweepCount: 1,
      noiseStdMv: 0.12,
      response: { amplitudeMv: 1 },
    });
    const absent = generatePspScenario({
      seed: `absent-${seed}`,
      sweepCount: 1,
      noiseStdMv: 0.12,
      response: { kind: "none" },
    });
    if (measurePspEvent(response.timeMs, response.sweeps[0].voltageMv, 100).detected) truePositives += 1;
    if (measurePspEvent(absent.timeMs, absent.sweeps[0].voltageMv, 100).detected) falsePositives += 1;
  }

  assert.equal(truePositives / scenarioCount, 1);
  assert.equal(falsePositives / scenarioCount, 0);
});

test("default profile remains serializable and explicit", () => {
  assert.doesNotThrow(() => JSON.stringify(DEFAULT_PSP_PROFILE));
  assert.equal(DEFAULT_PSP_PROFILE.expectedDirection, "auto");
  assert.equal(DEFAULT_PSP_PROFILE.baselineCorrection, "constant");

  const scenario = deterministicScenario();
  const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, 100);
  const visit = (value) => {
    if (typeof value === "number") assert.equal(Number.isFinite(value), true);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  visit(result);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(result)));
});
