/* Catálogo inicial proporcionado por el equipo; no se consulta un endpoint todavía. */
(function(root){
  const defaults = Object.freeze([
    {codigo:'01',nombre:'ARTE Y ARQUITECTURA'},
    {codigo:'02',nombre:'ECONOMÍA, ADMINISTRACIÓN Y COMERCIO'},
    {codigo:'03',nombre:'SALUD'},
    {codigo:'04',nombre:'CIENCIAS'},
    {codigo:'05',nombre:'AGROPECUARIA Y MEDIO AMBIENTE'},
    {codigo:'06',nombre:'DERECHO'},
    {codigo:'07',nombre:'HUMANIDADES'},
    {codigo:'08',nombre:'TECNOLOGÍA'},
    {codigo:'09',nombre:'EDUCACIÓN'},
    {codigo:'10',nombre:'CIENCIAS SOCIALES'},
    {codigo:'11',nombre:'NINGUNO'}
  ].map(Object.freeze));
  // A future API adapter can supply any number of {codigo?, nombre} entries.
  // An explicit empty list stays empty; it must not silently restore old options.
  function options(source=root.SIGPSApiConfig?.areasConocimiento??defaults){
    if(!Array.isArray(source))throw new Error('El catálogo de áreas no es válido.');
    const names=new Set();
    return source.map(item=>{
      const nombre=String(item?.nombre??'').trim(),codigo=String(item?.codigo??'').trim();
      if(!nombre||names.has(nombre))throw new Error('El catálogo contiene áreas vacías o repetidas.');
      names.add(nombre);
      return {codigo,nombre};
    });
  }
  const api={defaults,options};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSAreasConocimiento=api;
})(typeof window==='undefined'?globalThis:window);
