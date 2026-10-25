/* Catálogo público: nunca envía ni almacena datos de alumnos. */
(function(root){
  const positive=value=>value!==null&&value!==''&&Number.isFinite(Number(value))&&Number(value)>0;
  const id=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?String(value):null;
  function normalize(response){
    const data=response?.data;
    if(response?.status!=='success'||!Array.isArray(data?.departamentos)||!data.departamentos.length)throw new Error('Catálogo inválido.');
    const departments=new Set(), careers=new Set();
    return {departamentos:data.departamentos.map(d=>{
      const departmentId=id(d.id_departamento);
      if(!departmentId||departments.has(departmentId)||typeof d.nombre!=='string'||!d.nombre.trim()||!Array.isArray(d.carreras))throw new Error('Departamento inválido.');
      departments.add(departmentId);
      return {id_departamento:departmentId,nombre:d.nombre.trim(),carreras:d.carreras.map(c=>{
        const careerId=id(c.id_carrera);
        if(!careerId||careers.has(careerId)||id(c.departamento_id)!==departmentId||typeof c.nombre!=='string'||!c.nombre.trim())throw new Error('Carrera inválida.');
        careers.add(careerId);
        const agreed=positive(c.horas_servicio_social)&&positive(c.horas_requeridas)&&Number(c.horas_servicio_social)===Number(c.horas_requeridas);
        return {id_carrera:careerId,departamento_id:departmentId,nombre:c.nombre.trim(),horas_servicio_social:c.horas_servicio_social,horas_requeridas:c.horas_requeridas,horas:agreed?Number(c.horas_requeridas):null};
      })};
    })};
  }
  function snapshot(catalog,departmentId,careerId,meta){
    const d=catalog?.departamentos.find(d=>d.id_departamento===String(departmentId));
    const c=d?.carreras.find(c=>c.id_carrera===String(careerId));
    if(!c)throw new Error('Selecciona departamento y carrera.');
    if(!c.horas)throw new Error('Las horas de esta carrera necesitan confirmación de coordinación.');
    return Object.freeze({id_departamento:d.id_departamento,id_carrera:c.id_carrera,departamento:d.nombre,carrera:c.nombre,horas:String(c.horas),horas_servicio_social:Number(c.horas_servicio_social),horas_requeridas:Number(c.horas_requeridas),consultadoEn:meta.updatedAt,fuente:meta.baseURL});
  }
  function createClient({baseURL,localCatalog,fetchImpl=root.fetch?.bind(root),storage,now=()=>new Date(),timeoutMs=8000}){
    const base=String(baseURL||'').replace(/\/+$/,'');
    const key='sigps.catalogo-academico.v1:'+base;
    let pending;
    async function load(){
      if(base){
        let endpoint;
        try{endpoint=new URL(base);if(!['http:','https:'].includes(endpoint.protocol)||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error();}
        catch{throw new Error('La dirección del catálogo no es válida.');}
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
        try{
          const response=await fetchImpl(base+'/catalogo-academico',{headers:{Accept:'application/json'},credentials:'omit',signal:controller.signal,cache:'no-store'});
          if(!response.ok)throw new Error('Catálogo no disponible.');
          const raw=await response.json(),catalog=normalize(raw),updatedAt=now().toISOString();
          try{storage?.setItem(key,JSON.stringify({raw,updatedAt}));}catch{/* Storage may be unavailable or full. */}
          return {catalog,updatedAt,baseURL:base,cached:false};
        }catch(e){
          try{
            const cached=JSON.parse(storage?.getItem(key)||'null');
            if(cached&&Number.isFinite(Date.parse(cached.updatedAt)))return {catalog:normalize(cached.raw),updatedAt:cached.updatedAt,baseURL:base,cached:true};
          }catch{/* Reject malformed cached data. */}
          if(localCatalog)return {catalog:normalize(localCatalog),updatedAt:now().toISOString(),baseURL:'js/catalogo-local.js',cached:true};
          throw new Error('No pudimos cargar las carreras. Reintenta o descarga la guía para continuar manualmente.');
        }finally{clearTimeout(timer);}
      }
      if(localCatalog)return {catalog:normalize(localCatalog),updatedAt:now().toISOString(),baseURL:'js/catalogo-local.js',cached:false};
      throw new Error('El catálogo aún no está conectado. Puedes descargar la guía o probar un ejemplo.');
    }
    return {load(){if(!pending)pending=load().finally(()=>{pending=null;});return pending;}};
  }
  function renderFields({state,values,loading,error,esc,prefix,dataAttribute,errorPrefix,retryId}){
    const departments=state?.catalog.departamentos||[];
    const department=departments.find(d=>d.id_departamento===values.id_departamento);
    const career=department?.carreras.find(c=>c.id_carrera===values.id_carrera);
    const select=(key,label,items,selected,disabled)=>`<div class="form-field"><label for="${prefix}-${key}">${label} *</label><select id="${prefix}-${key}" ${dataAttribute}="${key}" required ${disabled?'disabled':''} aria-describedby="${errorPrefix}${key}"><option value="">Selecciona ${label.toLowerCase()}</option>${items.map(item=>`<option value="${esc(item[key])}" ${item[key]===selected?'selected':''}>${esc(item.nombre)}</option>`).join('')}</select><span class="field-error" id="${errorPrefix}${key}"></span></div>`;
    const notice=loading?'Cargando carreras…':error|| (state?.cached?`Sin conexión · Catálogo guardado el ${new Date(state.updatedAt).toLocaleString('es-SV')}.`:'');
    const hoursWarning=career&&!career.horas?'Las horas de esta carrera necesitan confirmación de coordinación.':'';
    const feedback=notice||hoursWarning?`<div class="form-field wide">${notice?`<p class="small-copy" role="status">${esc(notice)}</p>`:''}${!loading&&(error||state?.cached)?`<button type="button" class="text-button" id="${retryId}">Reintentar catálogo</button>`:''}${hoursWarning?`<p class="small-copy">${hoursWarning}</p>`:''}</div>`:'';
    return `${select('id_departamento','Departamento',departments,values.id_departamento,loading||!departments.length)}${select('id_carrera','Carrera',department?.carreras||[],values.id_carrera,loading||!department)}${feedback}`;
  }
  const api={normalize,snapshot,createClient,renderFields};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSCatalogoAcademico=api;
})(typeof window==='undefined'?globalThis:window);
