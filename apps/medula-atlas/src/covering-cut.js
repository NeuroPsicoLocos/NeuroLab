import { anatomyIllustrations } from './anatomy-illustrations.js?v=7';

/** Sectores de la lámina realista. Los puntos orientan, sin delimitar tejido. */
export const coveringFocusBounds = {
  dura: [164, 60, 58, 32],
  arachnoid: [70, 106, 40, 45],
  csf: [55, 186, 50, 73],
  pia: [218, 286, 50, 32],
  dorsalroot: [260, 113, 108, 78],
  dorsalganglion: [358, 126, 68, 83],
  ventralroot: [324, 220, 110, 40],
  spinalnerve: [442, 208, 48, 54]
};

/** La misma lámina de Anatomía ahora admite selección y acercamiento SVG.
 * La imagen se coloca sin deformación (560 × 420); el zoom solo cambia viewBox.
 * Cada punto tiene una alternativa con nombre completo en la lista contigua.
 */
export function buildCoveringCut(coverings, diagramButton) {
  const plate = anatomyIllustrations.coverings;
  return `<title>Meninges y raíces, corte anatómico interactivo</title><desc>Ilustración docente realista, no histología. Posterior arriba, anterior abajo. El ganglio está en la raíz dorsal; ambas raíces forman un nervio mixto. Los puntos orientan la selección y las separaciones están ampliadas. No se asigna un segmento medular concreto.</desc>
    <text x="215" y="15" text-anchor="middle" class="diagram-heading">POSTERIOR</text>
    <image class="realistic-covering" href="${plate.image}" x="0" y="20" width="560" height="420" preserveAspectRatio="xMidYMid meet" pointer-events="none" aria-hidden="true"/>
    ${plate.points.map((point, index) => {
      const item = coverings.find(covering => covering.id === point.id);
      const x = point.x * 5.6, y = 20 + point.y * 4.2;
      return diagramButton(point.id, item.name,
        `<title>${item.name}</title><circle cx="${x}" cy="${y}" r="18" class="covering-hit"/><circle cx="${x}" cy="${y}" r="9" class="covering-pin-surface"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" class="covering-pin-number">${index + 1}</text>`, 'data-covering');
    }).join('')}
    <text x="215" y="455" text-anchor="middle" class="diagram-heading">ANTERIOR</text>`;
}
