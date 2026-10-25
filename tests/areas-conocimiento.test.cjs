const {test}=require('node:test');
const assert=require('node:assert/strict');
const areas=require('../js/areas-conocimiento.js');
const fields=require('../js/procesos-data.js');
const {errors}=require('../js/documentos.js');
const examples=require('../js/procesos-ejemplos.js');

test('número obligatorio y área aparecen primero en Tu proyecto, sin repetirse en Contenido',()=>{
  for(const stage of ['proyecto','memoria']){
    const project=fields.projectFieldsFor(stage);
    assert.deepEqual(project.slice(0,2).map(f=>f[0]),['numero','area']);
    assert.equal(project[0][3],true);
    assert.equal(project[0][1],'Número de proyecto');
    assert.ok(!fields.contentFieldsFor(stage).some(f=>['numero','area'].includes(f[0])));
    const demo=examples.create(stage,1);
    assert.ok(errors(stage,{...demo.values,numero:'  '},demo.activities,demo.students).numero);
    assert.ok(errors(stage,{...demo.values,area:'Área inventada'},demo.activities,demo.students).area);
    assert.ok(!errors(stage,{...demo.values,area:'NINGUNO'},demo.activities,demo.students).area);
  }
});

test('el catálogo admite menos, más y cero opciones sin fijar la cantidad a once',()=>{
  assert.equal(areas.options().length,11);
  assert.equal(areas.options().at(-1).nombre,'NINGUNO');
  assert.equal(areas.options([{codigo:'A',nombre:'Área nueva'}]).length,1);
  assert.equal(areas.options(Array.from({length:15},(_,i)=>({codigo:String(i),nombre:`Área ${i}`}))).length,15);
  assert.deepEqual(areas.options([]),[]);
  assert.throws(()=>areas.options([{nombre:''}]));
});
