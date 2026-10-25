/* Populate the institutional Word template locally; supporting signed forms are attached separately. */
(function(root){
  const documents=typeof module!=='undefined'&&module.exports?require('./documentos.js'):root.SIGPSDocuments;
  const contentKeys=['introduccion','desarrollo','resultados','conclusiones','recomendaciones'];
  const annexGuide=[
  {
    "nombre": "Formulario n.º 3 · Informe del 50 % del servicio social",
    "instruccion": "Completa un informe por alumno al alcanzar el 50 %: actividades, fechas, horarios, horas, dificultades y cumplimiento de objetivos. Gestiona las firmas del tutor, del responsable de la institución y del coordinador de la Subunidad. Adjunta el informe revisado y firmado."
  },
  {
    "nombre": "Formulario n.º 4 · Informe del 100 % del servicio social",
    "instruccion": "Completa un informe por alumno al finalizar las horas, con las actividades realizadas y el total respaldado por la asistencia. Incluye dificultades, objetivos y observaciones. Gestiona las firmas del tutor, de la institución y del coordinador de la Subunidad."
  },
  {
    "nombre": "Formulario n.º 5 · Supervisión y evaluación",
    "instruccion": "Entrega el modelo al tutor o supervisor de Proyección Social para que registre la supervisión y evaluación. Firma donde corresponde al alumno y solicita las firmas y sellos del tutor y del representante de la institución. Adjunta la ficha revisada."
  },
  {
    "nombre": "Carta n.º 3 · Constancia del docente tutor",
    "instruccion": "Solicita al docente tutor una constancia por alumno. Comprueba nombre, carnet, carrera, proyecto, institución, fechas y horas realizadas. El tutor debe emitirla y firmarla; adjunta la constancia con la firma y el sello correspondientes."
  },
  {
    "nombre": "Carta n.º 4 · Finalización, emitida por el subcoordinador",
    "instruccion": "Solicita a la Subunidad de Proyección Social la constancia de finalización de cada alumno. Revisa los datos, fechas y horas antes de incorporarla. Debe estar firmada y sellada por el coordinador de la Subunidad."
  },
  {
    "nombre": "Carta n.º 5 · Certificación (emitida después de la aprobación)",
    "instruccion": "La Unidad de Proyección Social emite esta certificación después de aprobar la memoria. Solicítala cuando corresponda y confirma con coordinación cuándo incorporarla al expediente. No la completes ni la firmes como si ya estuviera emitida."
  },
  {
    "nombre": "Carta n.º 6 · Finalización, emitida por la institución",
    "instruccion": "Pide a la institución la constancia de finalización en papel membretado, con los alumnos, proyecto, fechas y horas realizadas. Debe incluir nombre y firma del responsable y sello institucional. El modelo indica escribir los datos en letras."
  },
  {
    "nombre": "Formulario n.º 6 · Desempeño del estudiante",
    "instruccion": "Entrega una ficha por alumno al responsable de la institución: él evalúa tu desempeño. No llenes tu propia calificación. Gestiona también la firma y sello del tutor. El modelo solicita envío confidencial; coordina su entrega e incorporación sin alterar la evaluación."
  },
  {
    "nombre": "Formulario n.º 7 · Control de asistencia",
    "instruccion": "Imprime una hoja por alumno y llénala a mano durante el servicio social: fecha, actividad, hora de entrada, hora de salida y firma. Al completar las hojas, solicita el nombre, firma y sello del responsable institucional. Escanea todas las hojas en orden de fecha."
  },
  {
    "nombre": "Formulario n.º 8 · Formulario 3–5 para el MINED",
    "instruccion": "Completa todos los apartados por alumno: año, área, proyecto, localidades, objetivos, logros, fechas, beneficiarios, personal y presupuesto según su procedencia. Usa los datos reales del proyecto y revisa que coincidan con el cuadro resumen; confirma con el tutor cualquier dato que desconozcas."
  },
  {
    "nombre": "Perfil o anteproyecto de servicio social",
    "instruccion": "Adjunta el proyecto que presentaste y fue revisado, completo y con sus anexos. Incluye los cronogramas y cuadros correspondientes. Usa la versión aprobada por tus responsables, no un borrador generado sin revisión."
  },
  {
    "nombre": "Documentos de inscripción, incluida la carta de asignación del tutor",
    "instruccion": "Reúne la carta de solicitud de la institución, las hojas de inscripción, la asignación de tutor, las constancias de aprobación del plan y los respaldos académicos del expediente presentado. Incorpora los documentos de todos los alumnos con las firmas y sellos que correspondan."
  },
  {
    "nombre": "Solicitudes de prórroga, si corresponde",
    "instruccion": "Si presentaste solicitudes de prórroga a Proyección Social o Junta Directiva, adjúntalas al final junto con la respuesta, si la tienes. Una solicitud no demuestra que fue autorizada. Si no solicitaste prórroga, omite este apartado."
  }
];
  const annexes=annexGuide.map(item=>item.nombre);
  const annexIntro="Reúne los anexos en este orden. Completa los formularios, gestiona las firmas y sellos y escanea todas sus páginas de forma legible. Sustituye estas instrucciones por los documentos antes de entregar un único PDF.";
  const supportingGuidance="Si tu tutor llevó un Formulario n.º 2 de control de asesorías, reúne los registros firmados y confirma con coordinación dónde incorporarlos. Agrega fotografías, capturas u otras evidencias propias con una breve descripción de lo realizado; ubícalas antes de las prórrogas, si las hay.";
  const clean=x=>String(x??'').trim(),value=x=>clean(x)||'[Por completar]';
  const paragraphs=x=>value(x).split(/\r?\n/).filter(x=>x.trim()).map(text=>({text:text.trim()}));
  const date=x=>new Intl.DateTimeFormat('es-SV',{dateStyle:'long',timeZone:'UTC'}).format(new Date(x+'T12:00:00Z'));
  function payload(v,students=[]){
    const issues=documents.errors('memoria',v,[],students);
    if(Object.keys(issues).length)throw new Error('Revisa los datos de la memoria antes de generar el Word.');
    if(!students.length||students.length!==Number(v.cantidad))throw new Error('La cantidad de alumnos no coincide con el equipo.');
    const data=Object.fromEntries(Object.entries(v).map(([k,x])=>[k,value(x)]));
    for(const key of ['area','seccion','tutor','beneficiarios','objetivo','institucion','direccionInstitucion','procedenciaFondos'])data[key]=value(v[key]);
    data.nombreMemoria=value(v.titulo);
    data.autores=students.map(s=>({nombre:clean(s.nombre),carnet:clean(s.carnet)}));
    for(const key of contentKeys)data[key]=paragraphs(v[key]);
    data.resultadosResumen=value(v.logrosResumen||v.resultados);
    data.recursosResumen=`Humanos: ${value(v.humanos)}\nMateriales: ${value(v.materiales)}\nFinancieros: ${value(v.financieros)}`;
    for(const key of ['inicio','fin','entrega'])data[key]=date(v[key]);
    data.anexos=paragraphs(v.anexos);
    data.anexosOrden=annexGuide.map((item,i)=>({numero:i+1,...item}));
    for(const [i,item] of annexGuide.entries()){data['anexo'+(i+1)+'Nombre']=item.nombre;data['anexo'+(i+1)+'Instruccion']=item.instruccion;}
    data.anexosIndicaciones=annexIntro;
    data.respaldosIndicaciones=supportingGuidance;
    return data;
  }
  function generate(template,values,activities,students,dependencies){
    const PizZip=dependencies?.PizZip||root.PizZip,Docxtemplater=dependencies?.Docxtemplater||root.docxtemplater;
    if(typeof PizZip!=='function'||typeof Docxtemplater!=='function')throw new Error('No se pudo cargar el generador de Word. Vuelve a intentarlo.');
    const doc=new Docxtemplater(new PizZip(template),{paragraphLoop:true,linebreaks:true,nullGetter(part){throw new Error('Falta la variable de plantilla: '+part.value);}});
    doc.render(payload(values,students));
    return doc.getZip().generate({type:'uint8array',compression:'DEFLATE'});
  }
  const api={generate,payload,annexes,annexGuide,annexIntro,supportingGuidance,contentKeys};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSMemoriaDocumento=api;
})(typeof window==='undefined'?globalThis:window);
