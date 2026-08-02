import {
  createSeededRandom,
  createStudentScenarioView,
  generatePspScenario,
} from "../../electrophysiology-lab/src/core/pspScenario.js";
import { measureEvokedPsps } from "../../electrophysiology-lab/src/core/currentClamp.js";
import { PspPlot } from "./plot.js";

const PROGRESS_KEY = "simulab-psp-student-progress-0.1";
const HINTS = [
  "Observa primero la línea base anterior al estímulo: su dispersión define cuánto cambio puede atribuirse al ruido.",
  "La línea naranja indica el estímulo. El intervalo inmediato puede contener artefacto y no debe confundirse con la respuesta.",
  "Busca una desviación sostenida, no una sola muestra extrema. Compara su tamaño y duración con el ruido basal.",
  "Describe positiva, negativa o bifásica. La polaridad por sí sola no permite llamarla EPSP o IPSP.",
];
const DIRECTION_LABELS = {
  positive: "positiva",
  negative: "negativa",
  biphasic: "bifásica",
  none: "ninguna",
  indeterminate: "indeterminada",
};
const RESPONSE_LABELS = {
  monophasic: "monofásica",
  biphasic: "bifásica",
  none: "sin respuesta",
};
const STATUS_LABELS = {
  not_evaluable: "No evaluable",
  no_response_detectable: "Sin respuesta detectable",
  ambiguous_response: "Respuesta ambigua",
  contaminated_response: "Respuesta contaminada",
  response_detected: "Respuesta detectada",
};

const elements = Object.fromEntries([
  "student-mode", "teacher-mode", "difficulty", "new-challenge", "challenge-id", "student-progress",
  "teacher-seed", "teacher-kind", "teacher-direction", "teacher-amplitude", "teacher-noise", "teacher-drift",
  "teacher-sweeps", "teacher-paired", "teacher-saturation", "apply-teacher", "previous-sweep", "next-sweep",
  "sweep-position", "answer-presence", "answer-direction", "selected-peak", "hint-button", "evaluate-button",
  "hint-text", "scenario-title", "scenario-summary", "analysis-status", "export-session", "feedback-card",
  "feedback-title", "feedback-content", "truth-card", "truth-values", "metric-baseline", "metric-noise",
  "metric-amplitude", "metric-onset", "metric-peak", "metric-snr", "quality-list", "psp-canvas",
].map((id) => [id, document.getElementById(id)]));

const state = {
  mode: "student",
  scenario: null,
  studentView: null,
  analyses: [],
  sweepIndex: 0,
  selectedBySweep: new Map(),
  evaluationBySweep: new Map(),
  hintIndex: 0,
  challengeCounter: 0,
};

const plot = new PspPlot(elements["psp-canvas"]);

function randomBetween(random, minimum, maximum) {
  return minimum + random() * (maximum - minimum);
}

