import { plateRegions } from './plate-regions.js';
import { grayBaseMarkup, grayGeometry } from './gray-level-geometry.js?v=10';
import { setupCutZoom } from './cut-zoom.js?v=10';

const NS = 'http://www.w3.org/2000/svg';

function node(tag, attrs = {}, text = '') {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, String(value));
  }
  if (text) element.textContent = text;
  return element;
}

/** Lleva los territorios de referencia al lienzo común, conservando la simetría. */
export function transformTractBounds(bounds, side = 'left') {
  let x = 300 + (bounds.x - 627) * .3;
  const y = 254 + (bounds.y - 640) * .37;
  const width = bounds.width * .3, height = bounds.height * .37;
  if (side === 'right') x = 600 - x - width;
  return [x, y, width, height];
}

/** Base SVG común. Los territorios son aproximados y quedan en sustancia blanca. */
export function createCrossSection(svg, tracts, onSelect) {
  svg.setAttribute('viewBox', '0 0 600 480');
  svg.classList.add('study-cut-map');
  const base = node('g', {class: 'cut-tissue-base', 'pointer-events': 'none', 'aria-hidden': 'true'});
  base.innerHTML = grayBaseMarkup('t3', 'tract-cut');
  svg.append(base);
  // Estos contornos usan solo comandos absolutos M, L, C y Q (pares x, y).
  let coordinate = 0;
  const mirroredGray = grayGeometry.t3.gray.replace(/-?\d+(?:\.\d+)?/g, value => String(coordinate++ % 2 === 0 ? 600 - Number(value) : Number(value)));
  const clip = node('clipPath', {id: 'tract-white-clip'});
  clip.append(node('path', {d: `${grayGeometry.t3.outer} ${grayGeometry.t3.gray} ${mirroredGray}`, 'clip-rule': 'evenodd', 'fill-rule': 'evenodd'}));
  const defs = node('defs'); defs.append(clip); svg.append(defs);
  svg.append(node('text', {x: 300, y: 38, class: 'map-orientation'}, 'POSTERIOR'));
  svg.append(node('text', {x: 300, y: 448, class: 'map-orientation'}, 'ANTERIOR'));
  const regions = node('g', {'aria-label': 'Tractos bilaterales', 'clip-path': 'url(#tract-white-clip)'});
  const territories = node('g', {transform: 'translate(111.9 17.2) scale(.3 .37)'});
  regions.append(territories);
  const labels = node('g', {class: 'map-labels', 'aria-hidden': 'true'});
  const zoom = setupCutZoom(svg, document.querySelector('#tract-cut-tools'), [0, 0, 600, 480]);
  let selectedId = tracts[0].id, selectedSide = 'left';

  for (const tract of tracts) {
    const region = plateRegions[tract.id];
    for (const side of ['right', 'left']) {
      const mirrored = side === 'right';
      const sideName = mirrored ? 'derecho' : 'izquierdo';
      const area = node('path', {
        d: region.path,
        style: `--tract-color:${tract.color}`,
        class: 'tract-shape', tabindex: 0, role: 'button',
        'aria-label': `${tract.name}, lado ${sideName} del sujeto`,
        'aria-pressed': false,
        'data-tract': tract.id, 'data-direction': tract.direction,
        transform: mirrored ? 'translate(1254 0) scale(-1 1)' : '',
        'data-side': side
      });
      area.append(node('title', {}, `${tract.name} (${sideName})`));
      area.addEventListener('click', () => { selectedSide = side; onSelect(tract.id); });
      area.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectedSide = side; onSelect(tract.id);
        }
      });
      territories.append(area);

      const labelX = 300 + (region.label[0] - 627) * .3;
      const x = mirrored ? 600 - labelX : labelX;
      const y = 254 + (region.label[1] - 640) * .37;
      const badge = node('g', {'data-direction': tract.direction});
      badge.append(node('rect', {
        x: x - 16, y: y - 10, width: 32, height: 20, rx: 6,
        class: 'map-symbol-background'
      }));
      badge.append(node('text', {x, y: y + 4, class: 'tract-symbol'}, tract.code));
      labels.append(badge);
    }
  }
  svg.append(regions, labels);
  const anatomy = node('g', {class: 'map-labels anatomy-labels', 'aria-hidden': 'true'});
  anatomy.append(node('circle', {cx: 300, cy: 254, r: 5, class: 'canal-marker'}));
  anatomy.append(node('text', {x: 300, y: 283, class: 'anatomy-label'}, 'Conducto central'));
  svg.append(anatomy);

  return {
    select(id) {
      selectedId = id;
      for (const area of svg.querySelectorAll('.tract-shape')) {
        const selected = area.dataset.tract === id;
        area.classList.toggle('selected', selected);
        area.setAttribute('aria-pressed', selected);
      }
      const area = svg.querySelector(`.tract-shape[data-tract="${selectedId}"][data-side="${selectedSide}"]`);
      const tract = tracts.find(item => item.id === id);
      zoom.select(transformTractBounds(area.getBBox(), selectedSide), `${tract.name}, lado ${selectedSide === 'left' ? 'izquierdo' : 'derecho'} del sujeto`);
    },
    filter(direction) {
      svg.classList.toggle('filtering', direction !== 'all');
      for (const area of svg.querySelectorAll('.tract-shape')) {
        const visible = direction === 'all' || area.dataset.direction === direction;
        area.classList.toggle('muted', !visible);
        area.setAttribute('tabindex', visible ? '0' : '-1');
        area.setAttribute('aria-hidden', !visible);
      }
      for (const badge of labels.querySelectorAll('g')) {
        badge.style.opacity = direction === 'all' || badge.dataset.direction === direction ? '1' : '.08';
      }
    },
    labels(visible) {
      for (const group of svg.querySelectorAll('.map-labels')) {
        group.classList.toggle('off', !visible);
      }
    }
  };
}
