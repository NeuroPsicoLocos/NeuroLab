/** Encuadre común para cortes SVG, sin modificar las coordenadas anatómicas. */
export function fitCutViewBox(bounds, fullViewBox, maxZoom = 4) {
  const [fullX, fullY, fullWidth, fullHeight] = fullViewBox;
  const [x, y, width, height] = bounds;
  const ratio = fullWidth / fullHeight;
  const viewWidth = Math.min(fullWidth, Math.max(fullWidth / maxZoom, width * 1.5, height * 1.5 * ratio));
  const viewHeight = viewWidth / ratio;
  return [
    Math.max(fullX, Math.min(fullX + fullWidth - viewWidth, x + width / 2 - viewWidth / 2)),
    Math.max(fullY, Math.min(fullY + fullHeight - viewHeight, y + height / 2 - viewHeight / 2)),
    viewWidth, viewHeight
  ];
}

/** La selección actualiza el encuadre cuando el acercamiento está activo. */
export function setupCutZoom(svg, controls, fullViewBox) {
  let selectedBounds = null, selectedLabel = '', zoomed = false;
  controls.innerHTML = `<button class="secondary-button" data-cut-zoom="in" disabled>Acercar selección</button><button class="secondary-button" data-cut-zoom="out" disabled>Vista completa</button><output aria-live="polite">Vista general</output>`;
  const zoomIn = controls.querySelector('[data-cut-zoom="in"]');
  const zoomOut = controls.querySelector('[data-cut-zoom="out"]');
  const status = controls.querySelector('output');
  function render() {
    const view = zoomed && selectedBounds ? fitCutViewBox(selectedBounds, fullViewBox) : fullViewBox;
    svg.setAttribute('viewBox', view.join(' '));
    zoomIn.disabled = !selectedBounds;
    zoomOut.disabled = !zoomed;
    status.textContent = zoomed ? `${(fullViewBox[2] / view[2]).toFixed(1).replace('.', ',')}× · ${selectedLabel}` : 'Vista general';
  }
  zoomIn.addEventListener('click', () => { zoomed = true; render(); });
  zoomOut.addEventListener('click', () => { zoomed = false; render(); });
  render();
  return {
    select(bounds, label) { selectedBounds = bounds; selectedLabel = label; render(); },
    reset() { zoomed = false; render(); }
  };
}
