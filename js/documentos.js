(function(root){
  const data=typeof module!=='undefined'&&module.exports?require('./procesos-data.js'):root.SIGPSProcessData;
  const areas=typeof module!=='undefined'&&module.exports?require('./areas-conocimiento.js'):root.SIGPSAreasConocimiento;
  const escape=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=(value)=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value.split('-').reverse().join('/'):String(value||'');
  function errors(stage,values,activities=[],students=[]){
    const result={};
    const fields=[...data.common.flatMap(s=>s.fields),...data.stages[stage].fields];
    for(const [key,label,type,required] of fields){
      if(key==='cantidad'&&!values[key]&&values.nombre)continue;
      if(key==='participantes')continue;
      const value=String(values[key]??'').trim();
      if(required&&!value)result[key]='Completa este campo.';
      else if(key==='cantidad'&&(!Number.isSafeInteger(Number(value))||Number(value)<1))result[key]='Indica una cantidad entera de alumnos, desde 1.';
      else if(value&&type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))result[key]='Escribe un correo válido.';
      else if(value&&type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))result[key]='Escribe una fecha válida.';
      else if(value&&type==='number'&&(!Number.isFinite(Number(value))||Number(value)<0))result[key]='Usa un número positivo o cero.';
    }
    if(stage!=='inscripcion'&&!values.fin)result.fin='Indica cuándo finaliza el proyecto.';
    if(stage!=='inscripcion'&&String(values.area??'').trim()&&!areas.options().some(area=>area.nombre===String(values.area).trim()))result.area='Selecciona un área de la lista.';
    if(values.fin&&values.inicio&&values.fin<values.inicio)result.fin='La finalización no puede ser anterior al inicio.';
    if(stage==='inscripcion'&&values.porcentaje!==undefined&&(!Number.isFinite(Number(values.porcentaje))||Number(values.porcentaje)<0||Number(values.porcentaje)>100))result.porcentaje='Usa un porcentaje entre 0 y 100.';
    if(Array.isArray(students)&&students.length>0){
      const seen=new Set();
      students.forEach((s,i)=>{
        if(!s.nombre)result[`alumno-${i}-nombre`]=`Completa el nombre del alumno ${i+1}.`;
        if(!s.carnet)result[`alumno-${i}-carnet`]=`Completa el carnet del alumno ${i+1}.`;
        const c=String(s.carnet||'').trim().toLocaleUpperCase();
        if(c){
          if(seen.has(c))result[`alumno-${i}-carnet`]=`El carnet del alumno ${i+1} ya aparece en otro integrante.`;
          seen.add(c);
        }
      });
    }
    activities.forEach((a,i)=>{
      if(a.inicio&&a.fin&&a.fin<a.inicio)result['actividad-'+i]='Revisa las fechas de la actividad '+(i+1)+'.';
      if(a.horas!==''&&(!Number.isFinite(Number(a.horas))||Number(a.horas)<0))result['actividad-'+i]='Las horas de la actividad '+(i+1)+' deben ser un número positivo o cero.';
      if(a.inicio&&values.inicio&&a.inicio<values.inicio||a.fin&&values.fin&&a.fin>values.fin)result['actividad-'+i]='La actividad '+(i+1)+' debe estar dentro de las fechas del proyecto.';
    });
    return result;
  }
  const printCSS=`@page{size:A4;margin:20mm}*{box-sizing:border-box}body{margin:0;color:#18212b;font:11pt/1.55 Arial,sans-serif;background:#eef0f2}.toolbar{position:sticky;top:0;background:#fff;padding:12px 20px;border-bottom:1px solid #ccc;display:flex;flex-wrap:wrap;gap:10px;align-items:center}.toolbar button{padding:10px 14px;cursor:pointer}.toolbar span{font-size:12px}.paper{max-width:210mm;margin:24px auto;background:#fff;padding:20mm;box-shadow:0 3px 16px #0001}h1{font-size:20pt}h2{font-size:15pt}h3{font-size:12pt}.institution{text-align:center;font-weight:bold;font-size:10pt}.draft{color:#68515a;font-size:9pt}.editable{white-space:pre-wrap;overflow-wrap:anywhere;min-height:1.5em}.editable:focus{outline:2px solid #991b32}.cover{padding:30px 0}.row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.field{margin:12px 0}.field strong{display:block;font-size:10pt}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9pt}th,td{border:1px solid #ccc;padding:7px;vertical-align:top;overflow-wrap:anywhere}th{text-align:left;background:#f3f3f3}tr{break-inside:avoid}.signature{margin-top:52px;border-top:1px solid #333;padding-top:7px;text-align:center}.section{margin-top:32px}.pending{background:#fff7e6;padding:12px}a{color:inherit}@media(max-width:650px){.paper{margin:0;padding:20px}.row{grid-template-columns:1fr}.toolbar{position:static}}@media print{body{background:white}.toolbar{display:none}.paper{padding:0;margin:0;box-shadow:none;max-width:none}.section{break-before:page;margin-top:0}.field{break-inside:avoid}.pending{background:none}.editable:focus{outline:none}thead{display:table-header-group}h2,h3{break-after:avoid}}`;
  function build(stage,v,activities=[],students=[]){
    const s=data.stages[stage];
    const text=(value)=>`<div class="editable" contenteditable="plaintext-only">${escape(value||'Por completar')}</div>`;
    const field=(label,value)=>`<div class="field"><strong>${escape(label)}</strong>${text(value)}</div>`;
    const section=(title,value,id)=>`<section class="section" id="${id}"><h2>${escape(title)}</h2>${text(value)}</section>`;
    const institutional=`<p class="institution">UNIVERSIDAD DE EL SALVADOR<br>FACULTAD MULTIDISCIPLINARIA ORIENTAL<br>${escape(v.departamento)}${v.seccion?' · '+escape(v.seccion):''}<br>SUBUNIDAD DE PROYECCIÓN SOCIAL</p>`;
    let person='';
    let studentCount=1;
    if(Array.isArray(students)&&students.length>0){
      person=students.map(st=>`${st.nombre||'Por completar'} · ${st.carnet||'Por completar'} · ${v.carrera||'Por completar'}`).join('\n');
      studentCount=students.length;
    }else{
      person=`${v.nombre} · ${v.carnet} · ${v.carrera}${v.participantes?'\n'+v.participantes:''}`;
      studentCount=1+String(v.participantes||'').split('\n').filter(line=>line.trim()).length;
    }
    let body=institutional+`<p class="draft">BORRADOR PARA REVISIÓN · Preparado con la guía de ${escape(s.short.toLowerCase())}. Requiere revisión, firmas y anexos según corresponda.</p><h1>${escape(s.output)}</h1>`;
    if(stage==='inscripcion')throw new Error('La inscripción se genera desde la plantilla Word con SIGPSInscripcionDocumento.');
    {
      body+=`<div class="cover">`+field(stage==='memoria'?'Nombre de la memoria':'Nombre del proyecto',v.titulo)+
        field('Número de proyecto',v.numero||'Por asignar')+field('Ubicación e institución',v.institucion+' · '+v.direccionInstitucion)+
        field('Inicio y finalización',date(v.inicio)+' — '+date(v.fin))+field('Presentado por (nombre, carnet y carrera)',person)+
        field('Docente tutor',v.tutor)+`<div class="signature">Firma y sello del tutor</div>`+
        field('Unidad responsable','Unidad de Proyección Social y Subunidades de Proyección Social')+field('Lugar y fecha de entrega',v.lugar+', '+date(v.entrega))+`</div>`;
      const sections=stage==='proyecto'?[['Introducción','introduccion'],['Identificación del problema','problema'],['Delimitación del problema','delimitacion'],['Objetivo general','objetivo'],['Objetivos específicos','especificos'],['Metas','metas'],['Recursos humanos','humanos'],['Recursos materiales','materiales'],['Recursos financieros','financieros']]:[['Introducción','introduccion'],['Desarrollo','desarrollo'],['Resultados','resultados'],['Conclusiones','conclusiones'],['Recomendaciones','recomendaciones']];
      body+=`<section class="section"><h2>Índice</h2><p class="draft">Comprueba la paginación después de completar el contenido y agregar los anexos.</p><ol>`+sections.map(([title,id])=>`<li><a href="#${id}">${escape(title)}</a></li>`).join('')+(stage==='proyecto'?'<li><a href="#cronograma">Cronogramas</a></li>':'')+`<li><a href="#resumen">Cuadro resumen</a></li><li><a href="#anexos">Anexos</a></li></ol></section>`;
      body+=sections.map(([title,id])=>section(title,v[id],id)).join('');
      if(stage==='proyecto'){
        const rows=activities.length?activities:[{}];
        const table=(heads,keys)=>`<table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(a=>`<tr>${keys.map(k=>`<td>${text(k==='inicio'||k==='fin'?date(a[k]):a[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        body+=`<section class="section" id="cronograma"><h2>Cronograma de actividades</h2>`+table(['Actividad','Metodología','Responsable','Recursos','Inicio','Fin'],['actividad','metodologia','responsable','recursos','inicio','fin'])+`</section><section class="section"><h2>Distribución de horas por período</h2><p>Corresponde a las mismas actividades del cronograma. Puedes repetir una actividad en distintos períodos.</p>`+table(['Actividad','Inicio','Fin','Horas'],['actividad','inicio','fin','horas'])+`<p>Total planificado: ${activities.reduce((sum,a)=>sum+(Number(a.horas)||0),0)} horas.</p></section>`;
      }
      body+=`<section class="section" id="resumen"><h2>Cuadro resumen</h2>`+
        field('Nombre',v.titulo)+field('Área de conocimiento',v.area)+field('Participantes y carreras',person)+field('Número de estudiantes',String(studentCount))+
        field('Inicio y finalización',date(v.inicio)+' — '+date(v.fin))+field('Población beneficiada y cantidad',v.beneficiarios)+field('Lugar',v.direccionInstitucion)+field('Objetivos',v.objetivo)+(stage==='memoria'?field('Logros',v.resultados):'')+field('Recursos humanos',v.humanos)+field('Recursos materiales',v.materiales)+field('Recursos financieros y procedencia de fondos',v.financieros)+`</section>`;
      body+=section('Relación de anexos',v.anexos,'anexos')+`<p class="pending">Los archivos de respaldo no se adjuntan desde este formulario. Incorpora los anexos, escaneos, firmas y sellos al expediente final.</p><ul>${s.documents.map(([t])=>`<li>${escape(t)}</li>`).join('')}</ul>`;
    }
    body+=`<p class="draft">Referencia: ${escape(s.source)} El portal prepara documentos; la revisión y aprobación corresponden a las autoridades del proceso.</p>`;
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(s.output)}</title><style>${printCSS}</style></head><body><div class="toolbar"><button type="button" onclick="window.print()">Imprimir / guardar PDF</button><button type="button" id="save">Guardar cambios en HTML</button><span>Los textos son editables. Revisa el contenido antes de imprimir.</span></div><main class="paper">${body}</main><script>document.getElementById('save').addEventListener('click',function(){const file=new Blob(['<!doctype html>'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download='${stage}-editado.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});</script></body></html>`;
  }
  const api={escape,date,errors,build};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSDocuments=api;
})(typeof window==='undefined'?globalThis:window);
