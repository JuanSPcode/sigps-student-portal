# Portal estudiantil — modo estático

El portal funciona con HTML, CSS y JavaScript nativo. PizZip y Docxtemplater son las únicas bibliotecas del generador Word y están incluidas en `js/vendor/`; no se descargan de un CDN. GitHub Pages sirve los archivos: el visitante no ejecuta Python, Node.js, Laravel ni Docker.

## Modos de documentos

El botón flotante **Documentos** abre una ventana con:

- **Modo estático (activo):** plantillas y guías incluidas en el portal.
- **Modo servidor (próximamente):** opción deshabilitada. No consulta ni configura endpoints de plantillas todavía.

Se puede arrastrar el botón con ratón o con el dedo. Con teclado, Tab lo enfoca, las flechas lo mueven y Enter abre la ventana. Escape, Listo o el botón de cierre cierran la ventana. Solo se guarda la posición; los datos personales del formulario no se guardan al cerrar la pestaña.

## Recursos incluidos

- `documentos/procesos/`: guías PDF y modelos originales Word.
- `documentos/plantillas/inscripcion.docx` `proyecto.docx` y `memoria.docx`: plantillas de generación.
- `js/inscripcion-plantilla.js`, `js/proyecto-plantilla.js` y `js/memoria-plantilla.js`: copias integradas de esas plantillas; Proyecto y Memoria usan sus copias y la inscripción la utiliza como respaldo.
- `js/catalogo-local.js`: catálogo académico de demostración copiado del entorno local el 24/10/2026. No contiene datos personales ni constituye el catálogo oficial. Permite probar los selectores sin API; debe sustituirse por datos validados por coordinación para uso real.
- `js/api-config.js`: modo estático y API vacía, también al probar en localhost. No se realizan peticiones al puerto 8000.

La memoria genera un Word editable desde su plantilla local; no requiere API ni conversión externa. El menú no altera los formatos que produce cada proceso.

## Publicar en GitHub Pages

1. Revisar y subir los archivos del portal, incluyendo `.github/workflows/pages.yml` y `scripts/export-pages.cjs`. No subir datos reales de estudiantes ni archivos `.env`.
2. En el repositorio, ir a **Settings → Pages → Source: GitHub Actions**.
3. Tener el workflow en la rama predeterminada. Ir a **Actions → Publicar portal estático → Run workflow** y seleccionar la rama que se publicará. Si el entorno `github-pages` restringe las ramas, autorizar esa rama desde la configuración del repositorio.
4. Abrir la URL que entrega GitHub. Los recursos usan rutas relativas y admiten una dirección como `https://usuario.github.io/sigps-student-portal/`.

El workflow es manual y publica únicamente el contenido estático de `dist/`. No instala dependencias ni ejecuta servicios. Para obtener la misma carpeta localmente: `npm run export:pages` (solo copia archivos; no compila). Puedes publicar el contenido de esa carpeta en otro alojamiento estático. `npm start` sigue siendo una vista previa opcional para desarrollo.

No se ha publicado desde esta tarea. Antes de compartirlo para trámites reales, sustituir el catálogo de demostración y confirmar la vigencia de las plantillas institucionales.

Referencia: [GitHub Pages: workflows personalizados](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Identificación del proyecto y áreas

En Proyecto y Memoria, el paso «Tu proyecto» comienza por Número de proyecto (obligatorio) y Área de conocimiento (selector opcional). El número se conserva como texto para admitir identificadores con letras, guiones o ceros iniciales; el portal no asigna números ni verifica su existencia en una base de datos.

`js/areas-conocimiento.js` contiene las 10 áreas proporcionadas por el equipo más «11 · NINGUNO». La interfaz y los documentos guardan el nombre legible. El catálogo admite cualquier cantidad de opciones: una futura integración puede entregar `SIGPSApiConfig.areasConocimiento` con entradas `{codigo, nombre}`; `codigo` es opcional. Ese es un formato interno de adaptación, no un contrato de endpoint confirmado. No se ha implementado ninguna petición de áreas ni se ha supuesto una URL de API.
