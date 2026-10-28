document.addEventListener('DOMContentLoaded',()=>{
  const {common,stages}=window.SIGPSProcessData;
  const {escape,errors,build}=window.SIGPSDocuments;
  const schedule=window.SIGPSCronograma;
  const $=id=>document.getElementById(id);
  // Personal data stays in memory; each stage keeps its own draft while this page is open.
  const drafts={};
  let scheduleStudent=0;
  let stage='inscripcion', step=0, activeStudent=0, values={cantidad:'1'}, students=[{}], activities=[], generated='', downloadURL='', demoCount=0;
  const contentStep=()=>stage==='proyecto'?4:3;
  const reviewStep=()=>contentStep()+1;
  const catalogAPI=window.SIGPSCatalogoAcademico, usesCatalog=Boolean(window.SIGPSApiConfig.localCatalog||window.SIGPSApiConfig.baseURL);
  let storage;try{storage=window.localStorage;}catch{}
  const catalogClient=catalogAPI.createClient({baseURL:window.SIGPSApiConfig.baseURL,localCatalog:window.SIGPSApiConfig.localCatalog,storage});
  let catalogState=null,catalogLoading=false,catalogError='';
  async function loadCatalog(){
    if(catalogLoading)return;
    catalogLoading=true;catalogError='';
    if(!$('builder').hidden&&step===0)renderForm(false);
    try{catalogState=await catalogClient.load();}catch(error){catalogError=error.message;}
    finally{
      catalogLoading=false;
      if(!$('builder').hidden&&step===0){saveFields();renderForm(false);}
    }
  }
  function academicErrors(){
    if(!usesCatalog)return {};
    try{
      if(!catalogState)throw new Error(catalogLoading?'Espera a que carguen las carreras.':catalogError||'Carga el catálogo para continuar.');
      const selected=catalogAPI.snapshot(catalogState.catalog,values.id_departamento,values.id_carrera,catalogState);
      Object.assign(values,selected,{catalogoAcademico:selected});
      return {};
    }catch(error){return {id_carrera:error.message};}
  }
  function academicFields(){
    return catalogAPI.renderFields({state:catalogState,values,loading:catalogLoading,error:catalogError,esc:escape,prefix:'field',dataAttribute:'data-field',errorPrefix:'error-',retryId:'process-catalog-retry'});
  }


  function saveFields(){
    $('document-form').querySelectorAll('[data-field]').forEach(el=>values[el.dataset.field]=el.value.trim());
    if(step===1){
      students[activeStudent]=students[activeStudent]||{};
      $('document-form').querySelectorAll('[data-student-field]').forEach(el=>{
        students[activeStudent][el.dataset.studentField]=el.value.trim();
      });
    }
    const count=Number(values.cantidad);
    if(Number.isSafeInteger(count)&&count>0&&students.length>count)students.length=count;
    if(students[0]){
      values.nombre=students[0].nombre||'';
      values.carnet=students[0].carnet||'';
    }
    values.participantes=students.slice(1).map(s=>`${s.nombre||''} · ${s.carnet||''} · ${values.carrera||''}`).join('\n');
    if(stage==='proyecto'&&step===3){
      const config=studentSchedule();
      $('document-form').querySelectorAll('[data-activity]').forEach(el=>{
        const a=config.actividades[Number(el.dataset.activity)];if(a)a[el.dataset.key]=el.value.trim();
      });
      $('document-form').querySelectorAll('[data-day]').forEach(el=>config.dias[Number(el.dataset.day)]=el.value.trim());
    }
  }

  function studentSchedule(){
    scheduleStudent=Math.min(scheduleStudent,students.length-1);
    const s=students[scheduleStudent];
    return s.cronograma||(s.cronograma={dias:[0,0,0,0,0,0,0],actividades:[]});
  }

  function progress(){
    const headings=stage==='proyecto'?['Equipo','Alumnos','Tu proyecto','Actividades y horas','Contenido','Revisión']:['Equipo','Alumnos','Tu proyecto','Contenido','Revisión'];
    $('form-progress').classList.toggle('project-progress',stage==='proyecto');
    $('form-progress').innerHTML=headings.map((title,i)=>`<li${i===step?' aria-current="step"':''}>${i+1}. ${title}</li>`).join('');
    $('step-count').textContent=`Paso ${step+1} de ${headings.length}`;
  }

  function fieldHTML([key,label,type,required], dataObj=values, prefix='field'){
    if(key==='fin'&&stage!=='inscripcion')required=true;
    const value=escape(dataObj[key]||'');
    const dataAttr=prefix==='student'?`data-student-field="${key}"`:`data-field="${key}"`;
    const attrs=`id="${prefix}-${key}" name="${key}" ${dataAttr} aria-describedby="error-${key}" ${required?'required':''}`;
    const numeric=key==='cantidad'?'min="1" step="1"':type==='number'?'min="0" max="100" step="0.01"':'';
    return `<div class="form-field ${type==='textarea'?'wide':''}"><label for="${prefix}-${key}">${escape(label)} ${required?'*':'<span>Opcional</span>'}</label>`+
      (key==='area'?`<select ${attrs}><option value="">Selecciona un área</option>${window.SIGPSAreasConocimiento.options().map(area=>`<option value="${escape(area.nombre)}" ${area.nombre===dataObj[key]?'selected':''}>${escape((area.codigo?area.codigo+' · ':'')+area.nombre)}</option>`).join('')}</select>`:type==='textarea'?`<textarea ${attrs} rows="4">${value}</textarea>`:`<input ${attrs} type="${type}" value="${value}" ${numeric} ${type==='text'?'maxlength="300"':''}>`)+
      `<span class="field-error" id="error-${key}"></span></div>`;
  }

  function renderForm(focus=true){
    progress();$('form-errors').hidden=true;$('document-form').hidden=false;$('document-preview').hidden=true;
    const demoNotice=$('builder-demo-notice');
    if(demoNotice){
      demoNotice.hidden=!(demoCount||(usesCatalog&&window.SIGPSApiConfig.notice));
      demoNotice.textContent=demoCount?`Ejemplo de ${demoCount} ${demoCount===1?'alumno':'alumnos'} · No válido para entrega.`:(usesCatalog?window.SIGPSApiConfig.notice||'':'');
    }
    if(stage==='proyecto')values.lugar='Ciudad Universitaria de Oriente';
    const count=Math.max(1,Number(values.cantidad)||1);
    if(Number.isSafeInteger(count)&&count>0&&students.length>count)students.length=count;
    activeStudent=Math.min(activeStudent,count-1);

    if(step===0){
      $('builder-title').textContent=`Equipo · ${stages[stage].short}`;
      const intro='Todos los integrantes deben ser de la misma carrera.'+(!usesCatalog?' Catálogo pendiente de conexión: completa los datos manualmente.':'');
      $('form-fields').innerHTML=`<p class="form-intro">${escape(intro)} Los campos con * son obligatorios.</p><div class="form-grid">${usesCatalog?academicFields():''}${common[0].fields.filter(f=>f[0]!=='codigo'&&!(usesCatalog&&['carrera','departamento'].includes(f[0]))).map(f=>fieldHTML(f,values,'field')).join('')}</div>`;
      $('previous-step').hidden=true;
      $('next-step').textContent='Continuar a Alumnos →';
    }else if(step===1){
      $('builder-title').textContent=count>1?`Datos del alumno ${activeStudent+1} de ${count} · ${stages[stage].short}`:`Datos del alumno · ${stages[stage].short}`;
      const intro=count>1?'Completa los datos de cada estudiante tal como aparecen en sus documentos. Todos los alumnos compartirán la carrera y departamento definidos en Equipo.':'Completa los datos del estudiante. La carrera y departamento se definieron en el paso anterior.';
      const selector=count>1?`<div class="form-field wide"><label for="process-student-select">Revisar otro alumno</label><select id="process-student-select">${Array.from({length:Math.min(students.length,count)},(_,i)=>`<option value="${i}" ${i===activeStudent?'selected':''}>Alumno ${i+1}${students[i]?.nombre?' · '+escape(students[i].nombre):''}</option>`).join('')}</select></div>`:'';
      $('form-fields').innerHTML=`<p class="form-intro">${escape(intro)} Los campos con * son obligatorios.</p>${selector}<div class="form-grid">${common[1].fields.map(f=>fieldHTML(f,students[activeStudent]||{},'student')).join('')}</div><p class="small-copy" style="margin-top:16px">Carrera asignada: <strong>${escape(values.carrera||'Por definir')}</strong> (${escape(values.departamento||'Por definir')})</p>`;
      $('previous-step').hidden=false;
      $('next-step').textContent=activeStudent<count-1?'Guardar y siguiente alumno →':'Continuar a Tu proyecto →';
    }else if(step===2){
      $('builder-title').textContent=`Tu proyecto · ${stages[stage].short}`;
      const intro='Ingresa los datos generales del proyecto y la institución. Las fechas deben corresponder a tu proyecto.';
      const allProjectFields=window.SIGPSProcessData.projectFieldsFor(stage).filter(f=>stage!=='proyecto'||f[0]!=='lugar');
      const generalKeys=['titulo','numero','area','institucion','direccionInstitucion','telefonoInstitucion','responsable'];
      const f1=allProjectFields.filter(f=>generalKeys.includes(f[0]));
      const f2=allProjectFields.filter(f=>!generalKeys.includes(f[0]));
      $('form-fields').innerHTML=`<p class="form-intro">${escape(intro)} Los campos con * son obligatorios.</p>
        <div class="form-section-card">
          <h3 class="form-section-title">1. Proyecto e Institución receptora</h3>
          <div class="form-grid">${f1.map(f=>fieldHTML(f,values,'field')).join('')}</div>
        </div>
        <div class="form-section-card">
          <h3 class="form-section-title">2. Plazos y Docente Tutor</h3>
          <div class="form-grid">${f2.map(f=>fieldHTML(f,values,'field')).join('')}</div>
        </div>`;
      $('previous-step').hidden=false;
      $('next-step').textContent=stage==='proyecto'?'Continuar a Actividades y horas →':'Continuar a Contenido →';
    }else if(stage==='proyecto'&&step===3){
      $('builder-title').textContent='Actividades y horas por semana';
      $('form-fields').innerHTML=schedule.editor(students,Math.min(scheduleStudent,students.length-1),values);
      $('previous-step').hidden=false;
      $('next-step').textContent='Continuar a Contenido →';
    }else if(step===contentStep()){
      $('builder-title').textContent=`Contenido · ${stages[stage].short}`;
      let intro=stage==='memoria'?'Completa las secciones de tu memoria. Lo que dejes en blanco aparecerá como «Por completar» en el Word.':'Puedes redactar las secciones principales ahora o completarlas luego en Word.';
      const contentFields=window.SIGPSProcessData.contentFieldsFor(stage);
      let sectionsHTML='';
      if(stage==='proyecto'){
        const g1=contentFields.filter(f=>['introduccion','problema','delimitacion'].includes(f[0]));
        const g2=contentFields.filter(f=>['objetivo','especificos','metas'].includes(f[0]));
        const g3=contentFields.filter(f=>['humanos','materiales','financieros'].includes(f[0]));
        const g4=contentFields.filter(f=>['referencias','anexos'].includes(f[0]));
        sectionsHTML=`
          <div class="form-section-card"><h3 class="form-section-title">1. Diagnóstico y Justificación</h3><div class="form-grid">${g1.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
          <div class="form-section-card"><h3 class="form-section-title">2. Objetivos y Metas</h3><div class="form-grid">${g2.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
          <div class="form-section-card"><h3 class="form-section-title">3. Recursos y Presupuesto</h3><div class="form-grid">${g3.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
          <div class="form-section-card"><h3 class="form-section-title">4. Respaldos y Referencias</h3><div class="form-grid">${g4.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
        `;
      }else{
        const g1=contentFields.filter(f=>['introduccion','desarrollo'].includes(f[0]));
        const g2=contentFields.filter(f=>['resultados','conclusiones','recomendaciones'].includes(f[0]));
        const g3=contentFields.filter(f=>['humanos','materiales','financieros','procedenciaFondos'].includes(f[0]));
        const g4=contentFields.filter(f=>['anexos'].includes(f[0]));
        sectionsHTML=`
          <div class="form-section-card"><h3 class="form-section-title">1. Introducción y Desarrollo</h3><div class="form-grid">${g1.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
          <div class="form-section-card"><h3 class="form-section-title">2. Resultados y Conclusiones</h3><div class="form-grid">${g2.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
          <div class="form-section-card"><h3 class="form-section-title">3. Recursos y Presupuesto</h3><div class="form-grid">${g3.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
          <div class="form-section-card"><h3 class="form-section-title">4. Relación de Anexos</h3><div class="form-grid">${g4.map(f=>fieldHTML(f,values,'field')).join('')}</div></div>
        `;
      }
      $('form-fields').innerHTML=`<p class="form-intro">${escape(intro)}</p>${sectionsHTML}`;
      $('previous-step').hidden=false;
      $('next-step').textContent='Preparar Word →';
    }
    if(focus)$('builder-title').focus();
  }

  function showErrors(all){
    const keys=Object.keys(all);if(!keys.length)return false;
    const findLabel=(key)=>{
      if(key.startsWith('cronograma-'))return 'Cronograma del alumno '+(Number(key.split('-')[1])+1);
      if(key.startsWith('actividad-'))return 'Actividad '+(Number(key.split('-')[1])+1);
      if(key==='id_carrera')return 'Carrera';
      if(key==='id_departamento')return 'Departamento';
      for(const s of common)for(const f of s.fields)if(f[0]===key)return f[1];
      for(const f of stages[stage].fields)if(f[0]===key)return f[1];
      return key;
    };
    $('form-errors').innerHTML='<strong>Revisa estos datos para continuar</strong><ul>'+keys.map(key=>{
      const href=key.startsWith('cronograma-')?'schedule-editor':key.startsWith('actividad-')?key:document.getElementById('student-'+key)?'student-'+key:'field-'+key;
      return `<li><a href="#${href}">${escape(all[key])} — ${escape(findLabel(key))}</a></li>`;
    }).join('')+'</ul>';
    $('form-errors').hidden=false;
    keys.forEach(key=>{
      if($('error-'+key))$('error-'+key).textContent=all[key];
      if($('student-'+key))$('student-'+key).setAttribute('aria-invalid','true');
      if($('field-'+key))$('field-'+key).setAttribute('aria-invalid','true');
    });
    keys.filter(key=>key.startsWith('actividad-')).forEach(key=>{if($(key))$(key).open=true;});
    $('form-errors').focus();return true;
  }

  function validStudents(){
    const count=Math.max(1,Number(values.cantidad)||1);
    const seen=new Set();
    for(let i=0;i<count;i++){
      const s=students[i]||{};
      if(!s.nombre||!s.carnet){
        activeStudent=i;
        renderForm();
        showErrors({[!s.nombre?'nombre':'carnet']:'Completa este campo para todos los alumnos.'});
        return false;
      }
      const carnetUpper=String(s.carnet).trim().toLocaleUpperCase();
      if(seen.has(carnetUpper)){
        activeStudent=i;
        renderForm();
        showErrors({carnet:'Este carnet ya aparece en otro alumno del equipo.'});
        return false;
      }
      seen.add(carnetUpper);
    }
    return true;
  }

  function preview(){
    const isProject=stage==='proyecto',isWord=isProject||stage==='memoria';
    let file;
    try{
      if(isWord){
        const template=Uint8Array.from(atob(isProject?window.SIGPSProyectoPlantilla:window.SIGPSMemoriaPlantilla),c=>c.charCodeAt(0));
        const generator=isProject?window.SIGPSProyectoDocumento:window.SIGPSMemoriaDocumento;
        file=new Blob([generator.generate(template,values,activities,students)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
        generated='';
      }else{
        generated=build(stage,values,activities,students);
        file=new Blob([generated],{type:'text/html;charset=utf-8'});
      }
    }catch(error){
      $('form-errors').textContent='No se pudo preparar el Word. '+error.message;
      $('form-errors').hidden=false;$('document-form').hidden=false;$('document-preview').hidden=true;
      $('form-errors').focus();return;
    }
    if(downloadURL)URL.revokeObjectURL(downloadURL);
    downloadURL=URL.createObjectURL(file);
    $('download-document').href=downloadURL;
    $('download-document').download=`${stage}-servicio-social.${isWord?'docx':'html'}`;
    $('download-document').textContent=isProject?'Descargar proyecto (.docx)':'Descargar memoria (.docx)';
    $('print-document').hidden=isWord;
    $('preview-frame').hidden=isWord;
    $('project-review').hidden=!isWord;
    $('document-format-note').textContent=isWord?'El Word es independiente. El índice permite ir a cada sección; revisa el contenido y agrega tus anexos antes de entregar.':'La descarga es un archivo HTML: ábrelo en el navegador, edita los textos y guarda los cambios o imprime. Funciona sin conexión.';
    if(isProject){
      const pending=window.SIGPSProyectoDocumento.contentKeys.filter(k=>!values[k]).map(k=>stages.proyecto.fields.find(f=>f[0]===k)?.[1]||k);

      $('project-review').innerHTML=`<section class="review-project"><h3>${escape(values.titulo)}</h3><p>${students.length} ${students.length===1?'alumno':'alumnos'} · ${escape(values.carrera)}</p></section><div class="schedule-tools"><button type="button" id="edit-schedule" class="flow-button secondary">Revisar cronogramas · ${students.length} ${students.length===1?'alumno':'alumnos'}</button></div><section class="review-documents"><h3>Anexos, en este orden</h3><ol class="review-document-list">${window.SIGPSProyectoDocumento.annexes.map(([id,title,state,note])=>`<li><div><strong>Anexo ${id} · ${escape(title)}</strong><span>${escape(note)}</span></div><span class="review-badge">${state}</span></li>`).join('')}</ol><p class="review-hint">Sustituye las hojas guía por tus anexos antes de entregar.</p></section><details class="review-details"><summary>Formato y revisión final</summary><p>Portada institucional editable; cuerpo con Times New Roman 12, márgenes de 2.54 cm, interlineado doble, sangría de 1.27 cm y páginas numeradas. Los cronogramas se presentan en horizontal.</p><p>La portada y el orden de secciones siguen la guía UPS. Revisa tus citas y referencias con el tutor; el sistema no las valida.</p><p>Gestiona las firmas y sellos y entrega un único PDF escaneado según la guía.</p>${pending.length?`<p><strong>Por completar:</strong> ${pending.map(escape).join('; ')}.</p>`:''}</details>`;
    }
    if(stage==='memoria'){
      const pending=window.SIGPSMemoriaDocumento.contentKeys.filter(k=>!values[k]);
      $('project-review').innerHTML=`<section class="review-project"><h3>${escape(values.titulo)}</h3><p>${students.length} ${students.length===1?'alumno':'alumnos'} · ${escape(values.carrera)}</p></section><details class="review-details"><summary>Anexos: qué debes adjuntar y en qué orden</summary><p class="review-hint">${escape(window.SIGPSMemoriaDocumento.annexIntro)}</p><ol class="annex-guide">${window.SIGPSMemoriaDocumento.annexGuide.map(t=>`<li><details><summary>${escape(t.nombre)}</summary><p>${escape(t.instruccion)}</p></details></li>`).join('')}</ol><details class="annex-support"><summary>Asesorías y evidencias del proyecto</summary><p>${escape(window.SIGPSMemoriaDocumento.supportingGuidance)}</p></details><a href="documentos/procesos/memoria.docx" download>Descargar modelos originales</a></details><details class="review-details"><summary>Revisión final${pending.length?` · ${pending.length} secciones por completar`:''}</summary><p>Incluye portada institucional, índice, las cinco secciones de la memoria y cuadro resumen. Revisa en Word los límites de la guía: introducción 2 páginas, desarrollo 6, resultados 2, conclusiones 2 y recomendaciones 2.</p><p>Completa los modelos, adjunta los respaldos firmados y retira las hojas de indicaciones antes de entregar.</p>${pending.length?`<p>Por completar: ${pending.map(escape).join(', ')}.</p>`:''}</details>`;
    }
    step=reviewStep();progress();$('document-form').hidden=true;$('document-preview').hidden=false;
    const demoNotice=$('builder-demo-notice');
    if(demoNotice){
      demoNotice.hidden=!(demoCount||(usesCatalog&&window.SIGPSApiConfig.notice));
      demoNotice.textContent=demoCount?`Ejemplo de ${demoCount} ${demoCount===1?'alumno':'alumnos'} · No válido para entrega.`:(usesCatalog?window.SIGPSApiConfig.notice||'':'');
    }
    $('builder-title').textContent=isProject?'Tu proyecto está preparado':'Tu memoria está preparada';
    const pending=stage==='inscripcion'?[]:stages[stage].fields.filter(([k,,,required])=>!required&&!['participantes','numero'].includes(k)&&!values[k]).map(([,label])=>label);
    $('preview-description').textContent=stage==='inscripcion'?'Revisa la hoja individual y completa los campos que aparezcan pendientes. Después de imprimirla, gestiona las firmas y reúne los otros cuatro documentos de inscripción.':`Este borrador no incorpora los archivos anexos, firmas ni sellos.${pending.length?' Secciones por completar: '+pending.join('; ')+'.':''}${stage==='proyecto'&&!activities.length?' El cronograma está pendiente.':''} Revisa la paginación y los límites de extensión de la guía antes de entregar.`;
    if(isProject)$('preview-description').textContent='Incluye portada, índice, contenido, cronogramas y cuadro resumen. Los archivos de los anexos los agregas tú.';
    if(stage==='memoria')$('preview-description').textContent='Incluye una hoja de indicaciones por anexo, seguida de su modelo original cuando corresponde. Completa los modelos y reúne los documentos firmados antes de entregar.';
    $('print-document').disabled=true;
    $('preview-frame').srcdoc=generated.replace('</style>','.toolbar{display:none}.editable{pointer-events:none}</style>');
    $('builder-title').focus();
  }

  function showStage(){
    const requested=location.hash.slice(1);
    const next=Object.prototype.hasOwnProperty.call(stages,requested)?requested:'inscripcion';
    saveFields();drafts[stage]={values,students,activities,activeStudent};
    stage=next;
    values=drafts[stage]?.values||{cantidad:'1'};
    students=drafts[stage]?.students||[{}];
    activities=drafts[stage]?.activities||[];
    activeStudent=drafts[stage]?.activeStudent||0;
    step=0;
    demoCount=0;
    const demoNotice=$('builder-demo-notice');
    if(demoNotice)demoNotice.hidden=true;
    const s=stages[stage];
    document.querySelectorAll('[data-stage]').forEach(el=>{if(el.dataset.stage===stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('builder').hidden=true;$('stage-content').hidden=false;$('form-fields').innerHTML='';
    $('stage-content').innerHTML=`<div class="guide-grid"><article class="flow-card"><p class="eyebrow">ETAPA ${s.number}</p><h2 id="stage-title" tabindex="-1">${s.title}</h2><p class="stage-lead">${s.intro}</p><div class="stage-cta-bar"><button type="button" id="start-builder" class="flow-button">Comenzar ${s.short.toLowerCase()} en Word →</button><a class="flow-button secondary" href="documentos/procesos/${stage}.docx" download>Descargar modelo Word</a></div><ol class="step-list">${s.steps.map(([t,d])=>`<li><strong>${t}</strong><p>${d}</p></li>`).join('')}</ol><div class="guide-note">${s.note}</div></article><aside class="guide-side" aria-label="Documentos y descargas"><section class="flow-card"><h3>${stage==='inscripcion'?'Documentos del expediente':'Documentos que debes reunir'}</h3><ol class="document-list">${s.documents.map(([t,d])=>`<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ol><div class="guide-downloads"><a class="text-button" href="documentos/procesos/${stage}.pdf" download>Descargar guía oficial en PDF</a></div></section></aside></div>`;
    $('start-builder').addEventListener('click',()=>{if(stage==='inscripcion'){window.SIGPSInscripcion.open();return;}$('stage-content').hidden=true;$('builder').hidden=false;step=0;renderForm();if(usesCatalog&&!catalogState)loadCatalog();$('builder').scrollIntoView({behavior:'auto',block:'start'});});
  }

  $('document-form').addEventListener('submit',e=>{
    e.preventDefault();saveFields();
    $('document-form').querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    $('document-form').querySelectorAll('.field-error').forEach(el=>el.textContent='');
    $('form-errors').hidden=true;
    const count=Math.max(1,Number(values.cantidad)||1);

    if(step===0){
      if(showErrors(academicErrors()))return;
      const teamErr={};
      if(!values.carrera)teamErr.carrera='Completa este campo.';
      if(!values.departamento)teamErr.departamento='Completa este campo.';
      if(!Number.isSafeInteger(Number(values.cantidad))||Number(values.cantidad)<1){
        teamErr.cantidad='Indica una cantidad entera de alumnos, desde 1.';
      }
      if(showErrors(teamErr))return;
      activeStudent=0;
      step=1;
      renderForm();
      return;
    }

    if(step===1){
      const curr=students[activeStudent]||{};
      const stErr={};
      if(!curr.nombre)stErr.nombre='Completa este campo.';
      if(!curr.carnet)stErr.carnet='Completa este campo.';
      if(showErrors(stErr))return;

      if(activeStudent<count-1){
        activeStudent++;
        students[activeStudent]=students[activeStudent]||{};
        renderForm();
        return;
      }

      if(!validStudents())return;
      step=2;
      renderForm();
      return;
    }

    if(step===2){
      const checked=errors(stage,values,[],students);
      const projectKeys=new Set(window.SIGPSProcessData.projectFieldsFor(stage).map(f=>f[0]));
      const projErr=Object.fromEntries(Object.entries(checked).filter(([key])=>projectKeys.has(key)));
      const projKeys=['titulo','institucion','direccionInstitucion','inicio','fin','lugar','entrega'];
      for(const k of projKeys){
        if(!values[k])projErr[k]='Completa este campo.';
      }
      if(values.inicio&&values.fin&&values.fin<values.inicio){
        projErr.fin='La finalización no puede ser anterior al inicio.';
      }
      if(showErrors(projErr))return;
      step=3;
      renderForm();
      return;
    }

    if(stage==='proyecto'&&step===3){
      const scheduleErrors=schedule.errors(students,values);
      const first=Object.keys(scheduleErrors)[0];
      if(first){scheduleStudent=Number(first.split('-')[1]);renderForm(false);showErrors(scheduleErrors);return;}
      step=contentStep();renderForm();return;
    }

    if(step===contentStep()){
      const all={...errors(stage,values,[],students),...(stage==='proyecto'?schedule.errors(students,values):{})};
      const stageKeys=new Set(stages[stage].fields.map(f=>f[0]));
      const relevant=Object.fromEntries(Object.entries(all).filter(([key])=>stageKeys.has(key)||key.startsWith('actividad-')||key.startsWith('cronograma-')));
      const firstSchedule=Object.keys(relevant).find(k=>k.startsWith('cronograma-'));
      if(firstSchedule){step=3;scheduleStudent=Number(firstSchedule.split('-')[1]);renderForm(false);}
      if(showErrors(relevant))return;
      preview();
      return;
    }
  });

  $('form-fields').addEventListener('click',e=>{
    if(e.target.id==='process-catalog-retry'){saveFields();loadCatalog();}
  });
  $('form-fields').addEventListener('change',e=>{
    if(['field-id_departamento','field-id_carrera'].includes(e.target.id)){
      saveFields();
      if(e.target.id==='field-id_departamento')values.id_carrera='';
      values.carrera='';values.departamento='';values.horas='';delete values.catalogoAcademico;
      if(values.id_carrera)academicErrors();
      renderForm(false);$('field-id_carrera').focus();return;
    }
    if(e.target.id==='process-student-select'){
      saveFields();
      activeStudent=Number(e.target.value);
      students[activeStudent]=students[activeStudent]||{};
      renderForm();
    }
  });

  $('form-fields').addEventListener('change',e=>{
    if(e.target.id==='schedule-student'){
      saveFields();scheduleStudent=Number(e.target.value);renderForm(false);$('schedule-student').focus();
    }
  });
  $('form-fields').addEventListener('input',e=>{
    if(!e.target.hasAttribute('data-day')&&!e.target.hasAttribute('data-activity'))return;
    saveFields();$('schedule-result').innerHTML=schedule.result(students[scheduleStudent],values);
  });

  $('previous-step').addEventListener('click',()=>{
    saveFields();
    if(step===1&&activeStudent>0){
      activeStudent--;
      renderForm();
      return;
    }
    step--;
    if(step===1){
      const count=Math.max(1,Number(values.cantidad)||1);
      activeStudent=count-1;
    }
    renderForm();
  });

  $('project-review').addEventListener('click',e=>{if(e.target.id==='edit-schedule'){step=3;renderForm(false);document.querySelector('.activity-list').scrollIntoView({block:'start'});}});

  $('edit-document').addEventListener('click',()=>{
    step=0;
    renderForm();
  });

  $('close-builder').addEventListener('click',()=>{
    saveFields();
    $('builder').hidden=true;
    $('stage-content').hidden=false;
    $('stage-title').focus();
  });

  document.querySelectorAll('[data-builder-demo]').forEach(button=>{
    button.addEventListener('click',()=>{
      const count=Number(button.dataset.builderDemo);
      const demo=window.SIGPSProcesosEjemplos?.create(stage,count);
      if(!demo)return;
      values=demo.values;
      students=demo.students;
      activities=[];
      activeStudent=0;scheduleStudent=0;
      demoCount=count;
      if(catalogState){
        try{
          const selected=catalogAPI.snapshot(catalogState.catalog,values.id_departamento,values.id_carrera,catalogState);
          Object.assign(values,selected,{catalogoAcademico:selected});
        }catch{}
      }
      const details=$('builder-demo');
      if(details)details.open=false;
      preview();
    });
  });

  $('form-fields').addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    if(stage!=='proyecto'||step!==3)return;
    saveFields();const config=studentSchedule(),list=config.actividades;
    if(button.id==='add-activity'){list.push({actividad:'',horas:''});renderForm(false);$(`activity-${list.length-1}-actividad`).focus();}
    if(button.hasAttribute('data-remove')){list.splice(Number(button.dataset.remove),1);renderForm(false);$('add-activity').focus();}
    if(button.hasAttribute('data-move')){const i=Number(button.dataset.move),dir=Number(button.dataset.direction);schedule.move(list,i,dir);renderForm(false);$(`activity-${i+dir}-actividad`).focus();}
  });

  $('preview-frame').addEventListener('load',()=>{$('print-document').disabled=!generated;});
  $('print-document').addEventListener('click',()=>{$('preview-frame').contentWindow.focus();$('preview-frame').contentWindow.print();});
  function checkAutoStart(){
    const params=new URLSearchParams(location.search);
    if(params.get('crear')==='1'||params.get('crear')==='true'){
      const doc=params.get('doc');
      if(stage==='inscripcion'&&window.SIGPSInscripcion?.open){
        window.SIGPSInscripcion.open({cartaInstitucion:doc==='carta_institucion'});
      }else if($('start-builder')){
        $('start-builder').click();
      }
    }
  }
  window.addEventListener('hashchange',()=>{if(Object.prototype.hasOwnProperty.call(stages,location.hash.slice(1))){showStage();$('stage-title').focus();}});
  showStage();
  checkAutoStart();
});
