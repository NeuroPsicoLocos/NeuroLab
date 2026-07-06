# Integracion con NeuroMorpho.org

Este documento define la ruta para convertir NeuroCell Explorer en un visor capaz de usar reconstrucciones neuronales reales procedentes de NeuroMorpho.org.

## Objetivo

Usar NeuroMorpho.org como fuente de morfologias neuronales reales, especialmente archivos `.swc`, para que la celula renderizada no dependa solo de generacion procedural. La visualizacion 3D debe conservar trazabilidad cientifica: especie, region, tipo celular, laboratorio/archivo, articulo original y NeuroMorpho.Org ID cuando este disponible.

## Fuente de datos

NeuroMorpho.org ofrece una API oficial para consultar informacion de neuronas, morphometria y literatura mediante solicitudes HTTP `GET`.

- API oficial: https://neuromorpho.org/apiReference.html
- Terminos de uso: https://neuromorpho.org/useterm.jsp

Consulta realizada el 30 de junio de 2026: NeuroMorpho.Org muestra la version 8.6.121, liberada el 30 de junio de 2026, con 297868 celulas.

Segun sus terminos de uso, el acceso programatico debe realizarse mediante la API para metadatos y mediante URLs directas para archivos `.swc` o auxiliares. No se debe automatizar scraping de paginas `.jsp`.

## Licencia y atribucion

NeuroMorpho.Org indica licencia Creative Commons Attribution 4.0 International License. Para usar datos descargados en publicaciones, materiales docentes o entregables derivados, se debe conservar atribucion clara.

Cada reconstruccion importada deberia guardar:

- NeuroMorpho.Org ID;
- nombre completo del repositorio: `NeuroMorpho.Org`;
- RRID: `SCR_002145`;
- articulo original de la reconstruccion;
- cita recomendada por NeuroMorpho.Org;
- fecha de descarga;
- URL de metadatos;
- URL del archivo `.swc`.

## Estructura propuesta

```text
neurocell-lab-3d/
├── data/
│   └── neuromorpho/
│       ├── manifest.json
│       └── swc/
├── docs/
│   └── NEUROMORPHO_INTEGRATION.md
└── src/
    ├── swcParser.js
    ├── neuromorphoLoader.js
    └── swcRenderer.js
```

## Formato SWC

Un archivo SWC representa una reconstruccion como un arbol de puntos. Cada fila describe un nodo con:

```text
n T x y z R P
```

- `n`: identificador del nodo;
- `T`: tipo anatomico del compartimento;
- `x, y, z`: coordenadas espaciales, usualmente en micrometros;
- `R`: radio local;
- `P`: nodo padre, con `-1` para la raiz.

## Pipeline tecnico

1. Consultar la API de NeuroMorpho.org para seleccionar neuronas por tipo celular, region, especie o archivo.
2. Guardar metadatos normalizados en `data/neuromorpho/manifest.json`.
3. Descargar el archivo `.swc` usando URL directa.
4. Parsear el SWC y reconstruir el arbol padre-hijo.
5. Convertir coordenadas en micrometros a unidades Three.js.
6. Separar soma, dendritas, axon y ramas segun los codigos SWC y metadatos disponibles.
7. Renderizar cada rama como una malla tubular continua de radio variable.
8. Suavizar uniones soma-dendrita con ensanchamiento proximal y blending visual.
9. Agregar materiales de membrana, textura anatomica sutil y etiquetas docentes.
10. Mantener un aviso visible cuando la superficie renderizada sea una interpolacion visual sobre un esqueleto SWC.

## Limitacion cientifica importante

El SWC conserva geometria esqueletica y radios locales, pero no necesariamente contiene membrana real, textura ultrastructural, espinas completas ni volumen segmentado a nivel confocal. Por eso NeuroCell Explorer debe distinguir:

- reconstruccion morfologica real: coordenadas, topologia y radios procedentes de SWC;
- render cinematografico: superficie, material, membrana, espinas interpoladas y efectos visuales;
- simulacion funcional: actividad didactica no equivalente a un modelo biofisico compartimental, salvo que se implemente explicitamente.

## Primera implementacion integrada

La primera reconstruccion real integrada es:

- NeuroMorpho.Org ID: `10037`
- Nombre: `oi57rpy2-1`
- Archivo: `Kisvarday`
- Tipo celular: piramidal / principal cell
- Region: neocortex, occipital, layer 2-3
- Especie: gato
- Dominio: dendritas, soma y axon
- Archivo local: `data/neuromorpho/swc/oi57rpy2-1.CNG.swc`
- Metadatos locales: `data/neuromorpho/metadata/oi57rpy2-1.json`
- Manifiesto: `data/neuromorpho/manifest.json`

El parser local detecta 8024 nodos, 210 segmentos, 71 segmentos dendriticos y 139 segmentos axonales. Por rendimiento, la interfaz puede renderizar una seleccion progresiva controlada por el parametro de complejidad, manteniendo el archivo completo en el repositorio.

La segunda reconstruccion real integrada es:

- NeuroMorpho.Org ID: `130610`
- Nombre: `2017-19-07-slice-4-cell7-rotated`
- Archivo: `Tolias`
- Tipo celular: interneuron, Martinotti, Somatostatin (SOM)-positive
- Region: neocortex, occipital, primary visual, layer 4
- Especie: raton
- Dominio: dendritas, soma y axon
- Archivo local: `data/neuromorpho/swc/2017-19-07-slice-4-cell7-rotated.CNG.swc`
- Metadatos locales: `data/neuromorpho/metadata/2017-19-07-slice-4-cell7-rotated.json`

El parser local detecta 15740 nodos, 287 segmentos, 32 segmentos dendriticos y 255 segmentos axonales.

Despues se puede agregar:

- buscador por especie, region y tipo celular usando la API;
- comparacion entre morfologia procedural e importada;
- modo docente con etiquetas anatomicas;
- modo estudiante con preguntas sobre compartimentos;
- exportacion de escena;
- soporte WebXR/VR.
