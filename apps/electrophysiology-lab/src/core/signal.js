/**
 * Pure signal utilities for Electrophysiology Lab.
 *
 * The analysis core has no DOM or spreadsheet dependencies so it can be tested
 * independently and reused by future field-potential and patch-clamp modules.
 */

export function median(values) {
  if (!values.length) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function medianAbsoluteDeviation(values, center = median(values)) {
  if (!values.length || !Number.isFinite(center)) return Number.NaN;
  return median(values.map((value) => Math.abs(value - center)));
}

function toNumeric(value) {
  if (value === null || value === undefined || value === "") return Number.NaN;
  return Number(value);
}

function detectArtifactCandidates(timeMs, signal, options) {
  if (timeMs.length < 3) return { candidates: [], threshold: Number.NaN };

  const derivative = [];
  for (let index = 1; index < signal.length; index += 1) {
    const deltaTime = timeMs[index] - timeMs[index - 1];
    derivative.push(deltaTime > 0 ? Math.abs((signal[index] - signal[index - 1]) / deltaTime) : 0);
  }

  const derivativeCenter = median(derivative);
  const derivativeMad = medianAbsoluteDeviation(derivative, derivativeCenter);
  const robustSigma = Math.max(derivativeMad * 1.4826, Number.EPSILON);
  const threshold = derivativeCenter + options.sensitivity * robustSigma;
  const supraThreshold = [];

  for (let index = 0; index < derivative.length; index += 1) {
    if (derivative[index] > threshold) {
      supraThreshold.push({ index: index + 1, score: derivative[index] });
    }
  }

  // Collapse adjacent derivative excursions into a single strongest candidate.
  const collapsed = [];
  for (const point of supraThreshold) {
    const previous = collapsed.at(-1);
    if (previous && point.index - previous.index <= 2) {
      if (point.score > previous.score) collapsed[collapsed.length - 1] = point;
    } else {
      collapsed.push(point);
    }
  }

  // Enforce a refractory interval while preserving the strongest excursion.
  const candidates = [];
  for (const point of collapsed) {
    const candidate = {
      index: point.index,
      timeMs: timeMs[point.index],
      value: signal[point.index],
      score: point.score,
      scoreOverThreshold: point.score / threshold,
    };
    const previous = candidates.at(-1);
    if (!previous || candidate.timeMs - previous.timeMs >= options.refractoryMs) {
      candidates.push(candidate);
    } else if (candidate.score > previous.score) {
      candidates[candidates.length - 1] = candidate;
    }
  }

  return { candidates, threshold };
}

/**
 * Analyze a trace whose time axis is expressed in milliseconds.
 * Candidate events represent abrupt electrical artifacts only; they are not
 * physiological response annotations.
 */
export function analyzeTrace(rawTimeMs, rawSignal, userOptions = {}) {
  const options = {
    sensitivity: 8,
    refractoryMs: 50,
    saturationMin: Number.NEGATIVE_INFINITY,
    saturationMax: Number.POSITIVE_INFINITY,
    ...userOptions,
  };

  const totalRows = Math.max(rawTimeMs.length, rawSignal.length);
  const timeMs = [];
  const signal = [];
  for (let index = 0; index < totalRows; index += 1) {
    const timeValue = toNumeric(rawTimeMs[index]);
    const signalValue = toNumeric(rawSignal[index]);
    if (Number.isFinite(timeValue) && Number.isFinite(signalValue)) {
      timeMs.push(timeValue);
      signal.push(signalValue);
    }
  }

  const missingCount = totalRows - timeMs.length;
  const flags = [];
  if (timeMs.length < 3) {
    return {
      ok: false,
      timeMs,
      signal,
      candidates: [],
      flags: [{ level: "exclude", code: "insufficient_data", message: "Se requieren al menos tres pares numéricos." }],
      stats: { totalRows, validRows: timeMs.length, missingCount },
      parameters: options,
    };
  }

  const deltas = timeMs.slice(1).map((time, index) => time - timeMs[index]);
  const nonPositiveDelta = deltas.some((delta) => delta <= 0);
  if (nonPositiveDelta) {
    flags.push({
      level: "exclude",
      code: "non_monotonic_time",
      message: "El eje temporal contiene valores repetidos o decrecientes.",
    });
  }

  const positiveDeltas = deltas.filter((delta) => delta > 0);
  const medianDeltaMs = median(positiveDeltas);
  const deltaMadMs = medianAbsoluteDeviation(positiveDeltas, medianDeltaMs);
  const irregularity = Number.isFinite(medianDeltaMs) && medianDeltaMs > 0 ? deltaMadMs / medianDeltaMs : Number.NaN;

  if (missingCount > 0) {
    flags.push({
      level: missingCount / totalRows > 0.05 ? "review" : "info",
      code: "missing_values",
      message: `${missingCount} fila(s) sin un par temporal/señal válido.`,
    });
  }
  if (Number.isFinite(irregularity) && irregularity > 0.01) {
    flags.push({
      level: "review",
      code: "irregular_sampling",
      message: "El intervalo de muestreo no es uniforme (MAD relativa > 1 %).",
    });
  }

  const invalidSaturationLimits = options.saturationMin >= options.saturationMax;
  if (invalidSaturationLimits) {
    flags.push({
      level: "exclude",
      code: "invalid_saturation_limits",
      message: "El límite inferior de saturación debe ser menor que el superior.",
    });
  }
  const saturatedCount = invalidSaturationLimits
    ? 0
    : signal.filter((value) => value <= options.saturationMin || value >= options.saturationMax).length;
  if (saturatedCount > 0) {
    flags.push({
      level: "review",
      code: "possible_saturation",
      message: `${saturatedCount} muestra(s) alcanzan los límites de saturación configurados.`,
    });
  }

  const detection = nonPositiveDelta
    ? { candidates: [], threshold: Number.NaN }
    : detectArtifactCandidates(timeMs, signal, options);

  if (!detection.candidates.length && !nonPositiveDelta) {
    flags.push({
      level: "review",
      code: "no_artifact_candidates",
      message: "No se identificaron candidatos de artefacto con la sensibilidad actual.",
    });
  }

  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const value of signal) {
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
  }
  const durationMs = timeMs.at(-1) - timeMs[0];
  const sampleRateHz = Number.isFinite(medianDeltaMs) && medianDeltaMs > 0 ? 1000 / medianDeltaMs : Number.NaN;

  return {
    ok: !flags.some((flag) => flag.level === "exclude"),
    timeMs,
    signal,
    candidates: detection.candidates,
    flags,
    stats: {
      totalRows,
      validRows: timeMs.length,
      missingCount,
      saturatedCount,
      minimum,
      maximum,
      peakToPeak: maximum - minimum,
      durationMs,
      sampleRateHz,
      medianDeltaMs,
      irregularity,
      artifactThreshold: detection.threshold,
    },
    parameters: options,
  };
}

