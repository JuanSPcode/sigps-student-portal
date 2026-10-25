# Portal Estudiantil — integración del catálogo académico

## Configuración actual: modo estático

Desde el 24/10/2026, esta entrega utiliza `js/catalogo-local.js` y deja `baseURL` vacía. Los tres formularios conservan los selectores dependientes y la validación, sin consultar una API. Los datos siguen siendo de demostración. El menú de documentos muestra modo estático activo y modo servidor pendiente. Ver [publicación estática](publicacion-estatica.md).

Las secciones siguientes documentan la integración anterior y el contrato comprobado; no describen servicios que deban mantenerse encendidos para esta entrega.

## Integración anterior

Inscripción, Proyecto y Memoria consultan `GET /api/v1/catalogo-academico` y mostrar departamento → carrera → horas por alumno. Los nombres seleccionados se usan en sus documentos. Inscripción utiliza además las horas del catálogo en su Word; las horas de actividades y de ejecución de Proyecto/Memoria conservan su significado propio. El generador continúa ejecutándose localmente; la API no recibe datos de estudiantes ni registra la inscripción.

Configurar `baseURL` en `js/api-config.js` con la dirección real del Sistema Interno, terminada en `/api/v1`. No incluir tokens ni contraseñas. Mientras esté vacía, se conserva el formulario manual y se indica que el catálogo no está conectado. En desarrollo, el portal servido desde localhost o 127.0.0.1 utiliza `http://127.0.0.1:8000/api/v1`, con un aviso de catálogo de pruebas. Fuera de esos hosts queda sin configurar hasta definir el servidor institucional.

## Contrato comprobado

Fuente: `API_PUBLICA.md` y rama remota `origin/aparicio` del Sistema Interno, commit `f08b4df`, consultada el 24 de octubre de 2026. Se descargaron sus referencias remotas sin cambiar la rama local `juan`.

- `CarreraApiController::catalogo` devuelve departamentos con carreras anidadas.
- `CarreraResource` obtiene `horas_servicio_social` y `horas_requeridas` de la misma columna. Si es nula, el backend utiliza 500. El portal no puede distinguir ese valor de respaldo de uno registrado: corresponde al equipo interno asegurar la calidad del catálogo.
- Se conservan `id_departamento` e `id_carrera` como referencias. El ID no se utiliza como código académico; el campo de código se retiró de los tres formularios porque no está en la respuesta pública. La API y las plantillas no se alteraron.
- Sección académica permanece opcional y separada: la API tampoco la informa.
- Si ambos campos de horas no son positivos e iguales, se solicita validación y no se genera una cantidad inventada.

## Conexión y errores

La petición es pública, sin credenciales y con tiempo de espera de ocho segundos. El servidor debe permitir el origen del portal mediante CORS. No se usa un proxy ni se desactiva la seguridad del navegador.

El navegador guarda solo la última respuesta válida del catálogo y su fecha, por servidor. Si falla la red, usa esa copia y muestra cuándo se consultó. Una primera visita sin respuesta ni copia válida ofrece reintentar o descargar la guía. Los ejemplos ficticios siguen disponibles y están identificados como prueba.

La selección guarda una copia de IDs, nombres, horas, servidor y fecha de consulta en el borrador en memoria. Los Word ya descargados conservan sus textos aunque cambie el catálogo. No existe historial persistente de documentos emitidos; los datos personales y la copia del borrador desaparecen al cerrar la pestaña.

## Plantillas y siguientes pasos

Esta entrega conserva la plantilla de inscripción ya probada. No sustituye automáticamente el DOCX por cualquier archivo publicado en `/formatos`: primero se debe identificar la plantilla, su versión y sus variables compatibles. Tampoco se asume que el ID de un ejemplo de la documentación sea el formato real de inscripción.

Pendiente para producción: confirmar dominio institucional y CORS, cargar y validar las carreras oficiales e identificar la plantilla oficial de inscripción y su versión. Los tres procesos reutilizan la presentación de selectores y la validación por IDs del catálogo. Un cambio de departamento borra la carrera anterior y exige una nueva selección válida. Los ejemplos ficticios conservan sus propios valores para probar los documentos, sin solicitar código.

## Verificación

Pruebas de relaciones entre IDs, discrepancias de horas, copia de datos, errores HTTP, respuestas inválidas, timeout, almacenamiento bloqueado y respaldo del mismo servidor. Recorrido de interfaz con respuesta controlada: selección dependiente, cambio de departamento, conservación de cantidad y código, validación, navegación y ejemplos. La suite completa incluye las pruebas existentes de generación de documentos.

## API local con Docker

La copia de ejecución está en `../sigps-api-local`, basada en `aparicio` (`f08b4df`), con base PostgreSQL independiente. No modifica la rama `juan` de `../sigps-app` ni los servicios de FUNDABED.

Desde `../sigps-api-local`:

```sh
# Iniciar aplicación y base de datos
docker compose -p sigps-api-local -f docker-compose.dev.yml -f compose.local-api.yml up -d app postgres
# Consultar estado
docker compose -p sigps-api-local -f docker-compose.dev.yml -f compose.local-api.yml ps
# Detener sin borrar los datos
docker compose -p sigps-api-local -f docker-compose.dev.yml -f compose.local-api.yml stop app postgres
```

La API se publica solo en `127.0.0.1:8000`; PostgreSQL no publica un puerto al host. El archivo local `compose.local-api.yml` espera a que PostgreSQL esté listo. El arranque se corrigió para instalar Composer antes de ejecutar `artisan key:generate`. La imagen de desarrollo usa Node 22 (requerido por concurrently 10) y npm 11.6.0: npm 10 fallaba al resolver dependencias con `edgesOut`. No se inicia Vite: el contenedor compila los recursos y no ocupa el puerto 5173 usado por FUNDABED.

Esta base se utiliza para pruebas de integración. El seeder de estudiantes incluido en el repositorio contiene dos carreras Demo, no el catálogo oficial. Las plantillas oficiales tampoco se incluyen como archivos publicados en una base nueva. No utilizar resultados de esta conexión para una entrega real.

Validación local: PostgreSQL saludable, ruta pública presente, catálogo HTTP 200 con CORS, selectores probados en el navegador y generación de Word con nombres y horas obtenidos de Laravel. La base local tiene un departamento y dos carreras identificadas como Demo. No se importó una base institucional ni se configuraron cuentas de acceso de producción.
