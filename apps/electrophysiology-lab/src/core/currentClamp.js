import { median, medianAbsoluteDeviation } from "./signal.js";

/**
 * Conservative defaults for evoked, subthreshold current-clamp responses.
 * All windows are relative to a declared stimulus time and expressed in ms.
 * These values are starting points for synthetic validation, not universal
 * physiological limits for every preparation.
 */
export const DEFAULT_PSP_PROFILE = Object.freeze({
  baselineStartMs: -40,
  baselineEndMs: -5,
  artifactStartMs: -0.5,
  artifactEndMs: 1.5,
  onsetSearchStartMs: 1.5,
  onsetSearchEndMs: 70,
  peakSearchStartMs: 1.5,
  peakSearchEndMs: 120,
  returnSearchEndMs: 250,
  expectedDirection: "auto",
  baselineCorrection: "constant",
  detectionSigma: 4.5,
  onsetSigma: 2.5,
  biphasicSigma: 4,
  minimumOppositePhaseRatio: 0.2,
  returnSigma: 2,
  minimumAmplitudeMv: 0.1,
  minimumOnsetDurationMs: 1,
  minimumReturnDurationMs: 2,
  slopeWindowMs: 1,
  driftReviewMvPerSecond: 5,
  irregularSamplingMadRatio: 0.01,
  edgeToleranceMs: 1,
  preNextStimulusPaddingMs: 0.5,
  spikeAmplitudeThresholdMv: 30,
  spikeSlopeThresholdMvPerMs: 20,
  saturationMinimumMv: null,
  saturationMaximumMv: null,
  maximumMissingFraction: 0.05,
});

const DIRECTIONS = new Set(["auto", "positive", "negative"]);
const BASELINE_CORRECTIONS = new Set(["constant", "linear"]);

function finiteNumber(value, name) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new TypeError(`${name} debe ser un número finito.`);
  return numeric;
}

function positiveNumber(value, name) {
  const numeric = finiteNumber(value, name);
  if (numeric <= 0) throw new RangeError(`${name} debe ser mayor que cero.`);
  return numeric;
}

function nonNegativeNumber(value, name) {
  const numeric = finiteNumber(value, name);
  if (numeric < 0) throw new RangeError(`${name} no puede ser negativo.`);
  return numeric;
}

function normalizeNullableNumber(value, name) {
  return value === null || value === undefined || value === "" ? null : finiteNumber(value, name);
}

function normalizeSettings(userOptions = {}) {
  const settings = { ...DEFAULT_PSP_PROFILE, ...userOptions };
  for (const name of [
    "baselineStartMs",
    "baselineEndMs",
    "artifactStartMs",
    "artifactEndMs",
    "onsetSearchStartMs",
    "onsetSearchEndMs",
    "peakSearchStartMs",
    "peakSearchEndMs",
    "returnSearchEndMs",
  ]) {
    settings[name] = finiteNumber(settings[name], name);
  }
  for (const name of [
    "detectionSigma",
    "onsetSigma",
    "biphasicSigma",
    "returnSigma",
    "minimumAmplitudeMv",
    "minimumOppositePhaseRatio",
    "minimumOnsetDurationMs",
    "minimumReturnDurationMs",
    "slopeWindowMs",
    "irregularSamplingMadRatio",
    "edgeToleranceMs",
    "preNextStimulusPaddingMs",
    "maximumMissingFraction",
    "driftReviewMvPerSecond",
    "spikeAmplitudeThresholdMv",
    "spikeSlopeThresholdMvPerMs",
  ]) {
    settings[name] = nonNegativeNumber(settings[name], name);
  }
  settings.slopeWindowMs = positiveNumber(settings.slopeWindowMs, "slopeWindowMs");
  settings.saturationMinimumMv = normalizeNullableNumber(settings.saturationMinimumMv, "saturationMinimumMv");
  settings.saturationMaximumMv = normalizeNullableNumber(settings.saturationMaximumMv, "saturationMaximumMv");

  if (!DIRECTIONS.has(settings.expectedDirection)) {
    throw new RangeError("expectedDirection debe ser auto, positive o negative.");
  }
  if (!BASELINE_CORRECTIONS.has(settings.baselineCorrection)) {
    throw new RangeError("baselineCorrection debe ser constant o linear.");
  }
  if (!(settings.baselineStartMs < settings.baselineEndMs && settings.baselineEndMs < settings.artifactStartMs)) {
    throw new RangeError("La ventana basal debe terminar antes de la ventana de artefacto.");
  }
  if (!(settings.artifactStartMs < settings.artifactEndMs && settings.artifactEndMs <= settings.onsetSearchStartMs)) {
    throw new RangeError("La búsqueda de inicio no puede invadir la ventana de artefacto.");
  }
  if (!(settings.onsetSearchStartMs < settings.onsetSearchEndMs && settings.onsetSearchEndMs <= settings.peakSearchEndMs)) {
    throw new RangeError("La ventana de inicio es inválida.");
  }
  if (!(settings.peakSearchStartMs < settings.peakSearchEndMs && settings.returnSearchEndMs > settings.peakSearchEndMs)) {
    throw new RangeError("Las ventanas de pico o retorno son inválidas.");
  }
  if (settings.maximumMissingFraction > 1) throw new RangeError("maximumMissingFraction no puede ser mayor que uno.");
  if (
    settings.saturationMinimumMv !== null &&
    settings.saturationMaximumMv !== null &&
    settings.saturationMinimumMv >= settings.saturationMaximumMv
  ) {
    throw new RangeError("saturationMinimumMv debe ser menor que saturationMaximumMv.");
  }
  return settings;
}

