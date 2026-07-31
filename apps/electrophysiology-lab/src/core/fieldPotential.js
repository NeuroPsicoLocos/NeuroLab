import { median, medianAbsoluteDeviation } from "./signal.js";

// Central smoothing coefficients equivalent to scipy.signal.savgol_filter
// for window_length=11 and polyorder=3 away from the five boundary samples.
const SAVGOL_11_3 = [-36, 9, 44, 69, 84, 89, 84, 69, 44, 9, -36].map((value) => value / 429);

export const LEGACY_POPS_PROFILE = Object.freeze({
  profile: "train",
  smoothing: true,
  artifactThreshold: 0.3,
  minimumArtifactDistanceMs: 15,
  p1StartMs: 3,
  p1EndMs: 10,
  p2StartMs: 0,
  p2EndMs: 10,
  p3StartMs: 2,
  p3EndMs: 8,
  p3Prominence: 0.2,
  baselineStartMs: -12,
  baselineEndMs: -2,
});

export const PAIRED_POPS_PROFILE = Object.freeze({
  ...LEGACY_POPS_PROFILE,
  profile: "paired",
  pairedSearchEndMs: [60, 150],
  artifactPaddingSamples: 5,
  p1StartMs: 1,
  p1EndMs: 10,
  p2StartMs: 0,
  p2EndMs: 15,
  p3StartMs: 0,
  p3EndMs: 20,
  p3Prominence: 0.3,
});

function resolveSettings(options) {
  const base = options.profile === "paired" ? PAIRED_POPS_PROFILE : LEGACY_POPS_PROFILE;
  return { ...base, ...options };
}

function firstIndexGreater(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] <= target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function extremeIndex(values, start, end, mode) {
  if (start < 0 || end > values.length || start >= end) return null;
  let selected = start;
  for (let index = start + 1; index < end; index += 1) {
    if ((mode === "max" && values[index] > values[selected]) || (mode === "min" && values[index] < values[selected])) {
      selected = index;
    }
  }
  return selected;
}

export function smoothSavitzkyGolay11x3(signal) {
  if (signal.length < SAVGOL_11_3.length) return [...signal];
  const halfWindow = 5;
  const output = [...signal];
  for (let index = halfWindow; index < signal.length - halfWindow; index += 1) {
    let value = 0;
    for (let offset = -halfWindow; offset <= halfWindow; offset += 1) {
      value += signal[index + offset] * SAVGOL_11_3[offset + halfWindow];
    }
    output[index] = value;
  }
  // POPS events are not expected at the recording boundaries. Copying the
  // nearest central estimate avoids inventing an edge extrapolation.
  for (let index = 0; index < halfWindow; index += 1) {
    output[index] = output[halfWindow];
    output[signal.length - 1 - index] = output[signal.length - 1 - halfWindow];
  }
  return output;
}

function localMaxima(values, threshold = Number.NEGATIVE_INFINITY) {
  const peaks = [];
  for (let index = 1; index < values.length - 1; index += 1) {
    if (values[index] >= threshold && values[index] > values[index - 1] && values[index] >= values[index + 1]) {
      peaks.push(index);
    }
  }
  return peaks;
}

function enforceMinimumDistance(peaks, scores, minimumSamples) {
  const selected = [];
  const ranked = [...peaks].sort((a, b) => scores[b] - scores[a]);
  for (const peak of ranked) {
    if (selected.every((accepted) => Math.abs(accepted - peak) >= minimumSamples)) selected.push(peak);
  }
  return selected.sort((a, b) => a - b);
}

export function detectLegacyArtifacts(timeMs, signal, options = {}) {
  const settings = resolveSettings(options);
  if (timeMs.length < 3 || timeMs.length !== signal.length) return [];
  const deltaMs = median(timeMs.slice(1).map((time, index) => time - timeMs[index]).filter((delta) => delta > 0));
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return [];

  const derivativePerSample = signal.slice(1).map((value, index) => Math.abs(value - signal[index]));
  const peaks = localMaxima(derivativePerSample, settings.artifactThreshold);
  const minimumSamples = Math.max(1, Math.floor(settings.minimumArtifactDistanceMs / deltaMs));
  const accepted = enforceMinimumDistance(peaks, derivativePerSample, minimumSamples);
  return accepted.map((index) => ({
    index,
    timeMs: timeMs[index],
    value: signal[index],
    score: derivativePerSample[index],
    scoreOverThreshold: derivativePerSample[index] / settings.artifactThreshold,
  }));
}

