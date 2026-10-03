/** Presentación de las láminas. Los puntos no delimitan territorios anatómicos. */
export const anatomyIllustrations = {
  regions: {
    image: './assets/anatomy/cord-longitudinal-v7.png',
    width: 1024, height: 1536,
    alt: 'Ilustración posterior de una médula dentro del canal abierto. El cono termina antes del sacro; por debajo descienden raíces de la cola de caballo.',
    caption: 'Lámina docente con salidas nerviosas representativas. Los puntos orientan la selección, sin marcar límites segmentarios exactos. El mapa de estudio muestra los 31 pares.',
    points: [
      { id: 'cervical', x: 50, y: 12, labelX: 74, labelY: 14 },
      { id: 'thoracic', x: 50, y: 31, labelX: 74, labelY: 32 },
      { id: 'lumbar', x: 50, y: 47, labelX: 74, labelY: 46 },
      { id: 'sacral', x: 50, y: 51, labelX: 74, labelY: 53 },
      { id: 'coccygeal', x: 50, y: 54, labelX: 74, labelY: 60 }
    ],
    landmarks: [
      { name: 'Cono medular', x: 50, y: 55.5, labelX: 18, labelY: 62 },
      { name: 'Cola de caballo', x: 50, y: 74, labelX: 18, labelY: 80 }
    ]
  },
  coverings: {
    image: './assets/anatomy/corte-meninges-v7.png',
    width: 1448, height: 1086,
    alt: 'Corte transversal ilustrado con sustancia gris en H, sustancia blanca y meninges. A la derecha, raíz dorsal con ganglio y raíz ventral sin ganglio se unen en un nervio mixto con dos ramos.',
    caption: 'Ilustración de relaciones anatómicas con espesores y separaciones ampliados. La textura es artística, no histológica. Posterior arriba y anterior abajo; ambos ramos son mixtos.',
    points: [
      { id: 'dura', x: 35, y: 14 },
      { id: 'arachnoid', x: 15.8, y: 25.8 },
      { id: 'csf', x: 12.7, y: 47.7 },
      { id: 'pia', x: 43, y: 67.2 },
      { id: 'dorsalroot', x: 59.5, y: 30 },
      { id: 'dorsalganglion', x: 71, y: 35 },
      { id: 'ventralroot', x: 66, y: 55 },
      { id: 'spinalnerve', x: 84.3, y: 50.5 }
    ]
  }
};
