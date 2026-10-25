# Guía y preparación de documentos del Portal Estudiantil

Implementación del 22 de octubre de 2026, basada en los tres paquetes proporcionados de FMO–UES. No modifica los documentos originales. La procedencia y los hashes se registran en `documentos/procesos/fuentes.json`.

## Correspondencia con las fuentes

| Etapa | Fuente | Aplicación |
| --- | --- | --- |
| Inscripción | `inscripcion.pdf`, p. 1 | Cinco documentos ordenados, firmas, escaneo en un PDF, entrega a coordinación y registro previo al inicio. |
| Hoja individual | `inscripcion.pdf`, p. 3 | Identificación, carrera, dirección, contacto, disponibilidad, institución, plan, tutor, fecha y espacios de firma. |
| Cartas de inscripción | `inscripcion.pdf`, pp. 2, 4–5 | Rellenado del modelo en Word para revisión; la emisión corresponde a institución/coordinación. |
| Proyecto | `proyecto.pdf`, p. 1 | Revisión por tutor, correcciones, coordinación y ratificación UPS. |
| Redacción del proyecto | `proyecto.pdf`, pp. 2–8 | Portada, índice, apartados, recursos, cronogramas, cuadro resumen y anexos. |
| Memoria | `memoria.pdf`, pp. 1–2 | Plazo, escaneo ordenado, antecedentes, aprobación, certificación y retiro personal. |
| Redacción de memoria | `memoria.pdf`, pp. 3–6 | Portada, índice, secciones en páginas separadas, límites de extensión, resumen y anexos. |
| Anexos | `memoria.pdf`, pp. 7–16 | Lista de informes, evaluaciones, constancias, asistencia y MINED; modelos disponibles en el paquete descargable. |

## Recorridos

Portal → Mi proceso → Etapa → Descargar guía PDF / modelos Word.

Inscripción → Crear documento → Equipo (cantidad) → Alumnos → Proyecto → Revisión → Preparar Word → Descargar DOCX.

Proyecto / Memoria → Crear documento → Equipo → Alumnos → Tu proyecto → Contenido → Revisión → Descargar Word.

El estudiante puede volver a cualquier paso anterior sin perder lo escrito. Cada etapa mantiene un borrador independiente durante la visita. No se almacena información personal al recargar o cerrar.

## Alcance de los documentos generados

La inscripción genera un solo Word por proyecto, usando el DOCX original como plantilla. Repite el Formulario 1 y la Carta 2 por alumno, y reúne al grupo en la Carta 1. La carta de solicitud indica cantidad y carreras, sin nombres. Véase `inscripcion-word.md`. Proyecto y memoria generan borradores completos en estructura, con el contenido aportado por el estudiante. Se permiten secciones narrativas pendientes para avanzar por partes; no se presentan como documentos listos para aprobación.

Los cronogramas usan las mismas actividades para el detalle por períodos y la distribución de horas. Cada fila representa una actividad y las columnas distribuyen horas en cuatro períodos por mes. Se valida el rango del proyecto y que la suma semanal coincida con las horas previstas; no se trasladan las fechas del ejemplo institucional.

No se adjuntan archivos de evidencia, no se aplican firmas ni sellos y no se generan certificaciones institucionales. El índice tiene enlaces a las secciones; su paginación final debe revisarse una vez reunidos los anexos. Los límites de páginas de la memoria se muestran como orientación; la paginación depende del texto, la impresión y los anexos.

## Decisiones que deben validarse

- Los archivos suministrados no indican versión institucional. Su incorporación al portal no equivale a validación de vigencia.
- La guía de proyecto menciona 15 días sin establecer de forma inequívoca la fecha inicial para el cómputo. No se genera un vencimiento automático.
- La guía de memoria lista la certificación como anexo y también indica emisión posterior a la aprobación. Se informa la contradicción y se deriva la confirmación a la UPS.
- El catálogo DSI relaciona F3 con asistencia, mientras la guía FMO usa Formulario 3 para el informe del 50 % y Formulario 7 para asistencia. Este incremento organiza recursos por proceso y no cambia silenciosamente los códigos del catálogo.
- Las tres etapas generan DOCX nativos. Memoria conserva el encabezado institucional y la tabla resumen del modelo original; los textos extensos pueden cambiar la paginación y requieren revisión antes de imprimir.

## Relación con backlog

Portal Estudiantil: ALU-HU-02 (acceso a guía), ALU-HU-04 (descargas de recursos), ALU-HU-05 (documentos editables locales), ALU-HU-06 y ALU-HU-07 (requisitos y pasos). Este incremento no completa automáticamente todas las tareas de dichas historias ni el catálogo F1–F8.

## Validación realizada

- Pruebas Node: campos obligatorios, correo, porcentaje, fechas reales y cronología; cronogramas; escape de contenido; documentos autocontenidos; integridad de los seis archivos de origen.
- Navegador integrado: inscripción de dos alumnos y descarga real del DOCX; los recorridos de proyecto y memoria se verificaron anteriormente con sus HTML.
- Inscripción: 13 pruebas automatizadas pasan, incluyendo casos de 1, 2 y 5 alumnos; comparación de partes del DOCX; orden de documentos; carnets duplicados; validación y escape XML. Renderizado de ejemplos de 1 y 2 alumnos y revisión visual. No se validó una aprobación institucional ni la inclusión de las constancias externas.
- La apertura directa de archivos `file://` está bloqueada por el navegador integrado. El funcionamiento local del HTML descargado debe comprobarse en un navegador que permita abrir archivos locales. El código y los documentos generados no requieren recursos externos.

- Revisión visual de guía y formulario a 390 px, sin desbordamiento visible; enlaces locales de las páginas comprobados.
- La prueba de impresión invoca el diálogo del navegador integrado, pero su interfaz no pudo verificarse mediante las herramientas disponibles. No se considera validado todavía el PDF final ni la paginación de textos extensos.

## Actualización del 25/10/2026

Cronograma ordenable y distribución semanal implementados; Memoria pasó de HTML a DOCX con plantilla local. Pruebas y límites documentados en `cronograma-memoria.md`. Las menciones anteriores a comprobaciones HTML describen las pruebas históricas.
