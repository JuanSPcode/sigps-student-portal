const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const api=require('../js/inscripcion-documento.js');const PizZip=require('pizzip');const Docxtemplater=require('docxtemplater');
const {project,students}=require('./fixtures/inscripcion.cjs');const root=path.join(__dirname,'..');const template=fs.readFileSync(path.join(root,'documentos/plantillas/inscripcion.docx'));
const generate=(p,s)=>api.generate(template,p,s,{PizZip,Docxtemplater});
function text(xml){return xml.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
test('1, 2 y 5 alumnos generan un solo paquete en orden, con hojas individuales y grupo',()=>{
 for(const n of [1,2,5]){
  const people=Array.from({length:n},(_,i)=>({...students[i%2],nombre:`Estudiante Ejemplo ${i+1}`,carnet:`EE${22001+i}`}));
  const zip=new PizZip(generate({...project,cantidad:String(n)},people));const xml=zip.file('word/document.xml').asText();const content=text(xml);
  assert.equal((content.match(/Formulario No. 1:/g)||[]).length,n);
  assert.equal((content.match(/Carta No. 1:/g)||[]).length,1);
  assert.equal((content.match(/Carta No. 2 /g)||[]).length,n);
  for(const s of people)assert.equal(content.split(s.nombre).length-1,3);
  assert.ok(content.lastIndexOf('Formulario No. 1:')<content.indexOf('Carta No. 1:'));
  assert.ok(content.indexOf('Carta No. 1:')<content.indexOf('Carta No. 2 '));
  const ids=[...xml.matchAll(/<wp:docPr\b[^>]*\bid="(\d+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  assert.ok(!content.includes('{'));assert.ok(!content.includes('undefined'));
  assert.match(content,/Firma del Estudiante/);assert.match(content,/Firma y sello/);
  assert.equal(content.split('solicitamos ')[1].split(' para realizar')[0],n===1?'1 estudiante apto':`${n} estudiantes aptos`);
  assert.ok(!content.split('Formulario No. 1:')[0].includes('Estudiante Ejemplo'));
 }
});
test('conserva estilos, relaciones, escudos y geometría de la plantilla',()=>{
 const source=new PizZip(fs.readFileSync(path.join(root,'documentos/procesos/inscripcion.docx')));const tpl=new PizZip(template);const out=new PizZip(generate(project,students));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'documentos/plantillas/inscripcion-manifest.json')));
 for(const [name,hash] of Object.entries(manifest.preserved_parts)){
  assert.equal(crypto.createHash('sha256').update(tpl.file(name).asNodeBuffer()).digest('hex'),hash,name);
  // Docxtemplater can normalize XML in app/core metadata; visual resources must stay intact.
  if(/^(word\/(styles|numbering|theme|fontTable|media|_rels)|\[Content_Types\])/.test(name))assert.deepEqual(out.file(name).asNodeBuffer(),source.file(name).asNodeBuffer(),name);
 }
 const geometry=xml=>xml.match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/)[0];
 assert.equal(geometry(out.file('word/document.xml').asText()),geometry(tpl.file('word/document.xml').asText()));
});
test('rechaza cantidades inválidas, alumnos incompletos, carnets repetidos y fechas contrarias a la guía',()=>{
 for(const cantidad of ['0','-1','1.5','no','Infinity'])assert.ok(api.validate(api.teamFields,{...project,cantidad}).cantidad);
 assert.throws(()=>generate(project,[students[0]]));
 assert.throws(()=>generate(project,[students[0],{...students[1],carnet:students[0].carnet.toLowerCase()}]));
 assert.throws(()=>generate(project,[students[0],{...students[1],carnet:''}]));
 assert.ok(api.validate(api.projectFields,{...project,fin:'2026-12-01'}).fin);
 assert.ok(api.validate(api.projectFields,{...project,inicio:'2026-02-31'}).inicio);
 assert.ok(api.validate(api.studentFields,{...students[0],porcentaje:101}).porcentaje);
});
test('escapa caracteres XML y no ejecuta variables introducidas por el alumno',()=>{
 const person={...students[0],nombre:'Ana & Luis <Ejemplo> {titulo}'};
 const output=new PizZip(generate({...project,cantidad:'1'},[person])).file('word/document.xml').asText();
 assert.match(output,/Ana &amp; Luis &lt;Ejemplo&gt; \{titulo\}/);
});
test('deja campos desconocidos para revisión sin inventar responsables',()=>{
 const out=text(new PizZip(generate({...project,tutor:'',coordinador:'',responsable:''},students)).file('word/document.xml').asText());
 assert.ok(!out.includes('undefined'));assert.match(out,/________________/);
});

