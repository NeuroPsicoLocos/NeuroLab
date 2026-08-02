/**
 * Deterministic teaching scenarios for postsynaptic potentials.
 *
 * This module is deliberately phenomenological. It generates signals with
 * known electrical features for testing and teaching; it does not claim to
 * reproduce a particular cell type, receptor composition, or preparation.
 */

export const PSP_SCENARIO_SCHEMA = "simulab-psp-scenario-0.1";

const PHYSIOLOGICAL_LABELS = new Set(["PSP_unclassified", "EPSP", "IPSP"]);
const RESPONSE_KINDS = new Set(["monophasic", "biphasic", "none"]);

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

function integerInRange(value, name, minimum, maximum) {
  const numeric = finiteNumber(value, name);
  if (!Number.isInteger(numeric) || numeric < minimum || numeric > maximum) {
    throw new RangeError(`${name} debe ser un entero entre ${minimum} y ${maximum}.`);
  }
  return numeric;
}

function hashSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) return Math.trunc(seed) >>> 0;
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Return a deterministic pseudo-random number generator in [0, 1). */
export function createSeededRandom(seed = 1) {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createNormalRandom(random) {
  let spare = null;
  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    let first = 0;
    let second = 0;
    while (first <= Number.EPSILON) first = random();
    while (second <= Number.EPSILON) second = random();
    const magnitude = Math.sqrt(-2 * Math.log(first));
    const angle = 2 * Math.PI * second;
    spare = magnitude * Math.sin(angle);
    return magnitude * Math.cos(angle);
  };
}

/** Analytical peak time of exp(-t/decay) - exp(-t/rise). */
export function biExponentialPeakTimeMs(tauRiseMs, tauDecayMs) {
  const rise = positiveNumber(tauRiseMs, "tauRiseMs");
  const decay = positiveNumber(tauDecayMs, "tauDecayMs");
  if (decay <= rise) throw new RangeError("tauDecayMs debe ser mayor que tauRiseMs.");
  return (rise * decay * Math.log(decay / rise)) / (decay - rise);
}

/** Difference-of-exponentials kernel normalized to a peak value of one. */
export function normalizedBiExponential(elapsedMs, tauRiseMs, tauDecayMs) {
  if (elapsedMs < 0) return 0;
  const peakTime = biExponentialPeakTimeMs(tauRiseMs, tauDecayMs);
  const peak = Math.exp(-peakTime / tauDecayMs) - Math.exp(-peakTime / tauRiseMs);
  if (peak <= 0) return 0;
  return (Math.exp(-elapsedMs / tauDecayMs) - Math.exp(-elapsedMs / tauRiseMs)) / peak;
}

function validateEvidence(label, evidence) {
  if (!PHYSIOLOGICAL_LABELS.has(label)) {
    throw new RangeError(`physiologicalLabel no reconocido: ${label}.`);
  }
  if (!Array.isArray(evidence) || evidence.some((item) => typeof item !== "string" || !item.trim())) {
    throw new TypeError("physiologicalEvidence debe ser una lista de textos no vacíos.");
  }
  if ((label === "EPSP" || label === "IPSP") && evidence.length === 0) {
    throw new RangeError("EPSP/IPSP requiere evidencia experimental explícita.");
  }
}

function normalizeStimuli(stimuli, durationMs) {
  if (!Array.isArray(stimuli) || stimuli.length === 0) {
    throw new RangeError("Se requiere al menos un estímulo.");
  }
  const normalized = stimuli.map((stimulus, index) => {
    const source = typeof stimulus === "number" ? { timeMs: stimulus } : stimulus;
    if (!source || typeof source !== "object") throw new TypeError(`Estímulo ${index + 1} inválido.`);
    const timeMs = finiteNumber(source.timeMs, `stimuli[${index}].timeMs`);
    if (timeMs < 0 || timeMs >= durationMs) {
      throw new RangeError(`stimuli[${index}].timeMs debe estar dentro de la traza.`);
    }
    return {
      id: String(source.id ?? `stimulus-${index + 1}`),
      timeMs,
      amplitudeScale: finiteNumber(source.amplitudeScale ?? 1, `stimuli[${index}].amplitudeScale`),
    };
  });
  normalized.sort((left, right) => left.timeMs - right.timeMs);
  return normalized;
}