function difficultyConfiguration(seed, difficulty) {
  const random = createSeededRandom(seed);
  const profiles = {
    intro: { amplitude: [2.5, 5], noise: [0.03, 0.08], none: 0.08, biphasic: 0.10, paired: 0.12, drift: 2 },
    intermediate: { amplitude: [0.8, 3.2], noise: [0.08, 0.18], none: 0.16, biphasic: 0.20, paired: 0.30, drift: 7 },
    advanced: { amplitude: [0.3, 2.2], noise: [0.15, 0.35], none: 0.22, biphasic: 0.26, paired: 0.42, drift: 16 },
  };
  const profile = profiles[difficulty] ?? profiles.intermediate;
  const kindRoll = random();
  const kind = kindRoll < profile.none ? "none" : kindRoll < profile.none + profile.biphasic ? "biphasic" : "monophasic";
  const sign = random() < 0.5 ? -1 : 1;
  const amplitudeMv = sign * randomBetween(random, ...profile.amplitude);
  const paired = random() < profile.paired;
  const baselineMv = randomBetween(random, -72, -58);
  const saturationEnabled = difficulty === "advanced" && kind !== "none" && random() < 0.10;
  const saturation = saturationEnabled
    ? sign > 0
      ? { minimumMv: null, maximumMv: baselineMv + Math.abs(amplitudeMv) * 0.62 }
      : { minimumMv: baselineMv - Math.abs(amplitudeMv) * 0.62, maximumMv: null }
    : { minimumMv: null, maximumMv: null };

  return {
    seed,
    title: `Reto PSP · ${difficulty === "intro" ? "inicial" : difficulty === "advanced" ? "avanzado" : "intermedio"}`,
    durationMs: paired ? 460 : 380,
    sampleRateHz: 10000,
    sweepCount: difficulty === "intro" ? 3 : 5,
    baselineMv,
    noiseStdMv: randomBetween(random, ...profile.noise),
    driftMvPerSecond: randomBetween(random, -profile.drift, profile.drift),
    stimuli: paired
      ? [{ timeMs: 100 }, { timeMs: 260, amplitudeScale: randomBetween(random, 0.65, 1.45) }]
      : [{ timeMs: 100 }],
    artifact: { amplitudeMv: randomBetween(random, 0.45, 1.1), tauMs: randomBetween(random, 0.12, 0.24) },
    response: {
      kind,
      amplitudeMv,
      latencyMs: randomBetween(random, 2.5, 7),
      tauRiseMs: randomBetween(random, 1.5, 4),
      tauDecayMs: randomBetween(random, 20, 55),
      secondaryAmplitudeMv: -sign * Math.abs(amplitudeMv) * randomBetween(random, 0.45, 1.1),
      secondaryDelayMs: randomBetween(random, 18, 35),
      secondaryTauRiseMs: randomBetween(random, 2, 5),
      secondaryTauDecayMs: randomBetween(random, 25, 65),
    },
    variability: {
      amplitudeCv: difficulty === "intro" ? 0.03 : 0.08,
      latencyJitterMs: difficulty === "intro" ? 0.08 : 0.25,
      baselineJitterMv: difficulty === "advanced" ? 0.25 : 0.12,
    },
    saturation,
  };
}

function teacherConfiguration() {
  const kind = elements["teacher-kind"].value;
  const sign = elements["teacher-direction"].value === "negative" ? -1 : 1;
  const amplitude = Math.max(0.1, Number(elements["teacher-amplitude"].value) || 3);
  const baselineMv = -65;
  const saturationEnabled = elements["teacher-saturation"].checked && kind !== "none";
  return {
    seed: elements["teacher-seed"].value.trim() || "psp-docente-01",
    title: "Escenario PSP docente",
    durationMs: elements["teacher-paired"].checked ? 460 : 380,
    sampleRateHz: 10000,
    sweepCount: Math.max(1, Math.min(20, Math.round(Number(elements["teacher-sweeps"].value) || 6))),
    baselineMv,
    noiseStdMv: Math.max(0, Number(elements["teacher-noise"].value) || 0),
    driftMvPerSecond: Number(elements["teacher-drift"].value) || 0,
    stimuli: elements["teacher-paired"].checked
      ? [{ timeMs: 100 }, { timeMs: 260, amplitudeScale: 1.25 }]
      : [{ timeMs: 100 }],
    response: {
      kind,
      amplitudeMv: sign * amplitude,
      latencyMs: 4,
      tauRiseMs: 2.5,
      tauDecayMs: 32,
      secondaryAmplitudeMv: -sign * amplitude * 0.7,
      secondaryDelayMs: 26,
      secondaryTauRiseMs: 3.5,
      secondaryTauDecayMs: 44,
    },
    saturation: saturationEnabled
      ? sign > 0
        ? { minimumMv: null, maximumMv: baselineMv + amplitude * 0.62 }
        : { minimumMv: baselineMv - amplitude * 0.62, maximumMv: null }
      : { minimumMv: null, maximumMv: null },
  };
}

function analyzeScenario(scenario) {
  const stimuli = scenario.configuration.stimuli.map((stimulus) => stimulus.timeMs);
  const detectorOptions = {
    saturationMinimumMv: scenario.configuration.saturation.minimumMv,
    saturationMaximumMv: scenario.configuration.saturation.maximumMv,
  };
  return scenario.sweeps.map((sweep) =>
    measureEvokedPsps(scenario.timeMs, sweep.voltageMv, stimuli, detectorOptions).events,
  );
}

