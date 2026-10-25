# Cronograma del proyecto y Word de memoria

Actualizado el 25 de octubre de 2026. Proyecto: Portal Estudiantil SIGPS.

## Cronograma

Las fechas de inicio y fin se capturan en «Tu proyecto». En Contenido, cada alumno registra horas disponibles por día de lunes a domingo (0 cuando no asiste), y su propia lista de actividad + horas. Hay accesos para 20 h semanales (L–V, 4 h/día) y 48 h (L–S, 8 h/día), siempre editables. Las actividades se agregan, quitan y ordenan con flechas. No se solicitan fechas, metodología, responsable ni recursos por actividad; los recursos generales continúan en la redacción del proyecto.

El planificador asigna las actividades secuencialmente desde el inicio, hasta completar sus horas o agotar las fechas disponibles. Puede completar una actividad y comenzar otra el mismo día, respetando la disponibilidad diaria. No reparte ni inventa horas para corregir un plan insuficiente. Cada alumno debe registrar exactamente las horas de su carrera según el catálogo; se informa el faltante o exceso y se bloquea la generación si el período no permite completar el requisito. Nunca se suman las horas del equipo para validar a un alumno. Si el catálogo no confirma las horas, se solicita revisarlo en Equipo.

El horario se repite semanalmente; vacaciones, feriados, pausas y cambios de horario por temporada están fuera de esta versión. La interfaz y el Word lo indican. Las semanas son de lunes a domingo; una semana que cruza de mes se separa en dos columnas, sin duplicar días ni horas. Puede haber 4, 5 o 6 columnas en un mes, incluyendo semanas parciales. Los cálculos conservan centésimas de hora.

El Word contiene una tabla numerada de actividades y horas por alumno, seguida de su cronograma mensual con subtotales, total individual y fecha prevista de finalización. Se omiten meses posteriores a la finalización de ese alumno. Se mantienen tablas editables horizontales, hasta dos meses por página. Los borradores pueden omitir redacción, pero no un cronograma válido.

## Memoria

`documentos/plantillas/memoria.docx` se deriva de `Plantillas/3. DOCUMENTO PARA PRESENTAR LA MEMORIA DE SERVICIO SOCIAL.docx` (idéntico al original conservado en `documentos/procesos/memoria.docx`). El original no se altera. Se retienen el encabezado con escudo, los campos y orden de la portada, el cuadro resumen de seis columnas y el orden de anexos. Se ajusta el espaciado de portada para equipos de varios alumnos y se sustituyen las instrucciones extensas por el contenido capturado.

La descarga incluye portada, índice con enlaces internos, Introducción, Desarrollo, Resultados, Conclusiones, Recomendaciones, cuadro resumen y anexos con una hoja de indicaciones por documento. Las secciones principales comienzan en página nueva. Conserva tamaño carta y márgenes de la guía (3 cm izquierdo y 2 cm superior, inferior y derecho), Cambria en el cuerpo y tabla nativa editable. La procedencia de fondos se captura por separado para la columna correspondiente. No se inventan cantidades ni responsables.

El índice no calcula números de página: navega mediante marcadores internos y no contiene vínculos a otros archivos. La paginación final y los límites de extensión deben revisarse en Word. Los modelos originales de informes y cartas siguen disponibles en «Descargar modelos originales». La descarga no inserta automáticamente anexos firmados, sellos, fotos ni certificaciones emitidas por las autoridades. La Carta 5 requiere confirmar su incorporación, pues la guía enumera el anexo y también indica que se emite después de aprobar la memoria.

### Instrucciones de los anexos

Cada uno de los 13 anexos tiene instrucciones compartidas entre la revisión web (desplegables individuales) y el Word: qué completar, a quién solicitarlo y cómo incorporarlo. El Formulario 7 se imprime y llena a mano, por indicación del usuario; el Formulario 6 lo evalúa la institución y conserva su tratamiento confidencial. La certificación sigue condicionada a la aprobación.

Fuentes: guía institucional `documentos/procesos/memoria.pdf`, páginas 1–2 y 6–16; ejemplo de memoria de 69 páginas proporcionado el 25 de octubre de 2026, usado únicamente como contexto local. El ejemplo incluye un Formulario 2 de asesorías y evidencias de ejecución, y utiliza otro orden: se mantiene el orden de la guía y se indica confirmar con coordinación la ubicación del Formulario 2, sin convertirlo en un nuevo requisito universal. No se distribuye el ejemplo ni sus datos personales, firmas o sellos.

Cada hoja de indicaciones ocupa una página. Los primeros diez anexos incluyen inmediatamente después su modelo original editable, con tablas, espacios, estilos e imágenes conservados; son modelos en blanco, todavía sin rellenado automático de sus campos. Se incluye una copia de cada modelo y se indica obtener las copias necesarias por alumno. La certificación se identifica como modelo de consulta que la Unidad debe emitir. Proyecto, inscripción y prórrogas incluyen solo la hoja para adjuntar el expediente existente. Las instrucciones son hojas de preparación que se retiran antes de entregar. No generan evaluaciones ni constancias institucionales. El original de la guía permanece intacto.

## Funcionamiento y comprobación

Todo se ejecuta en el navegador con HTML, CSS, JavaScript nativo y las dos bibliotecas Word locales existentes. Las plantillas están incorporadas como base64. GitHub Pages no requiere Python, Node, Laravel ni API para generar estos documentos. Los scripts de preparación de plantillas son herramientas de desarrollo excluidas de la publicación.

Se verificaron generación para 1, 3 y 5 integrantes, coincidencia de plantilla embebida con DOCX, ausencia de referencias externas, caracteres especiales, fechas y sumas. Se renderizaron y revisaron los Word de Memoria para 1 y 5 integrantes y Proyecto para 5, incluidas las tablas semanales. En el navegador se probó reordenar, corregir una distribución incompleta, preparar el proyecto y descargar la Memoria real. El contenido académico, las firmas, los anexos y la aprobación siguen a cargo del estudiante y sus responsables.

Actualización del cronograma: pruebas de capacidad diaria, fechas parciales, años bisiestos, precisión decimal, horas por carrera y actividades individuales; generación para 1, 3 y 5 alumnos. Se verificó en navegador el bloqueo con 499/500 horas y la generación al corregirlo.
