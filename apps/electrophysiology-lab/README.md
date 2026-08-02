# Electrophysiology Lab

Módulo de Simu-LAB para inspección y análisis reproducible de registros electrofisiológicos en el navegador.

## Estado actual

La aplicación dispone de una base segura de importación, inspección y trazabilidad. Funciona con potenciales de campo tabulados y prepara una arquitectura común para:

1. potenciales de campo evocados;
2. current clamp: EPSP e IPSP;
3. voltage clamp: EPSC e IPSC;
4. series temporales de farmacología.

Hay dos métodos disponibles:

- **Inspección preliminar:** candidatos de artefacto mediante derivada y MAD; no asigna fisiología.
- **Espiga poblacional · POPS experimental:** reproducción configurable de `High_Fr.ipynb` para trenes y `pops_detect.ipynb` para dos estímulos, con Savitzky–Golay 11/3 y puntos P1–P2–P3.

La exportación POPS genera un archivo por cada traza mostrada. El nombre del archivo conserva libro, hoja y columna; para exportar otra señal se navega con las flechas de barrido y se crea un archivo nuevo. Esta separación evita mezclar trazas con distinta longitud o calidad en un mismo resultado.

Para libros POPS conocidos, la unidad temporal y el protocolo se proponen automáticamente. Si una selección produce una escala inverosímil —por ejemplo, 10 MHz y menos de 1 ms para 9,900 muestras— la aplicación prueba la unidad inferida, conserva una bandera de trazabilidad y pide confirmación. La gráfica permite alternar entre **Respuesta**, que centra la escala en P1–P3, y **Traza completa**, que conserva visibles los artefactos extremos.

POPS se interpreta aquí como una medición de **espiga poblacional extracelular**. No clasifica respuestas sinápticas de una neurona individual como EPSP, IPSP, EPSC o IPSC.

La versión publicada puede probarse en <https://neurolab.neuropsicolocos.com/apps/electrophysiology-lab/>. Antes de ampliar los perfiles fisiológicos, las pruebas con registros reales deben seguir el [protocolo de validación piloto](../../docs/electrophysiology/PILOT_VALIDATION.md).

## Formato de entrada

Se aceptan XLSX, XLS, CSV, TSV y TXT. Cada traza debe tener como mínimo:

- una columna temporal numérica;
- una columna de señal numérica;
- al menos tres pares válidos;
- tiempo estrictamente creciente.

La unidad temporal se convierte internamente a milisegundos. La señal se conserva en la unidad declarada por la persona usuaria.
La columna elegida como tiempo se excluye automáticamente del selector de señal para evitar analizar el eje temporal como si fuera un registro electrofisiológico.

Los límites de saturación son opcionales y solo deben introducirse cuando se conocen los límites físicos del equipo. Sirven para generar una bandera; no recortan ni corrigen la señal. En la demostración, la vista de respuesta incluye toda la amplitud para que un artefacto fuera del rango fisiológico no parezca saturación del registro.

## Método preliminar

1. Se eliminan del análisis los pares que no sean numéricos, manteniendo su conteo como indicador de calidad.
2. La frecuencia de muestreo se estima con la mediana de los intervalos temporales.
3. La irregularidad se resume con `MAD(intervalo) / mediana(intervalo)`.
4. Se calcula la derivada absoluta de la señal.
5. El umbral es `mediana + sensibilidad × 1.4826 × MAD`.
6. Se agrupan excursiones adyacentes y se aplica un periodo refractario configurable.

Este procedimiento es deliberadamente preliminar. Su rendimiento debe validarse con registros reales representativos antes de usarse como criterio automático de inclusión.

## Perfil POPS reproducido

El protocolo de tren conserva los parámetros del notebook de alta frecuencia:

- umbral absoluto del artefacto: 0.3 unidades de señal por muestra;
- distancia mínima entre artefactos: 15 ms;
- P1: máximo entre 3 y 10 ms tras el artefacto;
- P2: mínimo hasta 10 ms después de P1;
- P3: máximo entre 2 y 8 ms después de P2, con prominencia mínima 0.2;
- amplitud: `((P1 + P3) / 2) - P2`.

El protocolo pareado busca el cambio derivativo más grande antes de 60 ms y antes de 150 ms, conserva el margen de cinco muestras del notebook y usa sus ventanas P1 1–10 ms, P2 0–15 ms y P3 0–20 ms. P3 debe alcanzar prominencia 0.3; de lo contrario se conserva el artefacto para revisión, pero no se reporta una respuesta ni una amplitud. Si ambas búsquedas seleccionan el mismo artefacto se genera una bandera explícita.

