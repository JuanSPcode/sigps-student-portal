# Portal Estudiantil SIGPS

Portal público en HTML, CSS y JavaScript vanilla, sin framework ni backend propio. La página principal orienta al estudiante por inscripción, presentación del proyecto y memoria. Los formularios y documentos se procesan en el navegador; el catálogo académico se incluye localmente para que esta entrega funcione sin API.

## Ejecutar

Para probar por HTTP, utiliza el servidor de archivos escrito en JavaScript con Node.js. No requiere Python, instalar paquetes ni compilar el portal:

```sh
npm start
```

Accede a `http://127.0.0.1:8765/`. El paso a paso y el formulario están en `procesos.html`.

Node.js es una herramienta de desarrollo para esta vista previa, no un requisito del alojamiento final. También puedes servir los archivos con Live Server de VS Code o cualquier alojamiento estático. Abrir el HTML con `file://` no es la forma admitida de probar la integración con la API.

## Publicar y entregar

Publica `index.html`, `procesos.html`, `checklist.html` y las carpetas de recursos que utilizan (`css/`, `js/`, `assets/` y `documentos/`). El modo estático es el predeterminado: no consulta localhost ni necesita API. Laravel y PostgreSQL pertenecen al Sistema Interno y no son necesarios para probar esta entrega.

No se publica `node_modules/`, `scripts/` ni `tests/`. Las utilidades históricas `scripts/prepare-*-template.py` sirvieron para preparar las plantillas y no se ejecutan al abrir el portal ni al generar Word. Las plantillas ya preparadas se incluyen como recursos. No hay Python, PHP, proceso de compilación ni servidor de aplicación requerido para el portal publicado.

Las pantallas usan JavaScript nativo. La generación de Word utiliza dos bibliotecas JavaScript locales (PizZip y Docxtemplater): no son frameworks, pero sí son dependencias de terceros. Por ello, no debe describirse como «sin bibliotecas externas».

## Procesos y documentos

Cada etapa ofrece indicaciones, responsables, documentos requeridos y descarga de las guías originales en PDF y Word. `documentos/procesos/fuentes.json` identifica los archivos proporcionados y sus hashes; los originales no indican una versión institucional.

El asistente prepara:

- Inscripción: un Word desde la plantilla original para 1 o varios alumnos. Incluye solicitud de la institución, un Formulario 1 por alumno, carta de tutor grupal y una Carta 2 por alumno. El formulario pregunta la cantidad y separa los datos personales de los compartidos.
- Proyecto: portada, índice, secciones redactadas por el estudiante, cronogramas por períodos y horas, cuadro resumen y relación de anexos.
- Memoria: portada, índice, secciones, cuadro resumen y relación de anexos.

Proyecto genera un Word editable con portada institucional, formato académico basado en APA 7, índice navegable sin actualización de campos, cronogramas y hojas guía para los anexos. Consulta `docs/proyecto-word.md`. Memoria genera un Word nativo desde una plantilla derivada de la guía institucional; conserva portada, orden de secciones y cuadro resumen. Consulta `docs/cronograma-memoria.md`. No generan contenido académico automáticamente. Las secciones sin redactar indican “Por completar”. Los archivos anexos se incorporan externamente al expediente final; las firmas, sellos y aprobaciones corresponden a sus responsables. La maquetación y el contenido deben revisarse antes de una entrega institucional.

La inscripción usa Docxtemplater y PizZip locales, sin CDN. Conserva estilos, tablas, márgenes y logos del DOCX. No convierte HTML a Word. Revisa los espacios pendientes y la paginación en Word/LibreOffice; las constancias académicas se obtienen externamente. Consulta `docs/inscripcion-word.md`.

Los datos del asistente se mantienen únicamente en memoria mientras la página está abierta: no se envían, no se guardan en el servidor ni se conservan al recargar. Cambiar de etapa conserva cada borrador durante esa visita. El checklist independiente conserva su implementación previa con `sessionStorage`.

## Organización

- `js/procesos-data.js`: pasos y campos derivados de las guías.
- `js/documentos.js`: validación compartida y generador HTML legado, sin uso en las descargas actuales.
- `js/cronograma.js`: actividades ordenables, distribución semanal, validación y tablas Word.
- `js/memoria-documento.js`: generación de Memoria desde su plantilla institucional.
- `js/proyecto-documento.js`: generación de Proyecto desde la plantilla Word.
- `documentos/plantillas/proyecto.docx`: portada editable, cuerpo académico y anexos del proyecto.
- `js/inscripcion-documento.js`: validación y generación DOCX desde variables.
- `js/inscripcion.js`: cantidad de alumnos, captura individual y revisión del paquete.
- `documentos/plantillas/inscripcion.docx`: plantilla etiquetada, derivada del original.
- `js/vendor/`: bibliotecas locales con versiones fijadas y licencias.
- `js/procesos.js`: navegación, formulario por pasos, vista previa y descargas.
- `css/procesos.css`: interfaz adaptable del recorrido.
- `docs/procesos.md`: correspondencia con fuentes, decisiones y límites.

El catálogo DSI previo se conserva en `documentos/catalogo-dsi.json` como referencia. Ya no se muestra como un catálogo descargable sin archivos confirmados: F3 y F7 tienen discrepancias con la numeración de los modelos FMO. Los DOCX de Ciencias Naturales y Humanidades se conservan como referencias y no se presentan como equivalencias exactas.

## Verificar

```sh
npm ci --ignore-scripts
npm test
```

Verificar además en el navegador: los tres recorridos, corrección de datos, cambio de etapa, descarga de guías PDF y documentos Word, edición de los archivos descargados, impresión según el formato de cada plantilla, textos largos y uso móvil. Confirmar con coordinación la vigencia de las guías, el cómputo del plazo de 15 días y cuándo anexar la certificación de memoria.

### Modo estático y GitHub Pages

El botón flotante Documentos abre las opciones: modo estático activo y modo servidor deshabilitado (próximamente). Puedes moverlo con el ratón, el dedo o las flechas del teclado.

`npm run export:pages` copia los archivos públicos a `dist/`, sin instalar dependencias ni compilar. El workflow manual `.github/workflows/pages.yml` permite publicar esa carpeta en GitHub Pages. Consulta [instrucciones de publicación](docs/publicacion-estatica.md).

Los selectores utilizan `js/catalogo-local.js`, una copia del catálogo de demostración, todavía no oficial. El cliente de la API se conserva para una integración futura; no se usa en esta configuración.
