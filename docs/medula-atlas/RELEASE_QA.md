# Revisión de integración de Médula

Fecha: 3 de octubre de 2026. Módulo: `apps/medula-atlas/`.

## Acabado común de los cortes anteriores, versión 9.0

- Pasaron las 75 pruebas, la sintaxis de los 22 módulos del atlas y los 63 archivos JavaScript del repositorio, y los dos bundles deterministas.
- Los mapas de tractos y cubiertas reutilizan el contorno torácico del comparador. Se revisaron sus gradientes, sombras, selección y orientación. La piamadre sigue el contorno medular; los territorios de las vías se recortan a la sustancia blanca.
- Se seleccionaron los diez tractos y las ocho estructuras de cubiertas, se comprobaron las cinco partes de cada ficha y se activó el acercamiento de cada selección. El ganglio llegó a 4×; cambiar entre lámina y mapa restauró el encuadre y conservó la estructura seleccionada.
- Un clic en el corticoespinal lateral derecho indicó el lado derecho del sujeto en el zoom. Enter y espacio seleccionaron tractos, ganglio y piamadre en los SVG. Los filtros conservaron seis vías sensitivas y cuatro motoras; las vías ocultas salieron del recorrido de teclado. Ocultar y restaurar los rótulos funcionó.
- Ambos paneles se comprobaron a 336, 390, 900 y 1440 px, sin desbordamiento horizontal. En móvil se revisaron el ganglio ampliado, la navegación entre ficha y corte y el acceso a los controles.
- El modo docente y el comparador de sustancia gris siguieron disponibles. No se registraron errores ni advertencias de consola durante el recorrido.

Los contornos y territorios son docentes, sin escala física ni límites histológicos medidos. Las cubiertas conservan espesores y separaciones ampliados; su zoom muestra un sector del contorno. El dibujo de raíces no determina una equivalencia exacta entre niveles medulares y vertebrales. Las láminas con textura y sus fuentes permanecen conservadas.

## Niveles y zoom de sustancia gris, versión 8.0

- Pasaron las 72 pruebas del repositorio, la sintaxis de los 20 módulos del atlas y los 60 archivos JavaScript del repositorio, y la verificación de los dos bundles deterministas.
- Se recorrieron 71 selecciones en el navegador: las estructuras disponibles y las diez láminas en C6, T3, L4 y S3. Cada selección actualizó su ficha de cinco apartados, la lista y el SVG.
- Clarke y el asta lateral simpática están disponibles en T3; el núcleo parasimpático sacro en S3. Al pasar de Clarke a L4, la selección volvió al asta posterior, se desactivó Clarke y apareció la explicación del cambio.
- Enter seleccionó II en el lado derecho del sujeto; el zoom indicó ese lado. Espacio seleccionó X y el encuadre cambió a línea media. Se comprobaron el límite de 4×, el retorno al corte completo y el reinicio del zoom al cambiar de segmento.
- No hubo desbordamiento horizontal a 336, 390, 900 y 1440 px. Se revisaron el corte y las fichas en escritorio y móvil; el retorno móvil deja accesibles los controles de contenido y acercamiento.
- El modo docente muestra la actividad de comparación. El acceso desde «Anatomía» abre el comparador y lleva el foco a él. Las dos láminas anatómicas anteriores cargaron y el mapa original siguió ofreciendo sus diez vías.
- No se registraron errores ni advertencias de consola durante el recorrido funcional. Las cinco pruebas nuevas cubren disponibilidad por segmento, selección persistente, referencias y geometría del encuadre.

Son cuatro cortes SVG de referencia, con formas y proporciones cualitativas y límites de Rexed orientativos. No representan medidas de tejido ni todos los segmentos medulares. La comparación de sustancia gris no modifica el corte T3 de las diez vías. Los recursos de histología animal conservan especie, técnica, nivel y licencia.

## Láminas anatómicas, versión 7.0

- Pasaron las 67 pruebas del repositorio, la sintaxis de los 17 módulos del atlas y del resto del repositorio, y la verificación de los dos bundles deterministas.
- Dos PNG con volumen y textura: vista longitudinal de médula y corte de meninges/raíces. El manifiesto conserva prompts, corrección del saco dural, revisión visual, dimensiones y hashes. No contienen marcas de agua.
- Se seleccionaron los cinco puntos regionales y las ocho estructuras de la lámina transversal. Cada punto mostró la ficha correspondiente; la lista y el mapa conservaron la misma selección.
- Se alternaron ambas representaciones de cada panel. Enter en el mapa regional y espacio en el mapa de cubiertas actualizaron las fichas, y al volver a la lámina permanecieron seleccionados Lumbar y Ganglio de la raíz dorsal.
- Las dos imágenes cargaron completas y no hubo desbordamiento horizontal a 336, 390, 900 y 1440 px. Se inspeccionaron las láminas en escritorio y móvil. Los puntos de dura y aracnoides se separaron para su lectura móvil.
- No se registraron errores ni advertencias de consola durante este recorrido. La lógica de error de carga ofrece el mapa de estudio como alternativa.

