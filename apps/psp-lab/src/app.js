import {
  createSeededRandom,
  createStudentScenarioView,
  generatePspScenario,
} from "../../electrophysiology-lab/src/core/pspScenario.js";
import { measureEvokedPsps } from "../../electrophysiology-lab/src/core/currentClamp.js";
import { PspPlot } from "./plot.js";

const i18n = window.SimuLabI18n.createI18n();
i18n.apply();
i18n.bindLanguageControls();
const t = (key, parameters) => i18n.t(key, parameters);
const PROGRESS_KEY = "simulab-psp-student-progress-0.1";
const HINT_KEYS = ["baseline", "artifact", "sustained", "polarity"];

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
  difficulty: "intermediate",
};

const plot = new PspPlot(elements["psp-canvas"], t);

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
    title: "PSP challenge",
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
    title: "Teacher PSP scenario",
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
    elements["scenario-title"].textContent = t("psp.results.loadError");
    elements["scenario-summary"].textContent = error.message;
    elements["analysis-status"].textContent = t("psp.results.invalid");
    elements["analysis-status"].className = "status-pill exclude";
  }
}

function newStudentChallenge() {
  state.challengeCounter += 1;
  state.difficulty = elements.difficulty.value;
  const seed = `reto-${Date.now().toString(36)}-${state.challengeCounter}`;
  loadScenario(difficultyConfiguration(seed, state.difficulty));
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
  elements["hint-text"].textContent = t("psp.worksheet.hintEmpty");
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
  if (!Number.isFinite(value)) return "—";
  const locale = i18n.language === "en" ? "en-US" : "es-MX";
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}${suffix}`;
}

function visibleResults() {
  return state.mode === "teacher" || state.evaluationBySweep.has(state.sweepIndex);
}

function renderMetrics(show) {
  const analysis = currentAnalysis()[0];
  const metrics = analysis?.metrics ?? {};
  const hidden = show ? "—" : t("psp.metrics.hiddenF");
  elements["metric-baseline"].textContent = show ? format(metrics.baselineMv, 2, " mV") : hidden;
  elements["metric-noise"].textContent = show ? format(metrics.baselineNoiseSigmaMv, 3, " mV") : t("psp.metrics.hiddenM");
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
    item.textContent = t("psp.quality.after");
    list.append(item);
    return;
  }
  const flags = currentAnalysis().flatMap((analysis, eventIndex) =>
    analysis.flags.map((flag) => ({ ...flag, eventIndex })),
  );
  if (!flags.length) {
    const item = document.createElement("li");
    item.className = "pass";
    item.textContent = t("psp.quality.none");
    list.append(item);
    return;
  }
  for (const flag of flags) {
    const item = document.createElement("li");
    item.className = flag.level === "exclude" ? "exclude" : "review";
    const flagKey = `psp.flags.${flag.code}`;
    const translatedFlag = t(flagKey);
    const message = translatedFlag === flagKey ? flag.message : translatedFlag;
    const prefix = currentAnalysis().length > 1 ? t("psp.quality.stimulus", { number: flag.eventIndex + 1 }) : "";
    item.textContent = `${prefix}${message}`;
    list.append(item);
  }
}

function renderTruth() {
  if (state.mode !== "teacher" || !state.scenario) return;
  const config = state.scenario.configuration;
  const truth = currentTruth()?.events[0];
  const values = [
    [t("psp.truth.seed"), String(config.seed)],
    [t("psp.truth.response"), t(`psp.response.${config.response.kind}`)],
    [t("psp.truth.direction"), truth?.direction ? t(`psp.direction.${truth.direction}`) : "—"],
    [t("psp.truth.amplitude"), format(truth?.amplitudeMv, 3, " mV")],
    [t("psp.truth.onset"), format(truth?.onsetTimeMs - truth?.stimulusTimeMs, 2, " ms")],
    [t("psp.truth.peak"), format(truth?.peakTimeMs - truth?.stimulusTimeMs, 2, " ms")],
    [t("psp.truth.noise"), format(config.noiseStdMv, 3, " mV")],
    [t("psp.truth.drift"), format(config.driftMvPerSecond, 2, " mV/s")],
    [t("psp.truth.stimuli"), String(config.stimuli.length)],
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
  elements["feedback-title"].textContent = t("psp.feedback.score", evaluation);
  elements["feedback-content"].replaceChildren();
  for (const message of evaluation.messages) {
    const paragraph = document.createElement("p");
    const parameters = { ...message.parameters };
    if (parameters.valueKey) parameters.value = t(parameters.valueKey);
    if (Number.isFinite(parameters.errorValue)) parameters.error = format(parameters.errorValue, 2);
    paragraph.textContent = t(message.key, parameters);
    elements["feedback-content"].append(paragraph);
  }
}

function render() {
  if (!state.scenario) return;
  const sweep = currentSweep();
  const evaluation = state.evaluationBySweep.get(state.sweepIndex);
  const show = visibleResults();
  const stimuli = sweep.stimulusTimesMs;
  const selected = state.selectedBySweep.get(state.sweepIndex) ?? null;
  elements["challenge-id"].textContent = state.scenario.id;
  elements["scenario-title"].textContent = state.mode === "teacher"
    ? t("psp.results.teacherTitle")
    : t("psp.results.challengeTitle", { difficulty: t(`psp.difficulty.${state.difficulty}`) });
  elements["scenario-summary"].textContent = t("psp.results.summary", { sweeps: state.scenario.sweeps.length, stimuli: stimuli.length });
  elements["sweep-position"].textContent = t("psp.sweep.position", { current: state.sweepIndex + 1, total: state.scenario.sweeps.length });
  elements["previous-sweep"].disabled = state.sweepIndex === 0;
  elements["next-sweep"].disabled = state.sweepIndex === state.scenario.sweeps.length - 1;
  elements["selected-peak"].textContent = selected ? `${format(selected.timeMs, 2, " ms")} · ${format(selected.voltageMv, 2, " mV")}` : t("psp.worksheet.click");
  elements["answer-presence"].disabled = Boolean(evaluation);
  elements["answer-direction"].disabled = Boolean(evaluation);
  elements["evaluate-button"].disabled = Boolean(evaluation);
  elements["evaluate-button"].textContent = evaluation ? t("psp.worksheet.evaluated") : t("psp.worksheet.evaluate");

  const firstAnalysis = currentAnalysis()[0];
  const status = show ? firstAnalysis?.status ?? "not_evaluable" : "notEvaluated";
  elements["analysis-status"].textContent = t(`psp.status.${status}`);
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
    messages.push({ key: "psp.evaluation.presenceCorrect" });
  } else {
    messages.push({ key: "psp.evaluation.expectedPresence", parameters: { valueKey: `psp.evaluation.presence.${expected.presence}` } });
  }
  if (directionAnswer === expected.direction) {
    score += 1;
    messages.push({ key: "psp.evaluation.directionCorrect" });
  } else {
    messages.push({ key: "psp.evaluation.expectedDirection", parameters: { valueKey: `psp.direction.${expected.direction}` } });
  }
  if (expected.presence === "present") {
    const peakError = selected ? Math.abs(selected.timeMs - expected.peakTimeMs) : Number.POSITIVE_INFINITY;
    if (peakError <= 3) {
      score += 1;
      messages.push({ key: "psp.evaluation.peakCorrect", parameters: { errorValue: peakError } });
    } else {
      messages.push(selected
        ? { key: "psp.evaluation.peakError", parameters: { errorValue: peakError } }
        : { key: "psp.evaluation.peakMissing" });
    }
  }
  messages.push({ key: "psp.evaluation.classification" });
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
    ? t("psp.progress.summary", progress)
    : t("psp.progress.empty");
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
  const hintKey = HINT_KEYS[Math.min(state.hintIndex, HINT_KEYS.length - 1)];
  elements["hint-text"].textContent = t(`psp.hint.${hintKey}`);
  state.hintIndex = Math.min(HINT_KEYS.length - 1, state.hintIndex + 1);
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
      locale: i18n.language,
      scenario: state.scenario,
      analyses: state.analyses,
    }
    : {
      schema: "simulab-psp-student-session-0.1",
      scenario: state.studentView,
      evaluations: [...state.evaluationBySweep.entries()].map(([sweepIndex, evaluation]) => ({ sweepIndex, ...evaluation })),
      locale: i18n.language,
      note: t("psp.export.studentNote"),
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
window.addEventListener("simulab:languagechange", () => {
  if (state.hintIndex > 0) {
    elements["hint-text"].textContent = t(`psp.hint.${HINT_KEYS[state.hintIndex - 1]}`);
  }
  plot.draw();
  render();
});

setMode("student");
