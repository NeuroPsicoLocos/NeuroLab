# Revisión de integración de Médula

Fecha: 3 de octubre de 2026. Módulo: `apps/medula-atlas/`.

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
