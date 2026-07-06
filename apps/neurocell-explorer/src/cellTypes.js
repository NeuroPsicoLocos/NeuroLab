export const cellTypes = {
  pyramidal: {
    name: "Neurona piramidal cortical, capa V",
    reconstruction: {
      format: "SWC",
      status: "NeuroMorpho.Org ID 10037",
      path: "data/neuromorpho/swc/oi57rpy2-1.CNG.swc",
      metadataPath: "data/neuromorpho/metadata/oi57rpy2-1.json",
      neuronId: 10037,
      neuronName: "oi57rpy2-1",
      archive: "Kisvarday",
      sourceUrl: "https://neuromorpho.org/dableFiles/kisvarday/CNG%20version/oi57rpy2-1.CNG.swc",
      metadataUrl: "https://neuromorpho.org/api/neuron/id/10037",
      note: "Reconstrucción real descargada de NeuroMorpho.org. La superficie 3D es una interpolación visual sobre el esqueleto SWC."
    },
    atlas: {
      image: "assets/atlas/pyramidal-neuron-atlas.png",
      caption: "Referencia IA para neurona piramidal cortical: dendrita apical, dendritas basales, espinas dendríticas, segmento inicial del axón y proceso astrocítico."
    },
    morphologyStyle: "pyramidal-realistic",
    layerLabels: {
      branches: "Dendritas",
      spines: "Espinas dendríticas",
      axon: "Axón",
      addBranch: "+ dendrita",
      removeBranch: "- dendrita",
      complexity: "Complejidad dendrítica",
      spineDensity: "Densidad de espinas"
    },
    colors: {
      soma: 0xb7bdc4,
      dendrite: 0x8d8ca3,
      apical: 0x8d8ca3,
      basal: 0x8fa8c4,
      axon: 0x87ad8c,
      axonInitial: 0x4f9a73,
      spine: 0xb98b97,
      astrocyteProcess: 0x9bbeb0,
      excitation: 0xf0b04d,
      inhibition: 0x4f8bc9,
      spike: 0xffd25b
    },
    somaScale: [0.86, 1.22, 0.74],
    dendrites: [
      [[0, 0.64, 0], [0.04, 1.22, -0.03], [0.0, 2.05, -0.08], [0.08, 2.96, -0.16], [0.0, 4.05, -0.22], [0.15, 5.05, -0.3]],
      [[0.02, 2.15, -0.08], [-0.52, 2.62, 0.1], [-1.18, 2.95, 0.18], [-1.92, 3.18, 0.15], [-2.55, 3.28, 0.05]],
      [[0.05, 2.75, -0.14], [0.58, 3.14, -0.24], [1.22, 3.42, -0.3], [1.95, 3.52, -0.26], [2.62, 3.45, -0.2]],
      [[-0.18, 0.0, 0.05], [-0.95, 0.05, 0.18], [-1.82, -0.1, 0.25], [-2.65, -0.38, 0.18], [-3.32, -0.78, 0.05]],
      [[0.16, 0.0, 0.06], [0.96, 0.0, -0.12], [1.82, -0.18, -0.28], [2.55, -0.52, -0.35], [3.18, -0.94, -0.42]],
      [[-0.08, -0.2, -0.12], [-0.52, -0.88, -0.34], [-1.05, -1.48, -0.46], [-1.68, -1.95, -0.48], [-2.25, -2.3, -0.38]],
      [[0.1, -0.2, 0.12], [0.58, -0.82, 0.32], [1.18, -1.32, 0.42], [1.9, -1.65, 0.48], [2.55, -1.82, 0.38]]
    ],
    axon: [[-0.06, -0.58, 0], [-0.14, -1.28, -0.08], [-0.05, -2.08, -0.18], [0.18, -2.92, -0.12], [0.45, -3.78, 0.05], [0.8, -4.58, 0.12]]
  },
  multipolar: {
    name: "Interneurona Martinotti cortical SOM+",
    reconstruction: {
      format: "SWC",
      status: "NeuroMorpho.Org ID 130610",
      path: "data/neuromorpho/swc/2017-19-07-slice-4-cell7-rotated.CNG.swc",
      metadataPath: "data/neuromorpho/metadata/2017-19-07-slice-4-cell7-rotated.json",
      neuronId: 130610,
      neuronName: "2017-19-07-slice-4-cell7-rotated",
      archive: "Tolias",
      sourceUrl: "https://neuromorpho.org/dableFiles/tolias/CNG%20version/2017-19-07-slice-4-cell7-rotated.CNG.swc",
      metadataUrl: "https://neuromorpho.org/api/neuron/id/130610",
      note: "Reconstrucción real de interneurona Martinotti SOM+ descargada de NeuroMorpho.org. La superficie 3D es una interpolación visual sobre el esqueleto SWC."
    },
    atlas: {
      image: "assets/atlas/multipolar-interneuron-atlas.png",
      caption: "Referencia IA para interneurona multipolar. La escena 3D usa una reconstrucción real Martinotti SOM+ de NeuroMorpho.org."
    },
    layerLabels: {
      branches: "Dendritas",
      spines: "Contactos sinápticos",
      axon: "Axón",
      addBranch: "+ dendrita",
      removeBranch: "- dendrita",
      complexity: "Complejidad dendrítica",
      spineDensity: "Densidad de contactos"
    },
    colors: {
      soma: 0xb8b1a7,
      dendrite: 0x8b94a6,
      axon: 0x84aa87,
      spine: 0xb98b97,
      excitation: 0xd0a35f,
      inhibition: 0x4f8bc9,
      spike: 0x86d2c4
    },
    somaScale: [1, 1, 1],
    dendrites: [
      [[0, 0.45, 0], [-0.85, 1.1, 0.25], [-1.8, 1.55, 0.2], [-2.65, 1.7, 0.35]],
      [[0.35, 0.25, 0], [1.1, 0.9, -0.2], [2.05, 1.15, -0.25], [2.9, 1.35, -0.1]],
      [[0.45, -0.05, 0.05], [1.35, -0.3, 0.18], [2.1, -0.8, 0.15], [2.65, -1.35, 0.25]],
      [[-0.42, -0.1, 0], [-1.2, -0.45, -0.15], [-1.9, -1.05, -0.1], [-2.55, -1.55, -0.25]],
      [[-0.05, 0.45, -0.2], [-0.15, 1.25, -0.45], [0.15, 2.05, -0.35], [0.1, 2.8, -0.55]]
    ],
    axon: [[0.15, -0.5, 0], [0.35, -1.2, -0.35], [0.15, -2.0, -0.55], [-0.45, -2.65, -0.6]]
  },
  purkinje: {
    name: "Célula de Purkinje cerebelosa",
    reconstruction: {
      format: "SWC",
      status: "NeuroMorpho.Org ID 10071",
      path: "data/neuromorpho/swc/Purkinje-slice-ageP35-4.CNG.swc",
      metadataPath: "data/neuromorpho/metadata/Purkinje-slice-ageP35-4.json",
      neuronId: 10071,
      neuronName: "Purkinje-slice-ageP35-4",
      archive: "Dusart",
      sourceUrl: "https://neuromorpho.org/dableFiles/dusart/CNG%20version/Purkinje-slice-ageP35-4.CNG.swc",
      metadataUrl: "https://neuromorpho.org/api/neuron/id/10071",
      note: "Reconstrucción real de dendritas y soma descargada de NeuroMorpho.org. El archivo no incluye axón; el render no inventa una reconstrucción axonal."
    },
    atlas: {
      image: "assets/atlas/purkinje-neuron-atlas.png",
      caption: "Vista de referencia NeuroMorpho.org para una célula de Purkinje murina del archivo Dusart."
    },
    morphologyStyle: "purkinje-realistic",
    rendering: {
      sectionMultiplier: 28,
      maxDendriticSections: 180,
      spineMultiplier: 0.42
    },
    layerLabels: {
      branches: "Árbol dendrítico planar",
      spines: "Espinas dendríticas densas",
      axon: "Axón no reconstruido",
      addBranch: "+ rama planar",
      removeBranch: "- rama planar",
      complexity: "Densidad del árbol visible",
      spineDensity: "Densidad de espinas"
    },
    colors: {
      soma: 0xc6b3a0,
      dendrite: 0x9e8ca8,
      axon: 0x86a77f,
      spine: 0xc596a2,
      excitation: 0xf0b04d,
      inhibition: 0x5a8bd4,
      spike: 0xffd25b
    },
    somaScale: [1.08, 1.32, 0.82],
    dendrites: [
      [[0, 0.48, 0], [0.2, 1.25, 0], [-0.2, 2.2, 0.1], [0.1, 3.15, 0.05]],
      [[0, 1.2, 0], [-0.9, 2.0, 0.08], [-1.8, 2.75, 0.12], [-2.8, 3.35, 0.08]],
      [[0, 1.3, 0], [0.9, 2.0, -0.08], [1.8, 2.75, -0.12], [2.8, 3.35, -0.08]]
    ],
    axon: []
  },
  astrocyte: {
    name: "Astrocito protoplásmico",
    layerLabels: {
      branches: "Procesos gliales",
      spines: "Contactos perisápticos",
      axon: "Axón",
      addBranch: "+ proceso",
      removeBranch: "- proceso",
      complexity: "Complejidad de procesos",
      spineDensity: "Densidad de contactos"
    },
    colors: {
      soma: 0x8dbfb6,
      dendrite: 0x78aaa1,
      axon: 0x6c8ea4,
      spine: 0x9b68a8
    },
    somaScale: [1.05, 0.95, 1.05],
    dendrites: [
      [[0, 0.3, 0], [-0.7, 1, 0.1], [-1.45, 1.35, 0.28], [-2.1, 1.35, 0.4]],
      [[0.3, 0.2, 0], [1.05, 0.9, -0.15], [1.7, 1.2, -0.4], [2.25, 1.05, -0.55]],
      [[0.45, 0, 0.1], [1.1, -0.25, 0.3], [1.75, -0.75, 0.4], [2.35, -1.2, 0.6]],
      [[-0.4, -0.1, -0.05], [-1.1, -0.45, -0.2], [-1.7, -1.0, -0.35], [-2.3, -1.55, -0.4]],
      [[0, 0.1, 0.4], [0.15, 0.55, 1.0], [0.0, 0.85, 1.55], [-0.3, 1.0, 2.0]],
      [[0, -0.1, -0.35], [0.25, -0.55, -0.9], [0.4, -0.85, -1.55], [0.55, -1.1, -2.1]]
    ],
    axon: []
  },
  microglia: {
    name: "Microglía ramificada",
    layerLabels: {
      branches: "Procesos microgliales",
      spines: "Puntas de vigilancia",
      axon: "Axón",
      addBranch: "+ proceso",
      removeBranch: "- proceso",
      complexity: "Complejidad de procesos",
      spineDensity: "Densidad de puntas"
    },
    colors: {
      soma: 0xb69b63,
      dendrite: 0xc0a870,
      axon: 0x6c8ea4,
      spine: 0xe0b04f
    },
    somaScale: [0.82, 0.68, 0.74],
    dendrites: [
      [[0, 0.28, 0], [-0.55, 0.95, 0.22], [-1.3, 1.35, 0.38], [-2.05, 1.42, 0.32]],
      [[0.18, 0.25, -0.08], [0.9, 0.85, -0.35], [1.6, 1.05, -0.55], [2.25, 0.92, -0.72]],
      [[0.33, 0.05, 0.12], [1.05, 0.1, 0.34], [1.75, -0.18, 0.55], [2.42, -0.58, 0.72]],
      [[0.1, -0.28, 0.05], [0.58, -0.95, 0.18], [1.05, -1.55, 0.12], [1.65, -2.1, 0.28]],
      [[-0.32, -0.1, -0.05], [-0.95, -0.45, -0.28], [-1.45, -1.05, -0.5], [-2.08, -1.62, -0.58]],
      [[-0.28, 0.18, 0.1], [-0.95, 0.34, 0.45], [-1.58, 0.25, 0.72], [-2.22, -0.05, 0.92]],
      [[0, 0.05, -0.35], [0.15, 0.45, -1.0], [-0.05, 0.72, -1.62], [-0.38, 0.86, -2.22]],
      [[0.05, -0.04, 0.36], [0.2, -0.35, 0.95], [0.05, -0.72, 1.52], [-0.2, -1.05, 2.05]]
    ],
    axon: []
  }
};

