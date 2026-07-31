/** Infer display defaults only; the user can always override units and method. */
export function guessTimeUnit(values, header = "") {
  const normalizedHeader = header.toLowerCase();
  if (/µs|\bus\b|microseg/.test(normalizedHeader)) return "us";
  if (/\bms\b|miliseg/.test(normalizedHeader)) return "ms";
  if (/\(s\)|segundo|seconds?/.test(normalizedHeader)) return "s";

  const numeric = values
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(Number)
    .filter(Number.isFinite);
  if (numeric.length < 3) return "ms";
  const deltas = numeric
    .slice(1)
    .map((value, index) => value - numeric[index])
    .filter((delta) => delta > 0)
    .sort((a, b) => a - b);
  const medianDelta = deltas[Math.floor(deltas.length / 2)];
  const duration = numeric.at(-1) - numeric[0];
  return medianDelta < 0.01 && duration <= 100 ? "s" : "ms";
}

export function suggestWorkbookAnalysis(workbook) {
  const fileName = workbook.fileName.toLowerCase();
  const frequencySheets = workbook.sheets.length > 0 && workbook.sheets.every((sheet) => /\b\d+\s*hz\b/i.test(sheet.name));
  const isPairedPops = /popspikes|pops[_\s-]?[ab]\b/i.test(fileName);
  const isTrainPops = /ps[_\s-]?frequenc|frecuenc/i.test(fileName) || frequencySheets;

  if (isPairedPops) {
    return {
      mode: "population-spike",
      profile: "paired",
      exportScope: "workbook",
      message: "POPS de dos estímulos aplicado automáticamente",
    };
  }
  if (isTrainPops) {
    return {
      mode: "population-spike",
      profile: "train",
      exportScope: "workbook",
      message: "POPS de tren de estímulos aplicado automáticamente",
    };
  }
  return {
    mode: "preliminary",
    profile: "train",
    exportScope: "active",
    message: "Inspección preliminar aplicada",
  };
}

/** Detects a likely unit mismatch without assuming a particular acquisition system. */
export function isImplausibleTimeScale(stats) {
  if (!stats) return false;
  return stats.sampleRateHz > 1_000_000 || (stats.validRows > 1000 && stats.durationMs < 10);
}

/** Keeps original workbook indices while removing the active time column. */
export function signalColumnChoices(headers, timeIndex) {
  return headers
    .map((header, index) => ({ header, index }))
    .filter(({ index }) => index !== timeIndex);
}