function firstIndexAtOrAfter(values, target) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function numericPairs(rawTimeMs, rawVoltageMv) {
  const totalRows = Math.max(rawTimeMs.length, rawVoltageMv.length);
  const timeMs = [];
  const voltageMv = [];
  let missingCount = 0;
  for (let index = 0; index < totalRows; index += 1) {
    const time = Number(rawTimeMs[index]);
    const voltage = Number(rawVoltageMv[index]);
    if (rawTimeMs[index] === null || rawTimeMs[index] === "" || rawVoltageMv[index] === null || rawVoltageMv[index] === "") {
      missingCount += 1;
    } else if (Number.isFinite(time) && Number.isFinite(voltage)) {
      timeMs.push(time);
      voltageMv.push(voltage);
    } else {
      missingCount += 1;
    }
  }
  return { timeMs, voltageMv, totalRows, missingCount };
}

function linearRegression(timeMs, values, startIndex, endIndex) {
  const count = endIndex - startIndex;
  if (count < 2) return { slope: Number.NaN, intercept: Number.NaN, count };
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (let index = startIndex; index < endIndex; index += 1) {
    const x = timeMs[index];
    const y = values[index];
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }
  const denominator = count * sumXX - sumX * sumX;
  if (Math.abs(denominator) <= Number.EPSILON) return { slope: Number.NaN, intercept: Number.NaN, count };
  const slope = (count * sumXY - sumX * sumY) / denominator;
  return { slope, intercept: (sumY - slope * sumX) / count, count };
}

// Approximate Theil–Sen slope using at most 41 evenly distributed baseline samples.
function robustSlope(timeMs, values, startIndex, endIndex) {
  const count = endIndex - startIndex;
  if (count < 3) return Number.NaN;
  const sampleCount = Math.min(41, count);
  const indices = Array.from({ length: sampleCount }, (_, index) =>
    startIndex + Math.round((index * (count - 1)) / Math.max(1, sampleCount - 1)),
  );
  const slopes = [];
  for (let left = 0; left < indices.length - 1; left += 1) {
    for (let right = left + 1; right < indices.length; right += 1) {
      const deltaTime = timeMs[indices[right]] - timeMs[indices[left]];
      if (deltaTime > 0) slopes.push((values[indices[right]] - values[indices[left]]) / deltaTime);
    }
  }
  return median(slopes);
}

function trapezoidIntegral(timeMs, values, startIndex, endIndex) {
  let area = 0;
  for (let index = startIndex + 1; index < endIndex; index += 1) {
    area += ((values[index - 1] + values[index]) / 2) * (timeMs[index] - timeMs[index - 1]);
  }
  return area;
}

function sustainedCrossing(values, startIndex, endIndex, sign, threshold, minimumSamples, mode = "above") {
  let runStart = null;
  for (let index = startIndex; index < endIndex; index += 1) {
    const signedValue = sign * values[index];
    const passes = mode === "above" ? signedValue >= threshold : Math.abs(values[index]) <= threshold;
    if (passes) {
      if (runStart === null) runStart = index;
      if (index - runStart + 1 >= minimumSamples) return runStart;
    } else {
      runStart = null;
    }
  }
  return null;
}