export function detectPairedLegacyArtifacts(timeMs, signal, options = {}) {
  const settings = resolveSettings({ ...options, profile: "paired" });
  if (timeMs.length < 3 || timeMs.length !== signal.length) return [];
  const derivativePerSample = signal.slice(1).map((value, index) => Math.abs(value - signal[index]));
  return settings.pairedSearchEndMs.map((searchEndMs) => {
    const end = Math.min(firstIndexGreater(timeMs, searchEndMs), derivativePerSample.length);
    const index = extremeIndex(derivativePerSample, 0, end, "max");
    if (index === null) return null;
    const referenceIndex = Math.min(timeMs.length - 1, index + settings.artifactPaddingSamples);
    return {
      index,
      timeMs: timeMs[index],
      value: signal[index],
      score: derivativePerSample[index],
      scoreOverThreshold: null,
      windowReferenceTimeMs: timeMs[referenceIndex],
      searchEndMs,
    };
  }).filter(Boolean);
}

function peakProminence(values, peakIndex) {
  let leftMinimum = values[peakIndex];
  for (let index = peakIndex - 1; index >= 0; index -= 1) {
    if (values[index] > values[peakIndex]) break;
    if (values[index] < leftMinimum) leftMinimum = values[index];
  }
  let rightMinimum = values[peakIndex];
  for (let index = peakIndex + 1; index < values.length; index += 1) {
    if (values[index] > values[peakIndex]) break;
    if (values[index] < rightMinimum) rightMinimum = values[index];
  }
  return values[peakIndex] - Math.max(leftMinimum, rightMinimum);
}

function selectP3(signal, start, end, minimumProminence) {
  if (start < 0 || end > signal.length || start >= end) return { index: null, usedFallback: true, prominence: null };
  const segment = signal.slice(start, end);
  const qualifying = localMaxima(segment)
    .map((index) => ({ index, prominence: peakProminence(segment, index) }))
    .filter((peak) => peak.prominence >= minimumProminence);

  if (!qualifying.length) {
    return { index: extremeIndex(signal, start, end, "max"), usedFallback: true, prominence: null };
  }
  qualifying.sort((a, b) => segment[b.index] - segment[a.index]);
  return {
    index: start + qualifying[0].index,
    usedFallback: false,
    prominence: qualifying[0].prominence,
  };
}

function pointAt(index, timeMs, signal, artifactTimeMs) {
  return {
    index,
    timeMs: timeMs[index],
    latencyMs: timeMs[index] - artifactTimeMs,
    value: signal[index],
  };
}

function nearWindowBoundary(pointTime, startTime, endTime, medianDeltaMs) {
  return pointTime - startTime <= medianDeltaMs * 1.5 || endTime - pointTime <= medianDeltaMs * 1.5;
}