La aplicación añade línea base robusta, SNR y una puntuación de revisión. La puntuación no es una probabilidad y no sustituye la inspección de la gráfica. La especificación y sus límites están en [`docs/electrophysiology/POPS_METHOD.md`](../../docs/electrophysiology/POPS_METHOD.md).

## Revisión manual por trazas

Las señales compatibles de cada hoja se recorren como barridos mediante flechas **Anterior** y **Siguiente**, disponibles tanto en la asignación de columnas como junto a la gráfica. El panel de revisión permite:

- guardar una traza como pendiente;
- aceptarla o rechazarla y avanzar automáticamente a la siguiente;
- conservar una nota breve por traza;
- consultar el avance y los conteos de aceptación y rechazo.

La única barra de decisión permanece unida al encabezado de la gráfica para evitar desplazamientos largos en Safari o pantallas amplias. Reúne las flechas de traza anterior/siguiente, el estado actual y las acciones de revisión; el panel superior conserva únicamente el progreso y la nota auditable. Cuando el foco no está en un campo de texto, pueden usarse `A` para aceptar y avanzar, `R` para rechazar y avanzar, y `P` para guardar como pendiente. Los atajos se desactivan durante la corrección gráfica de puntos.

La revisión se conserva en `localStorage`, únicamente en el navegador y dispositivo actuales. Cada decisión queda vinculada al archivo de origen, hoja, columna y configuración analítica. Si cambian parámetros que pueden alterar la detección, la decisión se presenta como desactualizada y requiere una nueva revisión.

P1, P2 y P3 pueden corregirse seleccionando el evento y el punto, activando **Seleccionar en la gráfica** y haciendo clic sobre la muestra deseada. El clic se ajusta a una muestra real; no interpola ni modifica la señal. La aplicación impide órdenes temporales imposibles, recalcula amplitud, latencias, intervalos, pendiente y SNR, y obliga a revisar nuevamente la traza. Cada punto puede restaurarse por separado o restablecerse toda la traza.

La configuración JSON usa el esquema `simulab-ephys-0.5` e incluye el estado de revisión, las correcciones activas y un historial acotado de acciones. En Excel, `Revision_manual` registra la decisión y el conteo de correcciones; `Correcciones_POPS` conserva valores automáticos y corregidos por punto; `Historial_POPS` registra ajustes y restauraciones; `Trazas_QC` incorpora el estado de revisión, y `Resumen` conserva la decisión activa. Los candidatos genéricos de derivada se exportan en `Candidatos_derivada`, separados de las mediciones fisiológicas de `Mediciones_POPS`.

## Arquitectura

- `src/core/signal.js`: funciones puras de análisis y señal sintética.
- `src/core/fieldPotential.js`: suavizado y medición POPS independiente de la interfaz.
- `src/core/corrections.js`: validación, aplicación y restauración auditable de puntos manuales.
- `src/core/review.js`: identidad, persistencia y vigencia de decisiones manuales.
- `src/io/workbook.js`: adaptación de libros de cálculo y exportación.
- `src/ui/plot.js`: gráfica Canvas de alta densidad.
- `src/app.js`: estado de interfaz y coordinación.

La separación evita acoplar la fisiología a Excel o al DOM, y permite probar cada detector con señales sintéticas.

La interfaz carga `src/app.bundle.js`, una copia clásica generada a partir de esos módulos para que la demostración y la selección de archivos también funcionen al abrir `index.html` directamente con `file://`. Después de modificar cualquier módulo, se regenera con:

```bash
node scripts/build-ephys-bundle.mjs
```

## Privacidad

La aplicación no envía archivos a un servidor. SheetJS se descarga desde su CDN oficial al abrir o exportar un libro; el contenido del archivo permanece en memoria local del navegador.

No se deben confirmar en Git datos humanos identificables ni registros crudos privados. Use `data/private/` para trabajo local; la ruta está ignorada por Git.

## Próximas fases

- contrato científico y técnico de current clamp descrito en [`CURRENT_CLAMP_SPEC.md`](../../docs/electrophysiology/CURRENT_CLAMP_SPEC.md), pendiente de revisión antes de implementar;
- perfiles adicionales por protocolo de polaridad, ventanas y criterios fisiológicos;
- línea base robusta, filtros opcionales con respuesta documentada y señal original visible;
- corrección manual de ventanas completas y del artefacto con historial auditable;
- confianza por evento, motivos de exclusión y gráficas de control de calidad;
- métricas de amplitud, latencia, pendiente, área, SNR y variabilidad entre ensayos;
- farmacología con tiempo experimental, baseline normalizado y modelos que respeten medidas repetidas;
- importadores ABF/NWB evaluados fuera del primer MVP tabular.

## Pruebas

Desde la raíz:

```bash
node scripts/build-ephys-bundle.mjs --check
node --test tests/*.test.mjs
```
