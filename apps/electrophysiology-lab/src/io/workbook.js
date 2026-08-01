const SHEETJS_MODULE_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

let sheetJsPromise;

export function loadSheetJs() {
  if (globalThis.XLSX) return Promise.resolve(globalThis.XLSX);
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

function safeFilePart(value, stripExtension = false) {
  const normalized = String(value ?? "");
  return (stripExtension ? normalized.replace(/\.[^.]+$/, "") : normalized)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sin-nombre";
}

export function buildTraceExportBaseName(fileName, sheetName, signalHeader) {
  return `simulab_${safeFilePart(fileName, true)}_${safeFilePart(sheetName)}_${safeFilePart(signalHeader)}`;
}

export async function exportAnalysisWorkbook(
  { fileName, sheetName, timeHeader, signalHeader, result, fieldResult, settings, review = null },
  sheetJsModule = null,
) {
  const XLSX = sheetJsModule ?? await loadSheetJs();
  const populationSources = fieldResult ? [{ sheetName, signalHeader, fieldResult }] : [];
  const exportedPopulationEvents = populationSources.flatMap((source) => source.fieldResult.events);
  const automaticState = review?.automaticState
    ?? (fieldResult ? (fieldResult.ok ? "Analizable" : "Revisar/excluir") : result.ok ? "Analizable" : "Excluido");
  const reviewDecision = review?.decision ?? "pending";
  const pointCorrections = review?.pointCorrections ?? {};
  const correctionHistory = review?.correctionHistory ?? [];
  const correctedPointCount = Object.values(pointCorrections)
    .reduce((count, correction) => count + Object.keys(correction?.points ?? {}).length, 0);
  const reviewLabels = { accepted: "Aceptada", rejected: "Rechazada", pending: "Pendiente" };
  const reviewIsCurrent = review?.currentForParameters !== false;
  const finalState = reviewDecision === "rejected"
    ? "Rechazado manualmente"
    : reviewDecision === "accepted" && reviewIsCurrent
      ? "Aceptado manualmente"
      : reviewDecision === "accepted"
        ? "Revisar: parámetros cambiaron"
        : automaticState;
  const summaryRows = [
    ["Campo", "Valor"],
    ["Archivo de origen", fileName],
    ["Hoja de origen", sheetName],
    ["Columna temporal", timeHeader],
    ["Columna de señal", signalHeader],
    ["Estado", finalState],
    ["Estado automático", automaticState],
    ["Decisión de revisión manual", reviewLabels[reviewDecision] ?? "Pendiente"],
    ["Revisión vigente para estos parámetros", reviewIsCurrent ? "Sí" : "No"],
    ["Nota de revisión manual", review?.note ?? ""],
    ["Fecha de revisión manual (ISO 8601)", review?.reviewedAt ?? "No revisada"],
    ["Muestras válidas", result.stats.validRows],
    ["Muestras faltantes", result.stats.missingCount],
    ["Frecuencia de muestreo (Hz)", result.stats.sampleRateHz],
    ["Duración (ms)", result.stats.durationMs],
    ["Mínimo", result.stats.minimum],
    ["Máximo", result.stats.maximum],
    ["Pico a pico", result.stats.peakToPeak],
    ["Candidatos preliminares de derivada", result.candidates.length],
    ["Método fisiológico", fieldResult ? "Espiga poblacional · perfil POPS experimental" : "Inspección preliminar"],
    ["Trazas POPS exportadas", fieldResult ? populationSources.length : "No aplicado"],
    ["Eventos POPS válidos", fieldResult ? exportedPopulationEvents.filter((event) => event.valid).length : "No aplicado"],
    ["Eventos POPS para revisión", fieldResult ? exportedPopulationEvents.filter((event) => !event.valid || event.reviewRequired).length : "No aplicado"],
    ["Puntos POPS corregidos manualmente", fieldResult ? correctedPointCount : "No aplicado"],
    ["Acciones en historial de corrección", fieldResult ? correctionHistory.length : "No aplicado"],
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
    ...(result.flags.length
      ? result.flags.map((flag) => [flag.level, flag.code, flag.message])
      : [["pass", "sin_incidencias", "Sin incidencias automáticas de calidad para esta traza."]]),
  ];
  const parameterRows = [
    ["Parámetro", "Valor"],
    ["Versión del esquema", "simulab-ephys-0.5"],
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
        "Origen de puntos", "P1 automático (ms)", "P1 corregido (ms)",
        "P2 automático (ms)", "P2 corregido (ms)", "P3 automático (ms)",
        "P3 corregido (ms)", "Corrección actualizada (ISO 8601)",
      ],
      ...populationSources.flatMap((source) => source.fieldResult.events.map((event) => [
        source.sheetName,
        source.signalHeader,
        event.eventNumber,
        event.valid ? "Sí" : "No",
        event.artifact.timeMs,
        event.intervalFromPreviousMs ?? null,
        event.p1?.timeMs ?? null,
        event.p1?.latencyMs ?? null,
        event.p1?.value ?? null,
        event.p2?.timeMs ?? null,
        event.p2?.latencyMs ?? null,
        event.p2?.value ?? null,
        event.p3?.timeMs ?? null,
        event.p3?.latencyMs ?? null,
        event.p3?.value ?? null,
        event.amplitude ?? null,
        event.tau12Ms ?? null,
        event.tau23Ms ?? null,
        event.slope13PerSecond ?? null,
        event.baseline ?? null,
        event.baselineSigma ?? null,
        event.snr ?? null,
        event.p3Prominence ?? null,
        event.confidence ?? null,
        !event.valid || event.reviewRequired ? "Sí" : "No",
        event.flags.join("; "),
        event.manualCorrection ? "Manual corregido" : "Automático",
        event.automaticPoints?.p1?.timeMs ?? event.p1?.timeMs ?? null,
        event.correctedPointNames?.includes("p1") ? event.p1?.timeMs ?? null : null,
        event.automaticPoints?.p2?.timeMs ?? event.p2?.timeMs ?? null,
        event.correctedPointNames?.includes("p2") ? event.p2?.timeMs ?? null : null,
        event.automaticPoints?.p3?.timeMs ?? event.p3?.timeMs ?? null,
        event.correctedPointNames?.includes("p3") ? event.p3?.timeMs ?? null : null,
        event.correctionUpdatedAt ?? null,
      ])),
    ]
    : null;
  const populationTraceQcRows = fieldResult
    ? [
      ["Hoja", "Traza", "Estado automático", "Artefactos", "Eventos válidos", "Eventos para revisión", "Banderas", "Decisión manual", "Nota manual", "Fecha de revisión", "Parámetros vigentes", "Puntos corregidos"],
      ...populationSources.map((source) => [
        source.sheetName,
        source.signalHeader,
        automaticState,
        source.fieldResult.artifacts.length,
        source.fieldResult.events.filter((event) => event.valid).length,
        source.fieldResult.events.filter((event) => !event.valid || event.reviewRequired).length,
        source.fieldResult.flags.join("; "),
        reviewLabels[reviewDecision] ?? "Pendiente",
        review?.note ?? "",
        review?.reviewedAt ?? "",
        reviewIsCurrent ? "Sí" : "No",
        correctedPointCount,
      ]),
    ]
    : null;
  const manualReviewRows = [
    ["Hoja", "Traza", "Decisión", "Nota", "Fecha (ISO 8601)", "Modo de análisis", "Estado automático al revisar", "Vigente para parámetros exportados", "Eventos corregidos", "Puntos corregidos"],
    [
      sheetName,
      signalHeader,
      reviewLabels[reviewDecision] ?? "Pendiente",
      review?.note ?? "",
      review?.reviewedAt ?? "",
      review?.analysisMode ?? "",
      review?.automaticState ?? automaticState,
      reviewIsCurrent ? "Sí" : "No",
      Object.keys(pointCorrections).length,
      correctedPointCount,
    ],
  ];

  const correctionRows = [
    ["Hoja", "Traza", "Vigente para parámetros exportados", "Evento", "Punto", "Índice automático", "Tiempo automático (ms)", "Señal automática", "Índice corregido", "Tiempo corregido (ms)", "Señal corregida", "Fecha (ISO 8601)"],
    ...Object.entries(pointCorrections).flatMap(([eventNumber, correction]) => {
      const event = fieldResult?.events.find((candidate) => String(candidate.eventNumber) === String(eventNumber));
      return Object.entries(correction?.points ?? {}).map(([pointName, point]) => {
        const automaticPoint = event?.automaticPoints?.[pointName] ?? (event?.manualCorrection ? null : event?.[pointName]);
        const correctedPoint = reviewIsCurrent ? event?.[pointName] : null;
        return [
          sheetName,
          signalHeader,
          reviewIsCurrent ? "Sí" : "No",
          Number(eventNumber),
          pointName.toUpperCase(),
          point.automaticIndex ?? automaticPoint?.index ?? null,
          automaticPoint?.timeMs ?? null,
          automaticPoint?.value ?? null,
          point.correctedIndex,
          correctedPoint?.timeMs ?? null,
          correctedPoint?.value ?? null,
          point.correctedAt ?? correction.updatedAt ?? review?.correctionsUpdatedAt ?? "",
        ];
      });
    }),
  ];
  const correctionHistoryRows = [
    ["Hoja", "Traza", "Acción", "Evento", "Punto", "Índice automático", "Índice corregido anterior", "Índice corregido nuevo", "Puntos restaurados", "Fecha (ISO 8601)"],
    ...correctionHistory.map((entry) => [
      sheetName,
      signalHeader,
      entry.action ?? "",
      entry.eventNumber ?? "",
      entry.pointName?.toUpperCase() ?? "",
      entry.automaticIndex ?? "",
      entry.previousCorrectedIndex ?? "",
      entry.correctedIndex ?? "",
      entry.restoredPointCount ?? "",
      entry.at ?? "",
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Resumen");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(eventRows), "Candidatos_derivada");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(flagRows), "Control_calidad");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(parameterRows), "Parametros");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(manualReviewRows), "Revision_manual");
  if (populationSpikeRows) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(populationSpikeRows), "Mediciones_POPS");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(populationTraceQcRows), "Trazas_QC");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(correctionRows), "Correcciones_POPS");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(correctionHistoryRows), "Historial_POPS");
  }
  XLSX.writeFileXLSX(workbook, `${buildTraceExportBaseName(fileName, sheetName, signalHeader)}.xlsx`);
}