function extremeIndex(values, startIndex, endIndex, direction) {
  if (startIndex >= endIndex) return null;
  let selected = startIndex;
  for (let index = startIndex + 1; index < endIndex; index += 1) {
    if (
      (direction === "positive" && values[index] > values[selected]) ||
      (direction === "negative" && values[index] < values[selected])
    ) {
      selected = index;
    }
  }
  return selected;
}

function firstLevelCrossing(values, startIndex, endIndex, sign, level) {
  for (let index = startIndex; index < endIndex; index += 1) {
    if (sign * values[index] >= level) return index;
  }
  return null;
}

function addFlag(flags, level, code, message) {
  if (!flags.some((flag) => flag.code === code)) flags.push({ level, code, message });
}

function pointAt(index, timeMs, voltageMv, correctedMv, stimulusTimeMs) {
  if (index === null || index < 0 || index >= timeMs.length) return null;
  return {
    index,
    timeMs: timeMs[index],
    latencyMs: timeMs[index] - stimulusTimeMs,
    rawVoltageMv: voltageMv[index],
    baselineCorrectedMv: correctedMv[index],
  };
}

function rollingMaximumSlope(timeMs, correctedMv, startIndex, endIndex, windowMs, sign) {
  let best = null;
  for (let start = startIndex; start < endIndex - 1; start += 1) {
    const end = Math.min(endIndex, firstIndexAtOrAfter(timeMs, timeMs[start] + windowMs) + 1);
    if (end - start < 2) continue;
    const regression = linearRegression(timeMs, correctedMv, start, end);
    if (!Number.isFinite(regression.slope)) continue;
    if (!best || sign * regression.slope > sign * best.slopeMvPerMs) {
      best = {
        slopeMvPerMs: regression.slope,
        startTimeMs: timeMs[start],
        endTimeMs: timeMs[end - 1],
      };
    }
  }
  return best;
}

function baseResult(settings, stimulusTimeMs, flags = []) {
  return {
    ok: false,
    status: "not_evaluable",
    detected: false,
    stimulusTimeMs: Number.isFinite(stimulusTimeMs) ? stimulusTimeMs : null,
    classification: {
      eventType: "not_evaluable",
      direction: "indeterminate",
      physiologicalLabel: "PSP_unclassified",
    },
    points: { onset: null, peak: null, rise20: null, rise80: null, return: null },
    metrics: {},
    confidence: 0,
    confidenceMeaning: "prioridad_heuristica_de_revision_no_probabilidad",
    reviewRequired: true,
    flags,
    settings,
  };
}

/**
 * Measure one evoked subthreshold response from a declared stimulus time.
 * The function reports electrical direction only; it never infers EPSP/IPSP.
 */
