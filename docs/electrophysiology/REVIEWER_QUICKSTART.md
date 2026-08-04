# Guía rápida para revisar Simu-LAB beta

Esta guía permite probar la beta pública en 10–15 minutos sin compartir datos privados. El protocolo científico
completo permanece en [`PILOT_VALIDATION.md`](PILOT_VALIDATION.md).

## Enlaces

- Portal: <https://neurolab.neuropsicolocos.com/>
- Análisis de potenciales de campo: <https://neurolab.neuropsicolocos.com/apps/electrophysiology-lab/>
- Laboratorio docente PSP: <https://neurolab.neuropsicolocos.com/apps/psp-lab/>
- Reportar una prueba: <https://github.com/NeuroPsicoLocos/NeuroLab/issues/new?template=electrophysiology-pilot.yml>

El selector `ES | EN` cambia el idioma. Los archivos electrofisiológicos se procesan localmente en el navegador;
no se cargan a un servidor de Simu-LAB.

## Prueba mínima con datos sintéticos

1. Abrir **Electrophysiology Lab** y seleccionar **Usar señal sintética de demostración**.
2. Confirmar que aparecen la gráfica, 10 artefactos candidatos y las métricas básicas.
3. Seleccionar **Espiga poblacional · POPS experimental** y revisar P1, P2 y P3.
4. Marcar la traza como pendiente, rechazada o aceptada.
5. Exportar Excel y confirmar que el archivo abre correctamente.
6. Abrir **PSP Lab**, generar un reto y comprobar los modos estudiante y docente.
7. Repetir brevemente en inglés con `EN`.

## Prueba opcional con un registro real

Utilizar únicamente un archivo autorizado y desidentificado. Confirmar hoja, columna temporal, unidad, frecuencia de
muestreo y señal antes de interpretar la detección. Una columna sin respuesta debe permanecer como resultado negativo;
no debe forzarse una medición fisiológica.

No adjuntar a GitHub el registro original si contiene datos privados. Para reportar un problema basta con describir el
formato y el entorno, usar un identificador local no sensible y, si es necesario, agregar una captura recortada sin
metadatos identificables.

## Mensaje breve para compartir

> Estamos probando la beta de Simu-LAB para análisis y enseñanza de electrofisiología. Funciona en el navegador y
> procesa los archivos localmente. Agradecemos una prueba de 10–15 minutos con la señal sintética y un reporte breve:
> https://neurolab.neuropsicolocos.com/

## English quick review

1. Open **Electrophysiology Lab** and choose **Use synthetic demonstration signal**.
2. Confirm that the plot, 10 artifact candidates, and summary metrics appear.
3. Select **Population spike · experimental POPS** and inspect P1, P2, and P3.
4. Save an accepted, rejected, or pending review decision.
5. Export Excel and confirm that the workbook opens.
6. Open **PSP Lab** and test both Student and Teacher modes.
7. Report the environment, observed result, expected result, and non-sensitive reproduction steps through the issue
   form linked above.

The synthetic signals are educational and methodological test cases. They do not validate the detector against real
recordings and do not establish EPSP, IPSP, EPSC, or IPSC identity.
