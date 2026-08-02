# Especificación científica: current clamp y potenciales postsinápticos

Estado: propuesta para revisión, sin implementación.

Esta especificación define el contrato científico y técnico de la fase `v0.2` de Electrophysiology Lab. Su primer objetivo es medir respuestas postsinápticas evocadas y subumbrales registradas en current clamp sin confundir polaridad eléctrica con identidad fisiológica.

## 1. Alcance inicial

La primera versión incluirá:

- registros intracelulares en current clamp, whole-cell o electrodo agudo;
- una o varias trazas de voltaje por ensayo;
- estímulos con tiempo conocido o canal marcador;
- respuestas postsinápticas evocadas y subumbrales;
- medición, control de calidad, revisión manual y exportación auditable;
- etiquetas EPSP/IPSP únicamente cuando su fundamento experimental esté declarado.

Quedan fuera de esta primera versión:

- clasificación automática de eventos espontáneos;
- potenciales de acción y propiedades de excitabilidad activa;
- estimación de conductancias excitatoria/inhibitoria desde una sola traza;
- voltage clamp, EPSC e IPSC;
- inferencia causal del neurotransmisor o receptor a partir de la forma de onda;
- importación ABF/NWB directa, que deberá evaluarse después del formato tabular.

## 2. Regla de interpretación fisiológica

La aplicación debe separar tres conceptos:

1. **Dirección registrada:** deflexión positiva, negativa, bifásica o indeterminada respecto a la línea base.
2. **Tipo de evento medido:** PSP evocado, sin respuesta, artefacto o respuesta contaminada por espiga.
3. **Interpretación fisiológica:** EPSP, IPSP o PSP no clasificado.

Una deflexión despolarizante no demuestra por sí sola que la respuesta sea excitatoria, ni una hiperpolarizante demuestra por sí sola inhibición. La polaridad depende del potencial de membrana, los potenciales de reversión, las concentraciones iónicas, el potencial de unión líquida y la configuración experimental. Además, una conductancia GABAérgica puede ser despolarizante y mantener un efecto inhibitorio por *shunting*.

Por ello, `physiological_label` sólo podrá tomar `EPSP` o `IPSP` cuando se seleccione al menos una fuente de evidencia:

- aislamiento farmacológico;
- antagonista/agonista que confirme el receptor;
- potencial de reversión medido;
- vía aferente y protocolo previamente validados;
- etiqueta experimental aportada por la persona investigadora;
- otra evidencia descrita en texto.

Si no existe esa evidencia, el resultado será `PSP_no_clasificado`, aunque la dirección y todas las métricas eléctricas se conserven.

## 3. Contrato mínimo de entrada

### 3.1. Series obligatorias

| Campo | Descripción | Unidad interna |
|---|---|---|
| `time` | tiempo estrictamente creciente | ms |
| `voltage` | potencial de membrana registrado | mV |
| `stimulus_time` | tiempo del estímulo o lista de tiempos | ms |
| `sweep_id` | identidad estable del ensayo | texto |

El tiempo del estímulo podrá venir de:

- una columna TTL/marcador;
- una tabla de eventos;
- una posición fija declarada para todos los ensayos;
- selección manual auditable.

No debe inferirse un estímulo fisiológico únicamente desde la mayor derivada del voltaje celular, porque puede corresponder a una espiga, artefacto o transición instrumental.

### 3.2. Series opcionales

- corriente inyectada y su unidad;
- comando de estímulo;
- marcador de adquisición;
- identificador de condición farmacológica;
- tiempo experimental acumulado;
- número de repetición.

La corriente inyectada debe mantenerse separada del voltaje registrado. Esta separación sigue el modelo de NWB, donde `CurrentClampSeries` almacena voltaje y `CurrentClampStimulusSeries` almacena la corriente aplicada.

## 4. Metadatos

### 4.1. Obligatorios para analizar

- archivo, hoja, columna y barrido;
- unidad temporal y unidad de voltaje;
- frecuencia de muestreo estimada o declarada;
- tiempo del estímulo;
- ventana preestímulo y ventana de respuesta;
- modalidad: whole-cell, perforated-patch, sharp u otra;
- corriente de sesgo, incluso si es cero o desconocida;
- potencial basal aproximado;
- identidad de la preparación y de la célula mediante códigos no identificables.

### 4.2. Recomendados para interpretar

- especie, edad/etapa, sexo cuando sea pertinente y región;
- tipo celular y método de identificación;
- temperatura;
- composición de soluciones interna y externa;
- electrodo y resistencia inicial;
- resistencia de acceso inicial y durante el experimento;
- *bridge balance* y compensación de capacitancia;
- filtros analógicos/digitales y frecuencia de adquisición;
- potencial de unión líquida: valor y estado de corrección;
- corriente de mantenimiento o sesgo;
- intensidad, duración, localización y modalidad del estímulo;
- fármacos, concentraciones, tiempos de aplicación y lavado;
- evidencia usada para clasificar EPSP/IPSP.

