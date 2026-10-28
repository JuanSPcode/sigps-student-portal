document.addEventListener('DOMContentLoaded',()=>{
  const api=window.SIGPSInscripcionDocumento, esc=window.SIGPSDocuments.escape, schedule=window.SIGPSInscripcionHorarios;
  const $=id=>document.getElementById(id), steps=['Equipo','Alumnos','Institución','Plazos y tutor','Revisión'];
  const institutionKeys=['titulo','institucion','direccionInstitucion','lugarEjecucion','responsable','telefonoInstitucion'];
  const institutionFields=api.projectFields.filter(([k])=>institutionKeys.includes(k));
  const timelineFields=api.projectFields.filter(([k])=>!institutionKeys.includes(k));
  let demoCount=0, step=0, active=0, project={...api.defaults(),cantidad:'1',incluirCartaInstitucion:false}, students=[{}], url='', busy=false, revision=0;
  const section=$('registration-builder');
  const catalogAPI=window.SIGPSCatalogoAcademico;
  const usesCatalog=Boolean(window.SIGPSApiConfig.localCatalog||window.SIGPSApiConfig.baseURL);
  let storage;try{storage=window.localStorage;}catch{}
  const catalogClient=catalogAPI.createClient({baseURL:window.SIGPSApiConfig.baseURL,localCatalog:window.SIGPSApiConfig.localCatalog,storage});
  let catalogState=null,catalogLoading=false,catalogError='';
  async function loadCatalog(){
    if(catalogLoading)return;
    catalogLoading=true;catalogError='';
    if(!section.hidden&&step===0)render();
    try{catalogState=await catalogClient.load();}catch(error){catalogError=error.message;}
    finally{
      catalogLoading=false;
      if(!section.hidden&&step===0){save();render();}
    }
  }
  function academicErrors(){
    if(!usesCatalog)return {};
    try{
      if(!catalogState)throw new Error(catalogLoading?'Espera a que carguen las carreras.':catalogError||'Carga el catálogo para continuar.');
      const selected=catalogAPI.snapshot(catalogState.catalog,project.id_departamento,project.id_carrera,catalogState);
      Object.assign(project,selected,{catalogoAcademico:selected});
      return {};
    }catch(error){return {id_carrera:error.message};}
  }
  function academicFields(){
    return catalogAPI.renderFields({state:catalogState,values:project,loading:catalogLoading,error:catalogError,esc,prefix:'reg',dataAttribute:'data-registration-field',errorPrefix:'reg-error-',retryId:'registration-catalog-retry'});
  }

  function save(){
    if(step===4)return;
    const obj=step===1?students[active]:project;
    section.querySelectorAll('[data-registration-field]').forEach(el=>{obj[el.dataset.registrationField]=el.value.trim();});
    if(step===1)obj.disponibilidad=Array.from(section.querySelectorAll('[data-schedule-block]'),block=>({
      dias:Array.from(block.querySelectorAll('[data-schedule-day]:checked'),el=>Number(el.value)),
      inicio:block.querySelector('[data-schedule-start]').value,fin:block.querySelector('[data-schedule-end]').value,otros:block.querySelector('[data-schedule-note]').value.trim()
    }));
  }
  function availability(data){
    const blocks=data.disponibilidad?.length?data.disponibilidad:[{dias:[],inicio:'',fin:'',otros:''}];
    return `<fieldset class="availability wide" id="reg-disponibilidad" tabindex="-1" aria-describedby="reg-error-disponibilidad"><legend>Disponibilidad y horario *</legend><p class="small-copy">Elige los días y una hora de entrada y salida.</p><div id="availability-blocks">${blocks.map((b,i)=>`<details class="schedule-card" data-schedule-block ${schedule.validate([b])||blocks.length===1?'open':''}><summary><span data-schedule-title>Horario ${i+1}</span><span class="schedule-edit-label" aria-hidden="true">Editar</span></summary><div class="schedule-editor"><fieldset class="schedule-day-picker"><legend>1. Días de la semana</legend><button type="button" class="text-button schedule-weekdays" data-schedule-weekdays>Seleccionar lunes a viernes</button><div class="availability-days">${schedule.days.map((day,d)=>`<label><input type="checkbox" data-schedule-day value="${d}" ${b.dias.includes(d)?'checked':''}> <span>${day}</span></label>`).join('')}</div></fieldset><fieldset class="schedule-hour-picker"><legend>2. Horario de la jornada</legend><div class="availability-times"><label for="reg-start-${i}">Entrada<input id="reg-start-${i}" data-schedule-start type="time" step="60" required value="${esc(b.inicio)}"></label><label for="reg-end-${i}">Salida<input id="reg-end-${i}" data-schedule-end type="time" step="60" required value="${esc(b.fin)}"></label></div><p class="small-copy" data-schedule-time aria-live="polite"></p></fieldset><details class="schedule-note" ${b.otros?'open':''}><summary>¿Aplica solo en fechas específicas?</summary><label for="reg-note-${i}">Detalle o período especial (opcional)</label><input id="reg-note-${i}" data-schedule-note type="text" maxlength="120" value="${esc(b.otros||'')}" placeholder="Ej.: en período interciclo"></details><div class="schedule-card-actions"><button type="button" class="flow-button secondary" data-schedule-done>Listo</button><button type="button" class="text-button" data-remove-schedule="${i}" aria-label="Quitar horario ${i+1}">Quitar</button></div></div></details>`).join('')}</div><button type="button" class="flow-button secondary" id="registration-add-schedule">+ Agregar otra jornada</button><p class="small-copy">Para turnos dobles o diferentes días.</p><span class="field-error" id="reg-error-disponibilidad"></span></fieldset>`;
  }
  function scheduleSummary(){
    section.querySelectorAll('[data-schedule-block]').forEach((block,i)=>{
      const b={dias:Array.from(block.querySelectorAll('[data-schedule-day]:checked'),el=>Number(el.value)),inicio:block.querySelector('[data-schedule-start]').value,fin:block.querySelector('[data-schedule-end]').value,otros:block.querySelector('[data-schedule-note]').value.trim()};
      const valid=!schedule.validate([b]);
      const row=valid?schedule.rows([b])[0]:null;
      block.querySelector('[data-schedule-title]').innerHTML=row?`${esc(row.dias)} <strong>${esc(row.horario)}</strong>${row.otros?`<small>${esc(row.otros)}</small>`:''}`:`Horario ${i+1} · Elige días y horas`;
      block.querySelector('[data-schedule-time]').textContent=valid?row.horario:'';
    });
  }
  function field([key,label,type,required,max],data){
    if(type==='schedule')return availability(data);
    if(key==='horas'&&usesCatalog)label='Horas requeridas por alumno';
    const value=esc(data[key]||'');
    const numeric=key==='cantidad'||key==='beneficiarios'?'min="1" step="1"':key==='porcentaje'?'min="0" max="100" step="0.01"':'min="0" step="0.01"';
    const attr=`id="reg-${key}" data-registration-field="${key}" ${required?'required':''} ${max?'maxlength="'+max+'"':''} ${key==='horas'&&usesCatalog?'readonly':''} aria-describedby="reg-error-${key}"`;
    return `<div class="form-field ${type==='textarea'?'wide':''}"><label for="reg-${key}">${esc(label)} ${required?'*':'<span>Opcional</span>'}</label>${type==='select'?`<select ${attr}>${api.financingOptions.map(option=>`<option value="${esc(option)}" ${option===(data[key]||api.defaults().financiamiento)?'selected':''}>${esc(option)}</option>`).join('')}</select>`:type==='textarea'?`<textarea ${attr} rows="3">${value}</textarea>`:`<input ${attr} type="${type}" value="${value}" ${type==='number'?numeric:''}>`}<span class="field-error" id="reg-error-${key}"></span>${key==='entrega'?`<p class="small-copy emission-preview">Fecha de emisión del documento.</p><p class="small-copy" id="registration-emission-date" aria-live="polite">${esc(api.emissionDate(data[key]))}</p>`:''}</div>`;
  }
  function errors(found){
    if(!Object.keys(found).length)return false;
    $('registration-errors').hidden=false;
    $('registration-errors').innerHTML='<strong>Revisa estos datos</strong><ul>'+Object.entries(found).map(([key,message])=>`<li><a href="#reg-${esc(key)}">${esc(message)}</a></li>`).join('')+'</ul>';
    Object.entries(found).forEach(([key,message])=>{if($('reg-'+key))$('reg-'+key).setAttribute('aria-invalid','true');if($('reg-error-'+key))$('reg-error-'+key).textContent=message;});
    $('registration-errors').focus();return true;
  }
  function clearErrors(){ $('registration-errors').hidden=true;section.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));section.querySelectorAll('.field-error').forEach(el=>el.textContent=''); }
  function render(){
    clearErrors();
    $('registration-institution-letter').checked=project.incluirCartaInstitucion===true;
    $('registration-letter-option').hidden=step===4;
    $('registration-demo-notice').hidden=!(demoCount||(usesCatalog&&window.SIGPSApiConfig.notice));
    $('registration-demo-notice').textContent=demoCount?`Ejemplo de ${demoCount} ${demoCount===1?'alumno':'alumnos'} cargado.`:(usesCatalog?window.SIGPSApiConfig.notice||'':'');
    $('registration-title').textContent=step===1?`Datos del alumno ${active+1} de ${project.cantidad}`:steps[step]+' · Inscripción';
    $('registration-progress').innerHTML=steps.map((s,i)=>`<li${step===i?' aria-current="step"':''}>${i+1}. ${s}</li>`).join('');
    $('registration-form').hidden=step===4;$('registration-review').hidden=step!==4;
    $('registration-back').hidden=step===0;
    $('registration-next').textContent=step===1&&active<Number(project.cantidad)-1?'Guardar y siguiente alumno →':step===3?'Revisar datos →':'Continuar →';
    $('registration-step').textContent=`Paso ${step+1} de 5`;
    if(step<4){
      const fields=step===0?api.teamFields:step===1?api.studentFields:step===2?institutionFields:timelineFields.filter(([key])=>key!=='aportes'&&(project.incluirCartaInstitucion||key!=='destinatario'));
      const intro=step===0?'Indica la carrera y cantidad de integrantes. Todos deben ser de la misma carrera.':step===1?`Carrera: ${esc(project.carrera)}. Datos del estudiante.`:step===2?'Información de la institución o comunidad donde se desarrollará el servicio social.':'Período de ejecución, horas requeridas y docentes asignados.';
      $('registration-fields').innerHTML=`<p class="form-intro">${intro} Los campos con * son obligatorios.</p>`+(step===1?`<div class="form-field wide"><label for="registration-student">Revisar otro alumno</label><select id="registration-student">${Array.from({length:Math.min(students.length,Number(project.cantidad))},(_,i)=>`<option value="${i}" ${i===active?'selected':''}>Alumno ${i+1}${students[i]?.nombre?' · '+esc(students[i].nombre):''}</option>`).join('')}</select></div>`:'')+`<div class="form-grid">${step===0&&usesCatalog?academicFields():''}${fields.filter(f=>f[0]!=='codigo'&&!(usesCatalog&&f[0]==='horas')&&!(step===0&&usesCatalog&&['carrera','departamento'].includes(f[0]))).map(f=>field(f,step===1?students[active]:project)).join('')}</div>`+(step===1?'<p class="small-copy" style="margin-top:14px">La constancia del 60 % se tramita en ventanilla de Administración Académica.</p>':'');
      if(step===1)scheduleSummary();
    }else{
      const count=Number(project.cantidad);
      $('registration-summary').innerHTML=`<div class="review-project"><h3>${esc(project.titulo)}</h3><p>${esc(project.institucion)} · ${count} ${count===1?'alumno':'alumnos'} · ${esc(project.carrera)}</p></div><details class="review-details review-students"><summary>Ver alumnos y horarios (${count})</summary><div class="review-student-grid">${students.slice(0,count).map(s=>`<div class="review-student"><strong>${esc(s.nombre)}</strong><span>${esc(s.carnet)}</span><ul>${schedule.rows(s.disponibilidad).map(row=>`<li><span>${esc(row.dias)}</span><strong>${esc(row.horario)}</strong>${row.otros?`<span class="schedule-condition">${esc(row.otros)}</span>`:''}</li>`).join('')}</ul></div>`).join('')}</div></details>`;
      const documents=[
        ['1. Carta de la Institución solicitante',project.incluirCartaInstitucion?'Para todo el equipo (incluida en el Word)':'Emitida por la institución receptora',project.incluirCartaInstitucion],
        ['2. Formulario No. 1: Hoja de Inscripción',`F1 oficial · ${count} ${count===1?'hoja individual':'hojas individuales'}`,true],
        ['3. Carta No. 1: Asignación del Tutor','Carta n.º 1 · Emitida por coordinación para el equipo',true],
        ['4. Carta No. 2: Constancia de aprobación del Plan',`Carta n.º 2 · ${count} ${count===1?'constancia individual':'constancias individuales'}`,true],
        ['5. Constancia de Administración Académica (60 %)','Constancia del 60 % · Tramitar en ventanilla académica',false]
      ];
      $('registration-documents').innerHTML=documents.map(([title,detail,included])=>`<li><div><strong>${title}</strong><span>${detail}</span></div><span class="review-badge ${included?'included':'attach'}">${included?'En el Word':'Adjuntar'}</span></li>`).join('');
      $('registration-download').hidden=true;$('registration-generate').hidden=false;$('registration-generate').disabled=busy;$('registration-status').textContent='';

    }
    $('registration-title').focus();
  }
  function validStudents(){
    const seen=new Set();
    for(let i=0;i<Number(project.cantidad);i++){
      const found=api.validate(api.studentFields,students[i]||{}), key=String(students[i]?.carnet||'').toLocaleUpperCase();
      if(seen.has(key))found.carnet='Este carnet ya aparece en otro alumno.';seen.add(key);
      if(Object.keys(found).length){active=i;step=1;students[i]||={};render();errors(found);return false;}
    }
    return true;
  }
  section.querySelectorAll('[data-registration-demo]').forEach(button=>button.addEventListener('click',()=>{
    const example=window.SIGPSInscripcionEjemplos.create(Number(button.dataset.registrationDemo));
    revision++;project=example.project;students=example.students;demoCount=students.length;active=0;step=4;
    if(catalogState){
      try{
        const selected=catalogAPI.snapshot(catalogState.catalog,project.id_departamento,project.id_carrera,catalogState);
        Object.assign(project,selected,{catalogoAcademico:selected});
      }catch{}
    }
    section.querySelector('.registration-demo').open=false;
    if(url){URL.revokeObjectURL(url);url='';}
    render();
  }));
  $('registration-form').addEventListener('submit',e=>{
    e.preventDefault();save();clearErrors();
    const fields=step===0?api.teamFields:step===1?api.studentFields:step===2?institutionFields:timelineFields.filter(([key])=>key!=='aportes'&&(project.incluirCartaInstitucion||key!=='destinatario'));
    if(step===0&&errors(academicErrors()))return;
    if(errors(api.validate(fields,step===1?students[active]:project)))return;
    revision++;
    if(step===0){active=0;students[0]||={};step=1;}
    else if(step===1){
      if(active<Number(project.cantidad)-1){active++;students[active]||={};}
      else {if(!validStudents())return;step=2;}
    }else if(step===2){
      step=3;
    }else {
      if(!validStudents())return;
      step=4;
    }
    render();
  });
  $('registration-institution-letter').addEventListener('change',e=>{
    save();revision++;project.incluirCartaInstitucion=e.target.checked;
    const found=api.validate(api.projectFields,project);
    if(step===4&&Object.keys(found).length){step=3;render();errors(found);}else render();
  });
  $('registration-fields').addEventListener('click',e=>{
    if(e.target.id==='registration-catalog-retry'){save();loadCatalog();return;}
    const remove=e.target.closest('[data-remove-schedule]'),done=e.target.closest('[data-schedule-done]'),weekdays=e.target.closest('[data-schedule-weekdays]');
    if(weekdays){
      weekdays.closest('[data-schedule-block]').querySelectorAll('[data-schedule-day]').forEach(el=>el.checked=Number(el.value)<5);
      save();scheduleSummary();return;
    }
    if(e.target.id!=='registration-add-schedule'&&!remove&&!done)return;
    save();revision++;clearErrors();
    if(!remove){
      const message=schedule.validate(students[active].disponibilidad);
      if(message){errors({disponibilidad:message});return;}
    }
    if(done){const block=done.closest('[data-schedule-block]');block.open=false;block.querySelector('summary').focus();return;}
    if(remove)students[active].disponibilidad.splice(Number(remove.dataset.removeSchedule),1);
    else students[active].disponibilidad.push({dias:[],inicio:'',fin:'',otros:''});
    render();
    const index=students[active].disponibilidad.length-1;
    if(!remove&&index>=0)section.querySelectorAll('[data-schedule-block]')[index].querySelector('[data-schedule-day]').focus();else $('registration-add-schedule').focus();
  });
  $('registration-fields').addEventListener('input',e=>{
    if(e.target.id==='reg-entrega')$('registration-emission-date').textContent=api.emissionDate(e.target.value);
    if(e.target.closest('[data-schedule-block]')){save();scheduleSummary();}
  });
  $('registration-fields').addEventListener('change',e=>{
    if(['reg-id_departamento','reg-id_carrera'].includes(e.target.id)){
      save();revision++;
      if(e.target.id==='reg-id_departamento')project.id_carrera='';
      project.carrera='';project.departamento='';project.horas='';delete project.catalogoAcademico;
      if(project.id_carrera)academicErrors();
      render();$('reg-id_carrera').focus();return;
    }
    if(e.target.id==='registration-student'){save();active=Number(e.target.value);students[active]||={};render();}
  });
  $('registration-back').addEventListener('click',()=>{
    save();revision++;
    if(step===1&&active>0)active--;
    else if(step===2){step=1;active=Number(project.cantidad)-1;}
    else step--;
    render();
  });
  $('registration-edit').addEventListener('click',()=>{revision++;step=0;render();});
  $('registration-close').addEventListener('click',()=>{save();revision++;section.hidden=true;$('stage-content').hidden=false;$('stage-title').focus();});
  $('registration-generate').addEventListener('click',async()=>{
    if(busy)return;busy=true;const current=revision;
    $('registration-generate').disabled=true;$('registration-download').hidden=true;$('registration-status').textContent='Preparando el Word con la plantilla…';
    try{
      let template;
      if(location.protocol!=='file:'){
        try{
          const response=await fetch('documentos/plantillas/inscripcion.docx',{cache:'no-store'});
          if(response.ok)template=await response.arrayBuffer();
        }catch(e){
          console.warn('No se pudo cargar la plantilla vía fetch, recurriendo a plantilla integrada.',e);
        }
      }
      if(!template&&window.SIGPSInscripcionPlantilla?.base64){
        const binary=atob(window.SIGPSInscripcionPlantilla.base64);
        const bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        template=bytes.buffer;
      }
      if(!template){
        if(location.protocol==='file:')throw api.failure('ARCHIVO_LOCAL','');
        throw api.failure('CARGA_PLANTILLA','');
      }
      if(current!==revision)return;
      const output=api.generate(template,project,students.slice(0,Number(project.cantidad)));
      if(url)URL.revokeObjectURL(url);
      url=URL.createObjectURL(new Blob([output],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
      $('registration-download').href=url;$('registration-download').hidden=false;
      $('registration-generate').hidden=true;
      $('registration-status').textContent='Tu Word está listo para descargar.';
      $('registration-download').focus();
    }catch(error){
      console.error('Error al generar Word:',error);
      if(current===revision)$('registration-status').textContent=api.errorMessage(error);
    }
    finally{busy=false;$('registration-generate').disabled=false;}
  });
  window.addEventListener('hashchange',()=>{if(['inscripcion','proyecto','memoria'].includes(location.hash.slice(1))){save();revision++;section.hidden=true;}});
  window.SIGPSInscripcion={open(options){if(options?.cartaInstitucion){project.incluirCartaInstitucion=true;}revision++;$('stage-content').hidden=true;$('builder').hidden=true;section.hidden=false;step=0;render();if(usesCatalog&&!catalogState)loadCatalog();section.scrollIntoView({block:'start'});}};
});
