import { median, medianAbsoluteDeviation } from "./signal.js";

export const CORRECTION_POINT_NAMES = Object.freeze(["p1", "p2", "p3"]);

export function appendCorrectionAudit(history = [], entry, maximumEntries = 500) {
  if (!entry || typeof entry !== "object") return [...history];
  return [...history, { ...entry }].slice(-Math.max(1, maximumEntries));
}

function pointAt(index, timeMs, signal, artifactTimeMs) {
  return {
    index,
    timeMs: timeMs[index],
    latencyMs: timeMs[index] - artifactTimeMs,
    value: signal[index],
    manual: true,
  };
}

function effectiveIndex(event, correction, pointName) {
  return correction?.points?.[pointName]?.correctedIndex ?? event?.[pointName]?.index ?? null;
}

export function setPointCorrection({
  event,
  eventCorrection = null,
  pointName,
  sampleIndex,
  timeMs,
  signal,
  correctedAt = new Date().toISOString(),
}) {
  if (!event?.artifact || !CORRECTION_POINT_NAMES.includes(pointName)) {
    return { ok: false, code: "invalid_point_selection", message: "Selecciona un evento y un punto POPS válido." };
  }
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex >= timeMs.length || sampleIndex >= signal.length) {
    return { ok: false, code: "invalid_sample", message: "El clic no corresponde a una muestra válida." };
  }

  const points = { ...(eventCorrection?.points ?? {}) };
  points[pointName] = {
    pointName,
    automaticIndex: event[pointName]?.index ?? null,
    correctedIndex: sampleIndex,
    correctedAt,
  };
  const candidate = { eventNumber: event.eventNumber, points, updatedAt: correctedAt };
  const indices = CORRECTION_POINT_NAMES.map((name) => effectiveIndex(event, candidate, name));
  if (indices[0] !== null && indices[1] !== null && indices[0] >= indices[1]) {
    return { ok: false, code: "p1_after_p2", message: "P1 debe quedar antes de P2." };
  }
  if (indices[1] !== null && indices[2] !== null && indices[1] >= indices[2]) {
    return { ok: false, code: "p2_after_p3", message: "P2 debe quedar antes de P3." };
  }
  return { ok: true, correction: candidate };
}

export function removePointCorrection(eventCorrection, pointName) {
  if (!eventCorrection?.points?.[pointName]) return eventCorrection ?? null;
  const points = { ...eventCorrection.points };
  delete points[pointName];
  return Object.keys(points).length ? { ...eventCorrection, points } : null;
}

function isOutsideConfiguredWindow(event, settings) {
  if (!event.p1 || !event.p2 || !event.p3) return false;
  const reference = event.artifact.windowReferenceTimeMs ?? event.artifact.timeMs;
  const inside = (value, start, end) => value >= start && value <= end;
  return !inside(event.p1.timeMs, reference + settings.p1StartMs, reference + settings.p1EndMs)
    || !inside(event.p2.timeMs, event.p1.timeMs + settings.p2StartMs, event.p1.timeMs + settings.p2EndMs)
    || !inside(event.p3.timeMs, event.p2.timeMs + settings.p3StartMs, event.p2.timeMs + settings.p3EndMs);
}

function baselineMetrics(event, timeMs, signal, settings) {
  if (Number.isFinite(event.baseline) && Number.isFinite(event.baselineSigma)) {
    return { baseline: event.baseline, baselineSigma: event.baselineSigma };
  }
  const values = timeMs.reduce((selected, time, index) => {
    if (time >= event.artifact.timeMs + settings.baselineStartMs && time <= event.artifact.timeMs + settings.baselineEndMs) {
      selected.push(signal[index]);
    }
    return selected;
  }, []);
  const baseline = median(values);
  return { baseline, baselineSigma: medianAbsoluteDeviation(values, baseline) * 1.4826 };
}

function applyEventCorrection(event, correction, timeMs, signal, settings) {
  if (!correction?.points || !Object.keys(correction.points).length) return event;
  const automaticPoints = { p1: event.p1 ?? null, p2: event.p2 ?? null, p3: event.p3 ?? null };
  const corrected = { ...event, automaticValid: event.valid, automaticFlags: [...(event.flags ?? [])], automaticPoints };
  for (const pointName of CORRECTION_POINT_NAMES) {
    const correctedIndex = correction.points[pointName]?.correctedIndex;
    if (Number.isInteger(correctedIndex)) {
      corrected[pointName] = pointAt(correctedIndex, timeMs, signal, event.artifact.timeMs);
    }
  }

  const complete = CORRECTION_POINT_NAMES.every((pointName) => corrected[pointName]);
  const ordered = complete && corrected.p1.index < corrected.p2.index && corrected.p2.index < corrected.p3.index;
  corrected.manualCorrection = true;
  corrected.correctedPointNames = Object.keys(correction.points);
  corrected.correctionUpdatedAt = correction.updatedAt ?? null;
  corrected.flags = ["manual_points_adjusted"];
  corrected.reviewRequired = true;
  corrected.confidence = null;
  if (!complete || !ordered) {
    corrected.valid = false;
    if (!complete) corrected.flags.push("manual_response_incomplete");
    if (!ordered) corrected.flags.push("manual_point_order_invalid");
    return corrected;
  }

  corrected.valid = true;
  corrected.amplitude = ((corrected.p1.value + corrected.p3.value) / 2) - corrected.p2.value;
  corrected.tau12Ms = corrected.p2.timeMs - corrected.p1.timeMs;
  corrected.tau23Ms = corrected.p3.timeMs - corrected.p2.timeMs;
  corrected.slope13PerSecond = corrected.p3.timeMs !== corrected.p1.timeMs
    ? ((corrected.p3.value - corrected.p1.value) / (corrected.p3.timeMs - corrected.p1.timeMs)) * 1000
    : Number.NaN;
  const baseline = baselineMetrics(event, timeMs, signal, settings);
  corrected.baseline = baseline.baseline;
  corrected.baselineSigma = baseline.baselineSigma;
  corrected.snr = baseline.baselineSigma > 0 ? corrected.amplitude / baseline.baselineSigma : Number.NaN;
  if (corrected.amplitude <= 0) corrected.flags.push("non_positive_amplitude");
  if (isOutsideConfiguredWindow(corrected, settings)) corrected.flags.push("manual_point_outside_configured_window");
  return corrected;
}

export function applyPointCorrections(fieldResult, timeMs, corrections = {}) {
  if (!fieldResult) return null;
  const signal = fieldResult.processedSignal;
  const events = fieldResult.events.map((event) => applyEventCorrection(
    event,
    corrections[String(event.eventNumber)],
    timeMs,
    signal,
    fieldResult.settings,
  ));
  const correctedCount = events.filter((event) => event.manualCorrection).length;
  return {
    ...fieldResult,
    ok: fieldResult.artifacts.length > 0 && events.some((event) => event.valid),
    events,
    manualCorrectionCount: correctedCount,
    flags: correctedCount ? [...new Set([...fieldResult.flags, "manual_points_adjusted"])] : fieldResult.flags,
  };
}
