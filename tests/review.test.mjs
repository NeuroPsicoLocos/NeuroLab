import test from "node:test";
import assert from "node:assert/strict";

import {
  REVIEW_SCHEMA,
  buildReviewSessionKey,
  buildTraceReviewKey,
  isReviewCurrent,
  loadReviewState,
  reviewDecisionFromShortcut,
  storeReviewRecord,
} from "../apps/electrophysiology-lab/src/core/review.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("manual review records persist per file, sheet, and trace", () => {
  const storage = memoryStorage();
  const sessionKey = buildReviewSessionKey({ fileName: "PopSpikes.xlsx", fileSize: 1024, lastModified: 42 });
  const traceKey = buildTraceReviewKey("condición F", "Columna G");
  const saved = storeReviewRecord(storage, sessionKey, traceKey, {
    decision: "accepted",
    note: "Puntos confirmados",
    analysisFingerprint: "abc",
  });

  assert.equal(saved.ok, true);
  const restored = loadReviewState(storage, sessionKey);
  assert.equal(restored.schema, REVIEW_SCHEMA);
  assert.equal(restored.traces[traceKey].decision, "accepted");
  assert.equal(isReviewCurrent(restored.traces[traceKey], "abc"), true);
  assert.equal(isReviewCurrent(restored.traces[traceKey], "changed"), false);
});

test("invalid saved review data falls back safely", () => {
  const storage = { getItem: () => "not-json" };
  assert.deepEqual(loadReviewState(storage, "key"), { schema: REVIEW_SCHEMA, traces: {} });
});

test("review shortcuts map only the documented unmodified keys", () => {
  assert.equal(reviewDecisionFromShortcut("A"), "accepted");
  assert.equal(reviewDecisionFromShortcut("r"), "rejected");
  assert.equal(reviewDecisionFromShortcut("P"), "pending");
  assert.equal(reviewDecisionFromShortcut("Enter"), null);
});