test('la versión distribuida al navegador genera con todos los opcionales vacíos',()=>{
 const vm=require('node:vm'),{DOMParser,XMLSerializer}=require('@xmldom/xmldom');
 const browser=vm.createContext({console,Uint8Array,ArrayBuffer,Uint16Array,Uint32Array,Int32Array,DataView,TextEncoder,TextDecoder,DOMParser,XMLSerializer});browser.window=browser;
 for(const file of ['js/vendor/pizzip.js','js/vendor/docxtemplater.js','js/inscripcion-horarios.js','js/inscripcion-documento.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),browser);
 const engine=browser.SIGPSInscripcionDocumento,p={...project},people=students.map(s=>({...s}));
 for(const fields of [engine.teamFields,engine.projectFields])for(const [key,,,required] of fields)if(!required)p[key]='';
 for(const s of people)for(const [key,,,required] of engine.studentFields)if(!required)s[key]='';
 p.incluirCartaInstitucion=false;
 const output=new PizZip(engine.generate(template,p,people)).file('word/document.xml').asText();
 assert.ok(output.includes('Ana Ejemplo'));assert.ok(output.includes('Luis Ejemplo'));
});
test('distingue errores del servidor, plantilla y datos sin perder la causa',()=>{
 assert.throws(()=>api.generate(Buffer.from('<html>404</html>'),project,students,{PizZip,Docxtemplater}),{code:'PLANTILLA_INVALIDA'});
 const broken=new PizZip(template);broken.file('word/document.xml',broken.file('word/document.xml').asText().replace('{titulo}','{variable_ausente}'));
 assert.throws(()=>generateBroken(),{code:'PLANTILLA_DESACTUALIZADA'});
 function generateBroken(){api.generate(broken.generate({type:'nodebuffer'}),project,students,{PizZip,Docxtemplater});}
 assert.match(api.errorMessage(api.failure('CARGA_PLANTILLA','')),/plantilla incluida/);
 assert.match(api.errorMessage(api.failure('ARCHIVO_LOCAL','')),/versión publicada/);
 for(const code of ['CARGA_PLANTILLA','ARCHIVO_LOCAL','MOTOR_NO_DISPONIBLE'])assert.doesNotMatch(api.errorMessage(api.failure(code,'')),/servidor local|127\.0\.0\.1|Python/);
 assert.match(api.errorMessage(api.failure('CARNETS_REPETIDOS','Hay carnets repetidos.')),/carnets repetidos/);
 assert.match(api.errorMessage(new Error('datos privados')),/GENERACION_FALLIDA/);
 assert.ok(!api.errorMessage(new Error('datos privados')).includes('datos privados'));
});

test('los ejemplos de 1, 5 y 3 alumnos generan el paquete completo con una sola carrera',()=>{
 const examples=require('../js/inscripcion-ejemplos.js');
 for(const n of [1,5,3]){
  const sample=examples.create(n),data=api.payload(sample.project,sample.students);
  assert.equal(data.alumnos.length,n);
  for(const s of data.alumnos){assert.equal(s.carrera,sample.project.carrera);assert.equal(s.codigo,sample.project.codigo);}
  const content=text(new PizZip(generate(sample.project,sample.students)).file('word/document.xml').asText());
  assert.equal((content.match(/Formulario No. 1:/g)||[]).length,n);
  assert.equal((content.match(/Carta No. 2 /g)||[]).length,n);
  for(const s of sample.students)assert.equal(content.split(s.nombre).length-1,3);
  assert.ok(content.includes(sample.project.carrera));assert.ok(!content.includes('undefined'));assert.ok(!content.includes('{'));
  sample.students[0].nombre='Modificado';sample.project.carrera='Modificada';
  assert.notEqual(examples.create(n).students[0].nombre,'Modificado');assert.notEqual(examples.create(n).project.carrera,'Modificada');
 }
});
test('la carrera se requiere al inicio, se propaga a todos y rechaza carreras contradictorias',()=>{
 assert.ok(api.validate(api.teamFields,{...project,carrera:''}).carrera);
 assert.ok(!api.studentFields.some(([key])=>key==='carrera'||key==='codigo'));
 const changed={...project,carrera:'Licenciatura en Educación',codigo:'DEMO2'};
 const data=api.payload(changed,students);
 assert.equal(data.carreras,changed.carrera);
 for(const s of data.alumnos){assert.equal(s.carrera,changed.carrera);assert.equal(s.codigo,'DEMO2');}
 const content=text(new PizZip(generate(changed,students)).file('word/document.xml').asText());
 assert.ok(content.includes(changed.carrera));assert.ok(!content.includes(project.carrera));
 assert.throws(()=>generate(project,[{...students[0],carrera:'Otra carrera'},students[1]]),{code:'CARRERAS_DISTINTAS'});
});

test('la plantilla integrada en base64 permite generar el Word sin servidor (file://)',()=>{
 const {base64}=require('../js/inscripcion-plantilla.js');
 assert.ok(base64 && typeof base64 === 'string');
 const buffer=Buffer.from(base64,'base64');
 assert.deepEqual(buffer,template);
 const out=generate(project,students);
 assert.ok(out && out.length > 0);
});

test('la carta institucional es opcional y beneficiarios no bloquea los tres documentos obligatorios',()=>{
 const examples=require('../js/inscripcion-ejemplos.js');
 for(const n of [1,3,5])for(const include of [false,true]){
  const {project:p,students:people}=examples.create(n);p.incluirCartaInstitucion=include;
  delete p.beneficiarios;
  if(!include){delete p.aportes;delete p.destinatario;}
  const xml=new PizZip(generate(p,people)).file('word/document.xml').asText(),content=text(xml);
  assert.equal(content.includes('solicitamos '),include);
  assert.equal((content.match(/Formulario No. 1:/g)||[]).length,n);
  assert.equal((content.match(/Carta No. 1:/g)||[]).length,1);
  assert.equal((content.match(/Carta No. 2 /g)||[]).length,n);
  assert.ok(!content.includes('{'));assert.ok(!content.includes('undefined'));
  if(!include)assert.ok(xml.split('Formulario No. 1:')[0].includes('pageBreakBefore'));
 }
 const p={...project,incluirCartaInstitucion:false,aportes:'',fin:'2027-05-01'};
 assert.deepEqual(api.validate(api.projectFields,p),{});
 assert.deepEqual(api.validate(api.projectFields,{...p,incluirCartaInstitucion:true}),{});
 assert.ok(api.validate(api.projectFields,{...p,fin:'2026-10-01'}).fin);
});
test('horarios ordenados, varios días por bloque y dos jornadas el jueves conservan su correspondencia',()=>{
 const schedule=require('../js/inscripcion-horarios.js');
 const blocks=[{dias:[4],inicio:'08:00',fin:'22:00'},{dias:[3],inicio:'13:00',fin:'16:00'},{dias:[1,0],inicio:'08:00',fin:'12:00'},{dias:[2],inicio:'08:00',fin:'16:00'},{dias:[3],inicio:'08:00',fin:'10:00'}];
 assert.equal(schedule.validate(blocks),'');
 const rows=schedule.rows(blocks);
 assert.deepEqual(rows.map(r=>r.dias),['Lunes, Martes','Miércoles','Jueves','Jueves','Viernes']);
 assert.deepEqual(rows.map(r=>r.horario),['8:00 AM a 12:00 PM','8:00 AM a 4:00 PM','8:00 AM a 10:00 AM','1:00 PM a 4:00 PM','8:00 AM a 10:00 PM']);
 assert.equal(schedule.time('00:30'),'12:30 AM');assert.equal(schedule.time('12:00'),'12:00 PM');
 const xml=new PizZip(generate({...project,cantidad:'1',incluirCartaInstitucion:false},[{...students[0],disponibilidad:blocks}])).file('word/document.xml').asText();
 const table=xml.match(/<w:tbl\b[\s\S]*?<\/w:tbl>/g).find(t=>t.includes('8:00 AM a 10:00 PM'));
 const actual=table.match(/<w:tr\b[\s\S]*?<\/w:tr>/g).map(text);
 assert.equal(actual.length,5);
 for(let i=0;i<5;i++){assert.ok(actual[i].includes(rows[i].dias));assert.ok(actual[i].includes(rows[i].horario));}
});
test('rechaza horarios vacíos, días inválidos y horas invertidas; admite minutos exactos',()=>{
 const schedule=require('../js/inscripcion-horarios.js');
 for(const blocks of [undefined,[],[{dias:[],inicio:'08:00',fin:'12:00'}],[{dias:[7],inicio:'08:00',fin:'12:00'}],[{dias:[0],inicio:'',fin:'12:00'}],[{dias:[0],inicio:'24:00',fin:'12:00'}],[{dias:[0],inicio:'12:00',fin:'08:00'}],[{dias:[0],inicio:'12:00',fin:'12:00'}]]){
  assert.ok(schedule.validate(blocks));
  assert.throws(()=>generate({...project,cantidad:'1'},[{...students[0],disponibilidad:blocks}]),{code:'DATOS_ALUMNOS'});
 }
 assert.equal(schedule.validate([{dias:[6],inicio:'08:15',fin:'09:45'}]),'');
});


test('las hojas de indicaciones delimitan el expediente y la inicial depende de la carta',()=>{
 const examples=require('../js/inscripcion-ejemplos.js');
 const initial='Adjunta la carta de solicitud de la institución',last='Adjunta la constancia del 60 % de materias aprobadas';
 for(const count of [1,3,5])for(const include of [false,true]){
  const {project:p,students:people}=examples.create(count);p.incluirCartaInstitucion=include;
  const xml=new PizZip(generate(p,people)).file('word/document.xml').asText(),content=text(xml);
  assert.equal(content.split(initial).length-1,include?0:1);
  assert.equal(content.split(last).length-1,1);
  assert.equal(content.split('HOJA DE INDICACIONES').length-1,include?1:2);
  if(!include){assert.ok(content.indexOf(initial)<content.indexOf('Formulario No. 1:'));assert.ok(content.includes('Sustituye esta hoja por la carta revisada y firmada'));}
  assert.ok(content.indexOf(last)>content.lastIndexOf('Subcoordinación de la Unidad de Proyección Social'));
  assert.ok(content.includes('Adjunta una constancia por cada alumno participante.'));
  assert.ok(content.endsWith('Retira esta hoja de indicaciones antes de entregar el expediente.'));
  const paragraphs=xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g);
  const labels=paragraphs.filter(p=>p.includes('HOJA DE INDICACIONES'));
  assert.match(labels.at(-1),/<w:pageBreakBefore/);
  if(!include)assert.ok(!labels[0].includes('pageBreakBefore'));
 }
});


test('la disponibilidad especial acompaña su horario al ordenar y generar el Word',()=>{
 const blocks=[{dias:[3],inicio:'13:00',fin:'16:00',otros:'Desde el 15 de noviembre'},{dias:[0],inicio:'08:00',fin:'12:00',otros:'Solo en interciclo'},{dias:[4],inicio:'08:00',fin:'12:00'}];
 const data=api.payload({...project,cantidad:'1'},[{...students[0],otros:'',disponibilidad:blocks}]);
 assert.deepEqual(data.alumnos[0].horarios.map(r=>r.otros),['Solo en interciclo','Desde el 15 de noviembre','']);
 const xml=new PizZip(generate({...project,cantidad:'1'},[{...students[0],otros:'',disponibilidad:blocks}])).file('word/document.xml').asText();
 const rows=xml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g).map(text);
 assert.ok(rows.some(r=>r.includes('Lunes')&&r.includes('Solo en interciclo')));
 assert.ok(rows.some(r=>r.includes('Jueves')&&r.includes('Desde el 15 de noviembre')));
 assert.ok(api.validate(api.studentFields,{...students[0],disponibilidad:[{...blocks[0],otros:'a'.repeat(121)}]}).disponibilidad);
});
test('la carta conserva el espacio para aportes sin inventar recursos de la institución',()=>{
 const sample=require('../js/inscripcion-ejemplos.js').create(1);sample.project.incluirCartaInstitucion=true;
 assert.equal(api.payload(sample.project,sample.students).aportes,'________________');
 const content=text(new PizZip(generate(sample.project,sample.students)).file('word/document.xml').asText());
 assert.ok(content.includes('Detallar: ________________'));
 assert.equal(api.payload({...sample.project,seccion:''},sample.students).seccion,'________________');
});


