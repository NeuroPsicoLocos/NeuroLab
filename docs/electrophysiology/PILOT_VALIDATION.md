# Validación piloto de Electrophysiology Lab

Protocolo breve para evaluar la versión beta de potenciales de campo antes de ampliar Simu-LAB a current clamp, voltage clamp y farmacología temporal.

## Objetivo

Comprobar con registros representativos que la aplicación:

1. importa correctamente los datos tabulados;
2. interpreta de forma explícita las columnas y unidades;
3. permite inspeccionar y revisar cada traza;
4. reproduce de manera consistente la detección POPS configurada;
5. exporta resultados y trazabilidad suficientes para una auditoría posterior.

La prueba no valida todavía EPSP, IPSP, EPSC ni IPSC. El perfil POPS mide una espiga poblacional extracelular y requiere revisión experta.

## Enlace de prueba

<https://neurolab.neuropsicolocos.com/apps/electrophysiology-lab/>

La aplicación procesa el archivo en el navegador. No se debe adjuntar al repositorio ningún registro humano identificable, archivo clínico privado ni dato sin autorización para compartir.

## Participantes sugeridos

- 3 a 5 personas con experiencia en registros electrofisiológicos;
- al menos una persona que no haya usado previamente la herramienta;
- Safari y Chrome en escritorio;
- una comprobación de lectura e interfaz en teléfono o tableta.

El análisis de archivos grandes y la revisión detallada de las gráficas se consideran principalmente tareas de escritorio.

## Datos para la prueba

Cada participante debe usar:

1. la señal sintética incluida;
2. un registro real con respuesta POPS reconocible;
3. si está disponible, un caso negativo sin respuesta fisiológica;
4. un caso difícil con ruido, deriva, artefacto grande, saturación o muestras faltantes.

No es necesario compartir el archivo original para reportar un problema. Puede indicarse un identificador local no sensible y adjuntarse una captura recortada.

## Registro mínimo del entorno

Antes de comenzar, anotar:

- fecha y hora;
- sistema operativo y versión;
- navegador y versión;
- computadora, tableta o teléfono;
- tipo de archivo: XLSX, XLS, CSV, TSV o TXT;
- número aproximado de filas, hojas y columnas;
- frecuencia de muestreo esperada y unidades conocidas.

## Secuencia de prueba

### A. Apertura y señal sintética

1. Abrir el enlace oficial en una pestaña nueva.
2. Seleccionar **Usar señal sintética de demostración**.
3. Confirmar que aparece la gráfica, el control de calidad y la navegación de revisión.
4. Marcar la traza como pendiente, rechazada y aceptada; confirmar que el estado cambia.
5. Exportar Excel y comprobar que el archivo puede abrirse.

Resultado esperado: no deben aparecer errores, pantallas en blanco ni descargas vacías.

### B. Importación del registro

1. Cargar o arrastrar el archivo.
2. Confirmar hoja, columna temporal, señal y unidades.
3. Verificar que la columna temporal no aparezca como señal seleccionable.
4. Comparar frecuencia estimada y duración con los valores esperados.
5. Navegar por todas las señales mediante las flechas.

Resultado esperado: cada columna compatible debe aparecer una sola vez y conservar su identidad al navegar.

### C. Detección y revisión POPS

1. Seleccionar **Espiga poblacional · POPS experimental**.
2. Elegir el protocolo correspondiente al registro.
3. Revisar artefactos y puntos P1, P2 y P3 en las vistas **Respuesta** y **Traza completa**.
4. Comparar visualmente la detección con el criterio experto o medición histórica.
5. Corregir al menos un punto en la gráfica y restaurarlo.
6. Registrar aceptación, rechazo o pendiente con una nota breve.

Resultado esperado: ninguna ausencia de señal debe convertirse automáticamente en una respuesta fisiológica. Las correcciones deben conservar el valor automático y el corregido.

### D. Exportación

1. Exportar la traza activa.
2. Abrir el archivo y revisar `Resumen`, `Mediciones_POPS`, `Trazas_QC`, `Revision_manual`, `Correcciones_POPS` e `Historial_POPS` cuando correspondan.
3. Confirmar archivo, hoja, columna, parámetros, decisión y motivos de exclusión.
4. Repetir con otra traza y comprobar que se genera un archivo independiente.

Resultado esperado: el Excel debe ser legible, trazable y utilizable como tabla para análisis estadístico posterior.

## Clasificación del resultado

- **Aprobada:** cumple el resultado esperado y la medición es fisiológicamente plausible.
- **Aprobada con observación:** funciona, pero requiere una aclaración de interfaz o documentación.
- **Revisión necesaria:** hay incertidumbre científica, escala dudosa o diferencia frente a la medición experta.
- **Fallo:** impide cargar, analizar, revisar o exportar.

## Prioridad de incidencias

- **Crítica:** pérdida/corrupción de resultados, exposición de datos, aplicación inaccesible o exportación inutilizable.
- **Alta:** detección sistemáticamente incorrecta, unidades equivocadas o decisiones que no se conservan.
- **Media:** problema reproducible de navegación, visualización o compatibilidad.
- **Baja:** texto, alineación o mejora de experiencia sin impacto en la medición.

## Cómo reportar

Usar el formulario **Validación piloto · Electrophysiology Lab** en GitHub Issues. Incluir pasos reproducibles, resultado observado, resultado esperado, entorno y parámetros. Si se adjunta una captura, retirar nombres, identificadores y metadatos sensibles.

Un resultado negativo o una traza sin detección también es información válida; no debe clasificarse como fallo si coincide con el criterio experto.

## Criterios para cerrar la fase piloto

La beta puede etiquetarse como `v0.1.0` cuando:

- la señal sintética y la exportación pasan en Safari y Chrome;
- al menos tres evaluadores completan el protocolo;
- se revisa al menos un caso positivo, uno negativo y uno difícil;
- no quedan incidencias críticas abiertas;
- las incidencias altas tienen corrección o una limitación documentada;
- las diferencias frente a mediciones expertas quedan cuantificadas y justificadas.

