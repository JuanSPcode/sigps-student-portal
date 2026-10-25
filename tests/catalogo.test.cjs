const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalize,snapshot,createClient}=require('../js/catalogo-academico.js');
const inscription=require('../js/inscripcion-documento.js');
const examples=require('../js/inscripcion-ejemplos.js');
const response=()=>({status:'success',data:{departamentos:[
  {id_departamento:1,nombre:'Departamento de Ingeniería y Arquitectura',carreras:[{id_carrera:7,departamento_id:1,nombre:'Ingeniería de Sistemas Informáticos',horas_servicio_social:500,horas_requeridas:500}]},
  {id_departamento:2,nombre:'Departamento de ejemplo',carreras:[{id_carrera:8,departamento_id:2,nombre:'Carrera de ejemplo',horas_servicio_social:300,horas_requeridas:300}]}
]}});
const baseURL='https://api.example.test/api/v1';
const meta={baseURL,updatedAt:'2026-10-24T16:00:00.000Z'};
function memory(){const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),data};}
test('relaciona departamento y carrera por ID y conserva una copia de nombres y horas',()=>{
  const catalog=normalize(response());
  const selected=snapshot(catalog,'1','7',meta);
  assert.equal(selected.horas,'500');assert.equal(selected.id_carrera,'7');
  assert.throws(()=>snapshot(catalog,'2','7',meta));
  catalog.departamentos[0].carreras[0].nombre='Nombre posterior';
  assert.equal(selected.carrera,'Ingeniería de Sistemas Informáticos');assert.ok(Object.isFrozen(selected));
  const example=examples.create(3);
  Object.assign(example.project,selected,{codigo:'',catalogoAcademico:selected});
  const payload=inscription.payload(example.project,example.students);
  for(const student of payload.alumnos){assert.equal(student.carrera,selected.carrera);assert.equal(student.horas,'500');assert.equal(student.codigo,'________________');}
  assert.throws(()=>inscription.payload({...example.project,horas:'300'},example.students),{code:'DATOS_PROYECTO'});
});
test('rechaza respuestas defectuosas y no inventa horas ante contradicciones',()=>{
  for(const raw of [null,{}, {status:'success',data:{departamentos:[]}}])assert.throws(()=>normalize(raw));
  const raw=response();raw.data.departamentos[0].carreras[0].departamento_id=2;assert.throws(()=>normalize(raw));
  for(const hours of [null,0,-1,'abc',300]){
    const raw=response();raw.data.departamentos[0].carreras[0].horas_requeridas=hours;
    assert.throws(()=>snapshot(normalize(raw),1,7,meta),/confirmación/);
  }
});
test('consulta una sola vez para peticiones simultáneas, sin credenciales ni datos personales',async()=>{
  const storage=memory();let calls=0;
  const client=createClient({baseURL,storage,now:()=>new Date(meta.updatedAt),fetchImpl:async(url,options)=>{
    calls++;assert.equal(url,baseURL+'/catalogo-academico');assert.equal(options.credentials,'omit');assert.equal(options.body,undefined);
    return {ok:true,json:async()=>response()};
  }});
  const [a,b]=await Promise.all([client.load(),client.load()]);
  assert.equal(calls,1);assert.deepEqual(a,b);assert.equal(a.cached,false);
  assert.equal(storage.data.size,1);assert.ok(![...storage.data.values()][0].includes('carnet'));
});
test('recupera únicamente el último catálogo válido del mismo servidor ante un fallo',async()=>{
  const storage=memory();
  await createClient({baseURL,storage,now:()=>new Date(meta.updatedAt),fetchImpl:async()=>({ok:true,json:async()=>response()})}).load();
  const failure=async()=>{throw new Error('offline');};
  const cached=await createClient({baseURL,storage,fetchImpl:failure}).load();
  assert.equal(cached.cached,true);assert.equal(cached.updatedAt,meta.updatedAt);
  await assert.rejects(createClient({baseURL:'https://other.example.test/api/v1',storage,fetchImpl:failure}).load());
  const invalid=await createClient({baseURL,storage,fetchImpl:async()=>({ok:true,json:async()=>({})})}).load();
  assert.equal(invalid.cached,true);
});
test('tolera almacenamiento bloqueado y permite reintentar después de error o timeout',async()=>{
  let calls=0;
  const storage={getItem(){throw Error();},setItem(){throw Error();}};
  const client=createClient({baseURL,storage,fetchImpl:async()=>({ok:++calls>1,json:async()=>response()})});
  await assert.rejects(client.load());assert.equal((await client.load()).cached,false);
  await assert.rejects(createClient({baseURL,timeoutMs:5,fetchImpl:(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))))}).load());
  await assert.rejects(createClient({baseURL:''}).load(),/no está conectado/);
});