export const scienceContent = {
  pyramidal: {
    anatomy: "Soma piramidal, dendrita apical con penacho distal, dendritas basales y espinas dendríticas. La vista piramidal usa una reconstrucción real en formato SWC de NeuroMorpho.org; la superficie, textura y espinas visibles son interpolaciones docentes sobre ese esqueleto morfológico.",
    connectivity: "Recibe sinapsis excitatorias frecuentes en espinas dendríticas y proyecta un axón hacia otras regiones corticales o subcorticales, según el circuito.",
    function: "Integra entradas excitatorias e inhibitorias en dendritas y soma. El módulo funcional muestra una suma esquemática: si la despolarización supera el umbral, aparece un disparo axonal visual.",
    clinic: "Alteraciones de arborización dendrítica y densidad de espinas se han asociado con trastornos del neurodesarrollo, epilepsia y enfermedades neurodegenerativas."
  },
  multipolar: {
    anatomy: "Interneurona Martinotti SOM+ cortical con soma local, arborización dendrítica y axón reconstruidos desde un archivo SWC real de NeuroMorpho.org. La superficie, membrana y marcadores sinápticos son interpolaciones docentes.",
    connectivity: "Las células Martinotti son interneuronas inhibitorias corticales que suelen contactar dendritas distales y contribuir al control local de neuronas piramidales.",
    function: "Participa en inhibición dendrítica, regulación del balance excitación-inhibición y modulación de actividad cortical recurrente.",
    clinic: "Alteraciones de interneuronas inhibitorias, incluyendo subtipos SOM+, se investigan en epilepsia, trastornos del neurodesarrollo y cambios de excitabilidad cortical."
  },
  purkinje: {
    anatomy: "Neurona principal de la corteza cerebelosa con soma piriforme y un árbol dendrítico muy extenso, denso y relativamente planar. Esta entrada usa una reconstrucción real de NeuroMorpho.org con dendritas completas; el archivo seleccionado no contiene axón.",
    connectivity: "Recibe entradas excitatorias de fibras paralelas y trepadoras en su arborización dendrítica, además de modulación inhibitoria local. Su salida real es inhibitoria hacia núcleos cerebelosos profundos, aunque el axón no está reconstruido en este SWC.",
    function: "Integra patrones temporales y espaciales de entrada cerebelosa. En esta versión se enfatiza la anatomía somatodendrítica; la simulación de disparo axonal queda desactivada porque el dataset no incluye axón.",
    clinic: "La vulnerabilidad de células de Purkinje se estudia en ataxias, trastornos del neurodesarrollo, daño cerebeloso, canalopatías y enfermedades neurodegenerativas con compromiso motor y cognitivo."
  },
  astrocyte: {
    anatomy: "Célula glial con soma central y procesos radiales. En la realidad, los astrocitos presentan dominios finos muy complejos que aquí se representan de forma esquemática.",
    connectivity: "Contacta sinapsis, vasos sanguíneos y otros elementos gliales. Sus procesos participan en la homeostasis del microambiente neural.",
    function: "Regula potasio, neurotransmisores, metabolismo y soporte sináptico; también participa en señalización neuroglial.",
    clinic: "La reactividad astrocitaria aparece en lesión, neuroinflamación, epilepsia y enfermedades neurodegenerativas."
  },
  microglia: {
    anatomy: "Célula glial inmunocompetente con soma pequeño y procesos finos, móviles y ramificados. El modelo muestra una microglía ramificada en vigilancia; no representa una reconstrucción real ni una célula ameboide activada.",
    connectivity: "No forma circuitos axodendríticos como una neurona. Sus procesos contactan sinapsis, neuritas, vasos y otras células gliales de manera dinámica.",
    function: "Participa en vigilancia del microambiente, respuesta inmune, poda sináptica, remodelado de circuitos y eliminación de detritos celulares.",
    clinic: "La activación microglial y la neuroinflamación se estudian en lesión, dolor crónico, epilepsia, enfermedades neurodegenerativas y trastornos del neurodesarrollo."
  }
};

export const quiz = {
  question: "¿Qué estructura aumenta la superficie postsináptica y suele recibir contactos excitatorios?",
  answers: [
    { text: "Espina dendrítica", correct: true },
    { text: "Vaina de mielina", correct: false },
    { text: "Nodo de Ranvier", correct: false }
  ]
};
