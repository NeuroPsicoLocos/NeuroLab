# NeuroCell Explorer

Plataforma de atlas tridimensional para explorar celulas del sistema nervioso en neurociencias. Esta primera version combina modelos 3D manipulables, atlas visual 2D, capas anatomicas, modo estudiante y modo docente.

## Objetivo

Construir una biblioteca web, modular y mantenible, para una futura plataforma de simulaciones celulares 3D y visualizacion con WebXR/VR.

## Caracteristicas

- Proyecto estatico compatible con GitHub Pages.
- HTML, CSS y JavaScript vanilla.
- Escena 3D con Three.js.
- Selector de tipo celular:
  - neurona piramidal cortical, capa V;
  - interneurona multipolar;
  - celula de Purkinje cerebelosa;
  - astrocito protoplasmico;
  - microglia ramificada.
- Capas independientes:
  - soma;
  - dendritas;
  - espinas dendriticas;
  - axon;
  - actividad funcional;
  - contexto glial;
  - etiquetas.
- Vista piramidal inspirada en formato atlas:
  - dendrita apical diferenciada;
  - dendritas basales diferenciadas;
  - segmento inicial del axon resaltado;
  - espinas tipo mushroom y thin;
  - proceso astrocitico cercano;
  - panel de detalle con leyenda anatomica.
- Panel de atlas visual con imagenes generadas por IA para:
  - neurona piramidal cortical;
  - interneurona multipolar.
- Controles de visualizacion:
  - iluminacion clinica, contraste histologico y campo oscuro;
  - transparencia de membrana;
  - etiquetas dinamicas.
- Panel de procedencia cientifica para reconstrucciones reales:
  - NeuroMorpho.Org ID;
  - archivo, especie, region y dominio;
  - DOI del articulo original;
  - conteo de nodos y segmentos SWC;
  - aviso de diferencia entre dato morfologico real y render docente.
- Vista especializada de interneurona Martinotti SOM+:
  - panel anatomo-funcional propio;
  - varicosidades axonales inhibitorias esquematicas;
  - textos funcionales diferenciados de la neurona piramidal;
  - controles rotulados como contactos sinapticos en lugar de espinas dendriticas.
- Modulo funcional esquematico para neuronas:
  - estimulo excitatorio;
  - estimulo inhibitorio;
  - potencial de membrana didactico;
  - disparo axonal visual al superar umbral.
- Modo estudiante con autoevaluacion.
- Modo docente con control de complejidad dendritica y densidad de espinas.
- Arquitectura modular para agregar nuevos tipos celulares.

## Advertencia cientifica

Los modelos incluidos son representaciones visuales educativas. No son reconstrucciones anatomicas reales ni simulaciones biofisicas. Las proporciones, grosores, ramificaciones, distribucion de espinas y dinamica electrica se simplifican para facilitar la ensenanza.

Las imagenes del panel de atlas son referencias visuales generadas por IA y se usan como apoyo docente. No deben interpretarse como micrografias, reconstrucciones volumetricas ni evidencia experimental.

## Disclosure NeuroPsicoLocos

NeuroCell Explorer es un recurso educativo y de visualizacion cientifica desarrollado por NeuroPsicoLocos. No sustituye evaluacion clinica, diagnostico medico ni simulaciones biofisicas validadas.

Cuando se indique procedencia NeuroMorpho.Org, el esqueleto SWC y los radios locales provienen de datos morfologicos reales. Las superficies renderizadas, materiales, espinas dendriticas, marcadores sinapticos y actividad visual son interpolaciones docentes.

Contacto: admin@neuropsicolocos.com

## Generador organico

El generador neuronal fue reescrito para evitar que el modelo final se perciba como cilindros, esferas o conos conectados. Las celulas se construyen con `BufferGeometry` personalizada:

- soma irregular con relieve de membrana;
- dendritas y axones como superficies tubulares continuas sobre curvas Catmull-Rom;
- radio variable con disminucion progresiva;
- ensanchamiento proximal para suavizar la emergencia desde el soma;
- bifurcaciones organicas y collaterales curvos;
- espinas dendriticas con longitud, orientacion, cabeza y cuello variables;
- textura geometrica sutil para evitar superficies lisas.

La prioridad de esta version es la calidad anatomica visual sobre el rendimiento.

Para una version mas anatomica, el siguiente paso recomendado es importar morfologias reales en formato `.swc` y renderizarlas como arboles 3D.

## NeuroMorpho.org

La ruta de desarrollo ya contempla usar NeuroMorpho.org como fuente de morfologias reales. La integracion propuesta esta documentada en `docs/NEUROMORPHO_INTEGRATION.md` e incluye:

- consulta de metadatos con la API oficial;
- descarga responsable de archivos `.swc` mediante URLs directas;
- manifiesto local con especie, region, tipo celular, archivo, NeuroMorpho.Org ID y cita original;
- parser SWC para renderizar arboles neuronales reales como superficies 3D continuas;
- distincion explicita entre reconstruccion morfologica real, render visual e interpretacion funcional.

La neurona piramidal ya incluye una reconstruccion real descargada de NeuroMorpho.Org:

- NeuroMorpho.Org ID: `10037`
- Nombre: `oi57rpy2-1`
- Archivo: `Kisvarday`
- Tipo celular: piramidal / celula principal
- Region: neocortex, occipital, capa 2-3
- Especie: gato
- Dominio: dendritas, soma y axon
- Integridad fisica: dendritas y axon completos

El archivo SWC local esta en `data/neuromorpho/swc/oi57rpy2-1.CNG.swc`, los metadatos oficiales estan en `data/neuromorpho/metadata/oi57rpy2-1.json` y el manifiesto de procedencia esta en `data/neuromorpho/manifest.json`.

Nota importante: el esqueleto SWC y radios locales provienen de NeuroMorpho.Org. La membrana renderizada, materiales, suavizado y espinas visibles son interpolaciones docentes sobre esa reconstruccion.

La interneurona tambien usa una reconstruccion real descargada de NeuroMorpho.Org:

- NeuroMorpho.Org ID: `130610`
- Nombre: `2017-19-07-slice-4-cell7-rotated`
- Archivo: `Tolias`
- Tipo celular: interneurona Martinotti / Somatostatin (SOM)-positive
- Region: neocortex, occipital, primary visual, layer 4
- Especie: raton
- Dominio: dendritas, soma y axon
- Integridad fisica: dendritas y axon completos

El archivo SWC local esta en `data/neuromorpho/swc/2017-19-07-slice-4-cell7-rotated.CNG.swc`, los metadatos oficiales estan en `data/neuromorpho/metadata/2017-19-07-slice-4-cell7-rotated.json` y el manifiesto de procedencia esta en `data/neuromorpho/manifest.json`.

La celula de Purkinje tambien usa una reconstruccion real descargada de NeuroMorpho.Org:

- NeuroMorpho.Org ID: `10071`
- Nombre: `Purkinje-slice-ageP35-4`
- Archivo: `Dusart`
- Tipo celular: Purkinje / celula principal
- Region: cerebellum, cerebellar cortex, Purkinje layer
- Especie: raton
- Dominio: dendritas, soma, sin axon
- Integridad fisica: dendritas completas

El archivo SWC local esta en `data/neuromorpho/swc/Purkinje-slice-ageP35-4.CNG.swc`, los metadatos oficiales estan en `data/neuromorpho/metadata/Purkinje-slice-ageP35-4.json` y el manifiesto de procedencia esta en `data/neuromorpho/manifest.json`.

Nota importante: este dataset no incluye axon. NeuroCell Explorer no inventa una reconstruccion axonal para esta Purkinje; la vista se concentra en soma y arbol dendritico planar.

## Estructura

```text
neurocell-lab-3d/
├── index.html
├── README.md
├── docs/
│   └── NEUROMORPHO_INTEGRATION.md
├── data/
│   └── neuromorpho/
│       ├── manifest.json
│       ├── metadata/
│       │   ├── oi57rpy2-1.json
│       │   ├── 2017-19-07-slice-4-cell7-rotated.json
│       │   └── Purkinje-slice-ageP35-4.json
│       └── swc/
│           ├── oi57rpy2-1.CNG.swc
│           ├── 2017-19-07-slice-4-cell7-rotated.CNG.swc
│           └── Purkinje-slice-ageP35-4.CNG.swc
├── styles/
│   └── main.css
└── src/
    ├── app.js
    ├── cellFactory.js
    ├── cellTypes.js
    ├── swcParser.js
    └── swcSamples.js
```

## Como usar

Abre `index.html` en un navegador moderno. Tambien puedes servir la carpeta con un servidor local:

```bash
python3 -m http.server 8000
```

Luego visita:

```text
http://localhost:8000/neurocell-lab-3d/
```

## Publicacion en GitHub Pages

1. Sube la carpeta `neurocell-lab-3d` a un repositorio de GitHub.
2. Activa GitHub Pages desde la rama principal.
3. Usa la carpeta raiz del repositorio o mueve estos archivos a la raiz si quieres que el laboratorio sea la pagina principal.

## Como agregar un nuevo tipo celular

Edita `src/cellTypes.js` y agrega una nueva entrada en `cellTypes` con:

- `name`: nombre visible;
- `layerLabels`: nombres visibles de procesos, puntas/espinas y axon;
- `colors`: colores de soma, procesos, axon y puntas/espinas;
- `somaScale`: escala del soma;
- `dendrites`: lista de ramas, cada una con puntos `[x, y, z]`;
- `axon`: puntos del axon, o lista vacia si no aplica.

Tambien agrega su contenido en `scienceContent`, separado en:

1. Anatomia
2. Conectividad
3. Funcion
4. Clinica

Finalmente agrega una opcion en el selector de `index.html`.

## Ruta de desarrollo sugerida

1. Agregar guardado y carga de escenas en JSON.
2. Crear un editor de ramas con clics sobre la escena.
3. Importar archivos `.swc`.
4. Agregar bibliografia por tipo celular.
5. Incluir actividad electrica simplificada.
6. Preparar compatibilidad WebXR para lentes VR.

## Bibliografia inicial sugerida

- Shepherd GM. *The Synaptic Organization of the Brain*. Oxford University Press.
- Kandel ER, Koester JD, Mack SH, Siegelbaum SA. *Principles of Neural Science*. McGraw-Hill.
- NeuroMorpho.Org: repositorio de morfologias neuronales reconstruidas.