function loadScenario(config) {
  try {
    state.scenario = generatePspScenario(config);
    state.studentView = createStudentScenarioView(state.scenario);
    state.analyses = analyzeScenario(state.scenario);
    state.sweepIndex = 0;
    state.selectedBySweep = new Map();
    state.evaluationBySweep = new Map();
    state.hintIndex = 0;
    clearAnswers();
    render();
  } catch (error) {
    elements["scenario-title"].textContent = "No se pudo generar el escenario";
    elements["scenario-summary"].textContent = error.message;
    elements["analysis-status"].textContent = "Configuración inválida";
    elements["analysis-status"].className = "status-pill exclude";
  }
}

function newStudentChallenge() {
  state.challengeCounter += 1;
  const seed = `reto-${Date.now().toString(36)}-${state.challengeCounter}`;
  loadScenario(difficultyConfiguration(seed, elements.difficulty.value));
}

function setMode(mode) {
  state.mode = mode;
  const student = mode === "student";
  elements["student-mode"].classList.toggle("active", student);
  elements["teacher-mode"].classList.toggle("active", !student);
  elements["student-mode"].setAttribute("aria-pressed", String(student));
  elements["teacher-mode"].setAttribute("aria-pressed", String(!student));
  document.querySelectorAll(".student-controls").forEach((node) => { node.hidden = !student; });
  document.querySelectorAll(".teacher-controls").forEach((node) => { node.hidden = student; });
  if (student) newStudentChallenge();
  else loadScenario(teacherConfiguration());
}

function clearAnswers() {
  elements["answer-presence"].value = "";
  elements["answer-direction"].value = "";
  elements["hint-text"].textContent = "Las pistas aparecerán aquí.";
  elements["feedback-card"].hidden = true;
}

function currentAnalysis() {
  return state.analyses[state.sweepIndex] ?? [];
}

function currentTruth() {
  return state.scenario?.groundTruth.sweeps[state.sweepIndex] ?? null;
}

function currentSweep() {
  const source = state.mode === "student" ? state.studentView : state.scenario;
  return source?.sweeps[state.sweepIndex] ?? null;
}

function format(value, digits = 2, suffix = "") {
  return Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "—";
}

function visibleResults() {
  return state.mode === "teacher" || state.evaluationBySweep.has(state.sweepIndex);
}

function renderMetrics(show) {
  const analysis = currentAnalysis()[0];
  const metrics = analysis?.metrics ?? {};
  const hidden = show ? "—" : "Oculta";
  elements["metric-baseline"].textContent = show ? format(metrics.baselineMv, 2, " mV") : hidden;
  elements["metric-noise"].textContent = show ? format(metrics.baselineNoiseSigmaMv, 3, " mV") : hidden;
  elements["metric-amplitude"].textContent = show ? format(metrics.signedAmplitudeMv ?? metrics.candidateAmplitudeMv, 3, " mV") : hidden;
  elements["metric-onset"].textContent = show ? format(metrics.onsetLatencyMs, 2, " ms") : hidden;
  elements["metric-peak"].textContent = show ? format(metrics.peakLatencyMs, 2, " ms") : hidden;
  elements["metric-snr"].textContent = show ? format(metrics.amplitudeSnr ?? metrics.candidateAmplitudeSnr, 2) : hidden;
}

function renderQuality(show) {
  const list = elements["quality-list"];
  list.innerHTML = "";
  if (!show) {
    const item = document.createElement("li");
    item.className = "info";
    item.textContent = "La evaluación aparecerá después del intento.";
    list.append(item);
    return;
  }
  const flags = currentAnalysis().flatMap((analysis, eventIndex) =>
    analysis.flags.map((flag) => ({ ...flag, eventIndex })),
  );
  if (!flags.length) {
    const item = document.createElement("li");
    item.className = "pass";
    item.textContent = "Sin banderas automáticas en este barrido.";
    list.append(item);
    return;
  }
  for (const flag of flags) {
    const item = document.createElement("li");
    item.className = flag.level === "exclude" ? "exclude" : "review";
    item.textContent = `${currentAnalysis().length > 1 ? `Estímulo ${flag.eventIndex + 1}: ` : ""}${flag.message}`;
    list.append(item);
  }
}

