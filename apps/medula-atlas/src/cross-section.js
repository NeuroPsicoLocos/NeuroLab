import { plateRegions } from './plate-regions.js';

const NS = 'http://www.w3.org/2000/svg';

function node(tag, attrs = {}, text = '') {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, String(value));
  }
  if (text) element.textContent = text;
  return element;
}

/** Ilustración raster con controles SVG independientes y accesibles. */
export function createCrossSection(svg, tracts, onSelect) {
  svg.setAttribute('viewBox', '0 60 1254 1110');
  svg.classList.add('illustrated-map');
  svg.append(node('image', {
    href: './assets/illustrations/01-corte-base-v2.png',
    x: 0, y: 0, width: 1254, height: 1254,
    class: 'atlas-base-image', 'aria-hidden': 'true',
    'pointer-events': 'none'
  }));
  svg.append(node('text', {x: 627, y: 94, class: 'map-orientation'}, 'POSTERIOR'));
  svg.append(node('text', {x: 627, y: 1135, class: 'map-orientation'}, 'ANTERIOR'));
  const regions = node('g', {'aria-label': 'Tractos bilaterales'});
  const labels = node('g', {class: 'map-labels', 'aria-hidden': 'true'});

  for (const tract of tracts) {
    const region = plateRegions[tract.id];
    for (const side of ['right', 'left']) {
      const mirrored = side === 'right';
      const sideName = mirrored ? 'derecho' : 'izquierdo';
      const area = node('path', {
        d: region.path,
        style: `--tract-color:${tract.color}`,
        class: 'tract-shape', tabindex: 0, role: 'button',
        'aria-label': `${tract.name}, lado ${sideName}`,
        'aria-pressed': false,
        'data-tract': tract.id, 'data-direction': tract.direction,
        transform: mirrored ? 'translate(1254 0) scale(-1 1)' : '',
        'data-side': side
      });
      area.append(node('title', {}, `${tract.name} (${sideName})`));
      area.addEventListener('click', () => onSelect(tract.id));
      area.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(tract.id);
        }
      });
      regions.append(area);

      const x = mirrored ? 1254 - region.label[0] : region.label[0];
      const y = region.label[1];
      const badge = node('g', {'data-direction': tract.direction});
      badge.append(node('rect', {
        x: x - 29, y: y - 19, width: 58, height: 38, rx: 12,
        class: 'map-symbol-background'
      }));
      badge.append(node('text', {x, y: y + 9, class: 'tract-symbol'}, tract.code));
      labels.append(badge);
    }
  }
  svg.append(regions, labels);
  const anatomy = node('g', {class: 'map-labels anatomy-labels', 'aria-hidden': 'true'});
  anatomy.append(node('circle', {cx: 627, cy: 640, r: 7, class: 'canal-marker'}));
  anatomy.append(node('text', {x: 627, y: 688, class: 'anatomy-label'}, 'Conducto central'));
  svg.append(anatomy);

  return {
    select(id) {
      for (const area of svg.querySelectorAll('.tract-shape')) {
        const selected = area.dataset.tract === id;
        area.classList.toggle('selected', selected);
        area.setAttribute('aria-pressed', selected);
      }
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
