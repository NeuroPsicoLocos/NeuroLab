import { analyzeTrace, createDemoTrace } from "./core/signal.js";
import {
  LEGACY_POPS_PROFILE,
  PAIRED_POPS_PROFILE,
  measurePopulationSpikes,
} from "./core/fieldPotential.js?v=20260731-6";
import {
  guessTimeUnit,
  isImplausibleTimeScale,
  signalColumnChoices,
  suggestWorkbookAnalysis,
} from "./core/inference.js?v=20260731-5";
import {
  buildTraceExportBaseName,
  columnValues,
  exportAnalysisWorkbook,
  parseWorkbook,
} from "./io/workbook.js?v=20260731-7";
import {
  buildReviewSessionKey,
  buildTraceReviewKey,
  emptyReviewState,
  isReviewCurrent,
  loadReviewState,
  storeReviewRecord,
} from "./core/review.js?v=20260731-1";
import { SignalPlot } from "./ui/plot.js?v=20260731-8";

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  demoButton: document.querySelector("#demo-button"),
  fileStatus: document.querySelector("#file-status"),
  sheetSelect: document.querySelector("#sheet-select"),
  timeSelect: document.querySelector("#time-select"),
  signalSelect: document.querySelector("#signal-select"),
  signalLabel: document.querySelector("#signal-label"),
  signalPrevious: document.querySelector("#signal-previous"),
  signalNext: document.querySelector("#signal-next"),
  timeUnit: document.querySelector("#time-unit"),
  signalUnit: document.querySelector("#signal-unit"),
  signalScopeHint: document.querySelector("#signal-scope-hint"),
  analysisMode: document.querySelector("#analysis-mode"),
  preliminaryControls: document.querySelector("#preliminary-controls"),
  popsControls: document.querySelector("#pops-controls"),
  sensitivity: document.querySelector("#sensitivity"),
  sensitivityOutput: document.querySelector("#sensitivity-output"),
  refractory: document.querySelector("#refractory"),
  saturationMin: document.querySelector("#saturation-min"),
  saturationMax: document.querySelector("#saturation-max"),
  popsSmoothing: document.querySelector("#pops-smoothing"),
  popsProfile: document.querySelector("#pops-profile"),
  popsArtifactThreshold: document.querySelector("#pops-artifact-threshold"),
  popsArtifactDistance: document.querySelector("#pops-artifact-distance"),
  popsProminence: document.querySelector("#pops-prominence"),
  popsExportScope: document.querySelector("#pops-export-scope"),
  p1Start: document.querySelector("#p1-start"),
  p1End: document.querySelector("#p1-end"),
  p2Start: document.querySelector("#p2-start"),
  p2End: document.querySelector("#p2-end"),
  p3Start: document.querySelector("#p3-start"),
  p3End: document.querySelector("#p3-end"),
  traceTitle: document.querySelector("#trace-title"),
  traceNavigator: document.querySelector("#trace-navigator"),
  tracePrevious: document.querySelector("#trace-previous"),
  traceNext: document.querySelector("#trace-next"),
  tracePosition: document.querySelector("#trace-position"),
  traceSignalName: document.querySelector("#trace-signal-name"),
  reviewWorkflow: document.querySelector("#review-workflow"),
  reviewTitle: document.querySelector("#review-title"),
  reviewProgress: document.querySelector("#review-progress"),
  reviewNote: document.querySelector("#review-note"),
  reviewPending: document.querySelector("#review-pending"),
  reviewReject: document.querySelector("#review-reject"),
  reviewAccept: document.querySelector("#review-accept"),
  reviewStorageNote: document.querySelector("#review-storage-note"),
  configButton: document.querySelector("#config-button"),
  excelButton: document.querySelector("#excel-button"),
  qualityTitle: document.querySelector("#quality-title"),
  qualityList: document.querySelector("#quality-list"),
  eventTableCard: document.querySelector("#event-table-card"),
  eventTableBody: document.querySelector("#event-table-body"),
  smoothLegend: document.querySelector("#smooth-legend"),
  pointsLegend: document.querySelector("#points-legend"),
  plotView: document.querySelector("#plot-view"),
  metrics: {
    samples: document.querySelector("#metric-samples"),
    rate: document.querySelector("#metric-rate"),
    duration: document.querySelector("#metric-duration"),
    range: document.querySelector("#metric-range"),
    events: document.querySelector("#metric-events"),
  },
};

const plot = new SignalPlot(document.querySelector("#signal-canvas"));
const state = {
  workbook: null,
  result: null,
  fieldResult: null,
  source: null,
  inferredTimeUnit: "ms",
  analysisSuggestion: "",
  reviewSessionKey: "",
  reviews: emptyReviewState(),
  activeReviewTraceKey: "",
};