/** Create a deterministic teaching trace with ten field-potential responses. */
export function createDemoTrace({ sampleRateHz = 10000, durationMs = 1100 } = {}) {
  const sampleCount = Math.round((durationMs / 1000) * sampleRateHz);
  const timeMs = new Array(sampleCount);
  const signal = new Array(sampleCount);
  const stimulusTimesMs = Array.from({ length: 10 }, (_, index) => 100 + index * 100);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = (index * 1000) / sampleRateHz;
    timeMs[index] = time;

    // Deterministic low-amplitude background; not intended as a biological noise model.
    let value =
      0.018 * Math.sin(2 * Math.PI * 47 * (time / 1000)) +
      0.009 * Math.sin(2 * Math.PI * 113 * (time / 1000) + 0.7) +
      0.004 * Math.sin(2 * Math.PI * 311 * (time / 1000) + 1.4);

    for (const stimulusTime of stimulusTimesMs) {
      const elapsed = time - stimulusTime;
      if (elapsed >= 0 && elapsed < 0.35) value += 1.7 * Math.exp(-elapsed / 0.07);
      if (elapsed >= 1.2 && elapsed < 30) {
        value += -0.82 * (1 - Math.exp(-(elapsed - 1.2) / 1.7)) * Math.exp(-(elapsed - 1.2) / 13);
      }
      if (elapsed >= 13 && elapsed < 45) {
        value += 0.16 * (1 - Math.exp(-(elapsed - 13) / 5)) * Math.exp(-(elapsed - 13) / 18);
      }
    }
    signal[index] = value;
  }

  return {
    name: "demo_potencial_campo",
    timeMs,
    signal,
    stimulusTimesMs,
    metadata: {
      source: "Simu-LAB synthetic demo",
      timeUnit: "ms",
      signalUnit: "mV",
      sampleRateHz,
      note: "Señal sintética docente; no representa un preparado biológico específico.",
    },
  };
}
