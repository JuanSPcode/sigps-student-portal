# Revisión funcional — Portal de estudiantes SIGPS

Fecha: 25 de octubre de 2026.

Los flujos probados de inscripción, proyecto y memoria funcionan en modo estático. Esta revisión comprueba el comportamiento local actual; no certifica todas las combinaciones de datos, navegadores o dispositivos.

## Correcciones realizadas

- Proyecto: al cambiar las fechas de un ejemplo se validaban actividades antiguas, aunque el cronograma individual ya estaba actualizado. Se eliminó esa validación obsoleta y se comprobó nuevamente la generación del Word.
- Proyecto y memoria: una cantidad de alumnos vacía ya no se convierte automáticamente en uno; se solicita corregirla.
- Proyecto y memoria: los registros de alumnos se crean progresivamente, evitando que un número muy grande provoque una reserva masiva de memoria al avanzar.
- Inscripción: se ocultó el campo de horas cuando se utiliza el catálogo. Su valor sigue disponible para validar y completar el documento.
- Se actualizaron las referencias de caché y se regeneró el paquete estático `dist/`.

## Comprobaciones

| Área | Resultado |
| --- | --- |
| Pruebas automáticas | 59 aprobadas, ninguna fallida. Incluyen catálogos, horarios, fechas, horas por alumno y generación documental. |
| Archivos del sitio | Sintaxis JavaScript válida; 60 referencias locales HTML/CSS del paquete estático sin archivos faltantes. |
| Inscripción | Recorrido desde cero, horarios separados en un mismo día, financiamiento predeterminado, carta institucional opcional y generación de Word comprobados. |
| Proyecto | Seis pasos, conservación de datos, cronograma individual y validación de horas. Un déficit de una hora impide continuar; al corregirlo se genera el Word. Cambiar las fechas del ejemplo ya no bloquea el documento. |
| Memoria | Recorrido desde cero con dos alumnos; rechazo de carnets repetidos; el título de la memoria utiliza el nombre del proyecto. |
| Navegación y utilidades | Menú flotante, cierre con Escape, preguntas frecuentes, selector de nivel y checklist comprobados. Las marcas del checklist sobreviven a una recarga durante la sesión y pueden limpiarse. |
| Documentos | Se descargaron archivos DOCX de inscripción, proyecto y memoria. Integridad ZIP y XML válida. Se renderizaron y revisaron visualmente sus 5, 18 y 32 páginas, respectivamente, sin cortes ni desbordamientos visibles en estos ejemplos. |

Se utilizaron datos ficticios. La revisión visual se hizo mediante renderizado con LibreOffice; no equivale a comprobar todas las versiones de Microsoft Word. No se modificaron las plantillas en esta revisión.

## Límites y pendientes

- El catálogo local contiene datos de demostración: hace falta confirmar el catálogo académico oficial antes de usarlo para entregas reales.
- El modo servidor y sus endpoints futuros siguen pendientes por decisión de alcance. El modo estático no requiere Python ni un backend para generar los documentos.
- El cronograma calcula según disponibilidad y fechas; no descuenta automáticamente vacaciones o feriados.
- Los anexos, firmas, sellos y constancias externas deben incorporarse según las indicaciones. Los textos de ejemplo deben reemplazarse y revisarse, incluso si cambian las fechas.
- Se comprobó la generación del paquete para publicación, pero no se publicó ni se probó en una URL real de GitHub Pages. Tampoco se realizó una matriz de pruebas en móviles y distintos navegadores.
- La descarga del checklist se activó, pero no se verificó el archivo resultante. Las descargas DOCX sí se verificaron.
- Los datos del formulario permanecen en la pestaña; esta revisión no acredita persistencia de inscripciones, autenticación ni funciones de backend.

## Siguiente comprobación recomendada

Probar el paquete publicado en GitHub Pages con el catálogo definitivo y abrir los tres Word en el equipo que se utilizará para la entrega. Esto cerrará las comprobaciones de publicación y compatibilidad que no cubre la prueba local.