export function measurePspEvent(rawTimeMs, rawVoltageMv, stimulusTimeMs, userOptions = {}) {
  let settings;
  try {
    settings = normalizeSettings(userOptions);
  } catch (error) {
    return baseResult(null, Number(stimulusTimeMs), [{ level: "exclude", code: "invalid_parameters", message: error.message }]);
  }

  const stimulus = Number(stimulusTimeMs);
  if (!Number.isFinite(stimulus)) {
    return baseResult(settings, stimulus, [{ level: "exclude", code: "invalid_stimulus_time", message: "El tiempo de estímulo no es válido." }]);
  }
  if (!Array.isArray(rawTimeMs) || !Array.isArray(rawVoltageMv)) {
    return baseResult(settings, stimulus, [{ level: "exclude", code: "invalid_trace", message: "Tiempo y voltaje deben ser arreglos." }]);
  }

  const pairs = numericPairs(rawTimeMs, rawVoltageMv);
  const { timeMs, voltageMv } = pairs;
  const flags = [];
  if (timeMs.length < 5) {
    return baseResult(settings, stimulus, [{ level: "exclude", code: "insufficient_data", message: "La traza no contiene suficientes pares numéricos." }]);
  }
  if (timeMs.slice(1).some((time, index) => time <= timeMs[index])) {
    return baseResult(settings, stimulus, [{ level: "exclude", code: "non_monotonic_time", message: "El tiempo debe ser estrictamente creciente." }]);
  }

  const missingFraction = pairs.totalRows ? pairs.missingCount / pairs.totalRows : 0;
  if (pairs.missingCount > 0) {
    addFlag(
      flags,
      missingFraction > settings.maximumMissingFraction ? "exclude" : "review",
      "missing_values",
      `${pairs.missingCount} fila(s) sin un par tiempo/voltaje válido.`,
    );
  }
  if (missingFraction > settings.maximumMissingFraction) return baseResult(settings, stimulus, flags);

  const deltas = timeMs.slice(1).map((time, index) => time - timeMs[index]);
  const medianDeltaMs = median(deltas);
  const deltaMadRatio = medianDeltaMs > 0 ? medianAbsoluteDeviation(deltas, medianDeltaMs) / medianDeltaMs : Number.NaN;
  if (Number.isFinite(deltaMadRatio) && deltaMadRatio > settings.irregularSamplingMadRatio) {
    addFlag(flags, "review", "irregular_sampling", "El intervalo de muestreo es irregular.");
  }

  const baselineStartTimeMs = stimulus + settings.baselineStartMs;
  const baselineEndTimeMs = stimulus + settings.baselineEndMs;
  const baselineStart = firstIndexAtOrAfter(timeMs, baselineStartTimeMs);
  const baselineEnd = firstIndexAtOrAfter(timeMs, baselineEndTimeMs);
  if (baselineEnd - baselineStart < 3 || baselineStart < 0 || baselineEnd > timeMs.length) {
    addFlag(flags, "exclude", "baseline_window_empty", "No existe una ventana basal preestímulo suficiente.");
    return baseResult(settings, stimulus, flags);
  }
  if (timeMs[0] > baselineStartTimeMs || timeMs.at(-1) < stimulus + settings.peakSearchStartMs) {
    addFlag(flags, "exclude", "incomplete_analysis_window", "La traza no cubre las ventanas basal y de respuesta.");
    return baseResult(settings, stimulus, flags);
  }

  const baselineValues = voltageMv.slice(baselineStart, baselineEnd);
  const baselineMedianMv = median(baselineValues);
  const driftSlopeMvPerMs = robustSlope(timeMs, voltageMv, baselineStart, baselineEnd);
  const baselineAtStimulusMv = settings.baselineCorrection === "linear" && Number.isFinite(driftSlopeMvPerMs)
    ? median(Array.from({ length: baselineEnd - baselineStart }, (_, offset) => {
      const index = baselineStart + offset;
      return voltageMv[index] - driftSlopeMvPerMs * (timeMs[index] - stimulus);
    }))
    : baselineMedianMv;
  const correctedMv = voltageMv.map((value, index) => {
    const modeledBaseline = baselineAtStimulusMv + (
      settings.baselineCorrection === "linear" && Number.isFinite(driftSlopeMvPerMs)
        ? driftSlopeMvPerMs * (timeMs[index] - stimulus)
        : 0
    );
    return value - modeledBaseline;
  });
  const baselineResiduals = Array.from({ length: baselineEnd - baselineStart }, (_, offset) => {
    const index = baselineStart + offset;
    const trend = Number.isFinite(driftSlopeMvPerMs) ? driftSlopeMvPerMs * (timeMs[index] - stimulus) : 0;
    return voltageMv[index] - baselineAtStimulusMv - trend;
  });
  const residualCenter = median(baselineResiduals);
  const baselineNoiseSigmaMv = 1.4826 * medianAbsoluteDeviation(baselineResiduals, residualCenter);
  const baselineNoiseRmsMv = Math.sqrt(
    baselineResiduals.reduce((sum, value) => sum + (value - residualCenter) ** 2, 0) / baselineResiduals.length,
  );
  const driftMvPerSecond = Number.isFinite(driftSlopeMvPerMs) ? driftSlopeMvPerMs * 1000 : Number.NaN;
  if (Number.isFinite(driftMvPerSecond) && Math.abs(driftMvPerSecond) > settings.driftReviewMvPerSecond) {
    addFlag(flags, "review", "baseline_drift", "La pendiente basal supera el límite configurado.");
  }

  let nextStimulusTimeMs;
  try {
    nextStimulusTimeMs = normalizeNullableNumber(userOptions.nextStimulusTimeMs, "nextStimulusTimeMs");
  } catch (error) {
    addFlag(flags, "exclude", "invalid_next_stimulus_time", error.message);
    return baseResult(settings, stimulus, flags);
  }
  const availableEndTimeMs = nextStimulusTimeMs !== null
    ? Math.min(timeMs.at(-1), nextStimulusTimeMs - settings.preNextStimulusPaddingMs)
    : timeMs.at(-1);
  const requestedPeakEndTimeMs = stimulus + settings.peakSearchEndMs;
  const peakEndTimeMs = Math.min(requestedPeakEndTimeMs, availableEndTimeMs);
  const peakStartTimeMs = stimulus + settings.peakSearchStartMs;
  const peakStart = firstIndexAtOrAfter(timeMs, peakStartTimeMs);
  const peakEnd = firstIndexAtOrAfter(timeMs, peakEndTimeMs);
  if (peakStart >= peakEnd) {
    addFlag(flags, "exclude", "peak_window_empty", "La ventana de pico está vacía o cubierta por el siguiente estímulo.");
    return baseResult(settings, stimulus, flags);
  }
  if (peakEndTimeMs < requestedPeakEndTimeMs - medianDeltaMs) {
    addFlag(flags, "review", "response_window_truncated", "La ventana de respuesta termina antes de lo solicitado.");
  }

  const returnEndTimeMs = Math.min(stimulus + settings.returnSearchEndMs, availableEndTimeMs);
  const returnEnd = firstIndexAtOrAfter(timeMs, returnEndTimeMs);
  const responseStart = firstIndexAtOrAfter(timeMs, stimulus + settings.onsetSearchStartMs);
  const saturationEnd = Math.max(peakEnd, returnEnd);
  const saturationCount = correctedMv.slice(responseStart, saturationEnd).filter((_, offset) => {
    const value = voltageMv[responseStart + offset];
    return (
      (settings.saturationMinimumMv !== null && value <= settings.saturationMinimumMv) ||
      (settings.saturationMaximumMv !== null && value >= settings.saturationMaximumMv)
    );
  }).length;
  if (saturationCount > 0) {
    addFlag(flags, "exclude", "saturation_in_response", `${saturationCount} muestra(s) saturada(s) en la ventana de medición.`);
    const result = baseResult(settings, stimulus, flags);
    result.metrics = {
      baselineMv: baselineAtStimulusMv,
      baselineNoiseSigmaMv,
      baselineNoiseRmsMv,
      baselineDriftMvPerSecond: driftMvPerSecond,
      saturationCount,
      sampleRateHz: 1000 / medianDeltaMs,
    };
    return result;
  }

  const positivePeak = extremeIndex(correctedMv, peakStart, peakEnd, "positive");
  const negativePeak = extremeIndex(correctedMv, peakStart, peakEnd, "negative");
  const finiteNoise = Number.isFinite(baselineNoiseSigmaMv) ? baselineNoiseSigmaMv : 0;
  const detectionThresholdMv = Math.max(settings.minimumAmplitudeMv, settings.detectionSigma * finiteNoise);
  const onsetThresholdMv = Math.max(settings.minimumAmplitudeMv * 0.2, settings.onsetSigma * finiteNoise);
  const onsetStart = firstIndexAtOrAfter(timeMs, stimulus + settings.onsetSearchStartMs);
  const onsetSearchEnd = firstIndexAtOrAfter(timeMs, stimulus + settings.onsetSearchEndMs);
  const minimumOnsetSamples = Math.max(1, Math.ceil(settings.minimumOnsetDurationMs / medianDeltaMs));
  const candidates = [
    { direction: "positive", sign: 1, peakIndex: positivePeak, absoluteAmplitudeMv: Math.max(0, correctedMv[positivePeak]) },
    { direction: "negative", sign: -1, peakIndex: negativePeak, absoluteAmplitudeMv: Math.max(0, -correctedMv[negativePeak]) },
  ].map((candidate) => ({
    ...candidate,
    onsetIndex: candidate.absoluteAmplitudeMv >= detectionThresholdMv
      ? sustainedCrossing(
        correctedMv,
        onsetStart,
        Math.min(candidate.peakIndex + 1, onsetSearchEnd),
        candidate.sign,
        onsetThresholdMv,
        minimumOnsetSamples,
      )
      : null,
  }));

  let selectedCandidate;
  let expectedDirectionMismatch = false;
  if (settings.expectedDirection !== "auto") {
    const expected = candidates.find((candidate) => candidate.direction === settings.expectedDirection);
    const opposite = candidates.find((candidate) => candidate.direction !== settings.expectedDirection);
    if (expected.absoluteAmplitudeMv < detectionThresholdMv && opposite.absoluteAmplitudeMv >= detectionThresholdMv) {
      selectedCandidate = opposite;
      expectedDirectionMismatch = true;
    } else {
      selectedCandidate = expected;
    }
  } else {
    const aboveThreshold = candidates.filter((candidate) => candidate.absoluteAmplitudeMv >= detectionThresholdMv);
    const sustained = aboveThreshold.filter((candidate) => candidate.onsetIndex !== null);
    selectedCandidate = sustained.sort((left, right) =>
      left.onsetIndex - right.onsetIndex || right.absoluteAmplitudeMv - left.absoluteAmplitudeMv,
    )[0] ?? aboveThreshold.sort((left, right) => right.absoluteAmplitudeMv - left.absoluteAmplitudeMv)[0]
      ?? [...candidates].sort((left, right) => right.absoluteAmplitudeMv - left.absoluteAmplitudeMv)[0];
  }

  const direction = selectedCandidate.direction;
  const sign = direction === "positive" ? 1 : -1;
  const peakIndex = selectedCandidate.peakIndex;
  const signedAmplitudeMv = correctedMv[peakIndex];
  const absoluteAmplitudeMv = Math.abs(signedAmplitudeMv);
  const amplitudeSnr = baselineNoiseSigmaMv > 0 ? absoluteAmplitudeMv / baselineNoiseSigmaMv : null;
  if (expectedDirectionMismatch) {
    addFlag(flags, "review", "unexpected_response_direction", "La respuesta detectable tiene dirección opuesta a la configurada.");
  }

  const commonMetrics = {
    baselineMv: baselineAtStimulusMv,
    baselineNoiseSigmaMv,
    baselineNoiseRmsMv,
    baselineDriftMvPerSecond: driftMvPerSecond,
    sampleRateHz: 1000 / medianDeltaMs,
    medianDeltaMs,
    irregularSamplingMadRatio: deltaMadRatio,
    missingCount: pairs.missingCount,
    saturationCount,
    detectionThresholdMv,
    candidateAmplitudeMv: signedAmplitudeMv,
    candidateAmplitudeSnr: amplitudeSnr,
  };

  if (absoluteAmplitudeMv < detectionThresholdMv) {
    const confidence = Math.max(0, 95 - flags.filter((flag) => flag.level === "review").length * 10);
    return {
      ...baseResult(settings, stimulus, flags),
      ok: true,
      status: "no_response_detectable",
      classification: {
        eventType: "no_response_detectable",
        direction: "indeterminate",
        physiologicalLabel: "PSP_unclassified",
      },
      metrics: commonMetrics,
      confidence,
    };
  }

  const onsetIndex = selectedCandidate.onsetIndex;
  if (onsetIndex === null) {
    addFlag(flags, "review", "unsustained_candidate", "Existe un extremo, pero no una desviación sostenida desde la línea base.");
    return {
      ...baseResult(settings, stimulus, flags),
      ok: true,
      status: "ambiguous_response",
      classification: {
        eventType: "ambiguous_response",
        direction,
        physiologicalLabel: "PSP_unclassified",
      },
      points: { onset: null, peak: pointAt(peakIndex, timeMs, voltageMv, correctedMv, stimulus), rise20: null, rise80: null, return: null },
      metrics: { ...commonMetrics, signedAmplitudeMv, absoluteAmplitudeMv, amplitudeSnr },
      confidence: 35,
    };
  }

  const rise20Index = firstLevelCrossing(correctedMv, onsetIndex, peakIndex + 1, sign, absoluteAmplitudeMv * 0.2);
  const rise80Index = firstLevelCrossing(correctedMv, rise20Index ?? onsetIndex, peakIndex + 1, sign, absoluteAmplitudeMv * 0.8);
  const riseRegression = rise20Index !== null && rise80Index !== null
    ? linearRegression(timeMs, correctedMv, rise20Index, rise80Index + 1)
    : { slope: Number.NaN, intercept: Number.NaN };
  const onsetByRegressionTimeMs = Number.isFinite(riseRegression.slope) && Math.abs(riseRegression.slope) > Number.EPSILON
    ? -riseRegression.intercept / riseRegression.slope
    : null;
  const maximumSlope = rollingMaximumSlope(
    timeMs,
    correctedMv,
    onsetIndex,
    peakIndex + 1,
    settings.slopeWindowMs,
    sign,
  );

  const returnThresholdMv = Math.max(settings.minimumAmplitudeMv * 0.2, settings.returnSigma * finiteNoise);
  const minimumReturnSamples = Math.max(1, Math.ceil(settings.minimumReturnDurationMs / medianDeltaMs));
  const returnIndex = sustainedCrossing(
    correctedMv,
    Math.min(peakIndex + 1, returnEnd),
    returnEnd,
    sign,
    returnThresholdMv,
    minimumReturnSamples,
    "within",
  );
  if (returnIndex === null) addFlag(flags, "review", "return_not_observed", "La respuesta no retorna a la banda basal dentro de la ventana.");

  const halfRiseIndex = firstLevelCrossing(correctedMv, onsetIndex, peakIndex + 1, sign, absoluteAmplitudeMv * 0.5);
  let halfDecayIndex = null;
  for (let index = peakIndex + 1; index < returnEnd; index += 1) {
    if (sign * correctedMv[index] <= absoluteAmplitudeMv * 0.5) {
      halfDecayIndex = index;
      break;
    }
  }

  const oppositePeakIndex = direction === "positive"
    ? extremeIndex(correctedMv, peakIndex + 1, returnEnd, "negative")
    : extremeIndex(correctedMv, peakIndex + 1, returnEnd, "positive");
  const oppositeAmplitudeMv = oppositePeakIndex === null ? 0 : Math.abs(correctedMv[oppositePeakIndex]);
  const biphasicThresholdMv = Math.max(settings.minimumAmplitudeMv, settings.biphasicSigma * finiteNoise);
  const isBiphasic =
    oppositeAmplitudeMv >= biphasicThresholdMv &&
    oppositeAmplitudeMv / absoluteAmplitudeMv >= settings.minimumOppositePhaseRatio;
  if (isBiphasic) addFlag(flags, "review", "biphasic_response", "Se detectó una segunda fase de polaridad opuesta.");

  const coherenceEnd = Math.max(onsetIndex + 1, peakIndex + 1);
  const signCoherence = correctedMv.slice(onsetIndex, coherenceEnd)
    .filter((value) => sign * value >= 0).length / Math.max(1, coherenceEnd - onsetIndex);
  if (signCoherence < 0.8) addFlag(flags, "review", "low_sign_coherence", "La fase ascendente cambia de signo repetidamente.");

  const peakNearEdge =
    timeMs[peakIndex] - peakStartTimeMs <= settings.edgeToleranceMs ||
    peakEndTimeMs - timeMs[peakIndex] <= settings.edgeToleranceMs;
  if (peakNearEdge) addFlag(flags, "review", "peak_at_window_edge", "El extremo está en el borde de la ventana de pico.");

  const spikeByAmplitude = absoluteAmplitudeMv >= settings.spikeAmplitudeThresholdMv;
  const spikeBySlope = maximumSlope && Math.abs(maximumSlope.slopeMvPerMs) >= settings.spikeSlopeThresholdMvPerMs;
  const spikeContamination = Boolean(spikeByAmplitude || spikeBySlope);
  if (spikeContamination) {
    addFlag(flags, "review", "possible_action_potential", "La amplitud o pendiente es compatible con contaminación por potencial de acción.");
  }

  let confidence = 100;
  if (Number.isFinite(amplitudeSnr) && amplitudeSnr < 6) confidence -= amplitudeSnr < 4 ? 25 : 15;
  for (const flag of flags) {
    if (flag.code === "baseline_drift") confidence -= 15;
    else if (flag.code === "irregular_sampling") confidence -= 10;
    else if (flag.code === "missing_values") confidence -= 10;
    else if (flag.code === "return_not_observed") confidence -= 10;
    else if (flag.code === "biphasic_response") confidence -= 10;
    else if (flag.code === "peak_at_window_edge") confidence -= 15;
    else if (flag.code === "low_sign_coherence") confidence -= 15;
    else if (flag.code === "possible_action_potential") confidence -= 40;
    else if (flag.code === "response_window_truncated") confidence -= 10;
    else if (flag.code === "unexpected_response_direction") confidence -= 15;
  }

  const integrationEnd = returnIndex ?? returnEnd;
  const metrics = {
    ...commonMetrics,
    signedAmplitudeMv,
    absoluteAmplitudeMv,
    amplitudeSnr,
    onsetLatencyMs: timeMs[onsetIndex] - stimulus,
    onsetBy20To80RegressionLatencyMs: onsetByRegressionTimeMs === null ? null : onsetByRegressionTimeMs - stimulus,
    peakLatencyMs: timeMs[peakIndex] - stimulus,
    riseTime20To80Ms: rise20Index !== null && rise80Index !== null ? timeMs[rise80Index] - timeMs[rise20Index] : null,
    initialSlope20To80MvPerMs: Number.isFinite(riseRegression.slope) ? riseRegression.slope : null,
    maximumSlopeMvPerMs: maximumSlope?.slopeMvPerMs ?? null,
    halfWidthMs: halfRiseIndex !== null && halfDecayIndex !== null ? timeMs[halfDecayIndex] - timeMs[halfRiseIndex] : null,
    signedAreaMvMs: trapezoidIntegral(timeMs, correctedMv, onsetIndex, Math.max(onsetIndex + 1, integrationEnd)),
    areaWindowStartMs: timeMs[onsetIndex],
    areaWindowEndMs: timeMs[Math.max(onsetIndex, integrationEnd - 1)],
    returnLatencyMs: returnIndex === null ? null : timeMs[returnIndex] - stimulus,
    signCoherence,
    oppositePhaseAmplitudeMv: isBiphasic ? oppositeAmplitudeMv : null,
    primaryAmplitudeValid: !spikeContamination,
  };

  return {
    ok: true,
    status: spikeContamination ? "contaminated_response" : "response_detected",
    detected: true,
    stimulusTimeMs: stimulus,
    classification: {
      eventType: spikeContamination ? "PSP_contaminated_by_spike" : "evoked_PSP_candidate",
      direction: isBiphasic ? "biphasic" : direction,
      physiologicalLabel: "PSP_unclassified",
    },
    points: {
      onset: pointAt(onsetIndex, timeMs, voltageMv, correctedMv, stimulus),
      peak: pointAt(peakIndex, timeMs, voltageMv, correctedMv, stimulus),
      rise20: pointAt(rise20Index, timeMs, voltageMv, correctedMv, stimulus),
      rise80: pointAt(rise80Index, timeMs, voltageMv, correctedMv, stimulus),
      return: pointAt(returnIndex, timeMs, voltageMv, correctedMv, stimulus),
    },
    metrics,
    baselineModel: {
      correction: settings.baselineCorrection,
      valueAtStimulusMv: baselineAtStimulusMv,
      robustSlopeMvPerMs: driftSlopeMvPerMs,
      windowStartMs: baselineStartTimeMs,
      windowEndMs: baselineEndTimeMs,
    },
    confidence: Math.max(0, Math.min(100, confidence)),
    confidenceMeaning: "prioridad_heuristica_de_revision_no_probabilidad",
    reviewRequired: flags.some((flag) => flag.level === "review") || confidence < 70,
    flags,
    settings,
  };
}

/** Measure each declared stimulus independently, truncating before the next one. */
export function measureEvokedPsps(timeMs, voltageMv, stimulusTimesMs, userOptions = {}) {
  if (!Array.isArray(stimulusTimesMs) || stimulusTimesMs.length === 0) {
    return {
      ok: false,
      events: [],
      flags: [{ level: "exclude", code: "missing_stimulus_times", message: "Se requiere al menos un estímulo declarado." }],
    };
  }
  const stimuli = stimulusTimesMs.map((value) => Number(value));
  if (stimuli.some((value) => !Number.isFinite(value)) || stimuli.slice(1).some((value, index) => value <= stimuli[index])) {
    return {
      ok: false,
      events: [],
      flags: [{ level: "exclude", code: "invalid_stimulus_times", message: "Los estímulos deben ser finitos y crecientes." }],
    };
  }
  const events = stimuli.map((stimulus, index) => measurePspEvent(timeMs, voltageMv, stimulus, {
    ...userOptions,
    nextStimulusTimeMs: stimuli[index + 1] ?? null,
  }));
  return {
    ok: events.every((event) => event.ok),
    events,
    flags: events.flatMap((event, index) => event.flags.map((flag) => ({ ...flag, eventNumber: index + 1 }))),
  };
}
