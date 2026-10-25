// Configuración estática: no requiere una API ni servicios en localhost.
// La conexión a plantillas del servidor se implementará en una entrega futura.
window.SIGPSApiConfig = Object.freeze({
  templateMode: 'static',
  baseURL: '',
  localCatalog: window.SIGPSCatalogoLocal,
  notice: 'Catálogo de demostración · No usar para entrega.'
});
