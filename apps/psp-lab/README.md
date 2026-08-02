# PSP Lab

Laboratorio docente experimental de Simu-LAB para practicar el análisis descriptivo de potenciales
postsinápticos evocados en current clamp con señales sintéticas reproducibles.

## Alcance científico

PSP Lab genera trazas fenomenológicas con línea base, ruido, deriva, artefacto de estímulo, respuesta
monofásica o bifásica, variación entre barridos y saturación opcional. El detector reporta dirección,
amplitud y latencias, pero mantiene la clasificación `PSP_unclassified`.

Una deflexión positiva o negativa no basta para identificar EPSP o IPSP: esa interpretación requiere
información adicional sobre potencial de membrana, potencial de reversión, configuración experimental y
farmacología. Las señales del laboratorio son sintéticas y no sustituyen registros biológicos.

## Modos

- **Estudiante:** recibe únicamente tiempo, voltaje, estímulos e identificadores. La configuración y la verdad
  conocida permanecen privadas hasta evaluar el intento.
- **Docente:** permite fijar semilla, forma, dirección, amplitud, ruido, deriva, número de barridos, estímulo
  pareado y saturación; muestra la verdad conocida y las métricas del detector.

La aplicación guarda solo un contador de progreso en `localStorage`. No envía datos a un servidor.

## Ejecución

Puede abrirse directamente mediante `index.html` o desde un servidor estático:

```bash
python3 -m http.server 8005
```

Después abre `http://127.0.0.1:8005/apps/psp-lab/`.

## Desarrollo

La fuente editable está dividida en módulos ES:

- `src/app.js`: estado, modos, tutor y exportación;
- `src/plot.js`: visualización Canvas;
- `../electrophysiology-lab/src/core/pspScenario.js`: generador determinista;
- `../electrophysiology-lab/src/core/currentClamp.js`: detector PSP.

Para conservar compatibilidad con Safari y `file://`, `index.html` carga `src/app.bundle.js`. Esta copia se
genera de forma determinista y no debe editarse manualmente:

```bash
node scripts/build-psp-lab-bundle.mjs
node scripts/build-psp-lab-bundle.mjs --check
node --test tests/*.test.mjs
```

Arquitectura detallada: [`../../docs/electrophysiology/PSP_TUTOR_ARCHITECTURE.md`](../../docs/electrophysiology/PSP_TUTOR_ARCHITECTURE.md).
