const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const PizZip=require('pizzip');
const Docxtemplater=require('docxtemplater');
const project=require('../js/proyecto-documento');
const demo=require('../js/procesos-ejemplos');
const template=fs.readFileSync(require('node:path').join(__dirname,'../documentos/plantillas/proyecto.docx'));
const dependencies={PizZip,Docxtemplater};
function render(d){return new PizZip(project.generate(template,d.values,d.activities,d.students,dependencies));}
test('Word para 1, 3 y 5 alumnos conserva portada, secciones, anexos y autores sin etiquetas pendientes',()=>{
  for(const n of [1,3,5]){
    const d=demo.create('proyecto',n),zip=render(d),xml=zip.file('word/document.xml').asText();
    assert.match(xml,/PROYECTO DE SERVICIO SOCIAL/);
    for(const s of d.students){assert.ok(xml.includes(s.nombre));assert.ok(xml.includes(s.carnet));}
    assert.ok(!/\{(?:#|\/)?(?:autores|actividades|titulo|text)\}/.test(xml));
    const headings=['Anexo A','Anexo B','Anexo C','Anexo D'].map(x=>xml.lastIndexOf('>'+x+'<'));
    assert.ok(headings.every((x,i)=>x>=0&&(!i||x>headings[i-1])));
    assert.match(xml,/Constancia del 60 %/);assert.match(xml,/Horas requeridas por cada alumno: 500/);
    const expectedHeaders=d.students.reduce((sum,s)=>sum+1+2*Math.ceil(new Set(require('../js/cronograma').plan(s,d.values).rows.flatMap(a=>Object.keys(a.semanas).map(k=>k.slice(0,7)))).size/2),0);
    assert.equal((xml.match(/w:tblHeader/g)||[]).length,expectedHeaders);
    assert.match(xml,/w:anchor="section_1"/);
    assert.match(zip.file('word/header1.xml').asText(),/PAGE/);
  }
});
test('formato académico: márgenes, sangría, doble espacio, orientación y sin estilos temáticos de título',()=>{
  const zip=render(demo.create('proyecto',1)),xml=zip.file('word/document.xml').asText(),styles=zip.file('word/styles.xml').asText();
  assert.match(xml,/w:pgSz w:w="12240" w:h="15840"/);
  assert.match(xml,/w:pgSz w:w="15840" w:h="12240"/);
  assert.match(xml,/w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/);
  const normal=styles.match(/<w:style\b[^>]*w:styleId="Normal"[\s\S]*?<\/w:style>/)[0];
  assert.match(normal,/w:line="480"/);assert.match(normal,/w:firstLine="720"/);assert.match(normal,/Times New Roman/);
  for(const id of ['Title','Heading1','Heading2']){
    const style=styles.match(new RegExp('<w:style\\b[^>]*w:styleId="'+id+'"[\\s\\S]*?<\\/w:style>'))[0];
    assert.ok(!style.includes('w:pBdr'));assert.ok(!style.includes('asciiTheme'));assert.match(style,/w:sz w:val="24"/);
  }
});
test('referencias opcionales con sangría francesa y sin inventar fuentes o datos vacíos',()=>{
  const d=demo.create('proyecto',1);d.values.tutor='';d.values.introduccion='';d.activities=[];
  let xml=render(d).file('word/document.xml').asText();
  assert.ok(xml.includes(d.values.numero));assert.match(xml,/\[Por completar\]/);
  assert.ok(!xml.includes('>Referencias<'));
  d.values.referencias='Fuente de prueba. (2026). Título.\nOtra fuente de prueba. (2025). Título.';
  xml=render(d).file('word/document.xml').asText();assert.match(xml,/>Referencias</);assert.match(xml,/Otra fuente de prueba/);assert.match(xml,/w:pStyle w:val="Reference"/);
});
test('secciones vacías incluyen orientaciones explicativas y recordatorio de borrado en cada página',()=>{
  const d=demo.create('proyecto',1);
  for(const k of project.contentKeys)d.values[k]='';
  d.activities=[];
  d.values.anexos='';
  const xml=render(d).file('word/document.xml').asText();
  assert.match(xml,/Borre este texto de orientación antes de entregar el documento final/);
  assert.match(xml,/ubicación espacio-temporal/);
  assert.match(xml,/preguntas clave sugeridas por la normativa oficial de la UPS/);
  assert.match(xml,/verbo en infinitivo/);
  assert.match(xml,/cuantitativa, medible y verificable/);
  assert.match(xml,/Docente tutor/);
  assert.match(xml,/procedencia de los fondos/);
  assert.match(xml,/Total por alumno/);
});
test('rechaza equipos inconsistentes, fechas imposibles, carnets duplicados y horas inválidas',()=>{
  const missingNumber=demo.create('proyecto',1);missingNumber.values.numero='   ';assert.throws(()=>render(missingNumber),/datos/);
  let d=demo.create('proyecto',3);d.students.pop();assert.throws(()=>render(d),/cantidad/);
  d=demo.create('proyecto',3);d.students[1].carnet=d.students[0].carnet;assert.throws(()=>render(d),/datos/);
  d=demo.create('proyecto',1);d.values.inicio='2026-02-31';assert.throws(()=>render(d),/datos/);
  d=demo.create('proyecto',1);d.students[0].cronograma.actividades[0].horas='-1';assert.throws(()=>render(d),/datos/);
});
test('texto extenso y caracteres especiales se conservan como texto, no como XML ni plantillas',()=>{
  const d=demo.create('proyecto',1);d.values.introduccion=('Párrafo de prueba largo con acentos. '.repeat(200))+'\nSegundo párrafo <script> & {titulo}';
  const xml=render(d).file('word/document.xml').asText();
  assert.match(xml,/Segundo párrafo &lt;script&gt; &amp; \{titulo\}/);
  assert.ok(!xml.includes('<script>'));
  assert.equal((xml.match(/Párrafo de prueba largo/g)||[]).length,200);
});
test('plantilla integrada y motor del navegador producen un DOCX offline con los mismos anexos',()=>{
  const {DOMParser,XMLSerializer}=require('@xmldom/xmldom');
  const context={Uint8Array,ArrayBuffer,Uint16Array,Uint32Array,Int32Array,DataView,TextEncoder,TextDecoder,Buffer,console,setTimeout,clearTimeout,DOMParser,XMLSerializer};vm.createContext(context);context.window=context;
  for(const f of ['vendor/pizzip.js','vendor/docxtemplater.js','procesos-data.js','areas-conocimiento.js','documentos.js','cronograma.js','proyecto-plantilla.js','proyecto-documento.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../js',f),'utf8'),context);
  assert.deepEqual(Buffer.from(context.window.SIGPSProyectoPlantilla,'base64'),template);
  const d=demo.create('proyecto',5);
  const output=context.window.SIGPSProyectoDocumento.generate(template,d.values,d.activities,d.students,{PizZip:context.PizZip||context.window.PizZip,Docxtemplater:context.docxtemplater||context.window.docxtemplater});
  const zip=new PizZip(output);assert.match(zip.file('word/document.xml').asText(),/Anexo D/);
  assert.equal(zip.file(/word\/media\//).length,1);
  assert.ok(!zip.file('word/document.xml').asText().includes('SP23002'));
});

test('documento independiente: no actualiza al abrir ni contiene relaciones externas o campos de referencia',()=>{
  const zip=render(demo.create('proyecto',5));
  const {DOMParser}=require('@xmldom/xmldom');
  for(const entry of Object.values(zip.files)){
    if(entry.dir)continue;
    if(entry.name.endsWith('.rels')){
      const xml=new DOMParser().parseFromString(entry.asText(),'text/xml');
      for(const rel of Array.from(xml.getElementsByTagName('Relationship')))assert.notEqual(rel.getAttribute('TargetMode'),'External',entry.name);
    }
    if(entry.name.startsWith('word/')&&entry.name.endsWith('.xml')){
      const xml=new DOMParser().parseFromString(entry.asText(),'text/xml');
      for(const field of Array.from(xml.getElementsByTagName('w:fldSimple')))assert.equal(field.getAttribute('w:instr').trim(),'PAGE');
      assert.equal(xml.getElementsByTagName('w:instrText').length,0);
    }
  }
  assert.match(zip.file('word/settings.xml').asText(),/<w:updateFields w:val="false"\s*\/>/);
  assert.doesNotMatch(zip.file('word/document.xml').asText(),/PAGEREF|INCLUDETEXT|INCLUDEPICTURE/);
});
