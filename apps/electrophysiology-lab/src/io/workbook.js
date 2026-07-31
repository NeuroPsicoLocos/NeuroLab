const SHEETJS_MODULE_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

let sheetJsPromise;

export function loadSheetJs() {
  if (!sheetJsPromise) sheetJsPromise = import(SHEETJS_MODULE_URL);
  return sheetJsPromise;
}

function makeColumnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return `Columna ${name}`;
}

function normalizeRows(rows) {
  const firstMeaningfulIndex = rows.findIndex((row) => row.some((cell) => cell !== null && cell !== ""));
  if (firstMeaningfulIndex < 0) return { headers: [], rows: [] };

  const relevantRows = rows.slice(firstMeaningfulIndex);
  const width = relevantRows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  const firstRow = relevantRows[0];
  const numericCells = firstRow.filter((cell) => Number.isFinite(Number(cell))).length;
  const nonEmptyCells = firstRow.filter((cell) => cell !== null && cell !== "").length;
  const hasHeader = nonEmptyCells > 0 && numericCells < Math.max(1, Math.ceil(nonEmptyCells / 2));

  const headers = Array.from({ length: width }, (_, index) => {
    const value = hasHeader ? firstRow[index] : null;
    return value !== null && value !== undefined && String(value).trim()
      ? String(value).trim()
      : makeColumnName(index);
  });

  return { headers, rows: hasHeader ? relevantRows.slice(1) : relevantRows };
}

export async function parseWorkbook(file, sheetJsModule = null) {
  // Dependency injection keeps parsing testable without network access in CI.
  const XLSX = sheetJsModule ?? await loadSheetJs();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: false, dense: true });
  const sheets = workbook.SheetNames.map((name) => {
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false,
    });
    return { name, ...normalizeRows(rawRows) };
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    sheets,
  };
}

export function columnValues(sheet, columnIndex) {
  return sheet.rows.map((row) => row[columnIndex]);
}

export async function exportAnalysisWorkbook({ fileName, sheetName, timeHeader, signalHeader, result, settings }) {
  const XLSX = await loadSheetJs();
  const summaryRows = [
    ["Campo", "Valor"],
    ["Archivo de origen", fileName],
    ["Hoja de origen", sheetName],
    ["Columna temporal", timeHeader],
    ["Columna de señal", signalHeader],
    ["Estado", result.ok ? "Analizable" : "Excluido"],
    ["Muestras válidas", result.stats.validRows],
    ["Muestras faltantes", result.stats.missingCount],
    ["Frecuencia de muestreo (Hz)", result.stats.sampleRateHz],
    ["Duración (ms)", result.stats.durationMs],
    ["Mínimo", result.stats.minimum],
    ["Máximo", result.stats.maximum],
    ["Pico a pico", result.stats.peakToPeak],
    ["Candidatos de artefacto", result.candidates.length],
  ];
  const eventRows = [
    ["Evento", "Índice", "Tiempo (ms)", "Señal", "Derivada absoluta", "Razón sobre umbral"],
    ...result.candidates.map((candidate, index) => [
      index + 1,
      candidate.index,
      candidate.timeMs,
      candidate.value,
      candidate.score,
      candidate.scoreOverThreshold,
    ]),
  ];
  const flagRows = [
    ["Nivel", "Código", "Descripción"],
    ...result.flags.map((flag) => [flag.level, flag.code, flag.message]),
  ];
  const parameterRows = [
    ["Parámetro", "Valor"],
    ["Versión del esquema", "simulab-ephys-0.1"],
    ["Fecha de exportación (ISO 8601)", new Date().toISOString()],
    ["Unidad temporal de entrada", settings.timeUnit],
    ["Unidad de señal", settings.signalUnit],
    ["Sensibilidad (MAD)", settings.sensitivity],
    ["Periodo refractario (ms)", settings.refractoryMs],
    ["Límite inferior de saturación", settings.saturationMin ?? "No configurado"],
    ["Límite superior de saturación", settings.saturationMax ?? "No configurado"],
    ["Nota metodológica", "Los eventos son candidatos de artefacto; no son puntos fisiológicos validados."],
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Resumen");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(eventRows), "Eventos");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(flagRows), "Control_calidad");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(parameterRows), "Parametros");
  XLSX.writeFileXLSX(workbook, `simulab_${fileName.replace(/\.[^.]+$/, "") || "analisis"}.xlsx`);
}