Los valores desconocidos deben guardarse como `no_reportado`; nunca deben rellenarse con cero. Un cero representa una medición o configuración real.

## 5. Control de calidad

Los umbrales de QC deben pertenecer a un perfil de laboratorio o protocolo. No se establecerá un valor universal de potencial de reposo, resistencia de acceso o resistencia de entrada, porque los intervalos aceptables dependen de especie, preparación, tipo celular, electrodo y objetivo experimental.

### 5.1. Exclusiones automáticas justificables

- tiempo no monótono o duplicado sin resolución posible;
- menos muestras que las necesarias para línea base y respuesta;
- unidades ausentes con escala físicamente ambigua;
- señal no numérica en una fracción que invalide la ventana de interés;
- saturación/clipping dentro de la ventana usada para medir;
- estímulo fuera de la traza;
- ausencia completa de línea base preestímulo;
- respuesta cubierta completamente por el artefacto;
- configuración imposible, como ventanas negativas o superpuestas incorrectamente.

La aplicación conservará el motivo y los datos crudos; excluir no significa borrar.

### 5.2. Banderas de revisión

- deriva preestímulo o postestímulo;
- ruido basal alto;
- muestreo irregular;
- artefacto cercano al inicio esperado;
- pico en el borde de la ventana;
- respuesta bifásica;
- potencial de acción dentro de la ventana subumbral;
- cambio de potencial basal entre ensayos;
- cambio de resistencia de acceso/entrada por encima del límite del protocolo;
- señal compatible con ausencia de respuesta;
- SNR bajo;
- discrepancia entre réplicas;
- corrección de unión líquida desconocida;
- filtro o compensación instrumental no reportados.

Estas banderas priorizan revisión y no convierten por sí mismas una traza en inválida.

## 6. Preprocesamiento

Principios:

1. conservar siempre la serie cruda;
2. trabajar internamente en ms y mV sin alterar el archivo de origen;
3. aplicar transformaciones sólo a una copia de análisis;
4. registrar método, parámetros y versión;
5. mostrar señal cruda y señal utilizada para medir;
6. permitir repetir el análisis con el preprocesamiento desactivado.

### 6.1. Línea base

- ventana configurable antes del estímulo;
- estimación primaria mediante mediana;
- ruido mediante `1.4826 × MAD`;
- pendiente basal robusta como indicador de deriva;
- corrección constante por defecto;
- corrección lineal opcional sólo si la ventana basal permite estimarla y queda registrada.

La corrección lineal no debe extrapolarse sin límite ni ocultar una deriva fisiológica o instrumental importante.

### 6.2. Filtrado y suavizado

La primera implementación no filtrará por defecto. Un filtro opcional debe:

- declarar tipo, orden, frecuencia de corte y tratamiento de bordes;
- respetar la frecuencia de Nyquist;
- evitar desplazamiento temporal cuando se midan latencias;
- calcular métricas principales también sobre la señal sin filtrar cuando sea viable;
- generar una bandera si modifica materialmente amplitud o latencia.

La pendiente no debe calcularse simplemente entre muestras adyacentes: ruido y frecuencia de muestreo afectan fuertemente esa estimación. Se usará una ventana temporal fija o una regresión local documentada.

### 6.3. Artefacto

- el artefacto se marca y se excluye de las búsquedas fisiológicas;
- no se sustituye en la señal cruda;
- una versión interpolada, si se añade posteriormente para visualización, no podrá usarse silenciosamente para métricas;
- una respuesta que comienza dentro del intervalo no observable se marca como latencia no estimable.

## 7. Detección propuesta

Cada estímulo se analiza de forma independiente mediante ventanas relativas.

### 7.1. Ventanas configurables

- `baseline_start_ms` y `baseline_end_ms`;
- `artifact_start_ms` y `artifact_end_ms`;
- `onset_search_start_ms` y `onset_search_end_ms`;
- `peak_search_start_ms` y `peak_search_end_ms`;
- `return_search_end_ms`.

Las ventanas se guardan en el archivo de configuración y en Excel.

### 7.2. Secuencia

1. validar tiempo, unidades y cobertura de ventanas;
2. estimar línea base, deriva y ruido robusto;
3. localizar el estímulo desde su marcador o valor declarado;
4. excluir el intervalo de artefacto;
5. buscar una desviación sostenida respecto a la línea base;
6. evaluar ambas direcciones cuando la polaridad esperada no esté declarada;
7. estimar inicio, extremo y retorno;
8. detectar contaminación por potencial de acción;
9. calcular métricas y banderas;
10. solicitar revisión cuando la respuesta sea dudosa o inexistente.

