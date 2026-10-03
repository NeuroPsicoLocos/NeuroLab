/** Patrones docentes T3. Reglas explícitas, sin inferencia a partir de píxeles.
 * Los casos son ficticios. Las fuentes sustentan relaciones, no predicciones.
 */
export const lesionSources = {
  anatomy: { title: 'UTHealth · Organización interna de la médula', url: 'https://nba.uth.tmc.edu/neuroscience/m/s2/chapter03.html' },
  sensory: { title: 'UTHealth · Vías somatosensitivas', url: 'https://nba.uth.tmc.edu/neuroscience/m/s2/chapter04.html' },
  motor: { title: 'UTHealth · Vías motoras descendentes', url: 'https://nba.uth.tmc.edu/neuroscience/m/s3/chapter02.html' },
  hemi: { title: 'Miranda et al. (2007) · Brown-Séquard, serie clínica', url: 'https://pubmed.ncbi.nlm.nih.gov/17394028/' },
  anterior: { title: 'Klakeel et al. (2015) · Anterior spinal cord syndrome of unknown etiology', url: 'https://pubmed.ncbi.nlm.nih.gov/25552812/' },
  posterior: { title: 'McKinley et al. (2021) · Posterior cord syndrome: Demographics and rehabilitation outcomes', url: 'https://pubmed.ncbi.nlm.nih.gov/30939076/' },
  commissure: { title: 'UTHealth · Guía de laboratorio, vías sensitivas y comisura blanca anterior', url: 'https://nba.uth.tmc.edu/Assets/pdf/courses/ns_2013_lab_guide.v13.1.0_SCR.pdf' }
};

export const lesionZones = [
  { id: 'hemi-right', pattern: 'hemi', side: 'right', label: 'Hemimédula derecha', code: '1', pin: [183, 255] },
  { id: 'hemi-left', pattern: 'hemi', side: 'left', label: 'Hemimédula izquierda', code: '2', pin: [417, 255] },
  { id: 'posterior', pattern: 'posterior', side: 'both', label: 'Columnas posteriores', code: '3', pin: [300, 143] },
  { id: 'anterior', pattern: 'anterior', side: 'both', label: 'Región anterior', code: '4', pin: [348, 347] },
  { id: 'commissure', pattern: 'commissure', side: 'both', label: 'Comisura blanca anterior', code: '5', pin: [300, 280] }
];

const columns = ['gracilis', 'cuneatus'];
const motor = ['cst-lateral'];
const pain = ['stt-lateral'];
const all = [...columns, ...motor, ...pain];
const entries = (ids, sides) => sides.flatMap(side => ids.map(id => ({ id, side })));
const row = (name, finding, scope) => ({ name, finding, scope });