test('financiamiento admite las seis opciones y utiliza fondos del estudiante por defecto',()=>{
 assert.deepEqual(api.financingOptions,['Gobierno Nacional','Gobierno Internacional','Empresa Privada Nacional','Empresa Privada Internacional','Propios de Institución','Propios del Estudiante']);
 const p={...project};delete p.financiamiento;
 assert.equal(api.payload(p,students).financiamiento,'Propios del Estudiante');
 for(const financiamiento of api.financingOptions){
  assert.equal(api.payload({...project,financiamiento},students).financiamiento,financiamiento);
  const content=text(new PizZip(generate({...project,financiamiento},students)).file('word/document.xml').asText());
  assert.ok(content.includes(financiamiento));
 }
 assert.ok(api.validate(api.projectFields,{...project,financiamiento:'Otra fuente'}).financiamiento);
 assert.ok(api.validate(api.projectFields,{...project,financiamiento:''}).financiamiento);
});
test('la fecha de emisión usa el día elegido, sede fija y año en letras en todas las hojas',()=>{
 const expected='Ciudad Universitaria de Oriente a los 6 días del mes de febrero del año dos mil veintiséis.';
 assert.equal(api.emissionDate('2026-02-06'),expected);
 assert.equal(api.emissionDate('2026-02-30'),'');
 assert.equal(api.emissionDate('2028-02-29'),'Ciudad Universitaria de Oriente a los 29 días del mes de febrero del año dos mil veintiocho.');
 assert.equal(api.emissionDate('2031-01-01'),'Ciudad Universitaria de Oriente al día 1 del mes de enero del año dos mil treinta y uno.');
 assert.equal(api.emissionDate('2100-12-31'),'Ciudad Universitaria de Oriente a los 31 días del mes de diciembre del año dos mil cien.');
 assert.equal(api.defaults(new Date(2026,1,6,23,59)).entrega,'2026-02-06');
 const p={...project,cantidad:'1',entrega:'2026-02-06',lugar:'Lugar anterior que debe ignorarse'};
 const content=text(new PizZip(generate(p,[students[0]])).file('word/document.xml').asText());
 assert.equal(content.split(expected).length-1,4);
 assert.ok(!content.includes(p.lugar));
 assert.ok(!api.projectFields.some(([key])=>key==='lugar'));
});


test('el correo se genera exclusivamente desde el carnet para cada alumno',()=>{
 const people=students.map((s,i)=>({...s,carnet:i===0?'  AB22001  ':'cd22002',email:'ignorar@example.com'}));
 const data=api.payload(project,people);
 assert.deepEqual(data.alumnos.map(s=>s.email),['ab22001@ues.edu.sv','cd22002@ues.edu.sv']);
 assert.ok(!api.studentFields.some(([key])=>key==='email'));
 const content=text(new PizZip(generate(project,people)).file('word/document.xml').asText());
 assert.ok(content.includes('ab22001@ues.edu.sv'));assert.ok(content.includes('cd22002@ues.edu.sv'));assert.ok(!content.includes('ignorar@example.com'));
 assert.equal(api.payload(project,[{...people[0],carnet:'XY22003'},people[1]]).alumnos[0].email,'xy22003@ues.edu.sv');
 for(const carnet of ['AB 22','ab22@ues.edu.sv'])assert.ok(api.validate(api.studentFields,{...students[0],carnet}).carnet);
});