El criterio inicial de candidato combinará:

- amplitud mínima expresada como múltiplo del ruido basal;
- duración mínima por encima del umbral;
- coherencia del signo dentro de la ventana;
- derivada calculada en intervalo temporal fijo;
- separación respecto al artefacto.

Los valores por defecto se validarán con señales sintéticas y registros reales. La puntuación resultante será una prioridad heurística de revisión, no una probabilidad fisiológica.

### 7.3. Inicio de respuesta

Se compararán dos estimadores:

- primer cruce sostenido de un umbral robusto;
- intersección con línea base de la recta ajustada entre 20 y 80% de la amplitud.

Ambos valores podrán exportarse durante validación. El estimador definitivo se elegirá por error frente a anotación experta, no por conveniencia visual.

### 7.4. Sin respuesta

`sin_respuesta` será un resultado válido cuando:

- no exista desviación sostenida dentro de la ventana;
- la amplitud no supere el criterio de ruido;
- sólo se detecte artefacto;
- no pueda separarse una respuesta del artefacto.

Los dos últimos casos deben distinguirse: `sin_respuesta_detectable` no equivale a `no_evaluable`.

## 8. Métricas

Todas las métricas conservarán valor, unidad, método, ventana y estado automático/corregido.

| Métrica | Definición propuesta |
|---|---|
| Línea base | mediana del voltaje preestímulo |
| Ruido basal | `1.4826 × MAD` y RMS, reportados por separado |
| Amplitud firmada | extremo menos línea base |
| Amplitud absoluta | valor absoluto de la amplitud firmada |
| Latencia de inicio | estímulo a inicio estimado |
| Latencia de pico | estímulo a extremo |
| Tiempo de subida | intervalo 20–80% de amplitud |
| Pendiente inicial | regresión entre 20–80% o ventana fija |
| Pendiente máxima | máximo local sobre intervalo temporal fijo |
| Anchura media | duración al 50% de amplitud |
| Área firmada | integral de señal corregida en ventana declarada |
| Retorno | tiempo hasta recuperar una banda alrededor de línea base |
| SNR de amplitud | amplitud absoluta dividida entre ruido robusto |
| Variabilidad | CV o medida robusta entre ensayos equivalentes |
| Razón pareada | segunda amplitud/primera amplitud, con denominador y QC explícitos |

El ajuste exponencial de decaimiento será opcional. Sólo se informará `tau` cuando el ajuste converja, use suficientes muestras y se exporten residuales o una métrica de ajuste. No se forzará una exponencial a respuestas bifásicas.

## 9. Potenciales de acción

La fase `v0.2` está dirigida a respuestas subumbrales. Si la ventana contiene una espiga:

- la traza no se usará automáticamente para amplitud de PSP al pico;
- se conservará la latencia a espiga como observación separada;
- se podrá medir el PSP previo únicamente mediante una regla explícita y revisable;
- nunca se suavizará la espiga para fabricar un pico subumbral.

El análisis completo de excitabilidad y potenciales de acción será otro perfil.

## 10. Revisión manual

Se reutilizará el flujo auditable existente:

- aceptar, rechazar o dejar pendiente;
- navegar por barridos;
- añadir nota;
- corregir inicio, pico y final/retorno sobre muestras reales;
- restaurar valores automáticos;
- invalidar una decisión si cambian parámetros relevantes;
- conservar historial automático y manual.

La interfaz debe mostrar siempre:

- estímulo y ventana de artefacto;
- línea base;
- inicio, extremo y retorno;
- dirección eléctrica;
- etiqueta fisiológica y su evidencia;
- banderas QC;
- señal cruda y señal de análisis.

## 11. Exportación

Hojas propuestas:

- `Resumen`: una fila por traza/estímulo;
- `Mediciones_PSP`: métricas automáticas y finales;
- `Eventos_estimulo`: tiempos y procedencia de cada estímulo;
- `Metadatos_current_clamp`: preparación, célula, soluciones y configuración;
- `Trazas_QC`: banderas, exclusión y motivo;
- `Revision_manual`: decisión, nota, persona/código y fecha;
- `Correcciones_PSP`: valores automáticos y corregidos;
- `Historial_PSP`: acciones auditables;
- `Parametros`: ventanas, umbrales, filtros y versión;
- `Diccionario`: definición y unidad de cada columna.

El formato largo será el principal para estadística: una fila por célula, barrido, estímulo y métrica. Los identificadores jerárquicos deben permitir posteriormente modelos de medidas repetidas sin confundir estímulos, barridos, células, cortes y animales.

## 12. Arquitectura propuesta

Sin implementación todavía:

