# Perfil POPS para espiga poblacional

## Propósito y alcance

Este documento registra cómo se trasladó a Simu-LAB el algoritmo de los notebooks `pops_detect.ipynb` y `High_Fr.ipynb`. El objetivo es conservar la medición que ya funcionaba, hacer explícitos sus supuestos y permitir su revisión antes de ampliar el sistema.

En este perfil, POPS se considera una **espiga poblacional extracelular**: una deflexión negativa delimitada por dos puntos de flanco. No se usa como sinónimo general de potencial postsináptico y no permite identificar por sí solo EPSP, IPSP, EPSC o IPSC.

## Datos observados en el proyecto original

- `PopSpikes.xlsx`: hojas `condicion F` y `condicion NF`, 10 trazas por hoja más una columna temporal.
- `PS-frequencies.xlsx`: hojas `10 Hz`, `30 Hz` y `50 Hz`, cada una con tiempo y señal.
- Intervalo temporal predominante: 0.0001 s, equivalente a 10 kHz.
- Los libros no contienen encabezados en las hojas de señal.
- Las unidades asumidas por los notebooks son segundos y milivoltios.

Los libros originales permanecen fuera del sitio y no se incorporan al repositorio público.

## Protocolo de tren reproducido (`High_Fr.ipynb`)

1. Aplicar Savitzky–Golay con ventana 11 y polinomio de orden 3.
2. Calcular la diferencia absoluta entre muestras consecutivas.
3. Detectar máximos de esa diferencia con umbral absoluto 0.3.
4. Separar artefactos al menos 15 ms.
5. P1: máximo entre 3 y 10 ms después del artefacto.
6. P2: mínimo desde la muestra posterior a P1 hasta 10 ms después de P1.
7. P3: máximo entre 2 y 8 ms después de P2. Se intenta exigir prominencia 0.2; si no existe un pico que la cumpla, se usa el máximo del intervalo y se genera una bandera.
8. Calcular amplitud como `((P1 + P3) / 2) - P2`.

También se calculan latencias, τ1–2, τ2–3, pendiente P1–P3, línea base robusta, sigma robusta y SNR.

## Protocolo pareado reproducido (`pops_detect.ipynb`)

1. Buscar el cambio absoluto máximo antes de 60 ms para el primer estímulo.
2. Buscar el cambio absoluto máximo antes de 150 ms para el segundo estímulo.
3. Conservar cinco muestras posteriores como final de la región de artefacto.
4. P1: máximo entre 1 y 10 ms después del final de esa región.
5. P2: mínimo desde la muestra posterior a P1 hasta 15 ms después.
6. P3: máximo hasta 20 ms después de P2, intentando prominencia 0.3.
7. Aplicar la misma fórmula de amplitud.

Como la segunda búsqueda incluye también la primera ventana, puede seleccionar dos veces el mismo artefacto cuando el primero sea el de mayor derivada. Simu-LAB conserva el comportamiento para reproducibilidad, pero genera la bandera `duplicate_artifact_windows`.

## Validación de equivalencia

La implementación JavaScript se comparó localmente con `PS-frequencies.xlsx` y con la tabla histórica `Resultados_POPs/tabla_POPS_frecuencia.xlsx`.

- Se detectaron 10 eventos en 10 Hz, 10 en 30 Hz y 10 en 50 Hz.
- Para el primer evento de 10 Hz se reprodujeron P1 = 0.0394 s, P2 = 0.0429 s y P3 = 0.0464 s.
- La amplitud reproducida fue 0.4524557868764569 mV; la tabla histórica registra 0.4524557868764582 mV. La diferencia es compatible con redondeo numérico.
- En `PopSpikes.xlsx`, condición F, columna B, el protocolo pareado reprodujo P1/P2/P3 = 0.0401/0.0476/0.0509 s y amplitud 0.08192173227272728 mV para el primer evento.

## Supuestos que deben permanecer visibles

- La polaridad esperada es una deflexión negativa. Invertir la señal requiere otro perfil o una transformación explícita.
- El umbral 0.3 es absoluto y depende de escala, ganancia y unidad. No es robusto entre laboratorios sin calibración.
- Las ventanas están adaptadas a estos registros; otras preparaciones, temperaturas o vías pueden tener latencias diferentes.
- Una distancia mínima de 15 ms puede fusionar estímulos en protocolos por encima de aproximadamente 66 Hz.
- El suavizado modifica valores locales. La señal cruda siempre debe conservarse y mostrarse junto con la procesada.
- La puntuación 0–100 es una heurística de revisión basada en bordes de ventana, prominencia, amplitud y SNR; no es una probabilidad.
- La clasificación automática no justifica exclusión definitiva sin conservar la bandera y permitir revisión manual.

## Cambio deliberado respecto al notebook

El cálculo histórico de `Decay time` buscaba la primera muestra posterior a P3 con señal menor que 0.1. Ese criterio usa un nivel absoluto, no la línea base de cada traza, y puede devolver un tiempo casi inmediato aunque la respuesta no haya decaído.

Por esta razón no se exporta como métrica validada en Simu-LAB. Una versión futura deberá definir retorno a línea base mediante tolerancia relativa al ruido basal y permanencia mínima dentro de esa banda.

## Próxima validación necesaria

1. Seleccionar registros representativos de preparaciones y condiciones distintas.
2. Crear anotaciones manuales ciegas por al menos dos revisores.
3. Comparar sensibilidad del artefacto, error de latencia y error de amplitud.
4. Evaluar estabilidad frente a ruido, deriva, saturación, cambios de ganancia y frecuencia de estimulación.
5. Fijar perfiles versionados por preparación/protocolo antes de análisis farmacológico.
