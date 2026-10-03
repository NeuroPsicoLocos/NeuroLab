/** Contenido docente. Los niveles son segmentos medulares, no vértebras. */
export const grayLevelSources = {
  anatomy: { title: 'Dafny · Anatomy of the Spinal Cord (UTHealth)', url: 'https://nba.uth.tmc.edu/neuroscience/m/s2/chapter03.html' },
  morphology: { title: 'NCBI Bookshelf · Spinal Cord Morphology', url: 'https://www.ncbi.nlm.nih.gov/books/NBK545206/' },
  pain: { title: 'Todd (2010) · Circuitos del asta posterior', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3277941/' },
  development: { title: 'Lai, Seal y Johnson (2016) · Organización somatosensitiva', url: 'https://pubmed.ncbi.nlm.nih.gov/27702783/' },
  autonomic: { title: 'NCBI Bookshelf · Nervios espinales y salida autónoma', url: 'https://www.ncbi.nlm.nih.gov/books/NBK542218/' }
};

export const grayLevels = [
  {
    id: 'c6', name: 'Cervical', segment: 'C6', region: 'cervical',
    summary: 'Un corte amplio del engrosamiento cervical, con astas anteriores desarrolladas y abundante sustancia blanca.',
    observations: ['Compara el tamaño de las astas anteriores con T3.', 'La sustancia blanca rodea una H de sustancia gris.', 'Aquí no se dibuja el asta lateral simpática torácica.'],
    sources: ['anatomy', 'morphology']
  },
  {
    id: 't3', name: 'Torácico', segment: 'T3', region: 'thoracic',
    summary: 'Astas anteriores más pequeñas y una proyección lateral que permite estudiar la columna intermediolateral simpática.',
    observations: ['Localiza el asta lateral entre las astas posterior y anterior.', 'El núcleo de Clarke aparece junto a la base del asta posterior.', 'Las bandas profundas del asta posterior se representan de forma aproximada.'],
    sources: ['anatomy', 'morphology', 'autonomic']
  },
  {
    id: 'l4', name: 'Lumbar', segment: 'L4', region: 'lumbar',
    summary: 'Un corte del engrosamiento lumbosacro, con sustancia gris y grupos motores anteriores desarrollados.',
    observations: ['Compara sus astas anteriores con las del corte torácico.', 'L4 es un segmento medular; no indica la altura de la vértebra L4.', 'No se dibujan aquí el asta lateral simpática ni el núcleo de Clarke.'],
    sources: ['anatomy', 'morphology']
  },
  {
    id: 's3', name: 'Sacro', segment: 'S3', region: 'sacral',
    summary: 'La sustancia gris ocupa una proporción mayor del corte y la zona intermedia contiene neuronas parasimpáticas sacras.',
    observations: ['Queda una envoltura de sustancia blanca relativamente menor.', 'La salida parasimpática sacra se estudia en S2–S4.', 'La zona autónoma sacra no forma el asta lateral prominente de T3.'],
    sources: ['anatomy', 'morphology', 'autonomic']
  }
];

const allLevels = grayLevels.map(level => level.id);
const item = (id, name, code, color, anatomy, connectivity, functionText, clinical, sources = ['anatomy'], levels = allLevels) => ({
  id, name, code, color, anatomy, connectivity, function: functionText, clinical, sources, levels
});

export const grayStructures = [
  item('dorsal', 'Asta posterior', 'AP', '#78958e',
    'Proyección posterior de sustancia gris que incluye las láminas superficiales y profundas del asta.',
    'Recibe aferencias sensitivas y señales de interneuronas y vías descendentes.',
    'Integra información somatosensitiva antes de su distribución a circuitos locales y vías ascendentes.',
    'Una alteración sensitiva depende también de las raíces y vías afectadas; el dibujo no localiza por sí solo una lesión.', ['anatomy', 'pain']),
  item('ventral', 'Asta anterior', 'AA', '#bb8175',
    'Región anterior con interneuronas y grupos de motoneuronas. Su desarrollo cambia por nivel.',
    'Las motoneuronas reciben entradas locales y descendentes y envían sus axones por la raíz ventral.',
    'Participa en la salida motora somática.',
    'Una lesión de motoneurona inferior puede acompañarse de debilidad, atrofia y disminución de reflejos.'),
  item('intermediate', 'Zona intermedia', 'ZI', '#a89d76',
    'Sustancia gris entre las astas posterior y anterior, asociada principalmente a la lámina VII.',
    'Reúne circuitos locales, propioceptivos y autónomos, con organización diferente por segmento.',
    'Conecta el procesamiento sensitivo con respuestas motoras y viscerales.',
    'Las consecuencias de una lesión dependen del nivel y de qué poblaciones neuronales compromete.'),
  item('commissure', 'Comisura gris', 'CG', '#95879d',
    'Puente de sustancia gris entre ambos lados, alrededor del conducto central.',
    'Contiene circuitos que relacionan las dos mitades de la médula.',
    'Participa en integración bilateral.',
    'Debe distinguirse de la comisura blanca anterior y de los axones que cruzan en ella.'),
  item('canal', 'Conducto central', 'CC', '#759eae',
    'Pequeño conducto ependimario en el centro de la comisura gris. Su permeabilidad varía en el adulto.',
    'Forma parte del sistema de cavidades del sistema nervioso central; no es una vía de axones.',
    'Se utiliza como referencia anatómica central, sin representar la principal circulación del LCR espinal.',
    'No debe confundirse con el canal vertebral ni con el espacio subaracnoideo.', ['anatomy', 'morphology']),
  item('gelatinosa', 'Sustancia gelatinosa', 'SG', '#9b8ba4',
    'Región superficial del asta posterior que corresponde a la lámina II.',
    'Contiene circuitos de interneuronas excitadoras e inhibidoras que reciben entradas sensitivas y moduladoras.',
    'Modula el procesamiento somatosensitivo, incluido el nociceptivo.',
    'La nocicepción y la experiencia de dolor son conceptos distintos; la actividad de esta región no mide por sí sola dolor.', ['pain', 'development']),
  item('clarke', 'Núcleo de Clarke', 'NC', '#718eab',
    'Grupo neuronal de la zona medial de la lámina VII, junto a la base del asta posterior.',
    'Sus axones contribuyen al tracto espinocerebeloso posterior.',
    'Releva información propioceptiva hacia el cerebelo.',
    'Se representa en T3. Su columna se describe aproximadamente entre C8/T1 y L2/L3; no se extiende por todos los segmentos.', ['anatomy', 'development'], ['t3']),
  item('motor', 'Grupos motores', 'IX', '#bf9870',
    'Grupos de motoneuronas de la lámina IX dentro del asta anterior.',
    'Sus axones salen por la raíz ventral hacia músculos esqueléticos.',
    'Las motoneuronas alfa inervan fibras extrafusales y las gamma regulan fibras intrafusales.',
    'El dibujo agrupa poblaciones y no delimita núcleos de músculos individuales.'),
  item('lateral', 'Asta lateral simpática', 'AL', '#bc9c62',
    'Proyección lateral torácica que contiene la columna intermediolateral.',
    'Las neuronas preganglionares envían axones por raíces ventrales hacia ganglios simpáticos.',
    'Participa en la salida simpática toracolumbar.',
    'Se representa solo en T3 entre estos cuatro cortes. La organización autónoma no es idéntica en los otros niveles.', ['autonomic'], ['t3']),
  item('sacral-autonomic', 'Núcleo parasimpático sacro', 'PS', '#729c96',
    'Población autónoma de la sustancia gris intermedia de segmentos S2–S4.',
    'Sus axones preganglionares alcanzan ganglios periféricos por la salida parasimpática sacra.',
    'Contribuye al control de funciones pélvicas.',
    'La función vesical, intestinal y sexual depende de redes más amplias; este punto no delimita un centro único.', ['autonomic'], ['s3'])
];

export const rexedLaminae = [
  item('I', 'Lámina I', 'I', '#819ea0', 'Zona marginal en el extremo posterior del asta.', 'Recibe entradas sensitivas y contiene neuronas de proyección.', 'Participa en el procesamiento nociceptivo y térmico.', 'Su territorio se amplía visualmente para poder seleccionarlo.', ['anatomy', 'pain']),
  item('II', 'Lámina II', 'II', '#ac95b0', 'Sustancia gelatinosa, bajo la lámina I.', 'Predominan circuitos de interneuronas excitadoras e inhibidoras.', 'Modula las entradas somatosensitivas.', 'No constituye por sí sola una medida de dolor.', ['pain', 'development']),
  item('III', 'Lámina III', 'III', '#baa37a', 'Parte del asta posterior situada por debajo de la sustancia gelatinosa.', 'Recibe aferencias mecanosensitivas y participa en circuitos locales.', 'Contribuye al procesamiento del tacto.', 'Los límites dependen de la citoarquitectura y no se deducen de los colores del mapa.', ['anatomy', 'development']),
  item('IV', 'Lámina IV', 'IV', '#aab77c', 'Región más profunda de la cabeza del asta posterior, relacionada con el núcleo propio.', 'Integra aferencias y señales de interneuronas; algunas neuronas contribuyen a proyecciones ascendentes.', 'Participa en procesamiento somatosensitivo.', 'No se asigna una única modalidad a todas sus neuronas.', ['anatomy', 'development']),
  item('V', 'Lámina V', 'V', '#b98a7d', 'Región del cuello del asta posterior.', 'Recibe entradas somáticas, viscerales y descendentes.', 'Integra señales sensitivas convergentes.', 'La convergencia participa en fenómenos como el dolor referido, sin explicarlos por una sola población.', ['anatomy']),
  item('VI', 'Lámina VI', 'VI', '#87a896', 'Base del asta posterior, más desarrollada en los engrosamientos.', 'Recibe entradas propioceptivas y señales descendentes.', 'Participa en integración sensoriomotora y reflejos.', 'En T3 la banda es poco desarrollada y su separación visual respecto a V y VII es orientativa.', ['anatomy', 'morphology']),
  item('VII', 'Lámina VII', 'VII', '#b3a582', 'Zona intermedia heterogénea que cambia de forma y contenido por segmento.', 'Incluye circuitos propioceptivos y poblaciones autónomas, según el nivel.', 'Integra respuestas somáticas y viscerales.', 'No todos los núcleos asociados a VII están presentes en todos los segmentos.', ['anatomy', 'autonomic']),
  item('VIII', 'Lámina VIII', 'VIII', '#9992aa', 'Región principalmente medial del asta anterior en los engrosamientos.', 'Recibe entradas descendentes y conecta con circuitos motores.', 'Contribuye a coordinación y regulación motora.', 'Su forma cambia por nivel; el esquema no delimita cada población neuronal.', ['anatomy']),
  item('IX', 'Lámina IX', 'IX', '#c39a72', 'Grupos discontinuos de motoneuronas en el asta anterior, no una banda continua.', 'Sus axones forman parte de las raíces ventrales.', 'Proporciona salida motora hacia músculo esquelético.', 'Los óvalos son grupos orientativos, no un mapa muscular completo.', ['anatomy']),
  item('X', 'Lámina X', 'X', '#8e9eb4', 'Sustancia gris pericanalicular que rodea el conducto central.', 'Incluye interneuronas y conexiones comisurales.', 'Participa en procesamiento e integración local.', 'La lámina X es tejido nervioso; el conducto central es la cavidad que queda en su centro.', ['anatomy'])
];

/** Una estructura no disponible nunca conserva una selección invisible. */
export function resolveGraySelection(levelId, mode, selectionId) {
  const level = grayLevels.find(candidate => candidate.id === levelId) || grayLevels[1];
  const items = mode === 'laminae' ? rexedLaminae : grayStructures;
  const requested = items.find(candidate => candidate.id === selectionId);
  const selected = requested?.levels.includes(level.id) ? requested : items.find(candidate => candidate.levels.includes(level.id));
  return { level, items, selected, changed: selected.id !== selectionId };
}
