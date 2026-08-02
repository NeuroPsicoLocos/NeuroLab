# Validación sintética inicial del detector PSP

Estado: núcleo implementado y probado; no conectado todavía a la interfaz pública ni validado con registros reales.

## Objetivo

Esta fase comprueba que el detector de respuestas evocadas en current clamp:

- recibe tiempos de estímulo declarados y no los inventa desde la señal celular;
- distingue respuesta detectable, ausencia de respuesta, respuesta ambigua y señal no evaluable;
- mide dirección eléctrica sin asignar automáticamente EPSP o IPSP;
- conserva amplitud firmada, latencias, subida, pendientes, anchura, área y retorno;
- genera banderas para deriva, muestreo irregular, saturación, bifasia y posible potencial de acción;
- ofrece una puntuación heurística para priorizar revisión, no una probabilidad fisiológica.

El código está en `apps/electrophysiology-lab/src/core/currentClamp.js`. No depende del DOM, Canvas, Excel ni servicios externos.

## Método de detección

Para cada estímulo se aplican ventanas relativas configurables:

1. línea base mediante mediana;
2. ruido mediante `1.4826 × MAD` sobre residuales basales;
3. deriva mediante una aproximación robusta de Theil–Sen;
4. exclusión explícita de la ventana de artefacto;
5. evaluación de extremos positivos y negativos;
6. amplitud mínima combinando límite absoluto y múltiplo del ruido;
7. inicio mediante cruce sostenido;
8. pico sobre la señal sin filtrar;
9. subida 20–80 %, pendiente por regresión y pendiente máxima en ventana temporal fija;
10. retorno sostenido a una banda alrededor de la línea base;
11. búsqueda de una fase opuesta suficientemente grande;
12. control de saturación y contaminación por espiga.

La corrección basal constante es la predeterminada. La corrección lineal es opcional y queda reportada; no se activa silenciosamente al detectar deriva.

## Benchmark reproducible

Comando:

```bash
node scripts/benchmark-psp-detector.mjs
```

El benchmark usa 30 semillas por combinación, cinco amplitudes y tres niveles de ruido: 450 escenarios. La tabla siguiente resume la corrida fija de esta versión.

| Ruido SD (mV) | Amplitud (mV) | Sensibilidad | Falsos positivos | Error absoluto amplitud (mV) | Error pico (ms) | Error inicio (ms) |
|---:|---:|---:|---:|---:|---:|---:|
| 0.05 | 0 | — | 0.000 | — | — | — |
| 0.05 | 0.5 | 1.000 | — | 0.109 | 1.197 | 0.614 |
| 0.05 | 1 | 1.000 | — | 0.097 | 0.919 | 0.275 |
| 0.05 | 2 | 1.000 | — | 0.096 | 0.488 | 0.142 |
| 0.05 | 4 | 1.000 | — | 0.090 | 0.516 | 0.098 |
| 0.12 | 0 | — | 0.000 | — | — | — |
| 0.12 | 0.5 | 0.867 | — | 0.291 | 2.375 | 3.249 |
| 0.12 | 1 | 1.000 | — | 0.261 | 1.366 | 0.824 |
| 0.12 | 2 | 1.000 | — | 0.250 | 1.239 | 0.353 |
| 0.12 | 4 | 1.000 | — | 0.217 | 0.679 | 0.184 |
| 0.25 | 0 | — | 0.000 | — | — | — |
| 0.25 | 0.5 | 0.000 | — | — | — | — |
| 0.25 | 1 | 0.767 | — | 0.557 | 2.593 | 3.273 |
| 0.25 | 2 | 1.000 | — | 0.544 | 1.177 | 0.895 |
| 0.25 | 4 | 1.000 | — | 0.500 | 0.875 | 0.349 |

Estos resultados muestran el comportamiento esperado: el criterio conservador evita falsos positivos en este banco, pero pierde sensibilidad y precisión cuando la amplitud se aproxima al ruido. No debe concluirse que la tasa de falsos positivos será cero en registros reales.

## Interpretación del error

El pico se selecciona sobre la señal sin filtrar. Con ruido, elegir el extremo introduce sesgo de selección: el error de amplitud aumenta aunque la forma subyacente sea idéntica. Se conserva este resultado en vez de suavizar la señal para forzar coincidencia con la verdad sintética.

La latencia de inicio se define por un cruce sostenido de umbral. Por tanto, no coincide exactamente con el inicio matemático de la biexponencial y se vuelve más tardía e inestable a menor SNR. La latencia de pico es más estable, pero también puede desplazarse por ruido.

## Pruebas automatizadas

El banco cubre:

- PSP positivo y negativo;
- prohibición de inferir EPSP/IPSP por polaridad;
- ausencia de respuesta;
- estímulos pareados y razón de amplitudes;
- deriva con corrección lineal explícita;
- respuesta bifásica;
- saturación conocida;
- contaminación semejante a potencial de acción;
- tiempo no monótono, parámetros inválidos y estímulos desordenados;
- sensibilidad y falsos positivos con semillas fijas.

## Limitaciones pendientes

- No existen todavía registros reales anotados por revisores independientes.
- Los valores predeterminados no deben considerarse universales para una preparación.
- El ruido sintético inicial es gaussiano y no reproduce toda la estructura espectral o instrumental real.
- La deriva no lineal, artefactos prolongados, capacitancia, espigas realistas y datos faltantes dentro de la respuesta requieren escenarios adicionales.
- Falta comparar el inicio por umbral con la intersección 20–80 % frente a anotación experta.
- Falta estimar concordancia entre revisores y separar entrenamiento, ajuste y prueba cuando haya datos reales.

## Criterio para conectar la interfaz

El detector permanecerá fuera de la aplicación pública hasta que:

1. se revise el perfil numérico con el laboratorio;
2. se incorporen registros piloto no identificables;
3. se midan falsos positivos y negativos por protocolo;
4. se diseñe la corrección manual de inicio, pico y retorno;
5. la exportación preserve automáticamente valores originales, finales y banderas.