/** Validate and normalize a serializable scenario configuration. */
export function normalizePspScenarioConfig(userConfig = {}) {
  const response = {
    kind: "monophasic",
    amplitudeMv: 4,
    latencyMs: 3,
    tauRiseMs: 2,
    tauDecayMs: 24,
    secondaryAmplitudeMv: -1.2,
    secondaryDelayMs: 18,
    secondaryTauRiseMs: 3,
    secondaryTauDecayMs: 35,
    ...(userConfig.response ?? {}),
  };
  const variability = {
    amplitudeCv: 0.08,
    latencyJitterMs: 0.2,
    baselineJitterMv: 0.15,
    ...(userConfig.variability ?? {}),
  };
  const artifact = {
    amplitudeMv: 0.8,
    tauMs: 0.18,
    ...(userConfig.artifact ?? {}),
  };
  const saturation = {
    minimumMv: null,
    maximumMv: null,
    ...(userConfig.saturation ?? {}),
  };

  const config = {
    schema: PSP_SCENARIO_SCHEMA,
    seed: userConfig.seed ?? 20260802,
    title: String(userConfig.title ?? "Escenario PSP sintético"),
    sampleRateHz: positiveNumber(userConfig.sampleRateHz ?? 10000, "sampleRateHz"),
    durationMs: positiveNumber(userConfig.durationMs ?? 400, "durationMs"),
    sweepCount: integerInRange(userConfig.sweepCount ?? 6, "sweepCount", 1, 200),
    baselineMv: finiteNumber(userConfig.baselineMv ?? -65, "baselineMv"),
    noiseStdMv: nonNegativeNumber(userConfig.noiseStdMv ?? 0.12, "noiseStdMv"),
    driftMvPerSecond: finiteNumber(userConfig.driftMvPerSecond ?? 0, "driftMvPerSecond"),
    physiologicalLabel: String(userConfig.physiologicalLabel ?? "PSP_unclassified"),
    physiologicalEvidence: [...(userConfig.physiologicalEvidence ?? [])],
    response,
    variability,
    artifact,
    saturation,
  };

  if (!RESPONSE_KINDS.has(response.kind)) throw new RangeError(`response.kind no reconocido: ${response.kind}.`);
  response.amplitudeMv = finiteNumber(response.amplitudeMv, "response.amplitudeMv");
  response.latencyMs = nonNegativeNumber(response.latencyMs, "response.latencyMs");
  response.tauRiseMs = positiveNumber(response.tauRiseMs, "response.tauRiseMs");
  response.tauDecayMs = positiveNumber(response.tauDecayMs, "response.tauDecayMs");
  biExponentialPeakTimeMs(response.tauRiseMs, response.tauDecayMs);
  if (response.kind === "biphasic") {
    response.secondaryAmplitudeMv = finiteNumber(response.secondaryAmplitudeMv, "response.secondaryAmplitudeMv");
    response.secondaryDelayMs = nonNegativeNumber(response.secondaryDelayMs, "response.secondaryDelayMs");
    response.secondaryTauRiseMs = positiveNumber(response.secondaryTauRiseMs, "response.secondaryTauRiseMs");
    response.secondaryTauDecayMs = positiveNumber(response.secondaryTauDecayMs, "response.secondaryTauDecayMs");
    biExponentialPeakTimeMs(response.secondaryTauRiseMs, response.secondaryTauDecayMs);
  }

  variability.amplitudeCv = nonNegativeNumber(variability.amplitudeCv, "variability.amplitudeCv");
  variability.latencyJitterMs = nonNegativeNumber(variability.latencyJitterMs, "variability.latencyJitterMs");
  variability.baselineJitterMv = nonNegativeNumber(variability.baselineJitterMv, "variability.baselineJitterMv");
  artifact.amplitudeMv = finiteNumber(artifact.amplitudeMv, "artifact.amplitudeMv");
  artifact.tauMs = positiveNumber(artifact.tauMs, "artifact.tauMs");

  for (const key of ["minimumMv", "maximumMv"]) {
    if (saturation[key] !== null) saturation[key] = finiteNumber(saturation[key], `saturation.${key}`);
  }
  if (saturation.minimumMv !== null && saturation.maximumMv !== null && saturation.minimumMv >= saturation.maximumMv) {
    throw new RangeError("saturation.minimumMv debe ser menor que saturation.maximumMv.");
  }

  validateEvidence(config.physiologicalLabel, config.physiologicalEvidence);
  config.stimuli = normalizeStimuli(userConfig.stimuli ?? [{ timeMs: 100 }], config.durationMs);

  const sampleCount = Math.floor((config.durationMs / 1000) * config.sampleRateHz) + 1;
  if (sampleCount < 3 || sampleCount * config.sweepCount > 2_000_000) {
    throw new RangeError("El escenario debe contener entre 3 y 2,000,000 de muestras totales.");
  }
  config.sampleCount = sampleCount;
  return config;
}

function responseDirection(kind, amplitudeMv, secondaryAmplitudeMv) {
  if (kind === "none" || amplitudeMv === 0) return "none";
  if (kind === "biphasic" && Math.sign(amplitudeMv) !== Math.sign(secondaryAmplitudeMv)) return "biphasic";
  return amplitudeMv > 0 ? "positive" : "negative";
}

function applySaturation(value, saturation) {
  let clipped = value;
  if (saturation.minimumMv !== null && clipped < saturation.minimumMv) clipped = saturation.minimumMv;
  if (saturation.maximumMv !== null && clipped > saturation.maximumMv) clipped = saturation.maximumMv;
  return clipped;
}

/**
 * Generate a deterministic PSP scenario with trace data and hidden truth.
 * Consumers must use createStudentScenarioView before exposing it to students.
 */
