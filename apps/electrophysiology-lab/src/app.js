import { analyzeTrace, createDemoTrace } from "./core/signal.js";
import {
  LEGACY_POPS_PROFILE,
  PAIRED_POPS_PROFILE,
  measurePopulationSpikes,
} from "./core/fieldPotential.js";
import { columnValues, exportAnalysisWorkbook, parseWorkbook } from "./io/workbook.js";
import { SignalPlot } from "./ui/plot.js";

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  demoButton: document.querySelector("#demo-button"),
  fileStatus: document.querySelector("#file-status"),
  sheetSelect: document.querySelector("#sheet-select"),
  timeSelect: document.querySelector("#time-select"),
  signalSelect: document.querySelector("#signal-select"),
  timeUnit: document.querySelector("#time-unit"),
  signalUnit: document.querySelector("#signal-unit"),
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
  configButton: document.querySelector("#config-button"),
  excelButton: document.querySelector("#excel-button"),
  qualityTitle: document.querySelector("#quality-title"),
  qualityList: document.querySelector("#quality-list"),
  eventTableCard: document.querySelector("#event-table-card"),
  eventTableBody: document.querySelector("#event-table-body"),
  metrics: {
    samples: document.querySelector("#metric-samples"),
    rate: document.querySelector("#metric-rate"),
    duration: document.querySelector("#metric-duration"),
    range: document.querySelector("#metric-range"),
    events: document.querySelector("#metric-events"),
  },
};

const plot = new SignalPlot(document.querySelector("#signal-canvas"));
const state = { workbook: null, result: null, fieldResult: null, source: null };

