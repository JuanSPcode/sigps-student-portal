const {test}=require('node:test'),assert=require('node:assert/strict');
const schedule=require('../js/cronograma'),demo=require('../js/procesos-ejemplos');
const student=(dias,actividades)=>({nombre:'Alumno',cronograma:{dias,actividades:actividades.map(([actividad,horas])=>({actividad,horas}))}});
test('semanas reales: cada día pertenece a un solo período, incluyendo febrero bisiesto y cambio de año',()=>{
 const ps=schedule.periods('2023-12-30','2024-02-29');
 assert.equal(ps[0].from,'2023-12-30');assert.equal(ps.at(-1).to,'2024-02-29');
 const dates=ps.flatMap(p=>{const out=[];for(let d=new Date(p.from);d<=new Date(p.to);d.setUTCDate(d.getUTCDate()+1))out.push(d.toISOString().slice(0,10));return out;});
 assert.equal(dates.length,62);assert.equal(new Set(dates).size,62);
 assert.deepEqual(schedule.periods('2026-02-31','2026-03-04'),[]);
 assert.equal(schedule.periods('2026-03-01','2026-03-31').length,6);
});
test('20 y 48 horas semanales: actividad secuencial sin exceder capacidad, con días parciales',()=>{
 const v={inicio:'2026-11-02',fin:'2026-11-08',horas:'20'};
 const s=student([4,4,4,4,4,0,0],[['Diagnóstico',6],['Archivo',14]]),p=schedule.plan(s,v);
 assert.deepEqual(p.issues,[]);assert.equal(p.weekly,20);assert.equal(p.allocated,20);assert.equal(p.finish,'2026-11-06');
 assert.equal(p.rows[0].fin,'2026-11-03');assert.equal(p.rows[1].inicio,'2026-11-03');
 const fast=schedule.plan(student([8,8,8,8,8,8,0],[['Otra',48]]),{...v,horas:'48'});
 assert.deepEqual(fast.issues,[]);assert.equal(fast.capacity,48);assert.equal(fast.finish,'2026-11-07');
 assert.equal(schedule.plan(s,{...v,inicio:'2026-11-04',fin:'2026-11-06'}).capacity,12);
});
test('horas por alumno y carrera: no suma los alumnos ni inventa horas si el período no alcanza',()=>{
 const v={inicio:'2026-11-02',fin:'2026-11-08',horas:'20'},s=student([4,4,4,4,4,0,0],[['A',10]]);
 assert.equal(Object.keys(schedule.errors([s,s],v)).length,2);
 assert.match(schedule.plan(s,v).issues.join(' '),/Faltan 10/);
 s.cronograma.actividades[0].horas=25;assert.match(schedule.plan(s,v).issues.join(' '),/exceden por 5/);
 const p=schedule.plan(s,{...v,horas:'25'});assert.equal(p.allocated,20);assert.equal(p.finish,'');assert.match(p.issues.join(' '),/caben 20/);
 assert.match(schedule.plan(s,{...v,horas:''}).issues.join(' '),/Confirma/);
});
test('rechaza horas negativas, vacías, no finitas, días imposibles, fechas y precisión inválida',()=>{
 const v={inicio:'2026-11-02',fin:'2027-06-01',horas:'500'};
 for(const hours of [-1,'','abc',Infinity,'0.001'])assert.ok(schedule.plan(student([4,4,4,4,4,0,0],[['A',hours]]),v).issues.length);
 for(const hours of [-1,25,Infinity,'0.001'])assert.match(schedule.plan(student([hours,0,0,0,0,0,0],[['A',500]]),v).issues.join(' '),/entre 0 y 24/);
 assert.match(schedule.plan(student([0,0,0,0,0,0,0],[['A',500]]),v).issues.join(' '),/al menos un día/);
 assert.match(schedule.plan(student([4,4,4,4,4,0,0],[['A',500]]),{...v,fin:'2026-02-31'}).issues.join(' '),/fechas/);
});
test('conserva centésimas y horarios variables sin modificar las actividades originales',()=>{
 const s=student([1.25,2.5,0,4.25,0,0,0],[['A',1.01],['B',6.99]]),before=JSON.stringify(s);
 const p=schedule.plan(s,{inicio:'2026-11-02',fin:'2026-11-08',horas:8});
 assert.deepEqual(p.issues,[]);assert.equal(p.allocated,8);assert.equal(p.rows.reduce((n,a)=>n+schedule.total(a),0),8);assert.equal(JSON.stringify(s),before);
});
test('reordenar recalcula las fechas y conserva identidad y horas; cada alumno usa actividades distintas',()=>{
 const d=demo.create('proyecto',3),s=d.students[0],before=s.cronograma.actividades[0];
 schedule.move(s.cronograma.actividades,0,1);assert.equal(s.cronograma.actividades[1],before);
 assert.deepEqual(schedule.errors(d.students,d.values),{});
 const xml=schedule.wordXML(d.students,d.values);assert.ok(xml.indexOf(s.cronograma.actividades[0].actividad)<xml.indexOf(before.actividad));
 for(const st of d.students){assert.ok(xml.includes(st.nombre));assert.equal(schedule.plan(st,d.values).allocated,500);}
 assert.ok(xml.includes(d.students[1].cronograma.actividades[1].actividad));
 before.actividad='<peligro> & texto';assert.match(schedule.detailsXML(d.students,d.values),/&lt;peligro&gt; &amp;/);
});