function measureEvent(eventNumber, artifact, timeMs, signal, settings, previousArtifact) {
  const artifactTime = artifact.timeMs;
  const windowReferenceTime = artifact.windowReferenceTimeMs ?? artifactTime;
  const p1StartTime = windowReferenceTime + settings.p1StartMs;
  const p1EndTime = windowReferenceTime + settings.p1EndMs;
  const p1Start = firstIndexGreater(timeMs, p1StartTime);
  const p1End = firstIndexGreater(timeMs, p1EndTime);
  const p1Index = extremeIndex(signal, p1Start, p1End, "max");
  if (p1Index === null) return { valid: false, eventNumber, artifact, flags: ["p1_window_empty"] };

  const p2StartTime = timeMs[p1Index] + settings.p2StartMs;
  const p2EndTime = timeMs[p1Index] + settings.p2EndMs;
  const p2Start = Math.max(p1Index + 1, firstIndexGreater(timeMs, p2StartTime));
  const p2End = firstIndexGreater(timeMs, p2EndTime);
  const p2Index = extremeIndex(signal, p2Start, p2End, "min");
  if (p2Index === null) return { valid: false, eventNumber, artifact, flags: ["p2_window_empty"] };

  const p3StartTime = timeMs[p2Index] + settings.p3StartMs;
  const p3EndTime = timeMs[p2Index] + settings.p3EndMs;
  const p3Start = firstIndexGreater(timeMs, p3StartTime);
  const p3End = firstIndexGreater(timeMs, p3EndTime);
  const p3Selection = selectP3(signal, p3Start, p3End, settings.p3Prominence);
  if (p3Selection.index === null) return { valid: false, eventNumber, artifact, flags: ["p3_window_empty"] };

  const p1 = pointAt(p1Index, timeMs, signal, artifactTime);
  const p2 = pointAt(p2Index, timeMs, signal, artifactTime);
  const p3 = pointAt(p3Selection.index, timeMs, signal, artifactTime);
  const amplitude = ((p1.value + p3.value) / 2) - p2.value;
  const tau12Ms = p2.timeMs - p1.timeMs;
  const tau23Ms = p3.timeMs - p2.timeMs;
  const slope13PerSecond = p3.timeMs !== p1.timeMs ? ((p3.value - p1.value) / (p3.timeMs - p1.timeMs)) * 1000 : Number.NaN;

  const baselineStart = firstIndexGreater(timeMs, artifactTime + settings.baselineStartMs);
  const baselineEnd = firstIndexGreater(timeMs, artifactTime + settings.baselineEndMs);
  const baselineValues = signal.slice(baselineStart, baselineEnd);
  const baseline = median(baselineValues);
  const baselineMad = medianAbsoluteDeviation(baselineValues, baseline);
  const baselineSigma = baselineMad * 1.4826;
  const snr = baselineSigma > 0 ? amplitude / baselineSigma : Number.NaN;
  const medianDeltaMs = median(timeMs.slice(1).map((time, index) => time - timeMs[index]).filter((delta) => delta > 0));

  const flags = [];
  let confidence = 100;
  if (p3Selection.usedFallback) {
    flags.push("p3_prominence_fallback");
    confidence -= 20;
  }
  if (amplitude <= 0) {
    flags.push("non_positive_amplitude");
    confidence -= 35;
  }
  if (nearWindowBoundary(p1.timeMs, p1StartTime, p1EndTime, medianDeltaMs)) {
    flags.push("p1_at_window_edge");
    confidence -= 12;
  }
  if (nearWindowBoundary(p2.timeMs, p2StartTime, p2EndTime, medianDeltaMs)) {
    flags.push("p2_at_window_edge");
    confidence -= 12;
  }
  if (nearWindowBoundary(p3.timeMs, p3StartTime, p3EndTime, medianDeltaMs)) {
    flags.push("p3_at_window_edge");
    confidence -= 12;
  }
  if (Number.isFinite(snr) && snr < 3) {
    flags.push("low_snr");
    confidence -= 15;
  }

  return {
    valid: true,
    eventNumber,
    artifact,
    intervalFromPreviousMs: previousArtifact ? artifact.timeMs - previousArtifact.timeMs : null,
    p1,
    p2,
    p3,
    amplitude,
    tau12Ms,
    tau23Ms,
    slope13PerSecond,
    baseline,
    baselineSigma,
    snr,
    p3Prominence: p3Selection.prominence,
    confidence: Math.max(0, confidence),
    reviewRequired: confidence < 70 || flags.length > 0,
    flags,
  };
}

/**
 * Port of the current POPS notebook profile for extracellular population spikes.
 * The confidence score is a transparent review heuristic, not a probability.
 */
export function measurePopulationSpikes(timeMs, rawSignal, options = {}) {
  const settings = resolveSettings(options);
  const flags = [];
  const invalidSettings =
    (settings.profile === "train" && (!Number.isFinite(settings.artifactThreshold) || settings.artifactThreshold <= 0)) ||
    !Number.isFinite(settings.minimumArtifactDistanceMs) ||
    settings.minimumArtifactDistanceMs < 0 ||
    settings.p1EndMs <= settings.p1StartMs ||
    settings.p2EndMs <= settings.p2StartMs ||
    settings.p3EndMs <= settings.p3StartMs;
  if (invalidSettings) {
    return { ok: false, processedSignal: [...rawSignal], artifacts: [], events: [], flags: ["invalid_parameters"], settings };
  }
  if (timeMs.length !== rawSignal.length || timeMs.length < 11) {
    return { ok: false, processedSignal: [...rawSignal], artifacts: [], events: [], flags: ["invalid_trace"], settings };
  }
  if (timeMs.slice(1).some((time, index) => time <= timeMs[index])) {
    return { ok: false, processedSignal: [...rawSignal], artifacts: [], events: [], flags: ["non_monotonic_time"], settings };
  }
  const processedSignal = settings.smoothing ? smoothSavitzkyGolay11x3(rawSignal) : [...rawSignal];
  const artifacts = settings.profile === "paired"
    ? detectPairedLegacyArtifacts(timeMs, processedSignal, settings)
    : detectLegacyArtifacts(timeMs, processedSignal, settings);
  const events = artifacts.map((artifact, index) =>
    measureEvent(index + 1, artifact, timeMs, processedSignal, settings, artifacts[index - 1]),
  );
  if (!artifacts.length) flags.push("no_artifacts");
  if (new Set(artifacts.map((artifact) => artifact.index)).size !== artifacts.length) flags.push("duplicate_artifact_windows");
  if (events.some((event) => !event.valid)) flags.push("incomplete_response_window");
  if (events.some((event) => event.reviewRequired)) flags.push("events_require_review");
  return {
    ok: artifacts.length > 0 && events.some((event) => event.valid),
    processedSignal,
    artifacts,
    events,
    flags,
    settings,
  };
}
