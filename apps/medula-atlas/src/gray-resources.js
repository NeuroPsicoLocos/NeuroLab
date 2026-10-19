/** Recursos documentados: los datos científicos se mantienen fuera del diseño. */
export const grayResources = {
  checked: '3 de octubre de 2026',
  images: [
    {
      id: 'regional', title: 'Regiones de la sustancia gris', type: 'Esquema anatómico',
      image: 'gris-c6-regional-v1.png', interactive: './regional.html',
      alt: 'Corte cervical idealizado con astas posteriores, región intermedia y astas anteriores; abre las áreas y láminas seleccionables.',
      metadata: 'C6 medular idealizado · áreas seleccionables en español',
      caption: 'Permite ubicar la zona marginal, la sustancia gelatinosa, las regiones intermedia y ventral, y el conducto central. Es una guía regional; no delimita por sí sola las diez láminas de Rexed.',
      credit: 'Ilustración original generada desde geometría controlada de NeuroLab; esquema Wikimedia conservado en comparación',
      source: './docs/regiones-c6.html',
      license: 'Procedencia, fuentes y límites docentes', licenseURL: './docs/regiones-c6.html'
    },
    {
      id: 'histology', title: 'Láminas I a V bajo el microscopio', type: 'Histología comparativa',
      image: 'rexed-cat-fig4.webp',
      alt: 'Figura científica con esquemas del asta posterior y microfotografías de las láminas I a V, comparando tejido sin teñir y marcadores NeuN, calbindina y SMI-32.',
      metadata: 'Gato · C1 (A–D) y L5 (E) · escala de 100 µm',
      caption: 'La figura 4 compara las láminas I a V con tejido sin teñir y distintos marcadores. Conserva los paneles y las barras de escala del artículo. Estos cortes no corresponden al segmento humano T3 del explorador.',
      credit: 'Veshchitskii, Shkorbatova y Merkulyeva (2022) · Frontiers in Neuroanatomy',
      source: 'https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2022.1034395/full#F4',
      license: 'CC BY 4.0', licenseURL: 'https://creativecommons.org/licenses/by/4.0/'
    }
  ],
  viewers: [
    {
      title: 'Nissl y motoneuronas', type: 'Microscopía virtual', metadata: 'Gato · violeta de cresilo',
      text: 'UCSF 163 permite acercarse a los somas neuronales, la sustancia de Nissl y el revestimiento del conducto central.',
      action: 'Abrir preparación', url: 'https://histologyguide.org/slideview/UCSF-163-spinal-cord/06-slide-1.html',
      credit: 'Histology Guide · preparación de UCSF'
    },
    {
      title: 'El corte completo', type: 'Microscopía virtual', metadata: 'Conejo · hematoxilina y eosina',
      text: 'MHS 240 ofrece una vista del conjunto y permite comparar las astas posteriores y anteriores, la sustancia blanca y el conducto central.',
      action: 'Abrir preparación', url: 'https://histologyguide.org/slideview/MHS-240-spinal-cord/06-slide-1.html',
      credit: 'Histology Guide · Brelje y Sorenson'
    },
    {
      title: 'Comparar niveles medulares', type: 'Guía universitaria', metadata: 'Preparaciones lumbar y torácica',
      text: 'Duke reúne una preparación lumbar con H&E y otra torácica con azul de Luxol y violeta de cresilo. Incluye una guía para reconocer somas, neuropilo, núcleo de Clarke y asta lateral.',
      action: 'Consultar guía', url: 'https://histology.oit.duke.edu/MBS/SysSci/SS-CNS/SS-CNS.html',
      credit: 'Duke University · especie no indicada en la guía consultada'
    },
    {
      title: 'Spinal Cord: anatomía y neuroarte', type: 'Referencia artística', metadata: 'Greg Dunn y Brian Edwards · 2021–2022',
      text: 'La obra aportada como referencia es un micrograbado de un corte medular humano, elaborado a partir de literatura neurocientífica. Sus colores y fibras ayudan a conversar sobre conectividad.',
      action: 'Ver obra en su fuente', url: 'https://www.gregadunn.com/microetchings/spinal-cord-microetching/',
      credit: 'Greg Dunn Neuro Art · imágenes consultables en la web del autor'
    }
  ]
};
