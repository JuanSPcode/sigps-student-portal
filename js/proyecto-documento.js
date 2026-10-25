/* Native Word output: data fills an editable institutional template, never an HTML imitation. */
(function(root){
  const documents=typeof module!=='undefined'&&module.exports?require('./documentos.js'):root.SIGPSDocuments;
  const schedule=typeof module!=='undefined'&&module.exports?require('./cronograma.js'):root.SIGPSCronograma;
  const contentKeys=['introduccion','problema','delimitacion','objetivo','especificos','metas','humanos','materiales','financieros'];
  const contentGuides={
    introduccion:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'En esta página debe redactar una breve descripción del proyecto de servicio social, presentando su naturaleza, justificación y las partes principales que lo componen. Debe especificar la ubicación espacio-temporal (dónde y en qué fechas se ejecutará) y detallar la población que será beneficiada de forma directa e indirecta. Se recomienda redactar de forma clara y formal en tercera persona o estilo impersonal, con una extensión habitual de 1 a 2 páginas.'
    ],
    problema:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'En esta página debe describir con claridad y objetividad la problemática, carencia o necesidad detectada en la institución, centro educativo o comunidad en la que intervendrán los estudiantes, y a la cual se pretende dar solución con el servicio social.',
      'Puede orientar su redacción respondiendo a las preguntas clave sugeridas por la normativa oficial de la UPS: ¿Cuál es el problema principal detectado y cuál es su entorno o contexto? ¿Quiénes consideran que es un problema y a qué personas o sectores afecta? ¿Cuáles son las causas conocidas de dicha necesidad? ¿Por qué es prioritario y factible resolverlo dentro del tiempo y recursos disponibles? ¿Cómo se pretende solucionar y qué beneficios concretos aportará la intervención?'
    ],
    delimitacion:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'En esta página debe redactar de forma clara, concreta y precisa los límites y alcances del problema seleccionado para el servicio social.',
      'Defina con exactitud el ámbito geográfico o espacial (comunidad, dependencia, laboratorio o institución específica), el límite temporal (período exacto de desarrollo) y el grupo poblacional o sector específico que será atendido. Aclare explícitamente qué aspectos del problema serán resueltos por el equipo de estudiantes y qué aspectos quedan fuera del alcance del proyecto, garantizando que los compromisos adquiridos sean alcanzables dentro de las horas requeridas por su carrera.'
    ],
    objetivo:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'Redacte un único objetivo general que exprese con claridad el propósito central del proyecto. Debe reflejar tanto la necesidad detectada como la solución global que se brindará. Inicie obligatoriamente con un verbo en infinitivo (por ejemplo: Diseñar, Desarrollar, Implementar, Capacitar, Elaborar) respondiendo a las preguntas: ¿Qué se hará?, ¿Cómo se hará? y ¿Para qué o para quiénes se hará?'
    ],
    especificos:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'Formule entre 2 y 4 objetivos específicos que desglosen secuencial o lógicamente las etapas necesarias para dar cumplimiento al objetivo general.',
      'Cada objetivo específico debe comenzar con un verbo en infinitivo, ser medible y alcanzable en los plazos previstos, cubriendo típicamente las siguientes etapas: 1. Diagnóstico o levantamiento de requerimientos iniciales; 2. Diseño o formulación técnica de la solución o intervención; 3. Ejecución, desarrollo o implementación de las actividades planificadas; 4. Evaluación, validación o capacitación sobre los resultados alcanzados.'
    ],
    metas:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'En esta página debe expresar de manera cuantitativa, medible y verificable los resultados esperados a partir de los objetivos planteados. Traduzca los objetivos cualitativos a cantidades numéricas concretas e indicadores verificables dentro del período de ejecución del proyecto.',
      'Ejemplos de metas medibles: capacitar a un total de [X] personas en [tema del proyecto]; elaborar y entregar [X] manuales, guías o documentos técnicos institucionales; desarrollar y desplegar [X] módulos funcionales del sistema o solución técnica; realizar [X] jornadas de mantenimiento o trabajo comunitario con [X] % de cobertura.'
    ],
    humanos:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'Detalle a todas las personas que intervendrán directamente en la planificación y ejecución del proyecto: el docente tutor (indicando nombre completo y rol de asesoría técnica y supervisión académica), los estudiantes prestadores de servicio social (con nombre, carnet, carrera y funciones asignadas), el personal institucional de enlace y miembros de la comunidad o beneficiarios participantes.'
    ],
    materiales:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'Detalle los equipos, herramientas, software, bibliografía, papelería, mobiliario e insumos necesarios para ejecutar cada actividad del proyecto. Especifique con claridad qué recursos serán provistos por la institución o comunidad sede y cuáles deberán ser aportados o gestionados por los estudiantes.'
    ],
    financieros:[
      '[Por completar] Indicación: Borre este texto de orientación antes de entregar el documento final.',
      'Presente el presupuesto estimado para la realización del proyecto de servicio social y detalle con claridad la procedencia de los fondos requeridos (gastos en papelería, impresiones, transporte, insumos consumibles o licencias). Especifique si los gastos serán cubiertos mediante autogestión de los estudiantes, aporte de la institución receptora o donaciones. Nota de la normativa UPS: no debe incluirse el valor económico de bienes o equipos preexistentes que la institución facilite en calidad de préstamo.'
    ]
  };
  const annexes=[
    ['A','Documentos de inscripción','Adjuntar','El expediente firmado de todos los alumnos.'],
    ['B','Respaldos del proyecto','Adjuntar','Mapas, fotografías u otras evidencias, si corresponden.'],
    ['C','Cuadro resumen','Incluido','Se completa con los datos del formulario.'],
    ['D','Solicitud de la institución','Adjuntar','Carta firmada y sellada; consulta si basta referenciar la del Anexo A.']
  ];
  const clean=value=>String(value??'').trim();
  const value=text=>clean(text)||'[Por completar]';
  const paragraphs=text=>(clean(text)||'[Por completar]').split(/\r?\n/).filter(line=>line.trim()).map(text=>({text:text.trim()}));
  const contentParagraphs=(key,text)=>{
    const raw=clean(text);
    if(raw)return raw.split(/\r?\n/).filter(line=>line.trim()).map(line=>({text:line.trim()}));
    const guide=contentGuides[key];
    if(guide)return guide.flatMap(p=>p.split(/\r?\n/).filter(line=>line.trim()).map(line=>({text:line.trim()})));
    return [{text:'[Por completar]'}];
  };
  const date=text=>/^\d{4}-\d{2}-\d{2}$/.test(text||'')?new Intl.DateTimeFormat('es-SV',{dateStyle:'long',timeZone:'UTC'}).format(new Date(text+'T12:00:00Z')):'[Por completar]';
  function payload(v,activities=[],students=[]){
    const issues={...documents.errors('proyecto',v,[],students),...schedule.errors(students,v)};
    if(Object.keys(issues).length)throw new Error('Revisa los datos del proyecto antes de generar el Word.');
    if(!students.length||students.length!==Number(v.cantidad||1))throw new Error('La cantidad de alumnos no coincide con el equipo.');
    const authors=students.map(s=>({nombre:clean(s.nombre),carnet:clean(s.carnet)}));
    const data=Object.fromEntries(Object.entries(v).map(([k,val])=>[k,value(val)]));
    for(const key of contentKeys)data[key]=contentParagraphs(key,v[key]);
    data.anexos=clean(v.anexos)?paragraphs(v.anexos):[
      {text:'[Por completar] Indicación: Borre este texto al incorporar sus respaldos.'},
      {text:'Adjunte en este apartado los mapas, croquis, planos, fotografías de diagnóstico, oficios o instrumentos técnicos que sirvan como evidencia y respaldo de la propuesta. Cada documento debe estar debidamente rotulado con su título y fuente correspondiente.'}
    ];
    data.referencias=paragraphs(v.referencias);
    data.tieneReferencias=!!clean(v.referencias);
    data.tieneSeccion=!!clean(v.seccion);
    data.numero=clean(v.numero);
    data.autores=authors;
    data.participantes=authors.map(s=>`${s.nombre} · ${s.carnet}`).join('\n');
    data.participantesNombres=authors.map(s=>s.nombre).join('; ');
    data.inicio=date(v.inicio);data.fin=date(v.fin);data.entrega=date(v.entrega);
    data.periodo=data.inicio+' a '+data.fin;
    data.institucionDireccion=value(v.institucion)+' · '+value(v.direccionInstitucion);
    for(const key of ['tutor','area'])data[key]=value(v[key]);
    data.beneficiarios=clean(v.beneficiarios)||'[Por completar] Indicación: Borre esta nota y especifique la cantidad y tipo de población beneficiada directamente (ej. 150 estudiantes de bachillerato) e indirectamente (ej. familias de la comunidad).';
    data.cronogramaDetalle=schedule.detailsXML(students,v);
    data.cronogramaHoras=schedule.wordXML(students,v);
    data.totalHoras=String(v.horas);
    return data;
  }
  function generate(template,v,activities,students,dependencies){
    const PizZip=dependencies?.PizZip||root.PizZip;
    const Docxtemplater=dependencies?.Docxtemplater||root.docxtemplater;
    if(typeof PizZip!=='function'||typeof Docxtemplater!=='function')throw new Error('No se cargó el generador de Word. Conserva tus datos y vuelve a intentarlo.');
    const data=payload(v,activities,students);
    const doc=new Docxtemplater(new PizZip(template),{paragraphLoop:true,linebreaks:true,nullGetter(part){throw new Error('Falta la variable de plantilla: '+part.value);}});
    doc.render(data);
    return doc.getZip().generate({type:'uint8array',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  const api={generate,payload,annexes,contentKeys};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSProyectoDocumento=api;
})(typeof window==='undefined'?globalThis:window);
