/** Dibujo docente T3. El color muestra relaciones cualitativas, no volúmenes. */
import { grayBaseMarkup, grayGeometry } from './gray-level-geometry.js?v=10';
import { plateRegions } from './plate-regions.js';
import { lesionZones } from './lesion-content.js?v=11';

const NS = 'http://www.w3.org/2000/svg';
const mirrored = d => {
  let coordinate = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, value => String(coordinate++ % 2 === 0 ? 600 - Number(value) : Number(value)));
};
const tractTransform = 'translate(111.9 17.2) scale(.3 .37)';
const tractMarkup = (id, side) => `<path d="${plateRegions[id].path}" transform="${side === 'right' ? 'translate(1254 0) scale(-1 1)' : ''}"/>`;
const columnMarkup = ['right', 'left'].flatMap(side => ['gracilis', 'cuneatus'].map(id => tractMarkup(id, side))).join('');

export const lesionFocusBounds = {
  'hemi-right': [118, 78, 182, 323], 'hemi-left': [300, 78, 182, 323],
  posterior: [220, 76, 160, 166], anterior: [130, 178, 340, 224],
  commissure: [275, 269, 50, 23]
};

export function createLesionCut(svg, onSelect) {
  const geometry = grayGeometry.t3;
  svg.innerHTML = `${grayBaseMarkup('t3', 'lesion-cut')}
    <defs>
      <clipPath id="lesion-white-clip"><path d="${geometry.outer} ${geometry.gray} ${mirrored(geometry.gray)}" clip-rule="evenodd" fill-rule="evenodd"/></clipPath>
      <mask id="lesion-spare-columns"><rect width="600" height="480" fill="white"/><g transform="${tractTransform}" fill="black">${columnMarkup}</g></mask>
    </defs>
    <text x="300" y="38" class="map-orientation">POSTERIOR</text>
    <text x="300" y="448" class="map-orientation">ANTERIOR</text>
    <text x="70" y="70" class="lesion-side-label">DERECHA</text>
    <text x="530" y="70" class="lesion-side-label">IZQUIERDA</text>
    <g class="lesion-territory" clip-path="url(#lesion-cut-tissue-clip)" pointer-events="none"></g>
    <g class="lesion-pathways" clip-path="url(#lesion-white-clip)" pointer-events="none"></g>
    <g class="lesion-commissure" pointer-events="none" hidden><ellipse cx="300" cy="280" rx="22" ry="7"/><path d="M273 280H327M273 280L279 276M273 280L279 284M327 280L321 276M327 280L321 284"/></g>
    <g class="lesion-pins"></g>`;
  for (const zone of lesionZones) {
    const group = document.createElementNS(NS, 'g');
    const attrs = { role: 'button', tabindex: '0', 'data-lesion-zone': zone.id,
      'aria-label': zone.label + ', seleccionar caso', 'aria-pressed': 'false', class: 'lesion-pin',
      transform: `translate(${zone.pin.join(' ')})` };
    for (const [key, value] of Object.entries(attrs)) group.setAttribute(key, value);
    group.innerHTML = `<circle r="27" class="lesion-pin-hit"/><circle r="15" class="lesion-pin-circle"/><text y="1">${zone.code}</text>`;
    group.addEventListener('click', () => onSelect(zone.id));
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(zone.id); }
    });
    svg.querySelector('.lesion-pins').append(group);
  }
  return {
    select(lesson, revealed) {
      const { zone } = lesson;
      let territory;
      if (zone.pattern === 'hemi') territory = `<rect x="${zone.side === 'right' ? 0 : 300}" y="60" width="300" height="350"/>`;
      else if (zone.pattern === 'posterior') territory = `<g clip-path="url(#lesion-white-clip)"><g transform="${tractTransform}">${columnMarkup}</g></g>`;
      else if (zone.pattern === 'anterior') territory = '<rect x="100" y="178" width="400" height="235" mask="url(#lesion-spare-columns)"/>';
      else territory = '<ellipse cx="300" cy="280" rx="24" ry="9"/>';
      svg.querySelector('.lesion-territory').innerHTML = territory;
      // Los tractos se muestran solo al resolver o revelar el caso.
      svg.querySelector('.lesion-pathways').innerHTML = revealed ? ['affected', 'spared'].map(status => `<g class="lesion-${status}" transform="${tractTransform}">${lesson[status].filter(item => plateRegions[item.id]).map(item => `<g data-lesion-tract="${item.id}" data-side="${item.side}" data-status="${status}">${tractMarkup(item.id, item.side)}</g>`).join('')}</g>`).join('') : '';
      svg.querySelector('.lesion-commissure').toggleAttribute('hidden', !(revealed && zone.pattern === 'commissure'));
      for (const pin of svg.querySelectorAll('.lesion-pin')) pin.setAttribute('aria-pressed', pin.dataset.lesionZone === zone.id);
    }
  };
}
