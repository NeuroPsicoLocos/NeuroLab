# Laboratorio de atención · NeuroLab

Integración autorizada por el propietario del Site, 2026-11-12. Fuente original: laboratorio-atencion v1, commit ba2afabe9b3f24f9c6ab2c4bc75dee53428e7373. El Site original y sus permisos permanecen intactos.

Portado el componente cliente y CSS a un bundle estático sin backend ni autenticación. Sin imágenes, medios o datos personales importados. No confundir con el Site distinto «Laboratorio Atencional Piloto», no incluido.

Contenido docente del propietario: la autorización de publicación no concede una licencia nueva sobre el material editorial. Dependencias redistribuidas React, React DOM y Scheduler bajo MIT: textos íntegros en licenses/. Esbuild se usa solo para compilar.

## Límites y privacidad
Cuatro demostraciones, no test validado ni investigación. Puntuaciones arbitrarias sin normas; vigilancia breve aleatoria no permite comparar personas ni medir atención sostenida. No diagnóstico. Respuestas en memoria durante la sesión, sin persistencia ni envío externo. Viñeta de reflexión docente conservada de la fuente.

## Cambios
- Enlace de regreso NeuroLab, idioma HTML español y noscript.
- Advertencia explícita de límites de puntuación y etiqueta viñeta docente.
- Nombre accesible del botón de vigilancia y foco de teclado.
- Tarjeta Aprender con ocho traducciones ES/EN; retos en español.

## Compilación
Desde esta carpeta: npm ci --ignore-scripts; npm run build. Versiones bloqueadas en package-lock.json. app.bundle.js se sirve directamente por GitHub Pages, sin dependencias remotas.

## QA
Chrome desktop: selección de 9/9 R, 5/5 Stroop, transición temporizada de vigilancia, 5/5 doble regla, resultado75 (sin respuestas a vigilancia), reflexión y reinicio a cero. Sin desbordamiento horizontal a1168px. Móviles físicos no probados. Tests estáticos y suite raíz ejecutados antes de publicar. Originales preservados, no se publican configs de preview.
