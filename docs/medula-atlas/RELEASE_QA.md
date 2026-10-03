# Revisión de integración de Médula

Fecha: 3 de octubre de 2026. Módulo: `apps/medula-atlas/`, versión 5.1.

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
