import test from "node:test";
import assert from "node:assert/strict";

import {
  appendCorrectionAudit,
  applyPointCorrections,
  removePointCorrection,
  setPointCorrection,
} from "../apps/electrophysiology-lab/src/core/corrections.js";

const timeMs = Array.from({ length: 12 }, (_, index) => index);
const signal = [0, 0, 1, 2, 1, -3, -2, 1, 3, 1, 0, 0];
const event = {
  valid: true,
  eventNumber: 1,
  artifact: { index: 1, timeMs: 1, value: 0 },
  p1: { index: 3, timeMs: 3, latencyMs: 2, value: 2 },
  p2: { index: 5, timeMs: 5, latencyMs: 4, value: -3 },
  p3: { index: 8, timeMs: 8, latencyMs: 7, value: 3 },
  amplitude: 5.5,
  baseline: 0,
  baselineSigma: 0.5,
  flags: [],
};
const fieldResult = {
  ok: true,
  artifacts: [event.artifact],
  events: [event],
  processedSignal: signal,
  flags: [],
  settings: {
    p1StartMs: 1, p1EndMs: 4,
    p2StartMs: 0, p2EndMs: 5,
    p3StartMs: 0, p3EndMs: 5,
    baselineStartMs: -2, baselineEndMs: -1,
  },
};

test("manual correction rejects an impossible P1-P2-P3 order", () => {
  const result = setPointCorrection({ event, pointName: "p1", sampleIndex: 6, timeMs, signal });
  assert.equal(result.ok, false);
  assert.match(result.message, /P1/);
});

test("manual correction snaps to a sample and recalculates derived POPS metrics", () => {
  const stored = setPointCorrection({
    event,
    pointName: "p2",
    sampleIndex: 6,
    timeMs,
    signal,
    correctedAt: "2026-08-01T10:00:00.000Z",
  });
  assert.equal(stored.ok, true);
  const corrected = applyPointCorrections(fieldResult, timeMs, { "1": stored.correction });
  const correctedEvent = corrected.events[0];
  assert.equal(correctedEvent.p2.index, 6);
  assert.equal(correctedEvent.p2.manual, true);
  assert.equal(correctedEvent.tau12Ms, 3);
  assert.equal(correctedEvent.tau23Ms, 2);
  assert.equal(correctedEvent.amplitude, 4.5);
  assert.deepEqual(correctedEvent.correctedPointNames, ["p2"]);
  assert.equal(correctedEvent.reviewRequired, true);
  assert.equal(corrected.manualCorrectionCount, 1);
});

test("a missing P3 can be supplied manually without erasing the automatic audit", () => {
  const incomplete = { ...event, valid: false, p3: undefined, flags: ["p3_prominence_not_met"] };
  const incompleteField = { ...fieldResult, ok: false, events: [incomplete] };
  const stored = setPointCorrection({ event: incomplete, pointName: "p3", sampleIndex: 8, timeMs, signal });
  const corrected = applyPointCorrections(incompleteField, timeMs, { "1": stored.correction }).events[0];
  assert.equal(corrected.valid, true);
  assert.equal(corrected.automaticValid, false);
  assert.deepEqual(corrected.automaticFlags, ["p3_prominence_not_met"]);
  assert.equal(corrected.p3.index, 8);
});

test("manual points outside configured windows remain measurable but are flagged", () => {
  const stored = setPointCorrection({ event, pointName: "p3", sampleIndex: 11, timeMs, signal });
  const corrected = applyPointCorrections(fieldResult, timeMs, { "1": stored.correction }).events[0];
  assert.equal(corrected.valid, true);
  assert.ok(corrected.flags.includes("manual_point_outside_configured_window"));
  assert.equal(corrected.reviewRequired, true);
});

test("individual and complete correction restoration are deterministic", () => {
  const first = setPointCorrection({ event, pointName: "p2", sampleIndex: 6, timeMs, signal }).correction;
  const second = setPointCorrection({ event, eventCorrection: first, pointName: "p3", sampleIndex: 9, timeMs, signal }).correction;
  const withoutP2 = removePointCorrection(second, "p2");
  assert.equal(withoutP2.points.p2, undefined);
  assert.equal(withoutP2.points.p3.correctedIndex, 9);
  assert.equal(removePointCorrection(withoutP2, "p3"), null);
});

test("correction audit history is append-only and bounded", () => {
  const original = [{ action: "set_point", correctedIndex: 4 }];
  const next = appendCorrectionAudit(original, { action: "restore_point" }, 2);
  assert.deepEqual(original, [{ action: "set_point", correctedIndex: 4 }]);
  assert.deepEqual(next, [
    { action: "set_point", correctedIndex: 4 },
    { action: "restore_point" },
  ]);
  assert.deepEqual(appendCorrectionAudit(next, { action: "restore_all" }, 2), [
    { action: "restore_point" },
    { action: "restore_all" },
  ]);
});
