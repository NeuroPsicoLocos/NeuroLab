import { grayBaseMarkup, grayGeometry } from './gray-level-geometry.js?v=8';

/** Sectores de las cubiertas y raíces que se muestran al acercar la selección. */
export const coveringFocusBounds = {
  dura: [304, 105, 62, 122],
  arachnoid: [290, 126, 58, 107],
  csf: [271, 158, 53, 103],
  pia: [252, 206, 45, 75],
  dorsalroot: [265, 141, 177, 120],
  dorsalganglion: [365, 162, 44, 24],
  ventralroot: [263, 242, 179, 104],
  spinalnerve: [428, 191, 109, 97]
};

/** Corte docente. Las cubiertas se separan para estudiar su orden, sin escala. */
export function buildCoveringCut(coverings, diagramButton) {
  const ring = (id, rx, ry) => diagramButton(id, coverings.find(item => item.id === id).name,
    `<ellipse cx="215" cy="245" rx="${rx}" ry="${ry}" fill="url(#covering-${id})" class="covering-surface"/>`, 'data-covering');
  const cordTransform = 'translate(71 128.16) scale(.48 .46)';
  return `<title>Meninges, raíces y formación de un nervio espinal</title><desc>Posterior arriba y anterior abajo. De fuera a dentro: duramadre, aracnoides, espacio con LCR y piamadre adherida a la médula. El ganglio solo está en la raíz dorsal. Ambas raíces se unen en un nervio mixto. La forma del tejido es una referencia torácica; el conjunto no tiene escala física.</desc>
    <defs>
      <radialGradient id="covering-dura" cx="35%" cy="30%" r="75%"><stop stop-color="#b4c0cb"/><stop offset="1" stop-color="#718698"/></radialGradient>
      <radialGradient id="covering-arachnoid" cx="35%" cy="30%" r="75%"><stop stop-color="#a7c7bb"/><stop offset="1" stop-color="#729e92"/></radialGradient>
      <radialGradient id="covering-csf" cx="35%" cy="30%" r="75%"><stop stop-color="#e9f4f3"/><stop offset="1" stop-color="#bad9de"/></radialGradient>
      <linearGradient id="covering-pia"><stop stop-color="#d7af9b"/><stop offset="1" stop-color="#b77e6c"/></linearGradient>
      <linearGradient id="covering-sensory"><stop stop-color="#d8ba7b"/><stop offset="1" stop-color="#af8e4c"/></linearGradient>
      <linearGradient id="covering-motor"><stop stop-color="#dda798"/><stop offset="1" stop-color="#bb7564"/></linearGradient>
      <linearGradient id="covering-mixed"><stop stop-color="#b7ad84"/><stop offset="1" stop-color="#8a825a"/></linearGradient>
      <radialGradient id="covering-ganglion" cx="35%" cy="30%"><stop stop-color="#ead3a0"/><stop offset="1" stop-color="#b08e4e"/></radialGradient>
      <filter id="covering-shadow" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#4d554b" flood-opacity=".13"/></filter>
      <marker id="sensory-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#927432"/></marker>
      <marker id="motor-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#a76050"/></marker>
    </defs>
    <text x="215" y="42" text-anchor="middle" class="diagram-heading">POSTERIOR</text><text x="215" y="434" text-anchor="middle" class="diagram-heading">ANTERIOR</text>
    <ellipse cx="215" cy="245" rx="166" ry="153" fill="#f1e7d8" filter="url(#covering-shadow)"/><text x="53" y="77" class="diagram-note">Espacio epidural (fuera de la dura)</text>
    ${ring('dura', 156, 143)}${ring('arachnoid', 144, 131)}${ring('csf', 135, 122)}
    ${diagramButton('pia', 'Piamadre', `<g transform="${cordTransform}"><path d="${grayGeometry.t3.outer}" fill="none" stroke="url(#covering-pia)" stroke-width="12" class="pial-surface"/></g>`, 'data-covering')}
    <g transform="${cordTransform}" class="covering-cord">${grayBaseMarkup('t3', 'covering-cord')}</g>
    <text x="215" y="339" text-anchor="middle" class="diagram-note">Médula · forma torácica de referencia</text>
    ${diagramButton('dorsalroot', 'Raíz dorsal', `<path d="M282 212Q308 164 366 174M287 220Q319 188 366 174M274 203Q302 145 366 174M405 174Q431 190 434 245" class="root-stroke sensory"/><path d="M345 182L311 195" class="signal-arrow" stroke="#927432" marker-end="url(#sensory-arrow)"/>`, 'data-covering')}
    ${diagramButton('dorsalganglion', 'Ganglio de la raíz dorsal', `<ellipse cx="387" cy="174" rx="22" ry="12" fill="url(#covering-ganglion)" stroke="#a5874f" class="ganglion-surface"/>`, 'data-covering')}
    ${diagramButton('ventralroot', 'Raíz ventral', `<path d="M279 278Q310 333 351 308Q393 296 434 245M285 271Q322 304 351 308M275 286Q310 352 351 308" class="root-stroke motor"/><path d="M309 322L342 315" class="signal-arrow" stroke="#a76050" marker-end="url(#motor-arrow)"/>`, 'data-covering')}
    ${diagramButton('spinalnerve', 'Nervio espinal y sus ramos', `<path d="M434 245H470M470 245Q487 234 501 206M470 245Q491 259 523 274" class="root-stroke mixed"/>`, 'data-covering')}
    <text x="337" y="141" class="diagram-note">Raíz dorsal</text><text x="373" y="158" class="diagram-note">Ganglio</text><text x="332" y="355" class="diagram-note">Raíz ventral</text><text x="448" y="298" class="diagram-note">Nervio mixto</text>
    <text x="483" y="193" class="diagram-note">Ramo</text><text x="483" y="205" class="diagram-note">posterior</text><text x="483" y="324" class="diagram-note">Ramo anterior</text>`;
}
