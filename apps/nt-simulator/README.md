# NeuroLab · Neurotransmisores 4.6 · piloto educativo

Abrir `index.html` o `/apps/nt-simulator/` desde el portal NeuroLab. Interfaz en español. Sin instalación, servicios externos ni carga de datos.

Cinco módulos: GABA, glutamato, acetilcolina, dopamina y serotonina. Cada uno separa sinapsis, receptores, respuesta celular y farmacología. Potencial de acción se mantiene como laboratorio independiente. Las ilustraciones, las comparaciones conceptuales y los cálculos están identificados por separado.

Métodos, unidades y límites: [methods.html](methods.html). Fuentes y grado de consulta: [sources.html](sources.html). Licencia MIT del repositorio.

## Mantenimiento

```sh
node apps/nt-simulator/build.mjs --check
node --test apps/nt-simulator/*.test.mjs
```

El motor numérico, la presentación y los dibujos son módulos separados. `build.mjs` produce cinco bundles clásicos deterministas para permitir también apertura directa. No hay dependencias nuevas.

Revisión real de Safari y viewport móvil pendiente: las solicitudes de permiso de automatización quedaron interrumpidas. Las pruebas automáticas no sustituyen esa revisión. No hay backend, telemetría ni formulario de captura de datos personales.
