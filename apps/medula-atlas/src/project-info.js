/** Identidad y criterios editoriales. Añadir personas solo con datos confirmados. */
export const projectInfo = {
  name: 'Médula · Atlas interactivo',
  tagline: 'Explorar, contrastar y enseñar neurociencias.',
  introduction: 'Somos NeuroPsicoLocos. Desarrollamos recursos para aprender neurociencias, explorar modelos y trabajar con datos. Simu-LAB reúne nuestros laboratorios digitales; los modelos imprimibles llevan parte de esa experiencia al aula.',
  purpose: 'Médula amplía esta colección con un atlas de regiones medulares, protección vertebral, meninges, raíces nerviosas y vías. Compartimos un mismo propósito: conectar anatomía, función y clínica, hacer visibles las fuentes y distinguir las observaciones de las simplificaciones docentes.',
  portal: { label: 'Explorar Simu-LAB', url: 'https://neurolab.neuropsicolocos.com/' },
  people: [],
  contact: { label: 'admin@neuropsicolocos.com', url: 'mailto:admin@neuropsicolocos.com' },
  // Enlaces públicos comprobados; los modelos físicos se ofrecen como descarga local.
  modules: [
    { title: 'NeuroCell Explorer', type: 'Células y tejidos', metadata: 'Atlas 3D', text: 'Explora células del sistema nervioso y reconstrucciones neuronales con su procedencia científica.', action: 'Abrir explorador', url: 'https://neurolab.neuropsicolocos.com/apps/neurocell-explorer/' },
    { title: 'PSP Lab', type: 'Fisiología y aprendizaje', metadata: 'Simulación docente', text: 'Practica la lectura de respuestas evocadas con señales sintéticas, pistas y modos estudiante y docente.', action: 'Abrir PSP Lab', url: 'https://neurolab.neuropsicolocos.com/apps/psp-lab/' },
    { title: 'Electrophysiology Lab', type: 'Datos experimentales', metadata: 'Beta metodológica', text: 'Abre registros locales, revisa señales y conserva métricas, controles de calidad y decisiones del análisis.', action: 'Abrir laboratorio', url: 'https://neurolab.neuropsicolocos.com/apps/electrophysiology-lab/' },
    { title: 'NeuroRuta', type: 'Autoevaluación', metadata: 'Sistema nervioso', text: 'Repasa evolución, desarrollo y organización del sistema nervioso con preguntas y retroalimentación.', action: 'Abrir cuestionario', url: 'https://hromo-parra.github.io/cuestionario-sistema-nervioso/' },
    { title: 'Topological Lab', type: 'Topología y psicoanálisis', metadata: 'Proyecto asociado', text: 'Explora el nudo borromeo y los registros RSI. El portal común presenta esta línea de trabajo y su proyecto asociado.', action: 'Ver en Simu-LAB', url: 'https://neurolab.neuropsicolocos.com/#laboratorios' },
    { title: 'Encéfalo desmontable', type: 'Anatomía tangible', metadata: 'STL y OBJ · geometría aproximada', text: 'Piezas de hemisferios, cerebelo, tronco encefálico y arco vascular, junto con una sección curva. Son modelos docentes para probar forma y ensamblaje.', action: 'Descargar piezas', url: './assets/downloads/encefalo-desmontable.zip' }
  ],
  related: 'La colección también incluye NeuroWave, Paisajes Dinámicos del Cerebro y el simulador de Melanie Klein.',
  principles: [
    ['Aprender explorando', 'El mapa, el modelo y las fichas permiten pasar de la forma a la función. El modo docente y la autoevaluación ofrecen distintas maneras de trabajar el mismo contenido.'],
    ['Fuentes a la vista', 'Las descripciones incluyen bibliografía. Las imágenes externas conservan su autoría, técnica, especie y fuente cuando estos datos están disponibles.'],
    ['Mostrar los límites', 'Los territorios de los tractos y los tejidos añadidos al modelo son esquemáticos. Las imágenes histológicas y las ilustraciones se identifican para que puedas interpretar cada una en su contexto.']
  ],
  production: 'El atlas combina contenido docente, ilustraciones generadas con apoyo de IA, controles SVG y mallas óseas del atlas BodyParts3D. Las nuevas imágenes de sustancia gris proceden de fuentes documentadas; las preparaciones animales se presentan como material comparativo.',
  privacy: 'La autoevaluación funciona en la sesión del navegador. El atlas no pide cuentas ni envía tus respuestas. Los visores externos tienen sus propias condiciones de uso.',
  credits: [
    ['Mallas vertebrales', 'BodyParts3D / DBCLS', 'https://lifesciencedb.jp/bp3d/info_en/index.html'],
    ['Histología y marcadores', 'Veshchitskii, Shkorbatova y Merkulyeva (2022)', 'https://doi.org/10.3389/fnana.2022.1034395'],
    ['Microscopía virtual', 'Histology Guide, Brelje y Sorenson', 'https://histologyguide.org/slidebox/06-nervous-tissue.html']
  ]
};
