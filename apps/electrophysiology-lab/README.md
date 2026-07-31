# Electrophysiology Lab

Módulo de Simu-LAB para inspección y análisis reproducible de registros electrofisiológicos en el navegador.

## Estado actual

La fase 1 es una base segura de importación, inspección y trazabilidad. Funciona con potenciales de campo tabulados y prepara una arquitectura común para:

1. potenciales de campo evocados;
2. current clamp: EPSP e IPSP;
3. voltage clamp: EPSC e IPSC;
4. series temporales de farmacología.

En esta fase, los eventos detectados son únicamente **candidatos de artefacto de estímulo** basados en cambios abruptos. No se clasifican respuestas sinápticas ni se aplican todavía filtros o correcciones de línea base.

## Formato de entrada

Se aceptan XLSX, XLS, CSV, TSV y TXT. Cada traza debe tener como mínimo:

- una columna temporal numérica;
- una columna de señal numérica;
- al menos tres pares válidos;
- tiempo estrictamente creciente.

La unidad temporal se convierte internamente a milisegundos. La señal se conserva en la unidad declarada por la persona usuaria.

## Método preliminar

1. Se eliminan del análisis los pares que no sean numéricos, manteniendo su conteo como indicador de calidad.
2. La frecuencia de muestreo se estima con la mediana de los intervalos temporales.
3. La irregularidad se resume con `MAD(intervalo) / mediana(intervalo)`.
4. Se calcula la derivada absoluta de la señal.
5. El umbral es `mediana + sensibilidad × 1.4826 × MAD`.
6. Se agrupan excursiones adyacentes y se aplica un periodo refractario configurable.

Este procedimiento es deliberadamente preliminar. Su rendimiento debe validarse con registros reales representativos antes de usarse como criterio automático de inclusión.

## Arquitectura

- `src/core/signal.js`: funciones puras de análisis y señal sintética.
- `src/io/workbook.js`: adaptación de libros de cálculo y exportación.
- `src/ui/plot.js`: gráfica Canvas de alta densidad.
- `src/app.js`: estado de interfaz y coordinación.

La separación evita acoplar la fisiología a Excel o al DOM, y permite probar cada detector con señales sintéticas.

## Privacidad

La aplicación no envía archivos a un servidor. SheetJS se descarga desde su CDN oficial al abrir o exportar un libro; el contenido del archivo permanece en memoria local del navegador.

No se deben confirmar en Git datos humanos identificables ni registros crudos privados. Use `data/private/` para trabajo local; la ruta está ignorada por Git.

## Próximas fases

- especificación por protocolo de polaridad, ventanas y criterios fisiológicos;
- línea base robusta, filtros opcionales con respuesta documentada y señal original visible;
- anotaciones manuales y correcciones auditables;
- confianza por evento, motivos de exclusión y gráficas de control de calidad;
- métricas de amplitud, latencia, pendiente, área, SNR y variabilidad entre ensayos;
- farmacología con tiempo experimental, baseline normalizado y modelos que respeten medidas repetidas;
- importadores ABF/NWB evaluados fuera del primer MVP tabular.

## Pruebas

Desde la raíz:

```bash
node --test tests/*.test.mjs
```
