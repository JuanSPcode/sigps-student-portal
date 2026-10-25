const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {build,errors}=require('../js/documentos.js');
const ejemplos=require('../js/procesos-ejemplos.js');
const v={nombre:'Ana Ejemplo',carnet:'AB22001',carrera:'Ingeniería',departamento:'Ingeniería y Arquitectura',titulo:'Biblioteca comunitaria',institucion:'Centro comunitario',direccionInstitucion:'San Miguel',inicio:'2026-01-10',fin:'2026-07-10',lugar:'San Miguel',entrega:'2026-08-01',direccion:'Dirección de ejemplo',movil:'70000000',email:'ana@example.com',porcentaje:'75',horario:'8:00–12:00',dias:'Lunes a viernes',numero:'PR-001',nombreMemoria:'Memoria biblioteca',tutor:'Tutor de ejemplo'};
test('los tres tipos validan datos completos',()=>{for(const s of ['inscripcion','proyecto','memoria'])assert.deepEqual(errors(s,v),{});});
test('exige campos, correo, rango de porcentaje y fechas coherentes',()=>{
  assert.ok(errors('inscripcion',{...v,nombre:''}).nombre);
  assert.ok(errors('inscripcion',{...v,email:'no-es-correo'}).email);
  assert.ok(errors('inscripcion',{...v,porcentaje:'101'}).porcentaje);
  assert.ok(errors('memoria',{...v,fin:''}).fin);
  assert.ok(errors('proyecto',{...v,fin:'2025-01-01'}).fin);
  assert.ok(errors('proyecto',{...v,inicio:'2026-02-31'}).inicio);
});
test('valida horas y fechas de cronograma',()=>{
  assert.ok(errors('proyecto',v,[{horas:'-1'}])['actividad-0']);
  assert.ok(errors('proyecto',v,[{horas:'texto'}])['actividad-0']);
  assert.ok(errors('proyecto',v,[{inicio:'2025-12-01',fin:'2026-06-01',horas:'20'}])['actividad-0']);
});
test('escapa datos que puedan convertirse en código',()=>{
  const attack='</script><img src=x onerror=alert(1)>';
  for(const s of ['proyecto','memoria']){
    const output=build(s,{...v,nombre:attack,introduccion:attack});
    assert.ok(!output.includes(attack));assert.ok(output.includes('&lt;/script&gt;'));
    assert.equal((output.match(/<script>/g)||[]).length,1);
  }
});
test('genera estructura autónoma y señala los respaldos pendientes',()=>{
  for(const s of ['proyecto','memoria']){
    const output=build(s,v);
    assert.match(output,/<style>/);assert.match(output,/contenteditable="plaintext-only"/);
    assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)=/i.test(output));
    assert.match(output,/BORRADOR PARA REVISIÓN/);
    assert.match(output,/Firma/);
    if(s!=='inscripcion')assert.match(output,/Los archivos de respaldo no se adjuntan/);
  }
});
test('cronogramas comparten actividades y suman horas',()=>{
  const out=build('proyecto',v,[{actividad:'Catalogar',horas:'2.5'},{actividad:'Ordenar',horas:'3'}]);
  assert.match(out,/Total planificado: 5.5 horas/);
  assert.equal((out.match(/Catalogar/g)||[]).length,2);
});
test('las guías distribuidas conservan exactamente los originales incorporados',()=>{
  const dir=path.join(__dirname,'../documentos/procesos');
  for(const item of JSON.parse(fs.readFileSync(path.join(dir,'fuentes.json'),'utf8'))){
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,item.archivo))).digest('hex'),item.sha256);
  }
});

test('proyecto y memoria formatean equipo de varios alumnos en portada y cuadro resumen',()=>{
  const students=[{nombre:'Juan Sandoval',carnet:'SP23002'},{nombre:'César Alexander',carnet:'AA23032'}];
  const out=build('proyecto',{...v,cantidad:'2'},[],students);
  assert.ok(out.includes('Juan Sandoval · SP23002 · Ingeniería'));
  assert.ok(out.includes('César Alexander · AA23032 · Ingeniería'));
  assert.ok(out.includes('Número de estudiantes</strong><div class="editable" contenteditable="plaintext-only">2</div>'));
});

test('valida alumnos y carnets repetidos en equipo de proyecto',()=>{
  const dup=[{nombre:'Juan',carnet:'SP23002'},{nombre:'Pedro',carnet:'sp23002'}];
  assert.ok(errors('proyecto',v,[],dup)['alumno-1-carnet']);
  const missing=[{nombre:'Juan',carnet:''}];
  assert.ok(errors('proyecto',v,[],missing)['alumno-0-carnet']);
});

test('inscripción no vuelve a generar una imitación HTML',()=>assert.throws(()=>build('inscripcion',v),/plantilla Word/));

test('los ejemplos de proyecto y memoria de 1, 3 y 5 alumnos son válidos y completos',()=>{
  assert.throws(()=>ejemplos.create('proyecto',2),/Elige 1, 3 o 5 alumnos/);
  for(const count of [1,3,5]){
    for(const stage of ['proyecto','memoria']){
      const demo=ejemplos.create(stage,count);
      assert.equal(demo.students.length,count);
      assert.deepEqual(errors(stage,demo.values,demo.activities,demo.students),{});
      const html=build(stage,demo.values,demo.activities,demo.students);
      assert.ok(html.includes(demo.students[0].nombre));
      assert.ok(html.includes(demo.students[0].carnet));
      if(count>1){
        assert.ok(html.includes(demo.students[count-1].nombre));
        assert.ok(html.includes(demo.students[count-1].carnet));
      }
      if(stage==='proyecto'){
        assert.ok(html.includes('Total planificado: 500 horas'));
      }
    }
  }
});