/** Conserva el lado anatómico al reflejar el dibujo; contralateral = lado opuesto. */
export function lesionLesson(zoneId) {
  const zone = lesionZones.find(item => item.id === zoneId);
  if (!zone) throw new RangeError('Zona de lesión desconocida: ' + zoneId);
  const sides = zone.side === 'both' ? ['right', 'left'] : [zone.side];
  const side = zone.side === 'right' ? 'derecho' : 'izquierdo';
  const opposite = zone.side === 'right' ? 'izquierdo' : 'derecho';
  const common = { zone, level: 'T3', affected: [], spared: [], sources: ['anatomy', 'sensory', 'motor'] };
  if (zone.pattern === 'hemi') return {
    ...common, title: 'Patrón de Brown-Séquard',
    case: `Caso ficticio. Una lesión limitada a la mitad ${side === 'derecho' ? 'derecha' : 'izquierda'} del segmento medular T3 interrumpe vías ascendentes y descendentes. Estudia el patrón establecido, una vez superada la fase de shock medular.`,
    question: '¿Qué combinación de hallazgos por debajo de la lesión esperarías?',
    options: [
      `Debilidad y pérdida de vibración del lado ${side}; pérdida de dolor y temperatura del lado ${opposite}.`,
      `Debilidad y pérdida de vibración del lado ${opposite}; pérdida de dolor y temperatura del lado ${side}.`,
      'Pérdida bilateral de vibración, con fuerza y sensibilidad térmica conservadas.'
    ], answer: 0,
    explanation: 'La vía corticoespinal lateral ya cruzó en el bulbo. Las columnas posteriores aún no han cruzado. La vía espinotalámica ascendente ya recibió fibras del lado opuesto.',
    anatomy: 'Una hemilesión compromete sustancia blanca y gris del mismo lado. El mapa destaca tres sistemas principales; no enumera todas las estructuras afectadas.',
    connectivity: 'El cruce corticoespinal es bulbar; el de las columnas posteriores ocurre en el bulbo después de su primer relevo. Las fibras termoalgésicas cruzan en la médula.',
    function: 'Relaciona movimiento voluntario, vibración y posición con dolor y temperatura.',
    clinical: 'El patrón puro es una simplificación. Puede haber signos segmentarios de neurona motora inferior en el nivel lesionado y alteraciones autonómicas. Los signos piramidales bajo la lesión evolucionan con el tiempo.',
    signs: [row('Movimiento', `Debilidad del lado ${side}`, 'Por debajo de T3; signos piramidales tras la fase aguda.'), row('Vibración y posición', `Disminución del lado ${side}`, 'Por debajo de la lesión.'), row('Dolor y temperatura', `Disminución del lado ${opposite}`, 'Suele empezar uno o dos segmentos más abajo; el límite es variable.')],
    affected: entries(all, sides), spared: entries(all, [zone.side === 'right' ? 'left' : 'right']),
    sources: [...common.sources, 'hemi'], discussion: 'Pide al grupo que ubique los tres cruces antes de decir qué lado pierde cada modalidad.'
  };
  if (zone.pattern === 'posterior') return {
    ...common, title: 'Patrón de columnas posteriores',
    case: 'Caso ficticio. Una lesión bilateral selectiva afecta las columnas posteriores en T3. El resto de los sistemas destacados permanece conservado en este ejercicio.',
    question: '¿Qué hallazgo encaja mejor con ese territorio?',
    options: ['Pérdida bilateral de fuerza y de dolor, con vibración conservada.', 'Pérdida bilateral de vibración y posición bajo la lesión, con fuerza y sensibilidad termoalgésica conservadas.', 'Pérdida de dolor y temperatura solo en una banda del tronco.'], answer: 1,
    explanation: 'Las columnas posteriores conducen vibración, tacto discriminativo y propiocepción consciente. Su interrupción puede causar ataxia sensitiva aunque se conserve la fuerza.',
    anatomy: 'El territorio incluye los fascículos grácil y cuneiforme de ambos lados. El cuneiforme está presente en T3.',
    connectivity: 'Estas aferencias ascienden del mismo lado hasta los núcleos grácil y cuneiforme del bulbo. El cruce ocurre después de ese relevo.',
    function: 'Permiten conocer la posición corporal y distinguir estímulos táctiles finos.',
    clinical: 'Una lesión restringida respeta las vías motoras y termoalgésicas. No implica perder todas las formas de tacto. En T3 no interrumpe las aferencias de la mano que entran más arriba.',
    signs: [row('Movimiento', 'Fuerza conservada en el caso idealizado', 'Puede haber dificultad de marcha por ataxia sensitiva.'), row('Vibración y posición', 'Disminución bilateral', 'Por debajo de T3.'), row('Dolor y temperatura', 'Conservados en el caso idealizado', 'Las vías anterolaterales permanecen intactas.')],
    affected: entries(columns, sides), spared: entries([...motor, ...pain], sides),
    sources: [...common.sources, 'posterior'], discussion: 'Compara debilidad con ataxia sensitiva y explica por qué cerrar los ojos puede empeorar la estabilidad.'
  };
  if (zone.pattern === 'anterior') return {
    ...common, title: 'Patrón medular anterior',
    case: 'Caso ficticio. Una lesión extensa anterior y lateral en T3 respeta relativamente las columnas posteriores. El contorno dibujado es orientativo y no reproduce un territorio vascular medido.',
    question: '¿Qué combinación sería más coherente?',
    options: ['Pérdida de vibración y posición con fuerza intacta.', 'Debilidad unilateral y pérdida termoalgésica del lado opuesto.', 'Déficit motor y termoalgésico bilateral bajo la lesión, con vibración y posición relativamente conservadas.'], answer: 2,
    explanation: 'Se comprometen vías motoras y anterolaterales. El respeto relativo de las columnas posteriores permite conservar vibración y propiocepción consciente.',
    anatomy: 'Se representa un daño amplio ventral y lateral, incluyendo astas anteriores. Solo se resaltan las vías principales de la comparación.',
    connectivity: 'Se interrumpe la conducción corticoespinal descendente y espinotalámica ascendente de ambos lados; las columnas posteriores quedan relativamente respetadas.',
    function: 'Compara movimiento y sensibilidad termoalgésica con vibración y posición.',
    clinical: 'Este patrón puede asociarse con isquemia, entre otras causas. El dibujo no identifica la causa ni estima gravedad, recuperación o perfusión. El shock medular puede modificar los signos iniciales.',
    signs: [row('Movimiento', 'Déficit bilateral', 'Por debajo de T3; las astas anteriores pueden dar signos segmentarios.'), row('Vibración y posición', 'Relativamente conservadas', 'En este patrón que respeta las columnas posteriores.'), row('Dolor y temperatura', 'Disminución bilateral', 'Por debajo de la lesión; el límite sensitivo no coincide necesariamente con T3.')],
    affected: entries([...motor, ...pain], sides), spared: entries(columns, sides),
    sources: [...common.sources, 'anterior'], discussion: 'Pregunta qué modalidad conservada permite distinguir este patrón de una lesión transversal extensa.'
  };
  return {
    ...common, title: 'Patrón comisural termoalgésico',
    case: 'Caso ficticio. Una pequeña lesión centrada en la comisura blanca anterior de la región torácica interrumpe fibras termoalgésicas que están cruzando. Las vías largas del entorno se respetan en este ejercicio.',
    question: '¿Qué cambio sensitivo explica mejor esa localización?',
    options: ['Pérdida bilateral de dolor y temperatura en una distribución segmentaria del tronco, con vibración y posición conservadas.', 'Pérdida bilateral de vibración en toda la parte inferior del cuerpo.', 'Parálisis de ambas manos por lesión de sus motoneuronas en T3.'], answer: 0,
    explanation: 'Se dañan fibras que cruzan desde ambos lados en la región comprometida. La pérdida es disociada y segmentaria, no necesariamente de toda la sensibilidad termoalgésica bajo T3.',
    anatomy: 'La comisura blanca anterior está ventral al conducto central. Es distinta de la comisura gris y de la lámina X.',
    connectivity: 'Las neuronas de proyección del asta dorsal envían axones al sistema anterolateral contralateral a través de esta región.',
    function: 'El ejercicio estudia el cruce de señales de dolor y temperatura.',
    clinical: 'Una lesión central que se expande puede involucrar otras estructuras. Este ejemplo aislado no equivale al síndrome medular central traumático ni confirma siringomielia. T3 no produce por sí solo un patrón en las manos.',
    signs: [row('Movimiento', 'Conservado en el caso idealizado', 'Las vías corticoespinales y las astas motoras se respetan.'), row('Vibración y posición', 'Conservadas', 'Las columnas posteriores se respetan.'), row('Dolor y temperatura', 'Disminución bilateral segmentaria', 'En una banda torácica orientativa; no es un mapa de dermatomas exactos.')],
    affected: [{ id: 'white-commissure', side: 'both' }], spared: entries(all, sides),
    sources: ['anatomy', 'sensory', 'commissure'], discussion: 'Distingue fibras que están cruzando de fibras que ya ascienden en el cordón lateral.'
  };
}

/** Estado efímero. Cambiar de caso elimina respuesta y revelación previas. */
export function updateLesionState(state, action) {
  if (action.type === 'select') {
    lesionLesson(action.id); // Verifica el identificador antes de actualizar.
    return { ...state, zone: action.id, choice: null, reveal: false };
  }
  if (action.type === 'answer' && state.choice === null) {
    const lesson = lesionLesson(state.zone);
    if (!Number.isInteger(action.choice) || action.choice < 0 || action.choice >= lesson.options.length) return state;
    return { ...state, choice: action.choice, reveal: true };
  }
  if (action.type === 'teacher') return { ...state, teacher: action.value, reveal: false };
  if (action.type === 'reveal' && state.teacher) return { ...state, reveal: !state.reveal };
  if (action.type === 'reset') return { ...state, choice: null, reveal: false };
  return state;
}
export const lesionExplanationVisible = state => state.teacher ? state.reveal : state.choice !== null;