Las salidas nerviosas de la lámina longitudinal son representativas; los 31 pares se estudian en el mapa SVG. Los puntos no delimitan segmentos exactos. El corte amplía separaciones y espesores, usa textura artística y no identifica un nivel medular específico. Son ilustraciones generadas con IA, identificadas como tales; la revisión no constituye validación anatómica independiente.

## Ampliación anatómica, versión 6.0

- Pasaron las 67 pruebas del repositorio, la sintaxis de JavaScript y los dos bundles deterministas. Las cuatro pruebas nuevas verifican los recuentos regionales y sus 31 pares, el descenso de raíces inferiores, las fuentes de las fichas y las claves de las doce preguntas.
- Se seleccionaron las cinco regiones y las ocho estructuras de cubiertas y raíces. Enter y espacio funcionan en los SVG y actualizan sus fichas y selección. Estas vistas no necesitan WebGL.
- Se probaron los ocho botones de tejidos del visor 3D y la visibilidad independiente de duramadre, aracnoides, piamadre, espacio con LCR y raíces/nervios. Un clic directamente en el ganglio dorsal mostró su descripción con el hueso oculto.
- La vista de cubiertas oculta hueso, canal y plano, activa las capas y ofrece un acercamiento. Se comprobó también la restitución del hueso y la vista oblicua.
- El visor ampliado mantiene las raíces dentro de su encuadre móvil. La sección Anatomía no desbordó horizontalmente a 336, 390, 900 y 1440 px.
- El modo docente muestra su actividad de comparación entre segmentos, vértebras, raíces y meninges. Se completaron las doce preguntas y el resultado mostró `12 de 12`; cada respuesta tuvo explicación.
- No se registraron errores ni advertencias de consola durante este recorrido en el navegador integrado.

Las cubiertas 3D y sus dos salidas bilaterales son aproximaciones docentes con aperturas y espesores ampliados. La vista longitudinal distingue 31 pares de nervios de la referencia ósea y muestra raíces por debajo del cono; no convierte segmentos en niveles vertebrales exactos. La precisión clínica, la validación con estudiantes y otras GPU quedan fuera de esta revisión. No se incorporaron las capturas de referencia ni se modificaron las mallas óseas.

## Integración inicial, versión 5.1

## Comprobaciones locales

- Las 63 pruebas del repositorio pasaron (Node.js, `node --test tests/*.test.mjs`).
- La sintaxis de todos los módulos JavaScript del repositorio pasó; los dos bundles deterministas siguen actualizados.
- Los scripts Python se pudieron analizar sin errores de sintaxis. El acceso local reconoció el atlas servido dentro del portal y devolvió su ruta completa.
- Los hashes SHA-256 de las tres mallas T2–T4 coinciden con el manifiesto. Las licencias y fuentes acompañan a mallas, Three.js e imágenes de sustancia gris.
- En el navegador integrado, la tarjeta se traduce en ES y EN, abre el atlas y el enlace de retorno lleva al portal.
- Las diez vías muestran sus fichas de anatomía, conectividad, función, clínica y bibliografía.
- El modelo WebGL se ve en escritorio y en el visor ampliado móvil. Se probaron las vistas oblicua y posterior, ampliación, cierre y navegación entre secciones.
- Las dos imágenes de sustancia gris cargan completas. Se mantienen los rótulos de especie, nivel, técnica, fuente y licencia.
- La descarga del encéfalo desmontable coincide byte a byte con el ZIP distribuido y contiene seis STL y seis OBJ, además de scripts, README y manifiesto.
- Se activó el modo docente y se comprobó una respuesta y su explicación en la autoevaluación.
- No hubo desbordamiento horizontal a 1440 y 390 px ni errores o advertencias de consola durante el recorrido.

## Límites

Esta revisión comprueba la integración del atlas en el portal. No equivale a validación docente con estudiantes ni a revisión independiente de todas las afirmaciones anatómicas. El corte T3, los tejidos aproximados y las preparaciones animales conservan sus aclaraciones. El atlas está en español; el portal es bilingüe. No se evaluaron todas las GPU ni todos los navegadores.

La publicación debe comprobarse después de la integración en `main`: estado `built` de GitHub Pages y navegación en la ruta pública `https://neurolab.neuropsicolocos.com/apps/medula-atlas/`.
