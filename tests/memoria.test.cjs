const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const PizZip=require('pizzip'),Docxtemplater=require('docxtemplater');
const memory=require('../js/memoria-documento'),demo=require('../js/procesos-ejemplos');
const template=fs.readFileSync(path.join(__dirname,'../documentos/plantillas/memoria.docx'));
const render=d=>new PizZip(memory.generate(template,d.values,d.activities,d.students,{PizZip,Docxtemplater}));
test('Memoria genera Word nativo para 1, 3 y 5 alumnos con estructura y cuadro institucional',()=>{
 for(const n of [1,3,5]){
  const d=demo.create('memoria',n),zip=render(d),xml=zip.file('word/document.xml').asText();
  for(const s of d.students){assert.ok(xml.includes(s.nombre));assert.ok(xml.includes(s.carnet));}
  for(const name of ['Introducción','Desarrollo','Resultados','Conclusiones','Recomendaciones','Cuadro resumen','Anexos'])assert.ok(xml.includes(name));
  assert.ok(!/\{(?:#|\/)?(?:autores|text|anexosOrden|nombreMemoria)\}/.test(xml));
  assert.match(xml,/Procedencia de fondos/);assert.match(xml,/Formulario n.º 3/);assert.match(xml,/Solicitudes de prórroga/);
  assert.match(xml,/w:anchor="memoria_1"/);assert.ok(zip.file('word/media/image1.png'));
  for(const f of zip.file(/\.rels$/))assert.ok(!f.asText().includes('TargetMode="External"'));
  assert.match(zip.file('word/settings.xml').asText(),/w:updateFields w:val="false"/);
 }
});
test('memoria no fabrica datos vacíos, rechaza equipo incoherente y escapa contenido',()=>{
 const d=demo.create('memoria',1);d.values.introduccion='<prueba> & {titulo}';d.values.tutor='';d.values.procedenciaFondos='';
 const xml=render(d).file('word/document.xml').asText();assert.match(xml,/&lt;prueba&gt; &amp; \{titulo\}/);assert.match(xml,/\[Por completar\]/);
 d.values.cantidad='2';assert.throws(()=>render(d),/cantidad/);
 d.values.cantidad='1';d.values.entrega='2026-02-31';assert.throws(()=>render(d),/datos/);
});
test('memoria integrada en navegador genera Word sin fetch ni servidor',()=>{
 const {DOMParser,XMLSerializer}=require('@xmldom/xmldom');
 const c={Uint8Array,ArrayBuffer,Uint16Array,Uint32Array,Int32Array,DataView,TextEncoder,TextDecoder,Buffer,console,setTimeout,clearTimeout,DOMParser,XMLSerializer};vm.createContext(c);c.window=c;
 for(const f of ['vendor/pizzip.js','vendor/docxtemplater.js','procesos-data.js','areas-conocimiento.js','documentos.js','memoria-plantilla.js','memoria-documento.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',f),'utf8'),c);
 assert.deepEqual(Buffer.from(c.SIGPSMemoriaPlantilla,'base64'),template);
 const d=demo.create('memoria',5),out=c.SIGPSMemoriaDocumento.generate(template,d.values,d.activities,d.students);
 assert.match(new PizZip(out).file('word/document.xml').asText(),/ED22005/);
});
test('cada anexo conserva las mismas instrucciones en el portal y el Word',()=>{
 const d=demo.create('memoria',1),data=memory.payload(d.values,d.students),xml=render(d).file('word/document.xml').asText();
 assert.equal(memory.annexGuide.length,13);
 assert.deepEqual(data.anexosOrden.map(a=>a.nombre),memory.annexes);
 for(const a of data.anexosOrden){assert.ok(a.instruccion.length>80);assert.ok(xml.includes(a.instruccion));}
 assert.match(data.anexosOrden[8].instruccion,/llénala a mano/);
 assert.match(data.anexosOrden[7].instruccion,/No llenes tu propia calificación/);
 assert.match(data.anexosOrden[5].instruccion,/después de aprobar la memoria/);
 assert.match(data.anexosOrden[12].instruccion,/no demuestra que fue autorizada/);
 assert.ok(xml.includes(memory.supportingGuidance));
 assert.ok(!/\{(?:instruccion|anexosIndicaciones|respaldosIndicaciones)\}/.test(xml));
});
test('los anexos incluyen los diez modelos originales con sus tablas editables intactas',()=>{
 const {DOMParser}=require('@xmldom/xmldom');
 const source=new PizZip(fs.readFileSync(path.join(__dirname,'../Plantillas/3. DOCUMENTO PARA PRESENTAR LA MEMORIA DE SERVICIO SOCIAL.docx')));
 const parse=xml=>new DOMParser().parseFromString(xml,'text/xml');
 const original=parse(source.file('word/document.xml').asText());
 const generated=parse(render(demo.create('memoria',5)).file('word/document.xml').asText());
 const children=doc=>Array.from(doc.getElementsByTagName('w:body')[0].childNodes).filter(n=>n.nodeType===1);
 const text=n=>Array.from(n.getElementsByTagName('w:t')).map(t=>t.textContent).join('');
 const titles=['Formulario N.º 3','Formulario N.º 4','Formulario N.º 5','Carta N.º 3','Carta N.º 4','Carta N.º 5','Carta N° 6','Formulario N.º 6','Formulario Nº 7','Formulario Nº 8'];
 const body=children(generated);let last=-1;
 for(const title of titles){const index=body.findIndex(n=>text(n).startsWith(title));assert.ok(index>last,title);last=index;assert.equal(body[index].getElementsByTagName('w:pageBreakBefore').length,1);}
 assert.equal(body.filter(n=>text(n)==='HOJA DE INDICACIONES').length,14);
 const originalAnnex=children(original).slice(children(original).findIndex(n=>n.nodeName==='w:p'&&text(n).startsWith(titles[0])));
 const generatedAnnex=body.slice(body.findIndex(n=>n.nodeName==='w:p'&&text(n).startsWith(titles[0])));
 const tables=nodes=>nodes.filter(n=>n.nodeName==='w:tbl').map(n=>({
  text:text(n),rows:n.getElementsByTagName('w:tr').length,
  geometry:['w:gridCol','w:tcW','w:gridSpan','w:vMerge'].map(tag=>Array.from(n.getElementsByTagName(tag)).map(e=>Array.from(e.attributes).map(a=>[a.name,a.value])))
 }));
 assert.deepEqual(tables(generatedAnnex),tables(originalAnnex));
 const instructions=body.filter(n=>text(n)==='HOJA DE INDICACIONES');
 for(const node of instructions.slice(0,13))assert.equal(node.getElementsByTagName('w:pageBreakBefore').length,1);
});

test('la memoria usa el título del proyecto aunque exista un nombre antiguo diferente',()=>{
 const d=demo.create('memoria',1);
 d.values.titulo='Proyecto comunitario unificado';
 d.values.nombreMemoria='Nombre antiguo que debe ignorarse';
 const xml=render(d).file('word/document.xml').asText();
 assert.equal(memory.payload(d.values,d.students).nombreMemoria,d.values.titulo);
 assert.ok(xml.includes(d.values.titulo));
 assert.ok(!xml.includes(d.values.nombreMemoria));
 delete d.values.nombreMemoria;
 assert.doesNotThrow(()=>render(d));
});
