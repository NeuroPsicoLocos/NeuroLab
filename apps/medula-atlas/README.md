# Médula · Atlas interactivo (versión 11.0)

Explorador educativo de la médula espinal, su protección vertebral y sus principales vías. Hecho con HTML, CSS y JavaScript, sin framework ni servidor de aplicación. Three.js se utiliza únicamente para el modelo 3D y está incluido localmente.

## Abrir el atlas

El atlas forma parte de [Simu-LAB](https://neurolab.neuropsicolocos.com/). Su ruta pública es [Médula · Atlas interactivo](https://neurolab.neuropsicolocos.com/apps/medula-atlas/). El contenido del atlas está en español; su tarjeta en el portal también está disponible en inglés.

Para revisar la integración en local, desde la raíz del repositorio NeuroLab:

```bash
python3 -m http.server 8005 --bind 127.0.0.1
```

Abre <http://127.0.0.1:8005/apps/medula-atlas/>. El enlace «Todos los laboratorios» vuelve al portal.

En macOS también puedes hacer doble clic en **Abrir atlas.command**. El acceso sirve la raíz del portal y reutiliza una instancia que incluya este atlas. Necesita Python 3, sin paquetes adicionales; elige un puerto entre 8024 y 8034. Deja la ventana de Terminal abierta mientras utilizas el atlas. Desde la carpeta del módulo, `npm run serve` inicia el mismo servidor sin abrir el navegador.

Si abres `index.html` directamente con `file://`, aparece una guía de apertura. Los módulos JavaScript y las mallas necesitan HTTP(S).

## Qué puedes explorar

- Panel vertebral con dos representaciones: lámina anatómica al abrir el atlas y modelo 3D giratorio.
- Puntos seleccionables sobre la lámina para consultar cuerpo vertebral, apófisis espinosa, canal y médula.
- Modelo 3D con mallas de las vértebras T2, T3 y T4 de BodyParts3D, material mate, grano tenue y sombras. El hueso comienza opaco (0 % de transparencia) y el plano transversal oculto.
- Vista ampliada que mantiene giro, selección, vistas y controles. Se cierra con «Volver al atlas» o Escape.
- Vistas oblicua, posterior y superior, transparencia del hueso y visibilidad de capas.
- Vista «Cubiertas» y acceso «Ver cubiertas y raíces» que oculta el hueso para estudiar duramadre, aracnoides, piamadre, espacio con LCR y nervios. Las capas se pueden ocultar por separado.
- Selección de raíces dorsal y ventral, ganglio dorsal y nervio mixto, mediante botones o un clic sobre el modelo.
- Sección «Anatomía» con las cinco regiones medulares, los 31 pares de nervios, cono medular, cola de caballo y filum terminale. Distingue los segmentos medulares de los niveles vertebrales.
- Dos nuevas láminas con volumen, textura ósea y detalle del tejido medular: vista longitudinal y corte con meninges y raíces. Incluyen trece puntos seleccionables y apertura a tamaño completo.
- Botones para cambiar la representación sin perder la estructura seleccionada. Las regiones alternan entre «Lámina anatómica» y «Mapa de estudio», con los 31 pares. Las cubiertas se abren en «Corte interactivo», con selección y zoom sobre la lámina realista.
- Esquema transversal interactivo de meninges, LCR, raíces, ganglio, nervio espinal y sus ramos. Sus fichas incluyen anatomía, conectividad, función, clínica y bibliografía.
- Selección de apófisis espinosa, cuerpo vertebral, canal vertebral y médula. También puedes seleccionar partes del modelo con un clic.
- Corte transversal con diez vías bilaterales y selección por clic, toque o teclado.
- Cuatro láminas regeneradas a partir de las referencias aportadas: vías, continuidad longitudinal, sustancia gris y raíces, y relaciones entre vértebras, meninges y médula.
- Sección «Sustancia gris» con un esquema regional, histología comparativa de las láminas I–V y enlaces a microscopía virtual. Cada recurso indica su técnica, especie y fuente cuando esos datos están disponibles.
- Comparador de cortes C6, T3, L4 y S3, con morfología diferente, astas y núcleos seleccionables y un modo para estudiar las diez láminas de Rexed.
- Zoom de la selección hasta 4×, con orientación anatómica, retorno a la vista completa y fichas de cinco apartados. Las estructuras disponibles cambian por segmento.
- Los cortes C6, T3, L4 y S3 incorporan nuevas láminas realistas con textura de sustancia blanca y gris. T3 también es la base del mapa de vías. El corte de cubiertas usa la lámina anatómica aprobada, ahora con selección y zoom. Los colores transparentes dejan visible el tejido.
- Sección «Quiénes somos» con la identidad común de NeuroPsicoLocos / Simu-LAB, contacto, criterios editoriales y accesos a otros módulos. Incluye una descarga de los modelos docentes del encéfalo desmontable procedentes de «3D printer».
- Fichas con anatomía, conectividad, función, correlación clínica y bibliografía.
- Filtros de vías sensitivas y motoras y rótulos ocultables para practicar identificación.
- Modo docente con una guía de discusión e impresión de la ficha.
- Autoevaluación de doce preguntas, con explicación tanto para aciertos como para errores.
- Diseño para escritorio y móvil. En móvil, seleccionar un tracto lleva a su ficha; el botón «Volver al corte» permite continuar explorando.

Las vías incluidas son los fascículos grácil y cuneiforme, los tractos corticoespinales lateral y anterior, los espinotalámicos lateral y anterior, los espinocerebelosos posterior y anterior, el vestibuloespinal lateral y una representación agrupada de las vías reticuloespinales.

## Lesiones (versión 11)

Abre [Lesiones](https://neurolab.neuropsicolocos.com/apps/medula-atlas/#lesions). Cinco zonas seleccionables representan cuatro patrones en T3: hemimédula derecha o izquierda (Brown-Séquard), columnas posteriores, región anterior y comisura blanca anterior.

1. Selecciona una zona mediante su botón o el punto numerado del corte (clic, toque, Enter o Espacio).
2. Lee el caso ficticio y elige una respuesta. El mapa resalta vías comprometidas y respetadas; la explicación incluye una tabla de hallazgos y los cinco apartados científicos.
3. Reinicia el caso o cambia de zona para ocultar de nuevo la respuesta. En modo docente puedes mostrar u ocultar vías y explicación sin contestar, con una pregunta de discusión.

El zoom mantiene el encuadre hasta 4×. Cambiar de caso regresa a la vista completa. El estado vive únicamente en memoria, sin cuentas, persistencia ni envío de respuestas.

Arquitectura: `src/lesion-content.js` contiene casos, reglas explícitas de lateralidad, fuentes y transiciones de estado; `src/lesion-geometry.js` reutiliza el corte T3 y los territorios cualitativos del atlas; `src/lesion-page.js` conecta el dibujo y los controles; `lesions.css` define la presentación. No se calculan déficits por intersección de píxeles ni por volumen de lesión.

Se destacan columnas posteriores, vía corticoespinal lateral, vía espinotalámica lateral y fibras comisurales termoalgésicas. No es una lista exhaustiva de estructuras afectadas. El patrón comisural es segmentario y distinto del síndrome medular central traumático. No se estiman dermatomas exactos, gravedad, recuperación, causa ni efectos autonómicos. T3 designa un segmento medular; no se cambia el nivel del mapa ni se establece correspondencia vertebral. Los patrones puros son aproximaciones docentes.

Fuentes revisadas el 3 de octubre de 2026: material universitario de UTHealth y artículos clínicos de Miranda et al. (2007, PMID 17394028), Klakeel et al. (2015, PMID 25552812) y McKinley et al. (2021, PMID 30939076). Cada ficha enlaza sus fuentes. Los casos no reproducen pacientes de esos artículos.

Pruebas específicas: `node --test tests/medula-lesions.test.mjs` desde la raíz del repositorio. Verifican lateralidad, preservación de vías, diferencia entre patrón comisural y vías largas, reinicio y ocultación de respuestas al cambiar de caso o salir del modo docente. Revisión manual: teclado, ambas hemimédulas, acierto/error, cuatro patrones, zoom, modo docente, móvil y navegación previa.

## Alcance anatómico

El mapa de las diez vías en «Explorar» representa un segmento medular torácico alto (T3). El selector de «Sustancia gris» compara cuatro cortes de referencia (C6, T3, L4 y S3) y no modifica ese mapa de tractos. El fascículo cuneiforme está presente en T3, pero no debería copiarse sin cambios a cortes torácicos bajos o lumbares.

Los cuatro cortes de sustancia gris combinan láminas de tejido generadas con IA y territorios SVG docentes, con formas y proporciones cualitativas diferentes. No representan medidas de área, reconstrucciones histológicas ni un atlas de todos los segmentos. Sus límites coloreados son orientativos. Clarke y el asta lateral simpática se muestran solo en T3 entre estos cortes, y el núcleo parasimpático sacro solo en S3. La lámina IX se dibuja en grupos discontinuos y la X rodea el conducto central, que es una cavidad. Las regiones homólogas conservan la selección al cambiar de nivel; una estructura no disponible se desactiva y se informa el cambio de selección.

T3 se refiere al segmento de médula, no a la vértebra T3. El modelo óseo utiliza T2, T3 y T4 del atlas BodyParts3D; el corte docente se estudia por separado y no establece equivalencia entre niveles medulares y vertebrales. El plano 3D muestra la orientación transversal; el SVG amplía y organiza el contenido para estudiarlo.

Las mallas óseas proceden de BodyParts3D / Anatomography 4.3, un atlas de contornos anatómicos. Se conserva su disposición relativa y se aplica una escala uniforme, una rotación de ejes y una subdivisión suave. El conjunto no es una reconstrucción clínica de un paciente. La médula, el espacio del canal, los discos y los grupos de selección son aproximaciones docentes. La textura del material es estética y no reproduce tejido histológico.

Las zonas coloreadas del corte permiten identificar vías y no representan fronteras histológicas exactas. Las vías se solapan y su distribución cambia según el nivel. Las líneas 3D marcan aproximadamente la ubicación bilateral del tracto elegido; no simulan conducción, decusaciones ni axones individuales.

El modelo 3D incorpora cubiertas y dos salidas nerviosas bilaterales entre las tres vértebras. Las meninges, sus aperturas, espesores, filamentos, ganglios y ramos son esquemáticos, con separaciones ampliadas para estudiar sus relaciones. La posición de las raíces no determina segmentos medulares concretos. El modelo omite vasos, ligamentos, costillas y otras vías. La envolvente turquesa señala el espacio del canal vertebral y no representa tejido. El conducto central es la pequeña estructura dentro de la médula, distinta del canal vertebral.

La vista longitudinal representa ocho pares cervicales, doce torácicos, cinco lumbares, cinco sacros y uno coccígeo. El cono se sitúa aproximadamente junto a L1–L2 vertebrales del adulto; las raíces inferiores continúan como cola de caballo. Las líneas y posiciones comparan estas relaciones, sin proporciones reales ni equivalencias precisas entre cada segmento y una vértebra. No son dermatomas. El LCR se distingue del conducto central y ocupa el espacio subaracnoideo entre aracnoides y piamadre. El ganglio sensitivo está en la raíz dorsal; ambos ramos del nervio espinal son mixtos.

Las nuevas imágenes mantienen un estilo común de ilustración médica con fondo marfil y colores suaves. Son ilustraciones docentes generadas con IA a partir de las cuatro imágenes del usuario. Se revisaron la orientación y las relaciones anatómicas generales; no son una reconstrucción histológica exacta. Las bandas de la sustancia gris no permiten asignar por sí solas las láminas I–X de Rexed. El recorrido longitudinal es conceptual y no identifica cuatro niveles medulares exactos.

El mapa de vías utiliza la lámina realista T3 del comparador, un contorno SVG de referencia y una capa independiente para las diez vías. Los territorios se adaptan desde sus coordenadas de referencia y se recortan a la sustancia blanca. Se pueden seleccionar bilateralmente, acercar, filtrar y estudiar con rótulos ocultos. La forma y la distribución siguen siendo esquemáticas y no representan áreas medidas ni límites histológicos precisos. La base ilustrada anterior permanece conservada entre los recursos del atlas.

El mapa de cubiertas reutiliza esa forma torácica como referencia de tejido, con la piamadre siguiendo su contorno. Las otras cubiertas y el espacio con LCR se amplían y separan para estudiar su orden. El acercamiento de una meninge muestra un sector de su contorno; el de una raíz o ganglio encuadra esa estructura. El mapa no establece una correspondencia exacta entre cada raíz dibujada y un segmento medular. Las láminas anatómicas con textura continúan disponibles en su representación propia.

Las correlaciones clínicas son ejemplos docentes. No sustituyen la valoración de un caso real.

Las dos láminas de «Anatomía» son ilustraciones generadas con IA, con fondo marfil, luz suave y textura artística. La vista longitudinal contiene salidas nerviosas representativas, no un recuento de 31 pares; los puntos tampoco delimitan exactamente los segmentos. El «Mapa de estudio» conserva esos recuentos y relaciones. El corte con meninges amplía espesores y separaciones y no representa histología ni un nivel medular específico. Se revisaron la orientación, el cono antes del sacro, la continuidad externa del saco dural, la piamadre junto al tejido medular y la unión de raíces en un nervio mixto. El ganglio aparece solo en la raíz dorsal. Esta revisión visual no equivale a validación clínica o anatómica independiente.

## Estudiar la sustancia gris

«Sustancia gris» comienza con el comparador interactivo de niveles. Puedes seleccionar una estructura o lámina con clic, toque, Enter o espacio. «Acercar selección» enfoca el lado elegido en el dibujo y «Vista completa» devuelve el corte entero. En móvil, seleccionar una región lleva a su ficha y «Volver al corte» permite continuar. El modo docente añade una actividad de comparación.

La sección también complementa el mapa de tractos con dos imágenes descargadas bajo licencias abiertas:

- Un esquema de regiones del asta posterior, zona intermedia, asta anterior y conducto central, de ExplicitImplicity (Wikimedia Commons, CC BY-SA 3.0). Conserva los rótulos originales en inglés; no delimita todas las láminas I–X.
- La figura 4 de Veshchitskii, Shkorbatova y Merkulyeva (2022), *Neurochemical atlas of the cat spinal cord*, DOI [10.3389/fnana.2022.1034395](https://doi.org/10.3389/fnana.2022.1034395), CC BY 4.0. Muestra láminas I–V en gato, con paneles de C1 y L5; no representa histología humana de T3.

Ambas conservan la proporción, los rótulos y las barras de escala originales. Se pueden abrir a tamaño completo. Las licencias, fuentes y hashes están en `assets/gray-matter/LICENSE.md` y `manifest.json`.

Los enlaces de Histology Guide abren preparaciones de gato con violeta de cresilo y conejo con H&E. La guía de Duke permite comparar preparaciones lumbar y torácica, pero la página consultada no identifica su especie. Estos recursos se presentan como histología comparativa.

Las imágenes aportadas de *Spinal Cord*, de Greg Dunn y Brian Edwards, se identifican como neuroarte de un corte medular humano. Se enlaza a la web del autor para consultar la obra; las capturas no se redistribuyen ni se modifican. No deben interpretarse como microfotografías o mapas con límites exactos de las láminas de Rexed.

## Arquitectura y edición

```text
medula-atlas/
├── index.html               Estructura de la interfaz
├── Abrir atlas.command      Acceso local para macOS
├── atlas-health.json        Identificación del atlas para reutilizar su servidor
├── styles.css               Diseño, adaptación móvil e impresión
├── illustrations.css        Estilo del corte ilustrado y galería
├── info-pages.css           Diseño de sustancia gris y presentación del proyecto
├── anatomy.css              Regiones, cubiertas y controles de capas
├── gray-explorer.css        Comparador, selección y zoom de sustancia gris
├── cut-presentation.css     Acabado y controles comunes de los otros cortes
├── src/
│   ├── content.js           Tractos, estructuras, preguntas y bibliografía
│   ├── anatomy-content.js   Regiones, meninges, raíces y sus fuentes
│   ├── anatomy-illustrations.js Láminas, puntos y rótulos de presentación
│   ├── anatomy-page.js      Láminas, mapas SVG seleccionables y fichas
│   ├── spinal-coverings.js  Cubiertas y nervios esquemáticos en Three.js
│   ├── cross-section.js     Dibujo SVG y selección bilateral
│   ├── cut-zoom.js          Encuadre y controles compartidos de acercamiento
│   ├── covering-cut.js      Geometría y sectores de meninges y raíces
│   ├── plate-regions.js     Territorios SVG sobre la base ilustrada
│   ├── illustrations.js     Contenido y fuentes de las cuatro láminas
│   ├── bone-presentation.js Alternancia entre lámina y modelo 3D
│   ├── anatomical-bones.js  Carga de mallas locales y normales
│   ├── model-viewer.js      Diálogo ampliado del mismo visor
│   ├── gray-resources.js    Imágenes, visores, especies, fuentes y licencias
│   ├── gray-level-content.js Segmentos, estructuras, láminas y fuentes científicas
│   ├── gray-level-geometry.js Contornos y territorios SVG docentes
│   ├── realistic-cuts.js    Archivos y colocación de las cuatro láminas de tejido
│   ├── gray-level-explorer.js Estado, selección, fichas y encuadre del corte
│   ├── project-info.js      Identidad, catálogo, contacto y créditos
│   ├── info-pages.js        Presentación de las dos nuevas secciones
│   ├── spine-scene.js       Modelo 3D, cámara, capas y selección
│   ├── app.js               Coordinación de controles, fichas y navegación
│   └── start.js             Aviso al abrir como archivo y arranque por HTTP(S)
├── assets/
│   ├── favicon.svg
│   ├── anatomy/             Dos láminas realistas y manifiesto de generación
│   ├── illustrations/       Cuatro láminas, base interactiva y manifiesto
│   ├── gray-matter/         Esquema, figura científica, manifiesto y licencias
│   ├── downloads/           Encéfalo desmontable y manifiesto de procedencia
│   ├── models/              T2–T4, STL originales, manifiesto y licencia
│   └── vendor/              Three.js 0.165.0, OrbitControls y licencia MIT
├── scripts/prepare_bones.py Preparación reproducible de las mallas
├── scripts/open_atlas.py    Inicio del servidor local y apertura del navegador
├── package.json             Comandos opcionales, sin dependencias de ejecución
└── .nojekyll                Compatibilidad con GitHub Pages
```

Para corregir una descripción, edita el objeto correspondiente de `src/content.js`. Mantén separados los campos `anatomy`, `route`, `crossing`, `function` y `clinical`. Cada vía tiene identificador estable, color, abreviatura y referencias. Las regiones y rótulos se editan en `src/plate-regions.js`, en coordenadas de referencia de 1254 × 1254. `cross-section.js` lleva el centro (627, 640) a (300, 254), aplica factores de dibujo de 0.3 y 0.37, refleja el lado derecho del sujeto y recorta los territorios a la sustancia blanca. Son ajustes docentes, sin escala física. La posición `label` conservada en `content.js` orienta la representación 3D.

Las regiones, cubiertas y raíces se editan en `src/anatomy-content.js`, manteniendo sus cinco apartados y referencias. `buildSpinalSegments()` genera los 31 pares del dibujo; sus coordenadas son docentes. `src/anatomy-page.js` dibuja los dos SVG y coordina la selección con clic, toque, Enter o espacio. Funcionan sin WebGL. `src/spinal-coverings.js` construye las superficies y raíces 3D, mientras `src/spine-scene.js` mantiene cámara, iluminación y selección. Cambia el diseño en `anatomy.css`, sin mezclarlo con las descripciones científicas.

La presentación de las láminas de «Anatomía» se edita en `src/anatomy-illustrations.js`: imágenes, textos alternativos, puntos y posiciones en porcentajes. Los botones, fichas y ambos mapas comparten la misma selección en `src/anatomy-page.js`. Si falla una imagen, su panel cambia al mapa. Los dos PNG y los prompts completos están en `assets/anatomy/`; el manifiesto también conserva dimensiones, hashes, revisión y límites.

`covering-cut.js` coloca la lámina de meninges dentro del SVG y conserva puntos y sectores de acercamiento. No deforma la imagen ni asigna un nivel medular a esa lámina. Los puntos permanecen pequeños al ampliar, para no ocultar el tejido. `cut-zoom.js` encuadra la selección dentro del lienzo, mantiene su proporción y limita el aumento a 4×. Ambos mapas coordinan el zoom con sus fichas; cambiar la representación de cubiertas restaura la vista completa y conserva la estructura. En móvil, la selección lleva a la descripción y el botón de retorno deja accesibles los controles. Su diseño se edita en `cut-presentation.css`.

Para cambiar el texto de las láminas generales, edita `src/illustrations.js`. Los cinco PNG están en `assets/illustrations/`; `generation-manifest.json` conserva los prompts completos, referencias y método de generación. Las referencias originales se conservan en la entrega local independiente y no se sirven desde este repositorio.

Para añadir un recurso de sustancia gris, edita `src/gray-resources.js`. Comprueba su autoría, técnica, especie y condiciones de reutilización antes de copiar la imagen. Si solo se permite consultarla en su web, añade un enlace a `viewers`. El contenido científico se mantiene separado del diseño en `src/info-pages.js` e `info-pages.css`.

El comparador separa cuatro módulos independientes. `gray-level-content.js` contiene las fichas, referencias y disponibilidad por segmento; `resolveGraySelection()` impide conservar una estructura no representada. `gray-level-geometry.js` contiene la forma de cada corte, los territorios seleccionables y el encuadre. `gray-level-explorer.js` coordina el nivel, el modo de contenido, la selección bilateral, la ficha y el zoom, sin WebGL ni nuevas dependencias. El lienzo usa 600 × 480 unidades de dibujo, sin escala física. `realistic-cuts.js` registra los archivos y su colocación; `grayBaseMarkup()` conserva un dibujo de respaldo bajo las imágenes. Las láminas se recortan al contorno docente y los territorios se mantienen separados. Cambia su presentación en `gray-explorer.css` y `cut-presentation.css`.

La identidad y los accesos se editan en `src/project-info.js`. Se reutilizan NeuroPsicoLocos / Simu-LAB y `admin@neuropsicolocos.com`, documentados en el portal y en NeuroCell Explorer. `people` acepta objetos con `name`, `role` e `institution`; los datos de personas o afiliaciones adicionales se incorporan solo cuando están confirmados. Los bloques vacíos permanecen ocultos.

## Colección y otros módulos

El atlas se presenta como parte de la colección de NeuroPsicoLocos. «Quiénes somos» enlaza al portal existente [Simu-LAB](https://neurolab.neuropsicolocos.com/), NeuroCell Explorer, PSP Lab, Electrophysiology Lab, NeuroRuta y la presentación del proyecto asociado Topological Lab. No se duplicaron estas aplicaciones ni se modificó su publicación. Los enlaces públicos devolvieron HTTP 200 el 3 de octubre de 2026; no se repitió la revisión funcional completa de cada laboratorio.

La colección local también contiene NeuroWave, Paisajes Dinámicos del Cerebro y el simulador de Melanie Klein. Sus carpetas y alcances se documentan en [el inventario](docs/module-catalog.md). No se inventaron rutas públicas para estos proyectos.

`assets/downloads/encefalo-desmontable.zip` conserva seis STL, seis OBJ, los dos scripts de generación y el README del proyecto local `3D printer`. El manifiesto registra los hashes de los originales. Se empaquetaron copias, sin modificar la carpeta de origen y sin incluir fotografías. Son geometrías docentes aproximadas; el paquete conserva las limitaciones y medidas necesarias antes de probar un ensamblaje físico.

Para cambiar iluminación, materiales y cámara, edita `src/spine-scene.js`. Las mallas se cargan con `src/anatomical-bones.js`; sus metadatos están en `assets/models/manifest.json`. El eje Y apunta hacia superior, Z hacia anterior y X hacia la izquierda del sujeto. El corte se muestra desde caudal: posterior arriba, anterior abajo y derecha anatómica a la izquierda de la imagen.

La versión 4 sustituye los cuerpos y apófisis procedurales por mallas continuas del atlas. Los tres STL originales se conservan en `assets/models/source/`. La preparación usa únicamente Python estándar:

```bash
python3 scripts/prepare_bones.py
```

El script verifica superficies cerradas, une vértices coincidentes, aplica una subdivisión Loop y prepara tres archivos binarios locales (24 168 triángulos en conjunto, unos 435 KB). Las normales se calculan al cargar. Los grupos de cuerpo, arco y espinosa permiten seleccionar regiones aproximadas de una misma superficie. Los discos se estiman entre planos de los platillos y la curva medular se orienta por centros aproximados de los forámenes; ninguno se presenta como tejido segmentado.

La lámina reutiliza `04-vertebras-meninges-v2.png`, conservada de la versión anterior. `src/model-viewer.js` mueve el mismo visor al diálogo, sin duplicar el contexto WebGL; al cerrar lo devuelve al panel.

El visor dibuja de nuevo cuando cambian la cámara, el tamaño, las capas o la selección. Cuando está quieto conserva la imagen y las sombras calculadas, lo que reduce el trabajo gráfico sin perder el giro con inercia.

`src/bone-presentation.js` controla qué representación se muestra. Los controles de giro, capas y transparencia aparecen solo en el modelo 3D. La ficha de cada estructura es compartida entre ambas vistas y el corte de tractos conserva su funcionamiento. Para ajustar los puntos de la lámina, modifica `--pin-x` y `--pin-y` en `index.html` (porcentajes sobre la imagen completa).

La carga 3D es independiente de la interfaz. Si WebGL no está disponible, se muestra una vista superior 2D y siguen funcionando el mapa, las fichas y la autoevaluación. Los resultados del cuestionario solo viven en la sesión actual; no se envían ni almacenan fuera del navegador.

## Bibliografía

La pestaña Bibliografía y las fichas enlazan directamente a las fuentes. Incluyen materiales docentes de UTHealth, Duke y University of Wisconsin, OpenStax, revisiones anatómicas de NCBI Bookshelf y el artículo de Vedantam et al. (2019), *Somatotopy and Organization of Spinothalamic Tracts in the Human Cervical Spinal Cord*, DOI: [10.1093/neuros/nyy330](https://pubmed.ncbi.nlm.nih.gov/30011044/).

Las fuentes enlazadas respaldan las descripciones. Las láminas de la versión 2 son nuevas ilustraciones basadas en las referencias visuales aportadas por el usuario; las capturas originales no se sirven en el sitio. Three.js y OrbitControls conservan su licencia en `assets/vendor/THREE-LICENSE.txt`.

Las mallas BodyParts3D son © Database Center for Life Science (DBCLS), con licencia [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en). Las mallas adaptadas se distribuyen bajo esa misma licencia. El manifiesto identifica las copias descargadas de Wikimedia Commons y sus hashes; `assets/models/LICENSE.md` documenta atribución y modificaciones. Fuente primaria: [BodyParts3D](https://lifesciencedb.jp/bp3d/info_en/index.html). Publicación: Mitsuhashi et al. (2009), [DOI 10.1093/nar/gkn613](https://doi.org/10.1093/nar/gkn613).

## GitHub Pages

El portal se publica desde `main`, en la raíz del repositorio NeuroPsicoLocos/NeuroLab, bajo el dominio `neurolab.neuropsicolocos.com`. El atlas reside en `apps/medula-atlas/` y usa rutas relativas, recursos locales y navegación con fragmentos (`#explore`, `#anatomy`, `#plates`, `#gray`, `#practice`, `#sources`, `#about`). No requiere una compilación ni servicios adicionales.

Conserva la carpeta completa al desplegar: las licencias, los manifiestos, las mallas y las imágenes son parte del módulo. No utilices Git LFS para sus recursos, porque GitHub Pages no sirve esos objetos.

## Verificación

Desde la carpeta del atlas, `npm run check` comprueba la sintaxis de sus veintitrés archivos JavaScript. Desde la raíz del repositorio, `node --test tests/*.test.mjs` verifica también la tarjeta del portal, las rutas del módulo, sus recursos esenciales y las traducciones del portal. `tests/medula-anatomy.test.mjs` comprueba los 31 pares, los cinco recuentos regionales, el descenso de raíces inferiores, la integridad de las fichas y las claves de las doce preguntas. `tests/medula-gray-levels.test.mjs` comprueba la disponibilidad y continuidad de selección entre segmentos, las fuentes de las fichas y la orientación, proporción y límites del zoom. `tests/medula-cut-zoom.test.mjs` comprueba el encuadre común con diferentes lienzos, la reflexión anatómica de los tractos y los sectores de las ocho estructuras de cubiertas.

La revisión de integración se documenta en [RELEASE_QA.md](../../docs/medula-atlas/RELEASE_QA.md). La evidencia de las versiones anteriores se conserva en la entrega local independiente. No se distribuyen capturas ni dependencias de pruebas dentro del atlas publicado.

La revisión de navegador cubre escritorio y una pantalla móvil de 390 px, la carga del mapa y el modelo WebGL, fichas, sustancia gris, modos docentes y navegación de retorno. No establece compatibilidad con todas las GPU o navegadores.

## Láminas realistas de la versión 10

Las cuatro imágenes `assets/anatomy/corte-c6-v10.png`, `corte-t3-v10.png`, `corte-l4-v10.png` y `corte-s3-v10.png` se generaron con la herramienta integrada de imágenes, usando las siluetas docentes como referencia geométrica y la lámina de meninges como referencia estética. El corte interactivo de cubiertas reutiliza `corte-meninges-v7.png`. Todos los rótulos y zonas seleccionables se dibujan aparte.

`assets/anatomy/generation-manifest-v10.json` conserva los cuatro prompts completos, dimensiones, tamaños y hashes. Los PNG tienen 1402 × 1122 píxeles; sus coordenadas de colocación se editan en `src/realistic-cuts.js`. No incluyen marcas de agua. La textura aporta legibilidad y volumen, pero no representa una preparación histológica, un recuento celular ni fibras reconstruidas a partir de datos. La alineación visual se revisa al cambiar de nivel y al ampliar la selección.