function renderTruth() {
  if (state.mode !== "teacher" || !state.scenario) return;
  const config = state.scenario.configuration;
  const truth = currentTruth()?.events[0];
  const values = [
    ["Semilla", String(config.seed)],
    ["Respuesta", RESPONSE_LABELS[config.response.kind] ?? config.response.kind],
    ["Dirección primaria", DIRECTION_LABELS[truth?.direction] ?? "—"],
    ["Amplitud verdadera", format(truth?.amplitudeMv, 3, " mV")],
    ["Inicio verdadero", format(truth?.onsetTimeMs - truth?.stimulusTimeMs, 2, " ms")],
    ["Pico verdadero", format(truth?.peakTimeMs - truth?.stimulusTimeMs, 2, " ms")],
    ["Ruido configurado", format(config.noiseStdMv, 3, " mV")],
    ["Deriva", format(config.driftMvPerSecond, 2, " mV/s")],
    ["Estímulos", String(config.stimuli.length)],
  ];
  elements["truth-values"].replaceChildren();
  for (const [term, value] of values) {
    const row = document.createElement("div");
    const label = document.createElement("dt");
    const content = document.createElement("dd");
    label.textContent = term;
    content.textContent = value;
    row.append(label, content);
    elements["truth-values"].append(row);
  }
}

function renderEvaluation(evaluation) {
  if (!evaluation) {
    elements["feedback-card"].hidden = true;
    return;
  }
  elements["feedback-card"].hidden = false;
  elements["feedback-card"].dataset.score = evaluation.score === evaluation.total ? "high" : "low";
  elements["feedback-title"].textContent = `${evaluation.score} de ${evaluation.total} criterios`;
  elements["feedback-content"].innerHTML = evaluation.messages.map((message) => `<p>${message}</p>`).join("");
}

function render() {
  if (!state.scenario) return;
  const sweep = currentSweep();
  const evaluation = state.evaluationBySweep.get(state.sweepIndex);
  const show = visibleResults();
  const stimuli = sweep.stimulusTimesMs;
  const selected = state.selectedBySweep.get(state.sweepIndex) ?? null;
  elements["challenge-id"].textContent = state.scenario.id;
  elements["scenario-title"].textContent = state.scenario.title;
  elements["scenario-summary"].textContent = `${state.scenario.sweeps.length} barrido(s) · ${stimuli.length} estímulo(s) · señal sintética en mV`;
  elements["sweep-position"].textContent = `${state.sweepIndex + 1} de ${state.scenario.sweeps.length}`;
  elements["previous-sweep"].disabled = state.sweepIndex === 0;
  elements["next-sweep"].disabled = state.sweepIndex === state.scenario.sweeps.length - 1;
  elements["selected-peak"].textContent = selected ? `${selected.timeMs.toFixed(2)} ms · ${selected.voltageMv.toFixed(2)} mV` : "Haz clic en la gráfica";
  elements["answer-presence"].disabled = Boolean(evaluation);
  elements["answer-direction"].disabled = Boolean(evaluation);
  elements["evaluate-button"].disabled = Boolean(evaluation);
  elements["evaluate-button"].textContent = evaluation ? "Evaluado" : "Evaluar";

  const firstAnalysis = currentAnalysis()[0];
  const status = show ? firstAnalysis?.status ?? "not_evaluable" : "Sin evaluar";
  elements["analysis-status"].textContent = STATUS_LABELS[status] ?? status;
  elements["analysis-status"].className = `status-pill ${show ? firstAnalysis?.ok ? firstAnalysis.reviewRequired ? "review" : "pass" : "exclude" : ""}`;
  plot.setData({
    timeMs: state.studentView.timeMs,
    voltageMv: sweep.voltageMv,
    stimulusTimesMs: stimuli,
    analyses: currentAnalysis(),
    showAnalysis: show,
    selectedSample: selected,
  });
  renderMetrics(show);
  renderQuality(show);
  renderTruth();
  renderEvaluation(evaluation);
  updateProgressLabel();
}

function expectedAnswers() {
  const analysis = currentAnalysis()[0];
  const truth = currentTruth()?.events[0];
  const responseKind = state.scenario.groundTruth.responseKind;
  const presence = analysis?.status === "not_evaluable"
    ? "not_evaluable"
    : responseKind === "none" ? "none" : "present";
  const direction = presence === "present" ? truth?.direction ?? "indeterminate" : "indeterminate";
  return { presence, direction, peakTimeMs: presence === "present" ? truth?.peakTimeMs : null };
}

