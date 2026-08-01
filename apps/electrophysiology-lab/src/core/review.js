export const REVIEW_SCHEMA = "simulab-ephys-review-0.1";

export function buildReviewSessionKey({ fileName, fileSize = 0, lastModified = 0 }) {
  return [
    "simulab:ephys:reviews:v1",
    encodeURIComponent(String(fileName || "sin-archivo")),
    Number(fileSize) || 0,
    Number(lastModified) || 0,
  ].join(":");
}

export function buildTraceReviewKey(sheetName, signalHeader) {
  return JSON.stringify([String(sheetName || ""), String(signalHeader || "")]);
}

export function emptyReviewState() {
  return { schema: REVIEW_SCHEMA, traces: {} };
}

export function loadReviewState(storage, sessionKey) {
  try {
    const parsed = JSON.parse(storage?.getItem(sessionKey) || "null");
    if (parsed?.schema !== REVIEW_SCHEMA || !parsed.traces || typeof parsed.traces !== "object") {
      return emptyReviewState();
    }
    return parsed;
  } catch {
    return emptyReviewState();
  }
}

export function storeReviewRecord(storage, sessionKey, traceKey, record, currentState = null) {
  const nextState = currentState?.schema === REVIEW_SCHEMA
    ? { ...currentState, traces: { ...currentState.traces } }
    : loadReviewState(storage, sessionKey);
  nextState.traces[traceKey] = { ...record };
  try {
    storage?.setItem(sessionKey, JSON.stringify(nextState));
    return { ok: true, state: nextState };
  } catch {
    return { ok: false, state: nextState };
  }
}

export function isReviewCurrent(record, analysisFingerprint) {
  return Boolean(record?.analysisFingerprint && record.analysisFingerprint === analysisFingerprint);
}
