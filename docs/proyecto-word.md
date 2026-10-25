# Proyecto de servicio social en Word

El botón **Preparar Word** del portal genera un `.docx` editable para todo el equipo mediante Docxtemplater y PizZip locales. No convierte HTML a Word, no envía los datos al servidor y no incorpora los archivos externos de los anexos.

## Referencias y decisiones

- Guía UPS incluida en `documentos/procesos/proyecto.pdf`: portada en p. 2, contenido y cronogramas en pp. 3–7, orden de anexos en p. 8. La p. 9 está en blanco.
- Anteproyecto personal compartido por el usuario: referencia de jerarquía institucional, portada, secciones y cronogramas. Su portada es una imagen dentro del DOCX; por eso se reconstruyó como texto editable. No se copiaron nombres, carnet, firmas, sellos ni contenido académico del ejemplo.
- El escudo procede de `word/media/image1.png` de la guía Word UPS incluida en el repositorio.
- Formato académico consultado: [APA Style — Paper format](https://apastyle.apa.org/style-grammar-guidelines/paper-format) y [APA — Student papers](https://www.apa.org/ed/precollege/psn/2020/09/apa-style-student-papers), consultados el 22 de octubre de 2026.

## Formato aplicado

Papel carta; márgenes de 2.54 cm; Times New Roman 12; cuerpo a doble espacio, alineado a la izquierda, primera línea con sangría de 1.27 cm; títulos negros; numeración automática superior derecha desde la portada. Referencias con sangría francesa, cuando el alumno las ingresa. Los saltos de línea del formulario separan párrafos.

**Adaptaciones institucionales:** portada centrada con escudo, datos y firma del tutor, interlineado compacto; índice de secciones; secciones principales en páginas separadas como el ejemplo compartido; cronogramas en horizontal y tablas a espacio sencillo. El orden y los títulos de los anexos siguen la guía UPS. No se presenta esta portada como la portada estándar de un ensayo estudiantil APA.

La aplicación aplica formato; no valida citas, veracidad de referencias, cursivas de títulos bibliográficos ni contenido académico. Las referencias deben revisarse y formatearse en Word con el tutor. No se inventan fuentes. Las secciones vacías se señalan como `[Por completar]`.

El archivo es independiente: textos, estilos e imagen están dentro del DOCX, sin relaciones externas. El índice enlaza a los títulos del propio documento, sin campos PAGEREF ni números que puedan quedar incorrectos al editar. La actualización de campos al abrir está desactivada. Se conserva únicamente PAGE para la numeración normal de hojas; no se cambian los ajustes globales de Word. Si se sustituyen hojas guía, conservar sus títulos/marcadores para mantener la navegación.

## Orden de los anexos

1. **A — Documentos de inscripción:** carta institucional, Formulario 1 por estudiante, Carta 1 del tutor, Carta 2 por estudiante y constancias del 60 % por estudiante.
2. **B — Respaldos:** mapas, fotografías y otros documentos pertinentes, con título y fuente. El campo de respaldos describe lo que el alumno agregará; no carga archivos.
3. **C — Cuadro resumen:** generado con los datos y textos ingresados.
4. **D — Solicitud de la institución:** la guía la enumera de nuevo al final; confirmar con coordinación si requiere duplicarla o referenciar su ubicación en A.

Las hojas A, B y D son indicaciones para sustituir por los anexos reales. El orden de la guía prevalece sobre el orden distinto del ejemplo personal. Al terminar se gestionan firmas y sellos y se entrega el PDF escaneado según la guía; generar el archivo no equivale a aprobación.

## Mantenimiento

- `scripts/prepare-proyecto-template.py`: construcción reproducible de la plantilla (Python con python-docx).
- `documentos/plantillas/proyecto.docx`: plantilla etiquetada.
- `js/proyecto-plantilla.js`: copia base64 del mismo archivo para uso sin red.
- `js/proyecto-documento.js`: validación, preparación de variables y generación.
- `js/procesos.js`: descarga Word y resumen de anexos en Proyecto; Memoria también genera un DOCX desde su plantilla local.
- `tests/proyecto.test.cjs`: equipos 1/3/5, estructura, formato, índice, referencias opcionales, datos inválidos, texto extenso, escape XML y motor del navegador.

Para reconstruir, ejecutar `python3 scripts/prepare-proyecto-template.py` con python-docx disponible. Revisar visualmente el resultado de 1 y 5 alumnos y ejecutar `npm test`. Si se edita directamente la plantilla Word, mantener sus variables y sincronizar su copia base64; la prueba compara ambos archivos.

El cronograma calcula fechas a partir de las horas diarias y actividades de cada alumno. Valida individualmente las horas requeridas por su carrera y la capacidad del período. El Word muestra actividades + horas y semanas reales agrupadas por mes, hasta dos meses por página. No descuenta feriados ni vacaciones. Véase `cronograma-memoria.md`.
