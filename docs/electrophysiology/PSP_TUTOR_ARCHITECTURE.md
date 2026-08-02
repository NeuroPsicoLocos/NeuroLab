# Arquitectura propuesta: PSP Lab y tutor didáctico

Estado: primera base implementada sólo en el núcleo sintético; no conectada todavía a la interfaz pública.

## Objetivo

PSP Lab será un entorno docente y de validación para generar, analizar y discutir potenciales postsinápticos. Usará el mismo núcleo matemático para los modos estudiante, docente y pruebas automatizadas, evitando que la “respuesta correcta” dependa de lo que dibuja la interfaz.

El sistema deberá distinguir siempre:

- señal sintética frente a registro experimental;
- dirección eléctrica frente a identidad EPSP/IPSP;
- medición descriptiva frente a interpretación fisiológica;
- verdad conocida del simulador frente a inferencia del estudiante o del tutor.

## Arquitectura

```text
scenario.json + semilla
        |
        v
generador PSP determinista -----> groundTruth (reservada)
        |                              |
        v                              v
trazas para estudiante ----------> tutor/reglas de evaluación
        |
        +----> núcleo de análisis PSP
        +----> gráfica y revisión
        +----> exportación docente
```

El primer motor está en `src/core/pspScenario.js`. No depende del DOM, Canvas, Excel ni servicios externos.

## Contrato de escenario

Esquema: `simulab-psp-scenario-0.1`.

La configuración serializable está descrita en [`psp-scenario.schema.json`](psp-scenario.schema.json). Incluye:

- semilla;
- frecuencia, duración y número de barridos;
- línea base, ruido y deriva;
- estímulos y escala por estímulo;
- respuesta mono/bifásica o ausencia de respuesta;
- amplitud, latencia y constantes temporales;
- variabilidad entre barridos;
- artefacto y límites de saturación;
- etiqueta fisiológica y evidencia experimental.

La salida contiene:

- eje temporal compartido;
- trazas por barrido;
- tiempos de estímulo;
- metadatos y configuración;
- verdad conocida por barrido y evento.

`createStudentScenarioView()` elimina configuración, evidencia y verdad conocida antes de entregar el escenario al estudiante.

## Modelo sintético inicial

La respuesta usa una diferencia de exponenciales normalizada:

```text
f(t) = [exp(-t/tau_decay) - exp(-t/tau_rise)] / valor_en_el_pico
```

El modelo permite controlar directamente amplitud y cinética. Se eligió porque es transparente, tiene pico analítico y es habitual como aproximación fenomenológica de conductancias sinápticas. No incorpora todavía morfología dendrítica, canales voltaje-dependientes ni subunidades receptoras.

La señal final suma:

1. potencial basal y variación entre barridos;
2. deriva lineal;
3. artefacto de estímulo;
4. una o varias respuestas PSP;
5. ruido gaussiano determinista;
6. clipping opcional.

La semilla garantiza que una pregunta, una corrección o una prueba puedan reproducirse exactamente.

## Modos educativos

### Estudiante

- recibe trazas sin la verdad conocida;
- selecciona línea base, inicio, pico y final;
- decide si hay respuesta, artefacto o señal no evaluable;
- describe dirección antes de interpretar fisiología;
- justifica EPSP/IPSP con evidencia;
- obtiene pistas progresivas y una devolución final.

### Docente

- configura o genera escenarios aleatorios;
- define qué metadatos se revelan;
- conserva la verdad conocida;
- elige tolerancias de amplitud y latencia;
- ve respuestas, intentos y errores frecuentes;
- exporta una rúbrica reproducible.

### Investigación/validación

- ejecuta el detector sobre señales con verdad conocida;
- cuantifica error de amplitud, latencia, pendiente y área;
- reporta falsos positivos y negativos;
- compara configuraciones sin usar los datos de prueba para ajustar umbrales.

## Tutor local: primera fase

El tutor inicial será determinista y funcionará en GitHub Pages. No será un chatbot libre. Evaluará una secuencia:

1. ¿La línea base es estable?
2. ¿El estímulo y su artefacto están identificados?
3. ¿Existe una desviación sostenida por encima del ruido?
4. ¿La respuesta es positiva, negativa, bifásica o indeterminada?
5. ¿Hay saturación, espiga o borde de ventana?
6. ¿Qué métricas son válidas?
7. ¿Existe evidencia suficiente para EPSP/IPSP?

