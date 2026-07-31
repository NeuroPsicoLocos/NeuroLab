# Simu-LAB / NeuroLab

Plataforma web abierta de NeuroPsicoLocos para simulación, análisis y docencia en neurociencias. El repositorio usa HTML, CSS y JavaScript modular sin proceso de compilación, por lo que puede publicarse directamente con GitHub Pages.

Sitio de producción: <https://neurolab.neuropsicolocos.com/>

Repositorio oficial: <https://github.com/NeuroPsicoLocos/NeuroLab>

## Laboratorios

### Electrophysiology Lab (beta metodológica)

Ruta: `apps/electrophysiology-lab/`

Primera base para analizar potenciales de campo y, por fases, registros de current clamp, voltage clamp y series farmacológicas. La versión actual incluye:

- apertura local de XLSX, XLS, CSV, TSV y TXT;
- selección de hoja, tiempo, señal y unidades;
- gráfica Canvas de la señal cruda;
- estimación robusta de frecuencia de muestreo y métricas descriptivas;
- candidatos preliminares de artefacto mediante derivada y MAD;
- banderas de datos faltantes, muestreo irregular y posible saturación;
- exportación de resumen, eventos, control de calidad y parámetros a Excel;
- exportación JSON de la configuración para reproducibilidad.

Los candidatos actuales **no son anotaciones fisiológicas validadas**. EPSP, IPSP, EPSC, IPSC, respuestas de campo y efectos farmacológicos requieren criterios y ventanas explícitas que se añadirán en fases posteriores. Véase el [README del módulo](apps/electrophysiology-lab/README.md).

### NeuroCell Explorer

Ruta: `apps/neurocell-explorer/`

Atlas tridimensional docente de células del sistema nervioso. Incluye reconstrucciones SWC de NeuroMorpho.Org, procedencia científica y paneles de anatomía, conectividad, función y clínica. Véanse su [README](apps/neurocell-explorer/README.md) y la [documentación de procedencia](docs/neurocell-explorer/NEUROMORPHO_INTEGRATION.md).

### Topological Lab

El nudo borromeo permanece como proyecto asociado durante esta primera integración. Se enlaza desde el portal y se migrará cuando su contenido, licencia y navegación estén estabilizados.

## Ejecución local

Desde la raíz del repositorio:

```bash
python3 -m http.server 8005
```

Abrir:

```text
http://127.0.0.1:8005/
http://127.0.0.1:8005/apps/electrophysiology-lab/
http://127.0.0.1:8005/apps/neurocell-explorer/
```

No conviene abrir los HTML con `file://`: los módulos ES y los recursos externos necesitan un servidor HTTP.

## Pruebas

Requieren Node.js 20 o superior y no instalan dependencias:

```bash
node --test tests/*.test.mjs
```

La integración continua repite estas pruebas y verifica la sintaxis de los módulos JavaScript.

## Estructura

```text
NeuroLab/
├── index.html                         # Portal Simu-LAB
├── styles/portal.css
├── apps/
│   ├── electrophysiology-lab/
│   │   ├── index.html
│   │   ├── styles/main.css
│   │   └── src/
│   │       ├── app.js
│   │       ├── core/signal.js         # Núcleo puro y comprobable
│   │       ├── io/workbook.js         # Entrada/salida tabular
│   │       └── ui/plot.js              # Visualización Canvas
│   └── neurocell-explorer/
├── docs/
└── tests/
```

## Datos, privacidad y límites de GitHub

Los registros seleccionados en Electrophysiology Lab se procesan dentro del navegador. No hay API de carga ni servidor de Simu-LAB.

Los datos crudos privados no deben añadirse al repositorio. `.gitignore` excluye formatos electrofisiológicos pesados comunes y una carpeta local `apps/electrophysiology-lab/data/private/`. Para ejemplos públicos deben usarse señales sintéticas pequeñas, desidentificadas y con licencia/procedencia documentada.

La interfaz usa SheetJS 0.20.3 desde su CDN oficial para leer y escribir libros de cálculo, y NeuroCell Explorer mantiene su dependencia Three.js fijada. El repositorio no usa Git LFS porque los objetos de LFS no se sirven mediante GitHub Pages.

## Exactitud científica

- Los datos crudos se preservan; toda transformación futura deberá registrarse.
- Las banderas automáticas sirven para revisión, no sustituyen el juicio experto.
- Las simplificaciones visuales o fisiológicas deben identificarse como tales.
- Las comparaciones farmacológicas deberán conservar tiempo experimental, dosis, condición, preparación y jerarquía de ensayos.

## Licencia y contacto

Código bajo licencia MIT, salvo recursos con atribuciones específicas indicadas en sus manifiestos.

Contacto: admin@neuropsicolocos.com