- `src/core/currentClamp.js`: detección y medición pura de PSP;
- `src/core/baseline.js`: estimación robusta compartida;
- `src/core/metrics.js`: métricas con ventanas y unidades explícitas;
- `src/core/qc.js`: banderas y motivos de exclusión;
- `src/core/classification.js`: etiqueta fisiológica y evidencia;
- `src/io/workbook.js`: adaptación tabular y exportación;
- `src/ui/plot.js`: capas de estímulo, artefacto y puntos revisables;
- `src/app.js`: selección de modalidad y estado de interfaz.

El detector no accederá al DOM ni a Excel. Recibirá arreglos y una configuración, y devolverá resultados serializables. Así podrá probarse con señales sintéticas deterministas.

## 13. Pruebas sintéticas y casos límite

El banco inicial debe incluir semillas fijas y valores verdaderos conocidos:

1. EPSP positivo monoexponencial/biexponencial;
2. PSP negativo;
3. IPSP despolarizante etiquetado por evidencia, para impedir clasificación por signo;
4. ausencia de respuesta;
5. respuesta bajo ruido creciente;
6. deriva lineal y no lineal;
7. artefacto que invade el inicio;
8. saturación en artefacto, pico y fuera de ventana;
9. potencial de acción sobre el PSP;
10. respuesta bifásica;
11. dos estímulos con facilitación y depresión;
12. muestreo irregular y cambio de frecuencia;
13. muestras faltantes;
14. respuesta en el borde de ventana;
15. cambio de potencial basal entre barridos;
16. amplitud cercana a cero para probar divisiones y razones.

Cada prueba evaluará error de amplitud, latencia, pendiente y área, además de falsos positivos/negativos y banderas QC.

## 14. Criterios para comenzar implementación

Antes de escribir el detector deben acordarse:

- tipo de preparación y células prioritarias;
- estructura real de los archivos;
- procedencia del tiempo de estímulo;
- ventanas esperadas por protocolo;
- polaridad eléctrica esperada;
- evidencia admitida para EPSP/IPSP;
- criterios del laboratorio para estabilidad de potencial y resistencias;
- manejo de respuestas con espigas;
- conjunto de trazas anotadas por al menos dos revisores.

La concordancia entre revisores debe medirse antes de usar su consenso como referencia. Los desacuerdos se conservarán; no deben ocultarse mediante una etiqueta mayoritaria sin revisión.

## 15. Criterios de aceptación de `v0.2`

- cero clasificación EPSP/IPSP basada sólo en signo;
- ausencia de respuesta tratada como resultado válido;
- error de amplitud y latencia cuantificado frente a anotación experta;
- falsos positivos y falsos negativos reportados por protocolo;
- pruebas sintéticas deterministas aprobadas;
- datos crudos preservados;
- toda transformación y corrección exportada;
- funcionamiento en Safari y Chrome;
- decisiones manuales persistentes e invalidadas cuando cambie la configuración;
- exportación larga compatible con análisis jerárquico posterior.

## 16. Fuentes metodológicas

- Guzman SJ, Schlögl A, Schmidt-Hieber C. *Stimfit: quantifying electrophysiological data with Python*. Front Neuroinform. 2014;8:16. <https://doi.org/10.3389/fninf.2014.00016>. Valida mediciones de línea base, pico, subida, anchura y pendientes, y muestra la dependencia de la pendiente respecto a ruido y muestreo.
- Monsivais P, Rubel EW. *Accommodation enhances depolarizing inhibition in central neurons*. J Neurosci. 2001;21(19):7823–7830. <https://pmc.ncbi.nlm.nih.gov/articles/PMC6762906/>. Demuestra experimentalmente que una respuesta GABAérgica despolarizante puede mantener función inhibitoria.
- Neher E. *Correction for liquid junction potentials in patch clamp experiments*. Methods Enzymol. 1992;207:123–131. <https://doi.org/10.1016/0076-6879(92)07008-C>. Fundamenta registrar y corregir explícitamente el potencial de unión líquida.
- Neurodata Without Borders. *NWB Format Specification: CurrentClampSeries and CurrentClampStimulusSeries*. <https://nwb-schema.readthedocs.io/en/latest/format.html#currentclampseries>. Separa voltaje registrado, corriente aplicada, corriente de sesgo, bridge balance y compensación de capacitancia.
- Gabriel R III, Boreland AJ, Pang ZP. *Whole cell patch clamp electrophysiology in human neuronal cells*. Methods Mol Biol. 2023;2683:259–273. <https://doi.org/10.1007/978-1-0716-3287-1_21>. Incluye estabilidad de línea base, resistencia de acceso y estabilización del potencial en I=0 como controles experimentales.

Los umbrales numéricos de artículos o protocolos particulares no se adoptarán como universales. Se configurarán y validarán para cada preparación.
