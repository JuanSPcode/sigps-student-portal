/* The DOCX is the design authority. Values replace tags; no HTML-to-Word conversion. */
(function(root){
  const schedule=typeof module!=='undefined'&&module.exports?require('./inscripcion-horarios.js'):root.SIGPSInscripcionHorarios;
  const financingOptions=['Gobierno Nacional','Gobierno Internacional','Empresa Privada Nacional','Empresa Privada Internacional','Propios de Institución','Propios del Estudiante'];
  const emissionPlace='Ciudad Universitaria de Oriente';
  function defaults(now=new Date()){return {financiamiento:'Propios del Estudiante',entrega:`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`};}
  const institutionalEmail=carnet=>String(carnet||'').trim().toLowerCase()+'@ues.edu.sv';
  const studentFields=[
    ['nombre','Nombre completo','text',true,100],['carnet','Carnet','text',true,24],
    ['direccion','Dirección completa del estudiante','text',true,200],
    ['fijo','Teléfono fijo','tel',false,24],['movil','Teléfono móvil','tel',true,24],
    ['porcentaje','Porcentaje de carrera cursada','number',true],
    ['disponibilidad','Disponibilidad semanal','schedule',true],
    ['observaciones','Observaciones del alumno','textarea',false,240]
  ];
  const teamFields=[['carrera','Carrera de todos los alumnos','text',true,100],['codigo','Código de carrera','text',false,20],['cantidad','¿Cuántos alumnos participarán en el proyecto?','number',true],['departamento','Departamento académico','text',true,100],['seccion','Sección académica (si aplica)','text',false,100]];
  const projectFields=[
    ['titulo','Nombre del proyecto o plan de trabajo','text',true,180],
    ['institucion','Comunidad o institución receptora','text',true,150],
    ['direccionInstitucion','Dirección de la institución','text',true,200],
    ['lugarEjecucion','Lugar donde se ejecutará el proyecto','text',true,160],
    ['responsable','Nombre del responsable de la institución','text',false,100],
    ['telefonoInstitucion','Teléfono de la institución','tel',false,24],
    ['aportes','¿Qué proporcionará la institución?','textarea',false,500],
    ['inicio','Fecha de inicio','date',true],['fin','Fecha de finalización','date',true],
    ['tutor','Nombre del tutor asignado','text',false,100],['coordinador','Nombre del coordinador','text',false,100],
    ['destinatario','Nombre de quien recibe la carta de solicitud','text',false,100],
    ['costos','Costo del proyecto (USD)','number',false],['financiamiento','Fuente de financiamiento','select',true],
    ['horas','Horas estimadas por alumno','number',true],
    ['entrega','Fecha del documento','date',true]
  ];
  const dateValid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  function validate(fields,v){
    const out={};
    for(const [key,label,type,required,max] of fields){
      if(type==='schedule'){const message=schedule.validate(v[key]);if(message)out[key]=message;continue;}
      if(fields===projectFields&&!v.incluirCartaInstitucion&&['aportes','destinatario'].includes(key))continue;
      const s=String(v[key]??'').trim();
      if(required&&!s)out[key]='Completa este dato.';
      else if(key==='carnet'&&s&&!/^[a-z0-9._-]+$/i.test(s))out[key]='Escribe solo tu carnet, sin espacios ni @ues.edu.sv.';
      else if(key==='financiamiento'&&s&&!financingOptions.includes(s))out[key]='Selecciona una fuente de la lista.';
      else if(max&&s.length>max)out[key]=`Usa hasta ${max} caracteres para este campo de la plantilla.`;
      else if(s&&type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))out[key]='Escribe un correo válido.';
      else if(s&&type==='date'&&!dateValid(s))out[key]='Escribe una fecha válida.';
      else if(s&&type==='number'&&(!Number.isFinite(Number(s))||Number(s)<0))out[key]='Usa un número positivo o cero.';
    }
    if(fields===teamFields&&(!Number.isSafeInteger(Number(v.cantidad))||Number(v.cantidad)<1))out.cantidad='Indica un número entero de alumnos, desde 1.';
    if(fields===studentFields&&v.porcentaje!==''&&v.porcentaje!=null&&(Number(v.porcentaje)<0||Number(v.porcentaje)>100))out.porcentaje='Usa un porcentaje entre 0 y 100.';
    if(fields===projectFields){
      if(v.horas!==''&&Number(v.horas)<=0)out.horas='Indica las horas previstas, mayores que cero.';
      if(dateValid(v.inicio||'')&&dateValid(v.fin||'')){
        const start=new Date(v.inicio+'T12:00:00Z');
        const min=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+3,1,12));
        const last=new Date(Date.UTC(min.getUTCFullYear(),min.getUTCMonth()+1,0)).getUTCDate();
        min.setUTCDate(Math.min(start.getUTCDate(),last));
        if(v.fin<v.inicio)out.fin='La fecha de finalización no puede ser anterior al inicio.';
        else if(v.fin<min.toISOString().slice(0,10))out.fin='La carta de solicitud indica una duración mínima de tres meses.';
      }
    }
    return out;
  }
  const date=s=>dateValid(s||'')?new Intl.DateTimeFormat('es-SV',{dateStyle:'long',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z')):'________________';
  function numberWords(n){
    const small=['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve'];
    if(n<30)return small[n];
    if(n<100)return ['','','','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'][Math.floor(n/10)]+(n%10?' y '+small[n%10]:'');
    if(n===100)return 'cien';
    if(n<1000)return ['','ciento','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'][Math.floor(n/100)]+(n%100?' '+numberWords(n%100):'');
    return (Math.floor(n/1000)===1?'mil':small[Math.floor(n/1000)]+' mil')+(n%1000?' '+numberWords(n%1000):'');
  }
  function emissionDate(value){
    if(!dateValid(value||''))return '';
    const [year,month,day]=value.split('-').map(Number);
    const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${emissionPlace} ${day===1?'al día 1':`a los ${day} días`} del mes de ${months[month-1]} del año ${numberWords(year)}.`;
  }
  function failure(code,message){const error=new Error(message);error.code=code;return error;}
  function payload(project,students){
    project={...defaults(),...project};
    if(project.catalogoAcademico){
      const snapshot=project.catalogoAcademico;
      if(['id_departamento','id_carrera','departamento','carrera','horas'].some(key=>String(project[key])!==String(snapshot[key]))||Number(snapshot.horas)<=0){
        throw failure('DATOS_PROYECTO','Vuelve a seleccionar la carrera para confirmar sus datos y horas.');
      }
    }
    if(Object.keys(validate(teamFields,project)).length||Object.keys(validate(projectFields,project)).length)throw failure('DATOS_PROYECTO','Revisa los datos del equipo y del proyecto.');
    if(students.length!==Number(project.cantidad)||students.some(s=>Object.keys(validate(studentFields,s)).length))throw failure('DATOS_ALUMNOS','Completa los datos de todos los alumnos.');
    if(students.some(s=>s.carrera&&s.carrera.trim().toLocaleLowerCase()!==project.carrera.trim().toLocaleLowerCase()))throw failure('CARRERAS_DISTINTAS','Todos los alumnos del proyecto deben pertenecer a la misma carrera.');
    const seen=new Set();
    for(const s of students){const key=s.carnet.trim().toLocaleUpperCase();if(seen.has(key))throw failure('CARNETS_REPETIDOS','Hay carnets repetidos. Revisa la lista de alumnos.');seen.add(key);}
    const clean=(fields,obj)=>Object.fromEntries(fields.filter(([, ,type])=>type!=='schedule').map(([key])=>[key,String(obj[key]??'').trim()||'________________']));
    const shared={...clean(teamFields,project),...clean(projectFields,project),institucionDireccion:project.institucion+'\n'+project.direccionInstitucion,fecha:date(project.entrega),lugar:emissionPlace,fechaEmision:emissionDate(project.entrega),inicio:date(project.inicio),fin:date(project.fin),periodo:date(project.inicio)+' a '+date(project.fin),solicitud_estudiantes:students.length===1?'1 estudiante apto':students.length+' estudiantes aptos',carreras:project.carrera.trim(),incluirCartaInstitucion:project.incluirCartaInstitucion===true,beneficiarios:'________________'};
    return {...shared,alumnos:students.map(s=>{
      const horarios=schedule.rows(s.disponibilidad,String(s.otros||'').trim());
      // The original availability table has three rows. Keep those blank slots for short schedules.
      while(horarios.length<3)horarios.push({horario:'',dias:'',otros:''});
      return {...shared,...clean(studentFields,s),email:institutionalEmail(s.carnet),horarios};
    })};
  }
  function generate(template,project,students,dependencies){
    const PizZip=dependencies?.PizZip||root.PizZip;
    const Docxtemplater=dependencies?.Docxtemplater||root.docxtemplater;
    const data=payload(project,students);
    if(typeof PizZip!=='function'||typeof Docxtemplater!=='function')throw failure('MOTOR_NO_DISPONIBLE','No se cargó el generador de Word.');
    let doc;
    try{
      doc=new Docxtemplater(new PizZip(template),{paragraphLoop:true,linebreaks:true,nullGetter(part){throw failure('PLANTILLA_DESACTUALIZADA','La plantilla y el generador no coinciden (variable: '+part.value+').');}});
      doc.render(data);
    }catch(error){if(error.code)throw error;throw failure('PLANTILLA_INVALIDA','La plantilla recibida no es un Word válido o contiene etiquetas incompatibles.');}
    const output=doc.getZip(), original=new PizZip(template);
    // This template only has tags in document.xml. Preserve every other part byte for byte.
    Object.entries(original.files).forEach(([name,file])=>{if(!file.dir&&name!=='word/document.xml')output.file(name,file.asUint8Array());});
    // Repeated logo drawings need unique nonvisual IDs in a valid Word package.
    let drawingId=0;
    output.file('word/document.xml',output.file('word/document.xml').asText().replace(/(<wp:docPr\b[^>]*\bid=")\d+(")/g,(_,a,b)=>a+(++drawingId)+b));
    return output.generate({type:'uint8array',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  function errorMessage(error){
    const messages={
      CARGA_PLANTILLA:'No se pudo cargar la plantilla incluida en el portal. Tus datos siguen en esta pestaña; vuelve a intentar preparar el Word.',
      PLANTILLA_INVALIDA:'El archivo de plantilla no es válido. Tus datos siguen en el formulario; informa este error para corregir la plantilla.',
      PLANTILLA_DESACTUALIZADA:'La plantilla y el generador son de versiones diferentes. Conserva tus datos antes de abrir la versión actualizada del portal.',
      MOTOR_NO_DISPONIBLE:'No pudimos iniciar la creación del Word. Conserva tus datos y vuelve a intentarlo.',
      ARCHIVO_LOCAL:'No se encontró la plantilla incluida. Comprueba que tienes la carpeta completa del portal o utiliza su versión publicada.'
    };
    if(['DATOS_PROYECTO','DATOS_ALUMNOS','CARNETS_REPETIDOS','CARRERAS_DISTINTAS'].includes(error?.code))return error.message+' Pulsa Editar datos; no necesitas rellenar todo otra vez.';
    return (messages[error?.code]||'El generador encontró un error inesperado. Tus datos siguen en esta pestaña. Informa el código para revisarlo.')+' Código: '+(Object.hasOwn(messages,error?.code)?error.code:'GENERACION_FALLIDA')+'.';
  }
  const api={institutionalEmail,financingOptions,emissionPlace,emissionDate,defaults,studentFields,teamFields,projectFields,validate,payload,generate,failure,errorMessage};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSInscripcionDocumento=api;
})(typeof window==='undefined'?globalThis:window);
