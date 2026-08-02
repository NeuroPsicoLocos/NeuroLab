import { measurePspEvent } from "../apps/electrophysiology-lab/src/core/currentClamp.js";
import { generatePspScenario } from "../apps/electrophysiology-lab/src/core/pspScenario.js";

const amplitudesMv = [0, 0.5, 1, 2, 4];
const noiseLevelsMv = [0.05, 0.12, 0.25];
const scenariosPerCondition = 30;

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function rounded(value, digits = 3) {
  return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(digits));
}

const rows = [];
for (const noiseStdMv of noiseLevelsMv) {
  for (const requestedAmplitudeMv of amplitudesMv) {
    let detectedCount = 0;
    const amplitudeErrorsMv = [];
    const peakLatencyErrorsMs = [];
    const onsetLatencyErrorsMs = [];

    for (let seed = 1; seed <= scenariosPerCondition; seed += 1) {
      const scenario = generatePspScenario({
        seed: `benchmark-${noiseStdMv}-${requestedAmplitudeMv}-${seed}`,
        sweepCount: 1,
        noiseStdMv,
        response: requestedAmplitudeMv === 0 ? { kind: "none" } : { amplitudeMv: requestedAmplitudeMv },
      });
      const truth = scenario.groundTruth.sweeps[0].events[0];
      const result = measurePspEvent(scenario.timeMs, scenario.sweeps[0].voltageMv, truth.stimulusTimeMs);
      if (!result.detected) continue;
      detectedCount += 1;
      if (requestedAmplitudeMv > 0) {
        amplitudeErrorsMv.push(Math.abs(result.metrics.signedAmplitudeMv - truth.amplitudeMv));
        peakLatencyErrorsMs.push(Math.abs(result.points.peak.timeMs - truth.peakTimeMs));
        onsetLatencyErrorsMs.push(Math.abs(result.points.onset.timeMs - truth.onsetTimeMs));
      }
    }

    rows.push({
      noiseStdMv,
      requestedAmplitudeMv,
      n: scenariosPerCondition,
      detected: detectedCount,
      sensitivity: requestedAmplitudeMv === 0 ? null : rounded(detectedCount / scenariosPerCondition),
      falsePositiveRate: requestedAmplitudeMv === 0 ? rounded(detectedCount / scenariosPerCondition) : null,
      meanAbsoluteAmplitudeErrorMv: rounded(mean(amplitudeErrorsMv)),
      meanAbsolutePeakLatencyErrorMs: rounded(mean(peakLatencyErrorsMs)),
      meanAbsoluteOnsetLatencyErrorMs: rounded(mean(onsetLatencyErrorsMs)),
    });
  }
}

const report = {
  schema: "simulab-psp-detector-benchmark-0.1",
  generatedBy: "scripts/benchmark-psp-detector.mjs",
  model: "deterministic synthetic current-clamp PSP scenarios",
  scenariosPerCondition,
  totalScenarios: rows.length * scenariosPerCondition,
  note: "Validación sintética del software; no sustituye registros reales ni anotación experta.",
  rows,
};

if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else {
  console.table(rows);
  console.log(`Total: ${report.totalScenarios} escenarios sintéticos deterministas.`);
  console.log(report.note);
}