Las pistas se basarán en banderas y reglas explícitas. El tutor nunca moverá puntos, aceptará trazas o cambiará parámetros sin que la persona usuaria lo vea.

## Agente con IA: fase posterior

Un agente conversacional podrá:

- adaptar explicaciones al nivel del estudiante;
- formular preguntas socráticas;
- comparar razonamientos con la rúbrica;
- explicar banderas y métricas;
- generar un resumen docente.

Restricciones:

- GitHub Pages no debe contener una clave de API;
- una IA remota requerirá un servicio intermedio seguro o un modelo local;
- por defecto sólo recibiría métricas y metadatos no sensibles, no archivos crudos;
- cualquier envío de una traza requerirá consentimiento explícito;
- sus respuestas distinguirán medición, inferencia y simplificación;
- el resultado del agente no sustituirá la revisión experta.

## Macro y microelectrofisiología

El formato de escenario se ampliará mediante perfiles, no mediante un generador monolítico:

- `current_clamp_psp`: voltaje intracelular subumbral;
- `voltage_clamp_psc`: corrientes postsinápticas;
- `field_population`: potencial extracelular de una población;
- `action_potential`: excitabilidad y canales voltaje-dependientes;
- `pharmacology_timecourse`: secuencias baseline–fármaco–lavado.

El perfil poblacional no será una simple multiplicación del PSP. Deberá declarar sincronía, número de unidades, geometría/electrodo y que se trata de una simplificación del campo extracelular.

## Receptores, subunidades y canales

La evolución propuesta es:

1. perfiles fenomenológicos AMPA, NMDA, GABA_A y GABA_B;
2. parámetros curados de subunidades con referencia y rango de validez;
3. voltage clamp para observar PSC y potencial de reversión;
4. current clamp con membrana pasiva para transformar conductancia en PSP;
5. canales Na, K, Ca y HCN para excitabilidad;
6. modelo Hodgkin–Huxley o variantes específicas para AP;
7. morfología y localización sináptica cuando el objetivo docente lo requiera.

Modificar receptores puede cambiar integración sináptica y probabilidad de disparo, pero la cinética directa del AP requiere además canales voltaje-dependientes. El simulador deberá hacer visible esta diferencia.

Cada perfil futuro incluirá:

- fuente científica;
- ecuaciones y parámetros;
- especie/preparación si corresponde;
- unidades;
- supuestos y simplificaciones;
- pruebas de regresión;
- versión estable.

## Pruebas de la primera base

La versión inicial comprueba:

- igualdad exacta con la misma semilla;
- diferencia con otra semilla;
- normalización y tiempo de pico de la biexponencial;
- coincidencia entre amplitud generada y verdad conocida sin ruido;
- prohibición de EPSP/IPSP sin evidencia;
- ausencia de respuesta como resultado válido;
- respuestas bifásicas, estímulos pareados y saturación;
- separación de la vista estudiante y la verdad conocida.

## Próximos incrementos

1. agregar contaminación por potencial de acción y muestras faltantes;
2. construir el detector genérico PSP contra este banco;
3. crear evaluación cuantitativa con tolerancias;
4. integrar una demostración separada de la beta experimental;
5. añadir modo docente y tutor local;
6. diseñar perfiles de conductancia y farmacología;
7. evaluar el agente conversacional sólo después de estabilizar la rúbrica.

## Fuentes iniciales

- Guzman SJ, Schlögl A, Schmidt-Hieber C. *Stimfit: quantifying electrophysiological data with Python*. Front Neuroinform. 2014;8:16. <https://doi.org/10.3389/fninf.2014.00016>.
- Pavlov I et al. *Ih-mediated depolarization enhances the temporal precision of neuronal integration*. Nat Commun. 2011;2:199. <https://pmc.ncbi.nlm.nih.gov/articles/PMC3105342/>. Utiliza el formalismo de doble exponencial para conductancias sinápticas en simulación.
- Hodgkin AL, Huxley AF. *A quantitative description of membrane current and its application to conduction and excitation in nerve*. J Physiol. 1952;117:500–544. <https://doi.org/10.1113/jphysiol.1952.sp004764>. Base histórica para la fase futura de potenciales de acción.