export function generatePspScenario(userConfig = {}) {
  const config = normalizePspScenarioConfig(userConfig);
  const random = createSeededRandom(config.seed);
  const normalRandom = createNormalRandom(random);
  const timeMs = Array.from({ length: config.sampleCount }, (_, index) => (index * 1000) / config.sampleRateHz);
  const primaryPeakOffsetMs = biExponentialPeakTimeMs(config.response.tauRiseMs, config.response.tauDecayMs);
  const secondaryPeakOffsetMs = config.response.kind === "biphasic"
    ? biExponentialPeakTimeMs(config.response.secondaryTauRiseMs, config.response.secondaryTauDecayMs)
    : null;

  const sweeps = [];
  const truthSweeps = [];

  for (let sweepIndex = 0; sweepIndex < config.sweepCount; sweepIndex += 1) {
    const baselineOffsetMv = normalRandom() * config.variability.baselineJitterMv;
    const events = config.stimuli.map((stimulus) => {
      const amplitudeMultiplier = Math.max(0, 1 + normalRandom() * config.variability.amplitudeCv);
      const latencyMs = Math.max(0, config.response.latencyMs + normalRandom() * config.variability.latencyJitterMs);
      const amplitudeMv = config.response.kind === "none"
        ? 0
        : config.response.amplitudeMv * stimulus.amplitudeScale * amplitudeMultiplier;
      return {
        stimulusId: stimulus.id,
        stimulusTimeMs: stimulus.timeMs,
        onsetTimeMs: stimulus.timeMs + latencyMs,
        peakTimeMs: config.response.kind === "none" ? null : stimulus.timeMs + latencyMs + primaryPeakOffsetMs,
        amplitudeMv,
        direction: responseDirection(config.response.kind, amplitudeMv, config.response.secondaryAmplitudeMv),
        secondaryPeakTimeMs: config.response.kind === "biphasic"
          ? stimulus.timeMs + latencyMs + config.response.secondaryDelayMs + secondaryPeakOffsetMs
          : null,
        secondaryAmplitudeMv: config.response.kind === "biphasic"
          ? config.response.secondaryAmplitudeMv * stimulus.amplitudeScale * amplitudeMultiplier
          : null,
      };
    });

    let clippedSamples = 0;
    const voltageMv = timeMs.map((time) => {
      let value = config.baselineMv + baselineOffsetMv + (config.driftMvPerSecond * time) / 1000;
      for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
        const event = events[eventIndex];
        const stimulus = config.stimuli[eventIndex];
        const artifactElapsed = time - stimulus.timeMs;
        if (artifactElapsed >= 0) value += config.artifact.amplitudeMv * Math.exp(-artifactElapsed / config.artifact.tauMs);
        if (config.response.kind !== "none") {
          value += event.amplitudeMv * normalizedBiExponential(
            time - event.onsetTimeMs,
            config.response.tauRiseMs,
            config.response.tauDecayMs,
          );
        }
        if (config.response.kind === "biphasic") {
          value += event.secondaryAmplitudeMv * normalizedBiExponential(
            time - event.onsetTimeMs - config.response.secondaryDelayMs,
            config.response.secondaryTauRiseMs,
            config.response.secondaryTauDecayMs,
          );
        }
      }
      value += normalRandom() * config.noiseStdMv;
      const clipped = applySaturation(value, config.saturation);
      if (clipped !== value) clippedSamples += 1;
      return clipped;
    });

    sweeps.push({
      id: `sweep-${sweepIndex + 1}`,
      voltageMv,
      stimulusTimesMs: config.stimuli.map((stimulus) => stimulus.timeMs),
    });
    truthSweeps.push({
      id: `sweep-${sweepIndex + 1}`,
      baselineMv: config.baselineMv + baselineOffsetMv,
      clippedSamples,
      events,
    });
  }

  return {
    schema: PSP_SCENARIO_SCHEMA,
    id: `psp-${hashSeed(config.seed).toString(16).padStart(8, "0")}`,
    title: config.title,
    metadata: {
      source: "Simu-LAB deterministic PSP generator",
      model: "normalized_difference_of_exponentials",
      mode: "current_clamp",
      timeUnit: "ms",
      signalUnit: "mV",
      sampleRateHz: config.sampleRateHz,
      note: "Escenario docente fenomenológico; no representa una preparación o receptor específicos.",
    },
    configuration: config,
    timeMs,
    sweeps,
    groundTruth: {
      responseKind: config.response.kind,
      physiologicalLabel: config.physiologicalLabel,
      physiologicalEvidence: [...config.physiologicalEvidence],
      sweeps: truthSweeps,
    },
  };
}

/** Remove hidden truth and physiological answers before student delivery. */
export function createStudentScenarioView(scenario) {
  if (!scenario || scenario.schema !== PSP_SCENARIO_SCHEMA) throw new TypeError("Escenario PSP inválido.");
  return {
    schema: scenario.schema,
    id: scenario.id,
    title: scenario.title,
    metadata: { ...scenario.metadata },
    timeMs: [...scenario.timeMs],
    sweeps: scenario.sweeps.map((sweep) => ({
      id: sweep.id,
      voltageMv: [...sweep.voltageMv],
      stimulusTimesMs: [...sweep.stimulusTimesMs],
    })),
  };
}