function numericOrUndefined(value) {
  if (value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function currentSettings() {
  return {
    timeUnit: elements.timeUnit.value,
    signalUnit: elements.signalUnit.value.trim() || "unidad arbitraria",
    sensitivity: Number(elements.sensitivity.value),
    refractoryMs: Math.max(0, Number(elements.refractory.value) || 0),
    saturationMin: numericOrUndefined(elements.saturationMin.value),
    saturationMax: numericOrUndefined(elements.saturationMax.value),
  };
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

function convertTimeToMilliseconds(values, unit) {
  const factor = unit === "s" ? 1000 : unit === "us" ? 0.001 : 1;
  return values.map((value) => {
    if (value === null || value === undefined || value === "") return value;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric * factor : value;
  });
}

function guessTimeUnit(values, header = "") {
  const normalizedHeader = header.toLowerCase();
  if (/µs|\bus\b|microseg/.test(normalizedHeader)) return "us";
  if (/\bms\b|miliseg/.test(normalizedHeader)) return "ms";
  if (/\(s\)|segundo|seconds?/.test(normalizedHeader)) return "s";

  const numeric = values.map(Number).filter(Number.isFinite);
  if (numeric.length < 3) return "ms";
  const deltas = numeric.slice(1).map((value, index) => value - numeric[index]).filter((delta) => delta > 0).sort((a, b) => a - b);
  const medianDelta = deltas[Math.floor(deltas.length / 2)];
  const duration = numeric.at(-1) - numeric[0];
  // A sub-0.01 interval over a recording shorter than 100 units is usually a
  // seconds axis in electrophysiology (e.g. 0.0001 s at 10 kHz).
  return medianDelta < 0.01 && duration <= 100 ? "s" : "ms";
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
    if (reviewEvents.length) {
      appendQualityItem("review", `${reviewEvents.length} de ${validEvents.length} evento(s) requieren revisión de puntos o prominencia.`);
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
    status.textContent = event.valid && !event.reviewRequired ? "Aceptable" : "Revisar";
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
}

function analyzeCurrentSelection() {
  if (!state.source) return;
  const settings = currentSettings();
  let timeValues;
  let signalValues;

  if (state.source.type === "demo") {
    timeValues = state.source.trace.timeMs;
    signalValues = state.source.trace.signal;
  } else {
    const sheet = state.workbook.sheets[Number(elements.sheetSelect.value)];
    timeValues = convertTimeToMilliseconds(columnValues(sheet, Number(elements.timeSelect.value)), settings.timeUnit);
    signalValues = columnValues(sheet, Number(elements.signalSelect.value));
  }

  const result = analyzeTrace(timeValues, signalValues, {
    sensitivity: settings.sensitivity,
    refractoryMs: settings.refractoryMs,
    saturationMin: settings.saturationMin ?? Number.NEGATIVE_INFINITY,
    saturationMax: settings.saturationMax ?? Number.POSITIVE_INFINITY,
  });
  const fieldResult = elements.analysisMode.value === "population-spike" && result.ok
    ? measurePopulationSpikes(result.timeMs, result.signal, currentFieldSettings())
    : null;
  renderResult(result, fieldResult);
}

function fillSelect(select, labels) {
  select.replaceChildren(...labels.map((label, index) => new Option(label, String(index))));
  select.disabled = !labels.length;
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
  fillSelect(elements.signalSelect, sheet.headers);
  const guess = guessColumns(sheet.headers);
  elements.timeSelect.value = String(guess.timeIndex);
  elements.signalSelect.value = String(guess.signalIndex);
  const inferredTimeUnit = guessTimeUnit(columnValues(sheet, guess.timeIndex), sheet.headers[guess.timeIndex]);
  elements.timeUnit.value = inferredTimeUnit;
  state.source = { type: "workbook" };
  elements.traceTitle.textContent = `${state.workbook.fileName} · ${sheet.name}`;
  elements.fileStatus.textContent = `${state.workbook.fileName} · ${(state.workbook.fileSize / 1024).toFixed(1)} kB · unidad temporal sugerida: ${inferredTimeUnit}; confirmar`;
  analyzeCurrentSelection();
}

function analyzeFieldColumn(sheet, timeIndex, signalIndex, timeUnit) {
  const settings = currentSettings();
  const timeValues = convertTimeToMilliseconds(columnValues(sheet, timeIndex), timeUnit);
  const signalValues = columnValues(sheet, signalIndex);
  const result = analyzeTrace(timeValues, signalValues, {
    sensitivity: settings.sensitivity,
    refractoryMs: settings.refractoryMs,
    saturationMin: settings.saturationMin ?? Number.NEGATIVE_INFINITY,
    saturationMax: settings.saturationMax ?? Number.POSITIVE_INFINITY,
  });
  if (!result.ok) return null;
  return {
    result,
    fieldResult: measurePopulationSpikes(result.timeMs, result.signal, currentFieldSettings()),
  };
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

function collectPopulationSpikeExports() {
  if (elements.analysisMode.value !== "population-spike") return [];
  if (state.source.type === "demo") {
    return [{ sheetName: "Demostración", signalHeader: "Potencial (mV)", fieldResult: state.fieldResult }];
  }

  const scope = elements.popsExportScope.value;
  const activeSheetIndex = Number(elements.sheetSelect.value);
  const sheets = scope === "workbook"
    ? state.workbook.sheets.map((sheet, index) => ({ sheet, index }))
    : [{ sheet: state.workbook.sheets[activeSheetIndex], index: activeSheetIndex }];
  const exports = [];

  for (const { sheet, index: sheetIndex } of sheets) {
    const isActiveSheet = sheetIndex === activeSheetIndex;
    const guessed = guessColumns(sheet.headers);
    const timeIndex = isActiveSheet ? Number(elements.timeSelect.value) : guessed.timeIndex;
    const timeUnit = isActiveSheet
      ? elements.timeUnit.value
      : guessTimeUnit(columnValues(sheet, timeIndex), sheet.headers[timeIndex]);
    const signalColumns = scope === "active" && isActiveSheet
      ? [{ header: sheet.headers[Number(elements.signalSelect.value)], index: Number(elements.signalSelect.value) }]
      : numericSignalColumns(sheet, timeIndex);

    for (const signalColumn of signalColumns) {
      const analysis = analyzeFieldColumn(sheet, timeIndex, signalColumn.index, timeUnit);
      if (analysis?.fieldResult) {
        exports.push({
          sheetName: sheet.name,
          signalHeader: signalColumn.header,
          fieldResult: analysis.fieldResult,
        });
      }
    }
  }
  return exports;
}

async function openFile(file) {
  if (!file) return;
  elements.fileStatus.textContent = `Abriendo ${file.name}…`;
  elements.fileStatus.className = "file-status loading";
  try {
    state.workbook = await parseWorkbook(file);
    if (!state.workbook.sheets.some((sheet) => sheet.headers.length >= 2)) {
      throw new Error("No se encontró una hoja con al menos dos columnas.");
    }
    fillSelect(elements.sheetSelect, state.workbook.sheets.map((sheet) => sheet.name));
    const firstUsableSheet = state.workbook.sheets.findIndex((sheet) => sheet.headers.length >= 2);
    elements.sheetSelect.value = String(firstUsableSheet);
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
  state.workbook = null;
  state.source = { type: "demo", trace };
  fillSelect(elements.sheetSelect, ["Demostración"]);
  fillSelect(elements.timeSelect, ["Tiempo (ms)"]);
  fillSelect(elements.signalSelect, ["Potencial (mV)"]);
  elements.sheetSelect.disabled = true;
  elements.timeSelect.disabled = true;
  elements.signalSelect.disabled = true;
  elements.timeUnit.value = "ms";
  elements.signalUnit.value = "mV";
  elements.traceTitle.textContent = "Señal sintética · potencial de campo";
  elements.fileStatus.textContent = "Demostración determinística: 10 estímulos, 10 kHz, 1.1 s.";
  elements.fileStatus.className = "file-status success";
  analyzeCurrentSelection();
}

function exportConfiguration() {
  const configuration = {
    schema: "simulab-ephys-0.2",
    exportedAt: new Date().toISOString(),
    source: state.source?.type === "demo" ? "synthetic_demo" : state.workbook?.fileName,
    sheet: state.source?.type === "demo" ? "Demostración" : state.workbook?.sheets[Number(elements.sheetSelect.value)]?.name,
    timeColumn: elements.timeSelect.selectedOptions[0]?.textContent,
    signalColumn: elements.signalSelect.selectedOptions[0]?.textContent,
    analysisMode: elements.analysisMode.value,
    settings: currentSettings(),
    fieldPotentialSettings: elements.analysisMode.value === "population-spike" ? currentFieldSettings() : null,
    exportScope: elements.analysisMode.value === "population-spike" ? elements.popsExportScope.value : "active",
    methodologicalNote: elements.analysisMode.value === "population-spike"
      ? "Perfil POPS experimental para espiga poblacional extracelular; puntos y confianza requieren validación experta."
      : "Los eventos exportados son candidatos de artefacto y requieren validación experta.",
  };
  const blob = new Blob([JSON.stringify(configuration, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "simulab_electrophysiology_config.json";
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
    const batchFieldResults = collectPopulationSpikeExports();
    await exportAnalysisWorkbook({
      fileName: demo ? "demo_potencial_campo.xlsx" : state.workbook.fileName,
      sheetName: demo ? "Demostración" : sheet.name,
      timeHeader: elements.timeSelect.selectedOptions[0]?.textContent,
      signalHeader: elements.signalSelect.selectedOptions[0]?.textContent,
      result: state.result,
      fieldResult: state.fieldResult,
      batchFieldResults,
      settings: { ...currentSettings(), popsExportScope: elements.popsExportScope.value },
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
elements.sheetSelect.addEventListener("change", () => activateSheet(Number(elements.sheetSelect.value)));
elements.timeSelect.addEventListener("change", analyzeCurrentSelection);
elements.signalSelect.addEventListener("change", analyzeCurrentSelection);
elements.timeUnit.addEventListener("change", analyzeCurrentSelection);
elements.signalUnit.addEventListener("change", analyzeCurrentSelection);
elements.analysisMode.addEventListener("change", () => {
  const isPopulationSpike = elements.analysisMode.value === "population-spike";
  elements.preliminaryControls.hidden = isPopulationSpike;
  elements.popsControls.hidden = !isPopulationSpike;
  analyzeCurrentSelection();
});
elements.popsProfile.addEventListener("change", () => {
  applyPopsProfile();
  analyzeCurrentSelection();
});
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
