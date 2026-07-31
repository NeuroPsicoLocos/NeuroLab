function range(values) {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
  }
  return { minimum, maximum };
}

function formatNumber(value) {
  const absolute = Math.abs(value);
  if (absolute >= 1000 || (absolute > 0 && absolute < 0.01)) return value.toExponential(2);
  return value.toFixed(absolute >= 10 ? 1 : 2);
}

export class SignalPlot {
  constructor(canvas) {
    this.canvas = canvas;
    this.result = null;
    this.units = { time: "ms", signal: "mV" };
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(canvas);
  }

  setData(result, units = this.units) {
    this.result = result;
    this.units = units;
    this.draw();
  }

  clear() {
    this.result = null;
    this.draw();
  }

  draw() {
    const canvas = this.canvas;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(320, bounds.width);
    const height = Math.max(260, bounds.height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const context = canvas.getContext("2d");
    context.scale(pixelRatio, pixelRatio);
    context.clearRect(0, 0, width, height);

    context.fillStyle = "#fbfaf5";
    context.fillRect(0, 0, width, height);

    if (!this.result?.timeMs.length) {
      context.fillStyle = "#687675";
      context.font = "500 15px system-ui";
      context.textAlign = "center";
      context.fillText("Importa un archivo o carga la demostración", width / 2, height / 2);
      return;
    }

    const {
      timeMs,
      signal,
      candidates = [],
      processedSignal = null,
      responseEvents = [],
    } = this.result;
    const margins = { top: 20, right: 20, bottom: 42, left: 62 };
    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;
    const timeRange = range(timeMs);
    const signalRange = range(signal);
    const signalPadding = Math.max((signalRange.maximum - signalRange.minimum) * 0.08, 1e-9);
    const yMinimum = signalRange.minimum - signalPadding;
    const yMaximum = signalRange.maximum + signalPadding;
    const xScale = (value) =>
      margins.left + ((value - timeRange.minimum) / (timeRange.maximum - timeRange.minimum || 1)) * plotWidth;
    const yScale = (value) => margins.top + ((yMaximum - value) / (yMaximum - yMinimum || 1)) * plotHeight;

    context.strokeStyle = "#dfe5df";
    context.lineWidth = 1;
    context.fillStyle = "#687675";
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

      const xValue = timeRange.minimum + (step / 5) * (timeRange.maximum - timeRange.minimum);
      const yValue = yMaximum - (step / 5) * (yMaximum - yMinimum);
      context.textAlign = "center";
      context.fillText(formatNumber(xValue), x, height - 20);
      context.textAlign = "right";
      context.fillText(formatNumber(yValue), margins.left - 9, y + 4);
    }

    context.save();
    context.beginPath();
    context.rect(margins.left, margins.top, plotWidth, plotHeight);
    context.clip();
    // At most two points per horizontal pixel keeps large workbooks responsive.
    const stride = Math.max(1, Math.floor(signal.length / Math.max(plotWidth * 2, 1)));
    const drawTrace = (values, color, lineWidth) => {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.beginPath();
      for (let index = 0; index < values.length; index += stride) {
        const x = xScale(timeMs[index]);
        const y = yScale(values[index]);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    };
    if (processedSignal) drawTrace(signal, "rgba(105, 122, 119, 0.5)", 0.9);
    drawTrace(processedSignal ?? signal, "#126d67", 1.35);

    for (const candidate of candidates) {
      const x = xScale(candidate.timeMs);
      context.strokeStyle = "rgba(218, 107, 57, 0.7)";
      context.setLineDash([4, 4]);
      context.beginPath();
      context.moveTo(x, margins.top);
      context.lineTo(x, margins.top + plotHeight);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = "#da6b39";
      context.beginPath();
      context.arc(x, yScale(candidate.value), 3.5, 0, Math.PI * 2);
      context.fill();
    }

    const pointStyles = {
      p1: { color: "#d99a32", label: "1" },
      p2: { color: "#2b8a64", label: "2" },
      p3: { color: "#b64b4b", label: "3" },
    };
    for (const event of responseEvents) {
      if (!event.valid) continue;
      for (const pointName of ["p1", "p2", "p3"]) {
        const point = event[pointName];
        const style = pointStyles[pointName];
        const x = xScale(point.timeMs);
        const y = yScale(point.value);
        context.fillStyle = style.color;
        context.strokeStyle = "#fffef9";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(x, y, 4.3, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = style.color;
        context.font = "800 9px system-ui";
        context.textAlign = "center";
        context.fillText(style.label, x, y - 7);
      }
    }
    context.restore();

    context.fillStyle = "#344745";
    context.font = "600 12px system-ui";
    context.textAlign = "center";
    context.fillText(`Tiempo (${this.units.time})`, margins.left + plotWidth / 2, height - 3);
    context.save();
    context.translate(14, margins.top + plotHeight / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(`Señal (${this.units.signal})`, 0, 0);
    context.restore();
  }
}