function numericOrUndefined(value) {
  if (value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function currentSettings() {
  return {
    timeUnit: resolvedTimeUnit(),
    timeUnitSelection: elements.timeUnit.value,
    signalUnit: elements.signalUnit.value.trim() || "unidad arbitraria",
    sensitivity: Number(elements.sensitivity.value),
    refractoryMs: Math.max(0, Number(elements.refractory.value) || 0),
    saturationMin: numericOrUndefined(elements.saturationMin.value),
    saturationMax: numericOrUndefined(elements.saturationMax.value),
  };
}

function resolvedTimeUnit() {
  return elements.timeUnit.value === "auto" ? state.inferredTimeUnit : elements.timeUnit.value;
}

function currentFieldSettings() {
  return {
    profile: elements.popsProfile.value,
    smoothing: elements.popsSmoothing.checked,
    artifactThreshold: Math.max(0, Number(elements.popsArtifactThreshold.value) || 0),
    minimumArtifactDistanceMs: Math.max(0, Number(elements.popsArtifactDistance.value) || 0),
    p1StartMs: Number(elements.p1Start.value),
    p1EndMs: Number(elements.p1End.value),
    p2StartMs: Number(elements.p2Start.value),
    p2EndMs: Number(elements.p2End.value),
    p3StartMs: Number(elements.p3Start.value),
    p3EndMs: Number(elements.p3End.value),
    p3Prominence: Math.max(0, Number(elements.popsProminence.value) || 0),
  };
}

function reviewStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function startReviewSession({ fileName, fileSize = 0, lastModified = 0 }) {
  state.reviewSessionKey = buildReviewSessionKey({ fileName, fileSize, lastModified });
  state.reviews = loadReviewState(reviewStorage(), state.reviewSessionKey);
  state.activeReviewTraceKey = "";
}

function analysisFingerprint() {
  return JSON.stringify({
    analysisMode: elements.analysisMode.value,
    settings: currentSettings(),
    fieldPotentialSettings: elements.analysisMode.value === "population-spike" ? currentFieldSettings() : null,
  });
}

function currentTraceIdentity() {
  if (!state.source) return null;
  if (state.source.type === "demo") {
    return { sheetName: "Demostración", signalHeader: "Potencial (mV)" };
  }
  const sheet = state.workbook?.sheets[Number(elements.sheetSelect.value)];
  const signalHeader = elements.signalSelect.selectedOptions[0]?.textContent;
  return sheet && signalHeader ? { sheetName: sheet.name, signalHeader } : null;
}

function currentTraceReview() {
  const identity = currentTraceIdentity();
  if (!identity) return null;
  return state.reviews.traces[buildTraceReviewKey(identity.sheetName, identity.signalHeader)] ?? null;
}

function activeSignalChoices() {
  if (!state.source) return [];
  if (state.source.type === "demo") return [{ index: 0, header: "Potencial (mV)" }];
  const sheet = state.workbook?.sheets[Number(elements.sheetSelect.value)];
  return sheet ? numericSignalColumns(sheet, Number(elements.timeSelect.value)) : [];
}

function updateSignalNavigator() {
  const choices = activeSignalChoices();
  const activeIndex = Number(elements.signalSelect.value);
  const position = Math.max(0, choices.findIndex((choice) => choice.index === activeIndex));
  const activeChoice = choices[position];
  const hasChoices = choices.length > 0;
  const workbookNavigation = state.source?.type === "workbook" && hasChoices;

  elements.signalLabel.value = activeChoice?.header ?? "—";
  elements.traceSignalName.textContent = activeChoice?.header ?? "—";
  elements.tracePosition.textContent = hasChoices ? `Traza ${position + 1} de ${choices.length}` : "Traza —";
  elements.traceNavigator.hidden = !state.source;
  elements.signalPrevious.disabled = !workbookNavigation || position <= 0;
  elements.tracePrevious.disabled = !workbookNavigation || position <= 0;
  elements.signalNext.disabled = !workbookNavigation || position >= choices.length - 1;
  elements.traceNext.disabled = !workbookNavigation || position >= choices.length - 1;
}

function decisionLabel(decision) {
  if (decision === "accepted") return "Aceptada";
  if (decision === "rejected") return "Rechazada";
  return "Pendiente guardada";
}

function updateReviewUi() {
  if (!state.source) {
    elements.reviewWorkflow.hidden = true;
    return;
  }
  elements.reviewWorkflow.hidden = false;
  const choices = activeSignalChoices();
  const sheetName = currentTraceIdentity()?.sheetName ?? "";
  const records = choices.map((choice) => state.reviews.traces[buildTraceReviewKey(sheetName, choice.header)]);
  const accepted = records.filter((record) => record?.decision === "accepted").length;
  const rejected = records.filter((record) => record?.decision === "rejected").length;
  elements.reviewProgress.textContent = `${accepted + rejected} de ${choices.length} revisadas · ${accepted} aceptadas · ${rejected} rechazadas`;

  const record = currentTraceReview();
  const identity = currentTraceIdentity();
  const activeTraceKey = identity ? buildTraceReviewKey(identity.sheetName, identity.signalHeader) : "";
  const current = isReviewCurrent(record, analysisFingerprint());
  if (record && !current && record.decision !== "pending") {
    elements.reviewTitle.textContent = `${decisionLabel(record.decision)} · parámetros cambiaron`;
    elements.reviewWorkflow.dataset.status = "stale";
  } else {
    elements.reviewTitle.textContent = record ? decisionLabel(record.decision) : "Pendiente de decisión";
    elements.reviewWorkflow.dataset.status = record?.decision ?? "pending";
  }
  if (document.activeElement !== elements.reviewNote) elements.reviewNote.value = record?.note ?? "";
  state.activeReviewTraceKey = activeTraceKey;
  const atLastTrace = choices.findIndex((choice) => choice.index === Number(elements.signalSelect.value)) >= choices.length - 1;
  elements.reviewAccept.textContent = atLastTrace ? "Aceptar" : "Aceptar y siguiente";
  elements.reviewReject.textContent = atLastTrace ? "Rechazar" : "Rechazar y siguiente";
}

function storeCurrentReview(decision, { advance = false } = {}) {
  const identity = currentTraceIdentity();
  if (!identity || !state.reviewSessionKey) return;
  const traceKey = buildTraceReviewKey(identity.sheetName, identity.signalHeader);
  const record = {
    decision,
    note: elements.reviewNote.value.trim(),
    reviewedAt: new Date().toISOString(),
    analysisFingerprint: analysisFingerprint(),
    analysisMode: elements.analysisMode.value,
    automaticState: state.fieldResult ? (state.fieldResult.ok ? "Analizable" : "Revisar/excluir") : state.result?.ok ? "Analizable" : "Excluido",
  };
  const saved = storeReviewRecord(reviewStorage(), state.reviewSessionKey, traceKey, record, state.reviews);
  state.reviews = saved.state;
  elements.reviewStorageNote.textContent = saved.ok
    ? "Decisión guardada en este navegador; se incluirá al exportar Excel."
    : "No fue posible usar el almacenamiento del navegador; exporta Excel antes de cerrar esta página.";
  updateReviewUi();
  if (advance) navigateSignal(1);
}

function persistDraftNote() {
  if (!state.activeReviewTraceKey || !state.reviewSessionKey) return;
  const traceKey = state.activeReviewTraceKey;
  const existing = state.reviews.traces[traceKey];
  const note = elements.reviewNote.value.trim();
  if (note === (existing?.note ?? "")) return;
  const record = {
    ...(existing ?? {}),
    decision: existing?.decision ?? "pending",
    note,
    reviewedAt: new Date().toISOString(),
    analysisFingerprint: existing?.analysisFingerprint ?? analysisFingerprint(),
    analysisMode: existing?.analysisMode ?? elements.analysisMode.value,
    automaticState: existing?.automaticState ?? (state.result?.ok ? "Analizable" : "Excluido"),
  };
  const saved = storeReviewRecord(reviewStorage(), state.reviewSessionKey, traceKey, record, state.reviews);
  state.reviews = saved.state;
}

function navigateSignal(offset) {
  if (state.source?.type !== "workbook") return;
  const choices = activeSignalChoices();
  const currentPosition = choices.findIndex((choice) => choice.index === Number(elements.signalSelect.value));
  const nextPosition = Math.min(choices.length - 1, Math.max(0, currentPosition + offset));
  if (nextPosition === currentPosition || nextPosition < 0) return;
  persistDraftNote();
  elements.signalSelect.value = String(choices[nextPosition].index);
  updateSignalScopeHint();
  analyzeCurrentSelection();
  elements.traceNavigator.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function applyPopsProfile() {
  const paired = elements.popsProfile.value === "paired";
  const profile = paired ? PAIRED_POPS_PROFILE : LEGACY_POPS_PROFILE;
  elements.popsArtifactThreshold.value = String(profile.artifactThreshold);
  elements.popsArtifactDistance.value = String(profile.minimumArtifactDistanceMs);
  elements.popsProminence.value = String(profile.p3Prominence);
  elements.p1Start.value = String(profile.p1StartMs);
  elements.p1End.value = String(profile.p1EndMs);
  elements.p2Start.value = String(profile.p2StartMs);
  elements.p2End.value = String(profile.p2EndMs);
  elements.p3Start.value = String(profile.p3StartMs);
  elements.p3End.value = String(profile.p3EndMs);
  elements.popsArtifactThreshold.disabled = paired;
  elements.popsArtifactDistance.disabled = paired;
}

function setAnalysisModeUi() {
  const isPopulationSpike = elements.analysisMode.value === "population-spike";
  elements.preliminaryControls.hidden = isPopulationSpike;
  elements.popsControls.hidden = !isPopulationSpike;
  elements.smoothLegend.hidden = !isPopulationSpike;
  elements.pointsLegend.hidden = !isPopulationSpike;
  elements.plotView.value = isPopulationSpike ? "response" : "full";
  elements.plotView.disabled = !isPopulationSpike;
  updateSignalScopeHint();
}

function configureForWorkbook(workbook) {
  const suggestion = suggestWorkbookAnalysis(workbook);
  elements.analysisMode.value = suggestion.mode;
  elements.popsProfile.value = suggestion.profile;
  elements.popsExportScope.value = suggestion.exportScope;
  state.analysisSuggestion = suggestion.message;
  if (suggestion.mode === "population-spike") applyPopsProfile();
  setAnalysisModeUi();
}

function updateSignalScopeHint() {
  updateSignalNavigator();
  if (state.source?.type === "demo") {
    elements.signalScopeHint.textContent = "Demostración con una señal sintética.";
    return;
  }
  if (!state.workbook || elements.sheetSelect.value === "") {
    elements.signalScopeHint.textContent = "La gráfica muestra una señal a la vez.";
    return;
  }
  const sheet = state.workbook.sheets[Number(elements.sheetSelect.value)];
  const timeIndex = Number(elements.timeSelect.value);
  const signals = numericSignalColumns(sheet, timeIndex);
  const activeIndex = Number(elements.signalSelect.value);
  const activePosition = Math.max(0, signals.findIndex((column) => column.index === activeIndex)) + 1;
  const exportMessage = elements.analysisMode.value === "population-spike"
    ? " Al exportar se incluirá únicamente esta traza."
    : " Selecciona el método POPS para medir P1, P2 y P3.";
  elements.signalScopeHint.textContent = `Mostrando señal ${activePosition} de ${signals.length || 1} en esta hoja.${exportMessage}`;
}

function convertTimeToMilliseconds(values, unit) {
  const factor = unit === "s" ? 1000 : unit === "us" ? 0.001 : 1;
  return values.map((value) => {
    if (value === null || value === undefined || value === "") return value;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric * factor : value;
  });
}

function formatMetric(value, unit = "") {
  if (!Number.isFinite(value)) return "—";
  const formatted = Math.abs(value) >= 10000
    ? value.toExponential(2)
    : new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function appendQualityItem(className, message) {
  const item = document.createElement("li");
  item.className = className;
  item.textContent = message;
  elements.qualityList.append(item);
}

function updateQuality(result, fieldResult = null) {
  elements.qualityList.replaceChildren();
  for (const flag of result.flags) appendQualityItem(flag.level, flag.message);

  if (fieldResult) {
    const validEvents = fieldResult.events.filter((event) => event.valid);
    const reviewEvents = validEvents.filter((event) => event.reviewRequired);
    if (fieldResult.flags.includes("invalid_parameters")) {
      appendQualityItem("exclude", "La configuración POPS contiene un umbral inválido o una ventana cuyo fin no es posterior al inicio.");
    }
    if (fieldResult.flags.includes("duplicate_artifact_windows")) {
      appendQualityItem("review", "Las dos ventanas del protocolo pareado seleccionaron el mismo artefacto; revisar la traza o el protocolo.");
    }
    if (!fieldResult.artifacts.length) appendQualityItem("review", "El perfil POPS no encontró artefactos con el umbral actual.");
    if (fieldResult.flags.includes("incomplete_response_window")) {
      appendQualityItem("review", "Al menos un estímulo no tiene una ventana completa para P1, P2 y P3.");
    }
    const rejectedP3Events = fieldResult.events.filter((event) => event.flags.includes("p3_prominence_not_met"));
    if (rejectedP3Events.length) {
      appendQualityItem(
        "review",
        `${rejectedP3Events.length} estímulo(s) sin respuesta POPS: no se encontró un P3 con la prominencia mínima. Se conservan los artefactos para revisión manual, pero no se reporta amplitud.`,
      );
    }
    if (reviewEvents.length) {
      appendQualityItem("review", `${reviewEvents.length} de ${validEvents.length} evento(s) requieren revisión de puntos o prominencia.`);
    }
    const fallbackEvents = validEvents.filter((event) => event.flags.includes("p3_prominence_fallback"));
    if (fallbackEvents.length) {
      appendQualityItem(
        "review",
        `${fallbackEvents.length} evento(s): P3 no alcanzó la prominencia mínima; el punto mostrado es el máximo local provisional y requiere confirmación manual.`,
      );
    }
    if (validEvents.length) {
      appendQualityItem("info", `${validEvents.length} espiga(s) poblacional(es) medidas con el perfil POPS reproducido.`);
    }
  }

  if (!elements.qualityList.children.length) appendQualityItem("pass", "Sin banderas automáticas en la revisión preliminar.");
  if (!result.ok || (fieldResult && !fieldResult.ok)) elements.qualityTitle.textContent = "Revisión necesaria antes de medir";
  else if (fieldResult) elements.qualityTitle.textContent = "Medición POPS disponible con revisión";
  else elements.qualityTitle.textContent = "Traza analizable con revisión";
}

function renderEventTable(fieldResult, signalUnit) {
  elements.eventTableBody.replaceChildren();
  elements.eventTableCard.hidden = !fieldResult;
  if (!fieldResult) return;

  for (const event of fieldResult.events) {
    const row = document.createElement("tr");
    if (!event.valid || event.reviewRequired) row.className = "review";
    const values = event.valid
      ? [
        event.eventNumber,
        formatMetric(event.artifact.timeMs),
        formatMetric(event.p1.latencyMs),
        formatMetric(event.p2.latencyMs),
        formatMetric(event.p3.latencyMs),
        formatMetric(event.amplitude, signalUnit),
        formatMetric(event.tau12Ms),
        formatMetric(event.tau23Ms),
        formatMetric(event.snr),
        `${Math.round(event.confidence)} / 100`,
      ]
      : [event.eventNumber, formatMetric(event.artifact.timeMs), "—", "—", "—", "—", "—", "—", "—", "0 / 100"];
    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.append(cell);
    }
    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = `review-pill${event.valid && !event.reviewRequired ? " accept" : ""}`;
    const p3Fallback = event.valid && event.flags.includes("p3_prominence_fallback");
    const p3Rejected = !event.valid && event.flags.includes("p3_prominence_not_met");
    status.textContent = event.valid && !event.reviewRequired
      ? "Aceptable"
      : p3Rejected
        ? "Sin P3"
        : p3Fallback
          ? "Revisar P3"
          : "Revisar";
    if (event.flags?.length) status.title = event.flags.join(", ");
    statusCell.append(status);
    row.append(statusCell);
    elements.eventTableBody.append(row);
  }
}

function renderResult(result, fieldResult = null) {
  const settings = currentSettings();
  state.result = result;
  state.fieldResult = fieldResult;
  const plotResult = fieldResult
    ? {
      ...result,
      candidates: fieldResult.artifacts,
      processedSignal: fieldResult.processedSignal,
      responseEvents: fieldResult.events,
      viewMode: elements.plotView.value,
      includeFullSignalRange: state.source?.type === "demo",
    }
    : result;
  plot.setData(plotResult, { time: "ms", signal: settings.signalUnit });
  elements.metrics.samples.textContent = formatMetric(result.stats.validRows);
  elements.metrics.rate.textContent = formatMetric(result.stats.sampleRateHz, "Hz");
  elements.metrics.duration.textContent = formatMetric(result.stats.durationMs, "ms");
  elements.metrics.range.textContent = formatMetric(result.stats.peakToPeak, settings.signalUnit);
  elements.metrics.events.textContent = fieldResult
    ? `${fieldResult.events.filter((event) => event.valid).length} / ${fieldResult.artifacts.length}`
    : formatMetric(result.candidates.length);
  elements.configButton.disabled = false;
  elements.excelButton.disabled = false;
  updateQuality(result, fieldResult);
  renderEventTable(fieldResult, settings.signalUnit);
  updateSignalNavigator();
  updateReviewUi();
}

function analyzeCurrentSelection() {
  if (!state.source) return;
  const settings = currentSettings();
  let timeValues;
  let rawTimeValues;
  let signalValues;

  if (state.source.type === "demo") {
    timeValues = state.source.trace.timeMs;
    signalValues = state.source.trace.signal;
  } else {
    const sheet = state.workbook.sheets[Number(elements.sheetSelect.value)];
    rawTimeValues = columnValues(sheet, Number(elements.timeSelect.value));
    timeValues = convertTimeToMilliseconds(rawTimeValues, settings.timeUnit);
    signalValues = columnValues(sheet, Number(elements.signalSelect.value));
  }

  const analyze = (times) => analyzeTrace(times, signalValues, {
    sensitivity: settings.sensitivity,
    refractoryMs: settings.refractoryMs,
    saturationMin: settings.saturationMin ?? Number.NEGATIVE_INFINITY,
    saturationMax: settings.saturationMax ?? Number.POSITIVE_INFINITY,
  });
  let result = analyze(timeValues);
  if (rawTimeValues && isImplausibleTimeScale(result.stats) && state.inferredTimeUnit !== settings.timeUnit) {
    const correctedTimes = convertTimeToMilliseconds(rawTimeValues, state.inferredTimeUnit);
    const correctedResult = analyze(correctedTimes);
    if (!isImplausibleTimeScale(correctedResult.stats)) {
      result = correctedResult;
      elements.timeUnit.value = "auto";
      result.flags.push({
        level: "info",
        code: "time_scale_auto_corrected",
        message: `Escala temporal corregida automáticamente a ${state.inferredTimeUnit === "s" ? "segundos" : "microsegundos"}; confirma la unidad del equipo.`,
      });
    }
  }
  if (isImplausibleTimeScale(result.stats)) {
    result.flags.push({
      level: "review",
      code: "implausible_time_scale",
      message: "La escala temporal produce una frecuencia mayor de 1 MHz o una duración demasiado corta. Revisa la unidad temporal.",
    });
  }
  const fieldResult = elements.analysisMode.value === "population-spike" && result.ok
    ? measurePopulationSpikes(result.timeMs, result.signal, currentFieldSettings())
    : null;
  renderResult(result, fieldResult);
}

function fillSelect(select, labels) {
  select.replaceChildren(...labels.map((label, index) => new Option(label, String(index))));
  select.disabled = !labels.length;
}

function fillSignalSelect(sheet, timeIndex, preferredIndex) {
  const choices = signalColumnChoices(sheet.headers, timeIndex);
  elements.signalSelect.replaceChildren(
    ...choices.map(({ header, index }) => new Option(header, String(index))),
  );
  const preferredAvailable = choices.some(({ index }) => index === preferredIndex);
  elements.signalSelect.value = String(preferredAvailable ? preferredIndex : choices[0]?.index ?? "");
  elements.signalSelect.disabled = !choices.length;
}

function guessColumns(headers) {
  const normalized = headers.map((header) => header.toLowerCase());
  const timeIndex = normalized.findIndex((header) => /time|tiempo|ms|seg/.test(header));
  const signalIndex = normalized.findIndex((header, index) => index !== timeIndex && /signal|volt|mv|uv|current|corriente|pa|trace/.test(header));
  return {
    timeIndex: timeIndex >= 0 ? timeIndex : 0,
    signalIndex: signalIndex >= 0 ? signalIndex : Math.min(1, Math.max(headers.length - 1, 0)),
  };
}

function activateSheet(sheetIndex = 0) {
  const sheet = state.workbook.sheets[sheetIndex];
  fillSelect(elements.timeSelect, sheet.headers);
  const guess = guessColumns(sheet.headers);
  elements.timeSelect.value = String(guess.timeIndex);
  fillSignalSelect(sheet, guess.timeIndex, guess.signalIndex);
  const inferredTimeUnit = guessTimeUnit(columnValues(sheet, guess.timeIndex), sheet.headers[guess.timeIndex]);
  state.inferredTimeUnit = inferredTimeUnit;
  const automaticOption = elements.timeUnit.querySelector('option[value="auto"]');
  const unitLabels = { s: "segundos (s)", ms: "milisegundos (ms)", us: "microsegundos (µs)" };
  automaticOption.textContent = `automática · ${unitLabels[inferredTimeUnit]}`;
  elements.timeUnit.value = "auto";
  state.source = { type: "workbook" };
  elements.traceTitle.textContent = `${state.workbook.fileName} · ${sheet.name}`;
  elements.fileStatus.textContent = `${state.workbook.fileName} · ${(state.workbook.fileSize / 1024).toFixed(1)} kB · ${state.analysisSuggestion} · tiempo: ${unitLabels[inferredTimeUnit]}`;
  updateSignalScopeHint();
  analyzeCurrentSelection();
}

function numericSignalColumns(sheet, timeIndex) {
  return sheet.headers
    .map((header, index) => ({ header, index }))
    .filter(({ index }) => index !== timeIndex)
    .filter(({ index }) => {
      const values = columnValues(sheet, index).slice(0, 1000);
      const nonEmpty = values.filter((value) => value !== null && value !== undefined && value !== "");
      if (nonEmpty.length < 11) return false;
      const numericCount = nonEmpty.filter((value) => Number.isFinite(Number(value))).length;
      return numericCount / nonEmpty.length >= 0.9;
    });
}

async function openFile(file) {
  if (!file) return;
  elements.fileStatus.textContent = `Abriendo ${file.name}…`;
  elements.fileStatus.className = "file-status loading";
  try {
    startReviewSession({ fileName: file.name, fileSize: file.size, lastModified: file.lastModified });
    state.workbook = await parseWorkbook(file);
    if (!state.workbook.sheets.some((sheet) => sheet.headers.length >= 2)) {
      throw new Error("No se encontró una hoja con al menos dos columnas.");
    }
    fillSelect(elements.sheetSelect, state.workbook.sheets.map((sheet) => sheet.name));
    const firstUsableSheet = state.workbook.sheets.findIndex((sheet) => sheet.headers.length >= 2);
    elements.sheetSelect.value = String(firstUsableSheet);
    configureForWorkbook(state.workbook);
    elements.fileStatus.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} kB · ${state.workbook.sheets.length} hoja(s)`;
    elements.fileStatus.className = "file-status success";
    activateSheet(firstUsableSheet);
  } catch (error) {
    console.error(error);
    elements.fileStatus.textContent = `No se pudo abrir el archivo: ${error.message}`;
    elements.fileStatus.className = "file-status error";
  }
}

function loadDemo() {
  const trace = createDemoTrace();
  startReviewSession({ fileName: "demo_potencial_campo", fileSize: 0, lastModified: 0 });
  state.workbook = null;
  state.source = { type: "demo", trace };
  fillSelect(elements.sheetSelect, ["Demostración"]);
  fillSelect(elements.timeSelect, ["Tiempo (ms)"]);
  fillSelect(elements.signalSelect, ["Potencial (mV)"]);
  elements.sheetSelect.disabled = true;
  elements.timeSelect.disabled = true;
  elements.signalSelect.disabled = true;
  state.inferredTimeUnit = "ms";
  elements.timeUnit.querySelector('option[value="auto"]').textContent = "automática · milisegundos (ms)";
  elements.timeUnit.value = "auto";
  elements.signalUnit.value = "mV";
  elements.traceTitle.textContent = "Señal sintética · potencial de campo";
  elements.fileStatus.textContent = "Demostración determinística: 10 estímulos, 10 kHz, 1.1 s.";
  elements.fileStatus.className = "file-status success";
  analyzeCurrentSelection();
}

function exportConfiguration() {
  const review = currentTraceReview();
  const configuration = {
    schema: "simulab-ephys-0.4",
    exportedAt: new Date().toISOString(),
    source: state.source?.type === "demo" ? "synthetic_demo" : state.workbook?.fileName,
    sheet: state.source?.type === "demo" ? "Demostración" : state.workbook?.sheets[Number(elements.sheetSelect.value)]?.name,
    timeColumn: elements.timeSelect.selectedOptions[0]?.textContent,
    signalColumn: elements.signalSelect.selectedOptions[0]?.textContent,
    analysisMode: elements.analysisMode.value,
    settings: currentSettings(),
    fieldPotentialSettings: elements.analysisMode.value === "population-spike" ? currentFieldSettings() : null,
    exportScope: "active",
    manualReview: review ? {
      ...review,
      currentForParameters: isReviewCurrent(review, analysisFingerprint()),
    } : { decision: "pending", note: "", currentForParameters: true },
    methodologicalNote: elements.analysisMode.value === "population-spike"
      ? "Perfil POPS experimental para espiga poblacional extracelular; puntos y confianza requieren validación experta."
      : "Los eventos exportados son candidatos de artefacto y requieren validación experta.",
  };
  const blob = new Blob([JSON.stringify(configuration, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const sourceName = state.source?.type === "demo" ? "demo_potencial_campo.xlsx" : state.workbook?.fileName;
  const sheetName = state.source?.type === "demo" ? "Demostración" : state.workbook?.sheets[Number(elements.sheetSelect.value)]?.name;
  const signalName = elements.signalSelect.selectedOptions[0]?.textContent;
  link.download = `${buildTraceExportBaseName(sourceName, sheetName, signalName)}_config.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function exportExcel() {
  if (!state.result) return;
  elements.excelButton.disabled = true;
  elements.excelButton.textContent = "Preparando…";
  try {
    const demo = state.source.type === "demo";
    const sheet = demo ? null : state.workbook.sheets[Number(elements.sheetSelect.value)];
    await exportAnalysisWorkbook({
      fileName: demo ? "demo_potencial_campo.xlsx" : state.workbook.fileName,
      sheetName: demo ? "Demostración" : sheet.name,
      timeHeader: elements.timeSelect.selectedOptions[0]?.textContent,
      signalHeader: elements.signalSelect.selectedOptions[0]?.textContent,
      result: state.result,
      fieldResult: state.fieldResult,
      settings: { ...currentSettings(), popsExportScope: "active" },
      review: currentTraceReview() ? {
        ...currentTraceReview(),
        currentForParameters: isReviewCurrent(currentTraceReview(), analysisFingerprint()),
      } : { decision: "pending", note: "", reviewedAt: null, currentForParameters: true },
    });
  } catch (error) {
    console.error(error);
    window.alert(`No fue posible exportar el libro: ${error.message}`);
  } finally {
    elements.excelButton.disabled = false;
    elements.excelButton.textContent = "Exportar Excel";
  }
}

elements.fileInput.addEventListener("change", () => openFile(elements.fileInput.files[0]));
elements.demoButton.addEventListener("click", loadDemo);
elements.sheetSelect.addEventListener("change", () => {
  persistDraftNote();
  activateSheet(Number(elements.sheetSelect.value));
});
elements.timeSelect.addEventListener("change", () => {
  if (state.source?.type === "workbook") {
    const sheet = state.workbook.sheets[Number(elements.sheetSelect.value)];
    const timeIndex = Number(elements.timeSelect.value);
    const previousSignalIndex = Number(elements.signalSelect.value);
    fillSignalSelect(sheet, timeIndex, previousSignalIndex);
    state.inferredTimeUnit = guessTimeUnit(columnValues(sheet, timeIndex), sheet.headers[timeIndex]);
    const labels = { s: "segundos (s)", ms: "milisegundos (ms)", us: "microsegundos (µs)" };
    elements.timeUnit.querySelector('option[value="auto"]').textContent = `automática · ${labels[state.inferredTimeUnit]}`;
  }
  updateSignalScopeHint();
  analyzeCurrentSelection();
});
elements.signalSelect.addEventListener("change", () => {
  persistDraftNote();
  updateSignalScopeHint();
  analyzeCurrentSelection();
});
elements.timeUnit.addEventListener("change", analyzeCurrentSelection);
elements.plotView.addEventListener("change", () => {
  if (state.result) renderResult(state.result, state.fieldResult);
});
elements.signalUnit.addEventListener("change", analyzeCurrentSelection);
elements.analysisMode.addEventListener("change", () => {
  setAnalysisModeUi();
  analyzeCurrentSelection();
});
elements.popsProfile.addEventListener("change", () => {
  applyPopsProfile();
  updateSignalScopeHint();
  analyzeCurrentSelection();
});
elements.popsExportScope.addEventListener("change", updateSignalScopeHint);
elements.sensitivity.addEventListener("input", () => {
  elements.sensitivityOutput.value = `${elements.sensitivity.value} MAD`;
  analyzeCurrentSelection();
});
elements.refractory.addEventListener("change", analyzeCurrentSelection);
elements.saturationMin.addEventListener("change", analyzeCurrentSelection);
elements.saturationMax.addEventListener("change", analyzeCurrentSelection);
for (const control of [
  elements.popsSmoothing,
  elements.popsArtifactThreshold,
  elements.popsArtifactDistance,
  elements.popsProminence,
  elements.p1Start,
  elements.p1End,
  elements.p2Start,
  elements.p2End,
  elements.p3Start,
  elements.p3End,
]) {
  control.addEventListener("change", analyzeCurrentSelection);
}
elements.configButton.addEventListener("click", exportConfiguration);
elements.excelButton.addEventListener("click", exportExcel);
elements.signalPrevious.addEventListener("click", () => navigateSignal(-1));
elements.signalNext.addEventListener("click", () => navigateSignal(1));
elements.tracePrevious.addEventListener("click", () => navigateSignal(-1));
elements.traceNext.addEventListener("click", () => navigateSignal(1));
elements.reviewPending.addEventListener("click", () => storeCurrentReview("pending"));
elements.reviewReject.addEventListener("click", () => storeCurrentReview("rejected", { advance: true }));
elements.reviewAccept.addEventListener("click", () => storeCurrentReview("accepted", { advance: true }));

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
  });
}
elements.dropZone.addEventListener("drop", (event) => openFile(event.dataTransfer.files[0]));
setAnalysisModeUi();
