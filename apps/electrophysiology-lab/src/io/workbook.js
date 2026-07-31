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

export async function exportAnalysisWorkbook(
  { fileName, sheetName, timeHeader, signalHeader, result, fieldResult, batchFieldResults = [], settings },
  sheetJsModule = null,
) {
  const XLSX = sheetJsModule ?? await loadSheetJs();
  const populationSources = batchFieldResults.length
    ? batchFieldResults
    : fieldResult
      ? [{ sheetName, signalHeader, fieldResult }]
      : [];
  const exportedPopulationEvents = populationSources.flatMap((source) => source.fieldResult.events);
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
    ["Método fisiológico", fieldResult ? "Espiga poblacional · perfil POPS experimental" : "Inspección preliminar"],
    ["Trazas POPS exportadas", fieldResult ? populationSources.length : "No aplicado"],
    ["Eventos POPS válidos", fieldResult ? exportedPopulationEvents.filter((event) => event.valid).length : "No aplicado"],
    ["Eventos POPS para revisión", fieldResult ? exportedPopulationEvents.filter((event) => event.reviewRequired).length : "No aplicado"],
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
    ["Versión del esquema", "simulab-ephys-0.2"],
    ["Fecha de exportación (ISO 8601)", new Date().toISOString()],
    ["Unidad temporal de entrada", settings.timeUnit],
    ["Unidad de señal", settings.signalUnit],
    ["Sensibilidad (MAD)", settings.sensitivity],
    ["Periodo refractario (ms)", settings.refractoryMs],
    ["Límite inferior de saturación", settings.saturationMin ?? "No configurado"],
    ["Límite superior de saturación", settings.saturationMax ?? "No configurado"],
    ["Nota metodológica", "Los eventos son candidatos de artefacto; no son puntos fisiológicos validados."],
  ];

  if (fieldResult) {
    parameterRows.push(
      ["POPS: protocolo", fieldResult.settings.profile === "paired" ? "Dos estímulos · pops_detect" : "Tren de estímulos · High_Fr"],
      ["POPS: suavizado Savitzky–Golay 11/3", fieldResult.settings.smoothing ? "Sí" : "No"],
      ["POPS: umbral de artefacto (unidad de señal/muestra)", fieldResult.settings.artifactThreshold],
      ["POPS: distancia mínima entre artefactos (ms)", fieldResult.settings.minimumArtifactDistanceMs],
      ["POPS: ventana P1 tras estímulo (ms)", `${fieldResult.settings.p1StartMs}–${fieldResult.settings.p1EndMs}`],
      ["POPS: ventana P2 tras P1 (ms)", `${fieldResult.settings.p2StartMs}–${fieldResult.settings.p2EndMs}`],
      ["POPS: ventana P3 tras P2 (ms)", `${fieldResult.settings.p3StartMs}–${fieldResult.settings.p3EndMs}`],
      ["POPS: prominencia mínima P3", fieldResult.settings.p3Prominence],
      ["POPS: interpretación", "Espiga poblacional extracelular; no equivale a EPSP/IPSP de una neurona individual."],
      ["POPS: confianza", "Heurística de revisión 0–100; no es una probabilidad fisiológica."],
      ["POPS: alcance de exportación", settings.popsExportScope ?? "active"],
    );
  }

  const populationSpikeRows = fieldResult
    ? [
      [
        "Hoja", "Traza", "Evento", "Válido", "Artefacto (ms)", "Intervalo previo (ms)",
        "P1 tiempo (ms)", "P1 latencia (ms)", "P1 señal",
        "P2 tiempo (ms)", "P2 latencia (ms)", "P2 señal",
        "P3 tiempo (ms)", "P3 latencia (ms)", "P3 señal",
        "Amplitud espiga poblacional", "Tau 1–2 (ms)", "Tau 2–3 (ms)",
        "Pendiente P1–P3 (unidad/s)", "Línea base", "Sigma robusta base", "SNR",
        "Prominencia P3", "Confianza (0–100)", "Revisión", "Banderas",
      ],
      ...populationSources.flatMap((source) => source.fieldResult.events.map((event) => event.valid
        ? [
          source.sheetName,
          source.signalHeader,
          event.eventNumber,
          "Sí",
          event.artifact.timeMs,
          event.intervalFromPreviousMs,
          event.p1.timeMs,
          event.p1.latencyMs,
          event.p1.value,
          event.p2.timeMs,
          event.p2.latencyMs,
          event.p2.value,
          event.p3.timeMs,
          event.p3.latencyMs,
          event.p3.value,
          event.amplitude,
          event.tau12Ms,
          event.tau23Ms,
          event.slope13PerSecond,
          event.baseline,
          event.baselineSigma,
          event.snr,
          event.p3Prominence,
          event.confidence,
          event.reviewRequired ? "Sí" : "No",
          event.flags.join("; "),
        ]
        : [source.sheetName, source.signalHeader, event.eventNumber, "No", event.artifact.timeMs, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0, "Sí", event.flags.join("; ")])),
    ]
    : null;
  const populationTraceQcRows = fieldResult
    ? [
      ["Hoja", "Traza", "Estado", "Artefactos", "Eventos válidos", "Eventos para revisión", "Banderas"],
      ...populationSources.map((source) => [
        source.sheetName,
        source.signalHeader,
        source.fieldResult.ok ? "Analizable" : "Revisar/excluir",
        source.fieldResult.artifacts.length,
        source.fieldResult.events.filter((event) => event.valid).length,
        source.fieldResult.events.filter((event) => !event.valid || event.reviewRequired).length,
        source.fieldResult.flags.join("; "),
      ]),
    ]
    : null;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Resumen");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(eventRows), "Eventos");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(flagRows), "Control_calidad");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(parameterRows), "Parametros");
  if (populationSpikeRows) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(populationSpikeRows), "Mediciones_POPS");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(populationTraceQcRows), "Trazas_QC");
  }
  XLSX.writeFileXLSX(workbook, `simulab_${fileName.replace(/\.[^.]+$/, "") || "analisis"}.xlsx`);
}
