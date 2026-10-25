# Portal Estudiantil — inscripción con plantilla Word

La inscripción usa el Word original de FMO–UES. El formulario rellena variables y genera un único `.docx` por proyecto. La reconstrucción anterior en HTML se retiró de esta etapa.

## Referencia y tecnología

FUNDABED utiliza `PhpOffice\PhpWord\TemplateProcessor`: abre `app/plantilla/FUNDABED.docx`, rellena variables con `setValue` y convierte la salida con LibreOffice en el servidor. En este portal estático se usa el mismo principio con **Docxtemplater 3.71.0 + PizZip 3.2.0**, ejecutados en el navegador. No se necesita React, Laravel ni un servicio externo para generar el DOCX.

- [Uso en navegador](https://docxtemplater.com/docs/get-started-browser/).
- [Bucles y variables](https://docxtemplater.com/docs/tag-types/).
- [Bucles de tablas gratuitos](https://docxtemplater.com/articles/ways-to-create-tables/).

El núcleo permite variables y bucles sin módulos comerciales. Las copias JS y licencias están en `js/vendor/`; `package-lock.json` fija las dependencias. `npm ci --ignore-scripts` y `npm run vendor:documents` reproducen esos archivos. El portal servido no necesita npm ni conexión a un CDN. La conversión fiel de Word a PDF no está implementada: el usuario revisa e imprime en Word/LibreOffice. La entrega que exige la guía es el escaneo posterior de originales firmados.

## Contenido y orden

| Orden | Documento | Tratamiento |
|---|---|---|
| 1 | Solicitud de la institución | Opcional en el generador, desmarcada por defecto. Si se incluye, lleva cantidad de estudiantes y carrera común, sin nombres. Si se omite, se adjunta la que emita la institución. |
| 2 | Formulario n.º 1 | Una hoja individual por alumno dentro del mismo Word. |
| 3 | Carta n.º 1 | Una carta de asignación del tutor con tabla del grupo. La revisa coordinación. |
| 4 | Carta n.º 2 | Una por alumno; la autoridad revisa y emite la aprobación. |
| 5 | Constancia académica del 60 % | Se obtiene de Administración Académica por alumno y se adjunta después. No se fabrica en el portal. |

La página 1 de la guía fija ese orden por tipo documental. Para varios alumnos se agrupan sus hojas individuales dentro de cada tipo. El equipo debe confirmar con coordinación si utiliza una convención adicional para ordenar expedientes grupales. La guía llama individuales al Formulario 1 y a la Carta 2; no se sustituyen por una única hoja colectiva.

La entrega es un único PDF escaneado, no fotografías, con firmas y sellos originales; la guía indica tinta azul. Se entrega a coordinación para su remisión a UPS. La generación de un Word no equivale a inscripción ni aprobación.

## Variables para editar la plantilla

Puedes modificar `documentos/plantillas/inscripcion.docx` en Word y mantener estas variables:

- Proyecto: `{titulo}`, `{institucion}`, `{direccionInstitucion}`, `{institucionDireccion}`, `{lugarEjecucion}`, `{beneficiarios}`, `{inicio}`, `{fin}`, `{periodo}`, `{aportes}`, `{costos}`, `{financiamiento}`, `{horas}`.
- Responsables y emisión: `{departamento}`, `{seccion}`, `{tutor}`, `{coordinador}`, `{destinatario}`, `{responsable}`, `{telefonoInstitucion}`, `{lugar}`, `{fecha}`.
- Grupo: `{solicitud_estudiantes}`, `{carreras}`. La solicitud está dentro de `{#incluirCartaInstitucion}` y `{/incluirCartaInstitucion}`.
- Dentro de `{#alumnos}` y `{/alumnos}`: `{nombre}`, `{carnet}`, `{carrera}`, `{codigo}`, `{direccion}`, `{fijo}`, `{movil}`, `{email}`, `{porcentaje}`, `{observaciones}`. Dentro de cada alumno, la tabla usa `{#horarios}{horario}`, `{dias}` y `{otros}{/horarios}` en sus tres columnas. Los campos del proyecto también están disponibles dentro del bloque.

Los horarios se repiten por fila manteniendo la relación día/hora. Los bucles de páginas tienen sus marcadores en párrafos separados; la tabla grupal coloca inicio y fin en la misma fila. No cambiar el nombre de una variable sin cambiar su correspondencia en `js/inscripcion-documento.js`. Las etiquetas pueden editarse con Word; el motor admite etiquetas divididas entre varios runs. No usar datos de ejemplo reales ni firmas escaneadas en la plantilla pública.

## Fidelidad y cambios de preparación

`scripts/prepare-inscripcion-template.py` deriva la plantilla desde `documentos/procesos/inscripcion.docx`. No modifica el archivo original. Su ejecución reemplaza la plantilla derivada: no usarlo si esta recibió cambios manuales sin conservar antes esa versión.

Se conservan las partes de estilos, fuentes, numeración, medios, relaciones y geometría de página. Se modificó únicamente `word/document.xml`: espacios de ejemplo pasan a variables; se retira del paquete generado la página de instrucciones; se incorporan bucles y saltos de página explícitos; se elimina un marcador de índice de ejemplo no referenciado para evitar duplicarlo. Se estabilizan con tabuladores las tres columnas de firma de la solicitud y se retira su salto de línea manual que estiraba el nombre de la carrera. Los espacios de firma se mantienen vacíos. Las identificaciones internas de dibujos se hacen únicas al repetir páginas.

`inscripcion-manifest.json` registra el hash del original y de cada parte preservada. Para reemplazar la plantilla con una preparada manualmente hay que revisar ese contrato y las pruebas; no basta con cambiar arbitrariamente el archivo.

## Verificación y límites

- Pruebas para 1, 2 y 5 alumnos: cantidad de hojas individuales, carta grupal, orden, datos, escape XML y campos sin completar.
- Verificación de duplicados de carnet, cantidad entera positiva, correo, fechas y plazo mínimo de tres meses indicado en el modelo.
- Renderizado revisado: ejemplo de 1 alumno (4 páginas) y de 2 (6 páginas), incluyendo escudos, tablas y firmas.
- La cantidad de alumnos no está fijada a las dos filas del modelo. Las tablas crecen con el grupo; los grupos grandes y textos largos pueden ocupar más páginas. Debe revisarse el Word antes de imprimir; no se garantiza una página por documento para cualquier longitud.
- Los campos opcionales desconocidos quedan con una línea en blanco. No se inventa tutor, coordinador ni responsable.
- La cantidad de horas se captura como común al proyecto para todos sus participantes; si difiere por alumno, debe ajustarse en cada Carta 2 en Word y validarse con coordinación.
- El cambio a Word responde a la petición actual del equipo. La referencia anterior ALU-HU-05 habla de HTML editable local: confirmar el criterio de aceptación actualizado antes de cerrar esa tarea en Taiga.

## Diagnóstico de fallos de generación

La interfaz distingue ahora descarga de plantilla, archivo local `file://`, bibliotecas ausentes, plantilla incompatible y validación de datos. Muestra un código específico y conserva los campos en memoria para corregir o reintentar. Los scripts de inscripción incluyen una versión en su URL y la plantilla se solicita sin caché. No se envían datos personales ni se escriben en los mensajes de diagnóstico.

Se verificó además el bundle distribuido al navegador con todos los opcionales vacíos y la descarga real para dos alumnos. Un error en una pestaña antigua no puede diagnosticarse a partir del mensaje genérico anterior: debe identificarse el navegador y la versión antes de atribuirle una causa.

## Carrera común y ejemplos de prueba

La carrera y su código se solicitan una sola vez en Equipo y se aplican a todos los alumnos del proyecto. No se vuelven a pedir en sus fichas individuales. El generador rechaza datos heredados que indiquen una carrera distinta.

Los botones «1 alumno», «5 alumnos» y «3 alumnos» rellenan equipo, alumnos y proyecto con datos ficticios, reemplazan el borrador actual y abren Revisión. Desde allí se puede preparar y descargar el Word o corregir los datos. Los ejemplos usan correos example.com y están identificados como prueba; no deben presentarse como documentos reales. Cada pulsación crea un ejemplo nuevo, sin conservar modificaciones del ejemplo anterior.

Pruebas añadidas: generación completa de los tres ejemplos, carrera y código comunes, cambio de carrera reflejado en el documento y rechazo de carreras contradictorias.

## Disponibilidad semanal y carta opcional

Cada alumno tiene sus propios bloques de días y horas. Se pueden marcar varios días que comparten horario y repetir un día en bloques distintos para mañana y tarde. El resumen y el Word ordenan los bloques desde el primer día de la semana y muestran horas AM/PM, con minutos exactos. Se exige al menos un bloque con días seleccionados y fin posterior al inicio del mismo día. No se suman automáticamente horas ni se descartan bloques superpuestos.

El Formulario n.º 1 y la Carta n.º 2 se generan por alumno; la Carta n.º 1 incluye al grupo. «Crear carta de solicitud (si aún no la tienes)» agrega la solicitud antes del formulario. El destinatario aparece solo al activarla. Los aportes se completan directamente en el Word por la institución. La institución sigue siendo quien debe revisarla y firmarla. La generación opcional no cambia el orden del expediente completo ni elimina la carta de los requisitos de entrega.

No se solicita el número de beneficiarios ni se usa como validación de inscripción. La carta opcional conserva el espacio del modelo para que la institución lo complete posteriormente. Se mantiene la validación previa de duración mínima del proyecto.

La plantilla conserva las columnas originales de horarios y repite filas cuando hace falta; mantiene al menos las tres filas del modelo. Se ajustó el espacio inicial de la primera hoja y cinco líneas vacías de la carta de tutor para evitar cierres aislados. La copia integrada para uso sin servidor se regenera junto al DOCX.

Verificación de esta versión: 21 pruebas automáticas; casos de 1, 3 y 5 alumnos con y sin carta; orden y correspondencia de jornadas; rechazo de horas inválidas; igualdad de la plantilla integrada. Revisión visual completa de 1 alumno con carta (4 páginas) y 3 alumnos sin carta (7 páginas), ambos con cinco bloques de disponibilidad. Los textos o grupos más grandes pueden requerir más páginas.

## Hojas de indicaciones para completar el expediente

Si no se genera la carta institucional, el Word comienza con una hoja que indica adjuntar la carta de solicitud emitida y firmada por la institución. Si se genera, esa hoja inicial se omite y el documento comienza con la carta.

Al final siempre se agrega una sola hoja que recuerda adjuntar la constancia del 60 % de materias aprobadas de cada alumno, solicitada a Administración Académica. Ambas se identifican como «HOJA DE INDICACIONES» y piden sustituirlas por los documentos correspondientes antes de entregar. No son constancias ni cartas oficiales.

Se verifican presencia condicional, orden, separación de páginas, ausencia de duplicados y conservación de los tres documentos obligatorios en grupos de 1, 3 y 5 alumnos. La plantilla integrada y la descargada contienen las mismas indicaciones.

## Revisión simplificada del expediente

La revisión muestra un único listado en orden de entrega, con etiquetas «En el Word» y «Adjuntar». Los alumnos y horarios, los ejemplos y las indicaciones posteriores usan secciones desplegables. La carta opcional se configura al editar los datos. Al terminar la generación, «Descargar Word» sustituye a «Preparar Word»; editar los datos invalida la descarga anterior y exige generar de nuevo. Se conserva el aviso de sustituir las hojas guía y las instrucciones de revisión, firmas y entrega escaneada.

Verificado: 22 pruebas existentes aprobadas; generación y descarga desde el navegador con cinco alumnos y acceso a ambas secciones desplegables. La plantilla y su contenido no se modificaron en este ajuste visual.

## Disponibilidad especial y simplificación del formulario

Cada bloque de horario admite una nota opcional de hasta 120 caracteres, por ejemplo «Solo en interciclo» o «A partir del 15 de noviembre». La nota pertenece a ese bloque, se conserva al ordenar los días y se escribe en su misma fila de la columna «Otros». No calcula fechas ni reemplaza la elección de días y horas. Se eliminó el campo general «Otra disponibilidad»; se mantiene compatibilidad con datos anteriores al generar documentos.

Se retiraron la frase introductoria repetida y el aviso superior de la pestaña, y se resumieron las instrucciones de equipo, alumno y proyecto. El recordatorio de descargar antes de cerrar permanece junto a la descarga. La opción de carta usa un solo texto breve.

La fuente distingue «Carrera» en el Formulario n.º 1 de «Departamento/Sección» en la Carta n.º 1. No se equiparan: el formulario utiliza «Departamento académico» y «Sección académica (si aplica)», esta última opcional. La carta institucional pide detallar los recursos aportados; esa pregunta se retiró del formulario a petición del usuario y el Word conserva un espacio en blanco para que la institución lo complete. No se presuponen recursos universales.

Verificación: 24 pruebas aprobadas, recorrido del formulario con un alumno y carta opcional activada, edición de la nota de interciclo y descarga satisfactoria sin aportes. Se revisaron las cinco páginas del Word descargado: las notas corresponden a sus filas y no hay desbordamientos en el ejemplo.

## Fuente de financiamiento y fecha de emisión

La fuente de financiamiento es una lista cerrada: Gobierno Nacional, Gobierno Internacional, Empresa Privada Nacional, Empresa Privada Internacional, Propios de Institución y Propios del Estudiante. El valor inicial es Propios del Estudiante; se rechazan valores fuera de la lista.

Se retiró el campo editable Lugar de emisión. La sede es Ciudad Universitaria de Oriente. La fecha del documento inicia con la fecha local actual y puede cambiarse para el día de firma. La vista previa y las cuatro ubicaciones de emisión de la plantilla usan `{fechaEmision}`, por ejemplo: «Ciudad Universitaria de Oriente a los 6 días del mes de febrero del año dos mil veintiséis.» El día 1 utiliza «al día 1». Las fechas de inicio y finalización del proyecto conservan su formato anterior.

Se regeneraron la plantilla y su copia integrada para uso sin servidor. Verificación: 26 pruebas aprobadas, selección y cambio de fecha desde el navegador, generación satisfactoria y revisión visual de las cinco páginas de un ejemplo con carta institucional y cinco horarios. La plantilla mantiene sus estilos, recursos y firmas en blanco.

## Correo institucional y horarios guiados

Se retiró el campo de correo. Se obtiene del carnet sin espacios exteriores y en minúsculas, seguido de `@ues.edu.sv`; aparece únicamente en el Word y se recalcula al generarlo, ignorando correos anteriores. Se rechazan carnets con espacios o con un dominio añadido.

Los horarios usan tarjetas plegables: elegir días (con acceso rápido de lunes a viernes), indicar entrada y salida, y cerrar con «Listo». Las tarjetas cerradas muestran días, horas AM/PM y la condición especial, si existe. «Agregar otra jornada» permite otro horario para esos días o días diferentes; la opción de interciclo o fecha permanece dentro de cada tarjeta. No se duplican los horarios en un resumen adicional debajo del editor. Se validan los datos antes de cerrar o agregar otra jornada.

Verificación: 27 pruebas aprobadas. En navegador se comprobó el cambio de carnet, selección de lunes a viernes, captura de horas, cierre y reapertura de la tarjeta, eliminación de una jornada y generación/descarga sin solicitar correo.
