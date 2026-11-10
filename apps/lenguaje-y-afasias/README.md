# Lenguaje y afasias · NeuroLab

Material de estudio para estudiantes de Psicología: tres sesiones y 39 temas, mapa interactivo de la red del lenguaje, desarrollo lingüístico, ocho síndromes afásicos, ocho casos ficticios con retroalimentación, herramientas docentes, bibliografía y una presentación editable de 73 diapositivas.

## Integración

Módulo estático de HTML, CSS y JavaScript. El catálogo de NeuroLab lo enlaza desde **Aprender**. Ruta del módulo: `apps/lenguaje-y-afasias/`. La navegación de regreso apunta al catálogo del mismo sitio. No necesita servidor de aplicación, base de datos ni instalación.

Para probarlo, sirve la raíz de NeuroLab con `python3 -m http.server 8005` y abre `http://127.0.0.1:8005/apps/lenguaje-y-afasias/`. La publicación sigue el flujo del repositorio principal; no debe crearse un repositorio ni un portal independiente.

## Archivos

- `index.html`: estructura y navegación.
- `css/styles.css`: diseño claro/oscuro y adaptable.
- `js/data.js`: contenido, casos, esquemas y referencias.
- `js/app.js`: navegación e interacciones.
- `img/`: esquemas originales simplificados.
- `descargas/`: presentación PPTX editable.

## Privacidad y límites

El tema visual y los identificadores de casos resueltos se guardan exclusivamente en localStorage, con claves propias de este módulo. No se recogen respuestas, datos personales ni datos clínicos. Las fuentes tipográficas se cargan desde Google Fonts, con fuentes del sistema como alternativa.

Los casos y muestras de habla son ficticios. Las localizaciones son aproximadas y probabilísticas. Las herramientas sirven para aprender y no sustituyen evaluación, diagnóstico ni atención clínica. Los instrumentos de evaluación deben contrastarse con ediciones y baremos locales. La comprobación técnica no equivale a validación clínica ni a revisión exhaustiva de la bibliografía.

## Validación

`node --check apps/lenguaje-y-afasias/js/data.js`

`node --check apps/lenguaje-y-afasias/js/app.js`

`node --test tests/lenguaje-afasias.test.mjs`

Ejecutar además las comprobaciones completas del repositorio antes de publicar.
