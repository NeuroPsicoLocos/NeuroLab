function numericRange(values) {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
  }
  return { minimum, maximum };
}

function formatTick(value) {
  const absolute = Math.abs(value);
  if (absolute >= 1000 || (absolute > 0 && absolute < 0.01)) return value.toExponential(1);
  return value.toFixed(absolute >= 10 ? 1 : 2);
}

function nearestIndex(values, target) {
  let low = 0;
  let high = values.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] < target) low = middle + 1;
    else high = middle;
  }
  const previous = Math.max(0, low - 1);
  return Math.abs(values[previous] - target) <= Math.abs(values[low] - target) ? previous : low;
}

export class PspPlot {
  constructor(canvas) {
    this.canvas = canvas;
    this.data = null;
    this.layout = null;
    this.selectionHandler = null;
    this.canvas.addEventListener("pointerdown", (event) => this.handleSelection(event));
    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(() => this.draw());
      this.resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", () => this.draw());
    }
  }

  setData(data) {
    this.data = data;
    this.draw();
  }

  onSelect(handler) {
    this.selectionHandler = typeof handler === "function" ? handler : null;
  }

  handleSelection(event) {
    if (!this.selectionHandler || !this.layout || !this.data?.timeMs?.length) return;
    const bounds = this.canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const { margins, plotWidth, plotHeight, timeRange } = this.layout;
    if (x < margins.left || x > margins.left + plotWidth || y < margins.top || y > margins.top + plotHeight) return;
    const target = timeRange.minimum + ((x - margins.left) / plotWidth) * (timeRange.maximum - timeRange.minimum);
    const index = nearestIndex(this.data.timeMs, target);
    this.selectionHandler({ index, timeMs: this.data.timeMs[index], voltageMv: this.data.voltageMv[index] });
  }

  draw() {
    const bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(320, bounds.width);
    const height = Math.max(280, bounds.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    const context = this.canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#fbfaf5";
    context.fillRect(0, 0, width, height);

    if (!this.data?.timeMs?.length) {
      context.fillStyle = "#657572";
      context.font = "500 15px system-ui";
      context.textAlign = "center";
      context.fillText("Genera un escenario para comenzar", width / 2, height / 2);
      return;
    }

    const { timeMs, voltageMv, stimulusTimesMs = [], analyses = [], showAnalysis = false, selectedSample = null } = this.data;
    const margins = { top: 20, right: 22, bottom: 44, left: 65 };
    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;
    const timeRange = { minimum: timeMs[0], maximum: timeMs[timeMs.length - 1] };
    const voltageRange = numericRange(voltageMv);
    const padding = Math.max((voltageRange.maximum - voltageRange.minimum) * 0.09, 0.05);
    const yMinimum = voltageRange.minimum - padding;
    const yMaximum = voltageRange.maximum + padding;
    const xScale = (value) => margins.left + ((value - timeRange.minimum) / (timeRange.maximum - timeRange.minimum || 1)) * plotWidth;
    const yScale = (value) => margins.top + ((yMaximum - value) / (yMaximum - yMinimum || 1)) * plotHeight;
    this.layout = { margins, plotWidth, plotHeight, timeRange };

    context.strokeStyle = "#dfe5df";
    context.lineWidth = 1;
    context.fillStyle = "#657572";
    context.font = "12px system-ui";
    for (let step = 0; step <= 5; step += 1) {
      const x = margins.left + (step / 5) * plotWidth;
      const y = margins.top + (step / 5) * plotHeight;
      context.beginPath();
      context.moveTo(x, margins.top);
      context.lineTo(x, margins.top + plotHeight);
      context.moveTo(margins.left, y);
      context.lineTo(margins.left + plotWidth, y);
      context.stroke();
      context.textAlign = "center";
      context.fillText(formatTick(timeRange.minimum + (step / 5) * (timeRange.maximum - timeRange.minimum)), x, height - 20);
      context.textAlign = "right";
      context.fillText(formatTick(yMaximum - (step / 5) * (yMaximum - yMinimum)), margins.left - 9, y + 4);
    }

    context.save();
    context.beginPath();
    context.rect(margins.left, margins.top, plotWidth, plotHeight);
    context.clip();

    for (const stimulusTimeMs of stimulusTimesMs) {
      const artifactStart = xScale(stimulusTimeMs - 0.5);
      const artifactEnd = xScale(stimulusTimeMs + 1.5);
      context.fillStyle = "rgba(218,107,57,.10)";
      context.fillRect(artifactStart, margins.top, Math.max(2, artifactEnd - artifactStart), plotHeight);
      context.strokeStyle = "rgba(218,107,57,.75)";
      context.setLineDash([5, 4]);
      context.beginPath();
      context.moveTo(xScale(stimulusTimeMs), margins.top);
      context.lineTo(xScale(stimulusTimeMs), margins.top + plotHeight);
      context.stroke();
      context.setLineDash([]);
    }

    const stride = Math.max(1, Math.floor(voltageMv.length / Math.max(1, plotWidth * 2)));
    context.strokeStyle = "#126d67";
    context.lineWidth = 1.35;
    context.beginPath();
    for (let index = 0; index < voltageMv.length; index += stride) {
      const x = xScale(timeMs[index]);
      const y = yScale(voltageMv[index]);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    if (showAnalysis) {
      const pointStyles = {
        onset: { color: "#2b8a64", label: "I" },
        peak: { color: "#b64b4b", label: "P" },
        return: { color: "#7b6aa5", label: "R" },
      };
      for (const analysis of analyses) {
        for (const pointName of ["onset", "peak", "return"]) {
          const point = analysis.points?.[pointName];
          if (!point) continue;
          const style = pointStyles[pointName];
          const x = xScale(point.timeMs);
          const y = yScale(point.rawVoltageMv);
          context.fillStyle = style.color;
          context.strokeStyle = "#fffef9";
          context.lineWidth = 1.5;
          context.beginPath();
          context.arc(x, y, 4.5, 0, Math.PI * 2);
          context.fill();
          context.stroke();
          context.fillStyle = style.color;
          context.font = "800 10px system-ui";
          context.textAlign = "center";
          context.fillText(style.label, x, y - 8);
        }
      }
    }

    if (selectedSample) {
      const x = xScale(selectedSample.timeMs);
      const y = yScale(selectedSample.voltageMv);
      context.fillStyle = "#cf9633";
      context.strokeStyle = "#10282a";
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(x, y, 6, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
    context.restore();

    context.fillStyle = "#344745";
    context.font = "600 12px system-ui";
    context.textAlign = "center";
    context.fillText("Tiempo (ms)", margins.left + plotWidth / 2, height - 3);
    context.save();
    context.translate(15, margins.top + plotHeight / 2);
    context.rotate(-Math.PI / 2);
    context.fillText("Voltaje (mV)", 0, 0);
    context.restore();
  }
}