function evaluateStudent() {
  if (state.mode !== "student" || state.evaluationBySweep.has(state.sweepIndex)) return;
  const expected = expectedAnswers();
  const selected = state.selectedBySweep.get(state.sweepIndex);
  const presenceAnswer = elements["answer-presence"].value;
  const directionAnswer = elements["answer-direction"].value;
  const messages = [];
  let score = 0;
  let total = expected.presence === "present" ? 3 : 2;

  if (presenceAnswer === expected.presence) {
    score += 1;
    messages.push("✓ Identificaste correctamente si la respuesta era evaluable.");
  } else {
    messages.push(`• La categoría esperada era: ${expected.presence === "present" ? "respuesta presente" : expected.presence === "none" ? "sin respuesta detectable" : "no evaluable"}.`);
  }
  if (directionAnswer === expected.direction) {
    score += 1;
    messages.push("✓ La dirección eléctrica es correcta.");
  } else {
    messages.push(`• La dirección esperada era ${DIRECTION_LABELS[expected.direction] ?? expected.direction}.`);
  }
  if (expected.presence === "present") {
    const peakError = selected ? Math.abs(selected.timeMs - expected.peakTimeMs) : Number.POSITIVE_INFINITY;
    if (peakError <= 3) {
      score += 1;
      messages.push(`✓ Seleccionaste el pico con un error de ${peakError.toFixed(2)} ms.`);
    } else {
      messages.push(selected ? `• El pico quedó a ${peakError.toFixed(2)} ms de la verdad conocida; intenta seguir el extremo sostenido.` : "• Faltó seleccionar el pico en la gráfica.");
    }
  }
  messages.push("La clasificación permanece como PSP no clasificado: se requiere evidencia adicional para nombrar EPSP o IPSP.");
  const evaluation = { score, total, messages, answers: { presence: presenceAnswer, direction: directionAnswer, selected } };
  state.evaluationBySweep.set(state.sweepIndex, evaluation);
  saveProgress(score === total);
  render();
}

function progressState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null");
    if (parsed && Number.isInteger(parsed.attempted) && Number.isInteger(parsed.correct)) return parsed;
  } catch {}
  return { attempted: 0, correct: 0 };
}

function saveProgress(correct) {
  const progress = progressState();
  progress.attempted += 1;
  if (correct) progress.correct += 1;
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {}
}

function updateProgressLabel() {
  const progress = progressState();
  elements["student-progress"].textContent = progress.attempted
    ? `${progress.attempted} intento(s) · ${progress.correct} completamente correctos en este navegador.`
    : "Sin intentos guardados en este navegador.";
}

function changeSweep(offset) {
  const next = state.sweepIndex + offset;
  if (next < 0 || next >= state.scenario.sweeps.length) return;
  state.sweepIndex = next;
  state.hintIndex = 0;
  clearAnswers();
  render();
}

function showHint() {
  elements["hint-text"].textContent = HINTS[Math.min(state.hintIndex, HINTS.length - 1)];
  state.hintIndex = Math.min(HINTS.length - 1, state.hintIndex + 1);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function exportSession() {
  if (!state.scenario) return;
  const payload = state.mode === "teacher"
    ? {
      schema: "simulab-psp-teacher-session-0.1",
      scenario: state.scenario,
      analyses: state.analyses,
    }
    : {
      schema: "simulab-psp-student-session-0.1",
      scenario: state.studentView,
      evaluations: [...state.evaluationBySweep.entries()].map(([sweepIndex, evaluation]) => ({ sweepIndex, ...evaluation })),
      note: "La configuración y la verdad conocida se omiten de la exportación estudiante.",
    };
  downloadJson(`${state.scenario.id}-${state.mode}.json`, payload);
}

plot.onSelect((sample) => {
  if (state.mode !== "student" || state.evaluationBySweep.has(state.sweepIndex)) return;
  state.selectedBySweep.set(state.sweepIndex, sample);
  render();
});

elements["student-mode"].addEventListener("click", () => setMode("student"));
elements["teacher-mode"].addEventListener("click", () => setMode("teacher"));
elements["new-challenge"].addEventListener("click", newStudentChallenge);
elements["apply-teacher"].addEventListener("click", () => loadScenario(teacherConfiguration()));
elements["previous-sweep"].addEventListener("click", () => changeSweep(-1));
elements["next-sweep"].addEventListener("click", () => changeSweep(1));
elements["hint-button"].addEventListener("click", showHint);
elements["evaluate-button"].addEventListener("click", evaluateStudent);
elements["export-session"].addEventListener("click", exportSession);

setMode("student");
