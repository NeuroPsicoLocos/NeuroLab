import { analyzeTrace, createDemoTrace } from "./core/signal.js";
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
  sensitivity: document.querySelector("#sensitivity"),
  sensitivityOutput: document.querySelector("#sensitivity-output"),
  refractory: document.querySelector("#refractory"),
  saturationMin: document.querySelector("#saturation-min"),
  saturationMax: document.querySelector("#saturation-max"),
  traceTitle: document.querySelector("#trace-title"),
  configButton: document.querySelector("#config-button"),
  excelButton: document.querySelector("#excel-button"),
  qualityTitle: document.querySelector("#quality-title"),
  qualityList: document.querySelector("#quality-list"),
  metrics: {
    samples: document.querySelector("#metric-samples"),
    rate: document.querySelector("#metric-rate"),
    duration: document.querySelector("#metric-duration"),
    range: document.querySelector("#metric-range"),
    events: document.querySelector("#metric-events"),
  },
};

const plot = new SignalPlot(document.querySelector("#signal-canvas"));
const state = { workbook: null, result: null, source: null };

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

function updateQuality(result) {
  elements.qualityList.replaceChildren();
  if (!result.flags.length) {
    const item = document.createElement("li");
    item.className = "pass";
    item.textContent = "Sin banderas automáticas en la revisión preliminar.";
    elements.qualityList.append(item);
  } else {
    for (const flag of result.flags) {
      const item = document.createElement("li");
      item.className = flag.level;
      item.textContent = flag.message;
      elements.qualityList.append(item);
    }
  }
  elements.qualityTitle.textContent = result.ok ? "Traza analizable con revisión" : "Exclusión automática preliminar";
}

function renderResult(result) {
  const settings = currentSettings();
  state.result = result;
  plot.setData(result, { time: "ms", signal: settings.signalUnit });
  elements.metrics.samples.textContent = formatMetric(result.stats.validRows);
  elements.metrics.rate.textContent = formatMetric(result.stats.sampleRateHz, "Hz");
  elements.metrics.duration.textContent = formatMetric(result.stats.durationMs, "ms");
  elements.metrics.range.textContent = formatMetric(result.stats.peakToPeak, settings.signalUnit);
  elements.metrics.events.textContent = formatMetric(result.candidates.length);
  elements.configButton.disabled = false;
  elements.excelButton.disabled = false;
  updateQuality(result);
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
  renderResult(result);
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
  state.source = { type: "workbook" };
  elements.traceTitle.textContent = `${state.workbook.fileName} · ${sheet.name}`;
  analyzeCurrentSelection();
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
    schema: "simulab-ephys-0.1",
    exportedAt: new Date().toISOString(),
    source: state.source?.type === "demo" ? "synthetic_demo" : state.workbook?.fileName,
    sheet: state.source?.type === "demo" ? "Demostración" : state.workbook?.sheets[Number(elements.sheetSelect.value)]?.name,
    timeColumn: elements.timeSelect.selectedOptions[0]?.textContent,
    signalColumn: elements.signalSelect.selectedOptions[0]?.textContent,
    settings: currentSettings(),
    methodologicalNote: "Los eventos exportados son candidatos de artefacto y requieren validación experta.",
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
    await exportAnalysisWorkbook({
      fileName: demo ? "demo_potencial_campo.xlsx" : state.workbook.fileName,
      sheetName: demo ? "Demostración" : sheet.name,
      timeHeader: elements.timeSelect.selectedOptions[0]?.textContent,
      signalHeader: elements.signalSelect.selectedOptions[0]?.textContent,
      result: state.result,
      settings: currentSettings(),
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
elements.sensitivity.addEventListener("input", () => {
  elements.sensitivityOutput.value = `${elements.sensitivity.value} MAD`;
  analyzeCurrentSelection();
});
elements.refractory.addEventListener("change", analyzeCurrentSelection);
elements.saturationMin.addEventListener("change", analyzeCurrentSelection);
elements.saturationMax.addEventListener("change", analyzeCurrentSelection);
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
