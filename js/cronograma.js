/* Per-student planning, calculated locally. Hours are integer hundredths during allocation. */
(function(root){
  const clean=x=>String(x??'').trim();
  const esc=x=>clean(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||'')&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
  const cents=x=>Math.round(Number(x)*100);
  const validHours=x=>clean(x)!==''&&Number.isFinite(Number(x))&&Number(x)>=0&&Number.isSafeInteger(cents(x))&&Math.abs(Number(x)*100-cents(x))<.00001;
  const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const iso=d=>d.toISOString().slice(0,10),date=x=>new Date(x+'T12:00:00Z');
  const dayIndex=d=>(d.getUTCDay()+6)%7;
  function range(start,end){
    if(!validDate(start)||!validDate(end)||end<start)return [];
    // A bounded range prevents an accidental enormous document; never silently truncate.
    if((date(end)-date(start))/86400000>3660)return [];
    const result=[];
    for(let d=date(start);iso(d)<=end;d.setUTCDate(d.getUTCDate()+1))result.push(iso(d));
    return result;
  }
  function periodId(value){
    const d=date(value),first=date(value.slice(0,7)+'-01');
    return value.slice(0,7)+'-S'+(Math.floor((d.getUTCDate()-1+dayIndex(first))/7)+1);
  }
  function periods(start,end){
    const grouped=new Map();
    for(const value of range(start,end)){
      const id=periodId(value);
      if(!grouped.has(id))grouped.set(id,{id,month:value.slice(0,7),week:Number(id.split('-S')[1]),from:value,to:value,title:new Intl.DateTimeFormat('es-SV',{month:'long',year:'numeric',timeZone:'UTC'}).format(date(value))});
      grouped.get(id).to=value;
    }
    return [...grouped.values()].map(p=>({...p,label:p.from.slice(8)+'–'+p.to.slice(8)}));
  }
  const total=a=>Object.values(a.semanas||{}).reduce((n,h)=>n+cents(h),0)/100;
  function plan(student,values){
    const config=student.cronograma||{},availability=config.dias||[],activities=config.actividades||[],issues=[];
    const required=Number(values.horas),dates=range(values.inicio,values.fin);
    if(!validHours(values.horas)||required<=0)issues.push('Confirma las horas de tu carrera en Equipo.');
    if(!dates.length)issues.push('Revisa las fechas del proyecto (máximo 10 años).');
    const hours=days.map((_,i)=>availability[i]??0);
    const availabilityOK=hours.every(h=>validHours(h)&&Number(h)<=24);
    if(!availabilityOK)issues.push('Usa entre 0 y 24 horas por día, con hasta dos decimales.');
    const weekly=availabilityOK?hours.reduce((n,h)=>n+cents(h),0)/100:0;
    if(!weekly&&availabilityOK)issues.push('Indica cuántas horas puedes hacer al menos un día de la semana.');
    const capacity=availabilityOK?dates.reduce((n,d)=>n+cents(hours[dayIndex(date(d))]),0)/100:0;
    const activityOK=activities.length>0&&activities.every(a=>clean(a.actividad)&&validHours(a.horas)&&Number(a.horas)>0);
    if(!activityOK)issues.push('Agrega actividades con nombre y horas mayores que cero (hasta dos decimales).');
    const assigned=activities.reduce((n,a)=>n+(validHours(a.horas)?cents(a.horas):0),0)/100;
    if(activityOK&&required>0&&cents(assigned)!==cents(required))issues.push(assigned<required?`Faltan ${(cents(required)-cents(assigned))/100} h en tus actividades para completar ${required} h.`:`Tus actividades exceden por ${(cents(assigned)-cents(required))/100} h las ${required} h de la carrera. Ajusta sus horas.`);
    if(dates.length&&weekly&&required>capacity)issues.push(`En estas fechas caben ${capacity} h: faltan ${(cents(required)-cents(capacity))/100} h. Amplía el período o ajusta tu disponibilidad.`);
    const rows=activities.map(a=>({actividad:clean(a.actividad),horas:Number(a.horas)||0,semanas:{},inicio:'',fin:''}));
    let index=0,remaining=rows.length?cents(rows[0].horas):0,allocated=0;
    if(activityOK&&availabilityOK)for(const value of dates){
      let available=cents(hours[dayIndex(date(value))]);
      while(available>0&&index<rows.length){
        const used=Math.min(available,remaining),row=rows[index],id=periodId(value);
        row.semanas[id]=(cents(row.semanas[id]||0)+used)/100;
        row.inicio=row.inicio||value;row.fin=value;
        available-=used;remaining-=used;allocated+=used;
        if(!remaining){index++;remaining=index<rows.length?cents(rows[index].horas):0;}
      }
    }
    return {issues,required,weekly,capacity,assigned,allocated:allocated/100,rows,periods:periods(values.inicio,values.fin),finish:index===rows.length&&rows.length?rows.at(-1).fin:''};
  }
  function errors(students,values){
    return Object.fromEntries(students.flatMap((s,i)=>{const p=plan(s,values);return p.issues.length?[[`cronograma-${i}`,`${s.nombre||'Alumno '+(i+1)}: ${p.issues.join(' ')}`]]:[];}));
  }
  function move(list,index,direction){const target=index+direction;if(target>=0&&target<list.length)[list[index],list[target]]=[list[target],list[index]];return list;}
  function card(a,i,count){return `<div class="schedule-activity" id="actividad-${i}"><div class="form-field"><label for="activity-${i}-actividad">Actividad ${i+1} *</label><input id="activity-${i}-actividad" data-activity="${i}" data-key="actividad" maxlength="600" value="${esc(a.actividad)}" placeholder="Ej. Organizar el archivo digital"></div><div class="form-field"><label for="activity-${i}-horas">Horas *</label><input id="activity-${i}-horas" data-activity="${i}" data-key="horas" type="number" min="0.01" step="0.01" value="${esc(a.horas)}"></div><div class="schedule-actions"><button type="button" data-move="${i}" data-direction="-1" aria-label="Subir actividad ${i+1}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="${i}" data-direction="1" aria-label="Bajar actividad ${i+1}" ${i===count-1?'disabled':''}>↓</button><button type="button" data-remove="${i}" aria-label="Quitar actividad ${i+1}">Quitar</button></div></div>`;}
  function matrix(p){
    if(!p.rows.length||!p.allocated)return '';
    const months=[...new Set(p.periods.filter(x=>!p.finish||x.month<=p.finish.slice(0,7)).map(x=>x.month))];
    return `<details class="schedule-month"><summary>Ver distribución por mes y semana</summary>${months.map(month=>{const ps=p.periods.filter(x=>x.month===month);return `<div class="schedule-scroll" tabindex="0" role="region" aria-label="${esc(ps[0].title)}"><table><caption>${esc(ps[0].title)}</caption><thead><tr><th>Actividad</th>${ps.map(x=>`<th>S${x.week}<small>${x.label}</small></th>`).join('')}<th>Total</th></tr></thead><tbody>${p.rows.map(a=>`<tr><th scope="row">${esc(a.actividad)}</th>${ps.map(x=>`<td>${a.semanas[x.id]||'—'}</td>`).join('')}<td>${ps.reduce((n,x)=>n+cents(a.semanas[x.id]||0),0)/100}</td></tr>`).join('')}<tr><th>Total</th>${ps.map(x=>`<td>${p.rows.reduce((n,a)=>n+cents(a.semanas[x.id]||0),0)/100}</td>`).join('')}<td>${p.rows.reduce((n,a)=>n+ps.reduce((t,x)=>t+cents(a.semanas[x.id]||0),0),0)/100}</td></tr></tbody></table></div>`;}).join('')}<p class="small-copy">Semanas de lunes a domingo; al cambiar de mes se separan sus días.</p></details>`;
  }
  function result(student,values){const p=plan(student,values);return `<div class="schedule-summary"><span><strong>${p.weekly} h</strong> por semana</span><span><strong>${p.assigned} / ${Number.isFinite(p.required)?p.required:'—'} h</strong> en actividades</span><span><strong>${p.capacity} h</strong> disponibles en el período</span></div><div class="schedule-feedback" role="status">${p.issues.length?`<ul>${p.issues.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:`<p>✓ Cronograma completo. Terminas el ${p.finish.split('-').reverse().join('/')}.</p>`}</div>${matrix(p)}`;}
  function editor(students,index,values){const s=students[index],config=s.cronograma||{dias:[],actividades:[]};return `<section class="activity-list" id="schedule-editor"><h3>Cronograma por alumno</h3><p class="small-copy">Del ${esc(values.inicio.split('-').reverse().join('/'))} al ${esc(values.fin.split('-').reverse().join('/'))}. Puedes cambiar estas fechas en «Tu proyecto».</p><div class="form-field"><label for="schedule-student">Alumno</label><select id="schedule-student">${students.map((s,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(s.nombre||'Alumno '+(i+1))}</option>`).join('')}</select></div><fieldset class="schedule-availability"><legend>1. ¿Cuántas horas harás cada día?</legend><p class="small-copy">Coloca 0 los días que no asistirás. Este horario se repite cada semana.</p><div class="schedule-days">${days.map((d,i)=>`<div class="form-field"><label for="day-${i}">${d}</label><input id="day-${i}" data-day="${i}" type="number" min="0" max="24" step="0.01" value="${esc(config.dias?.[i]??0)}"></div>`).join('')}</div></fieldset><h4>2. Agrega tus actividades y horas</h4><p class="small-copy">Se programan en este orden, sin superar tus horas diarias. Usa las flechas para cambiarlo.</p><div id="activities">${(config.actividades||[]).map((a,i)=>card(a,i,config.actividades.length)).join('')}</div><button type="button" class="flow-button secondary" id="add-activity">+ Agregar actividad</button><div id="schedule-result">${result(s,values)}</div><p class="small-copy">Por ahora, no se descuentan vacaciones ni feriados.</p></section>`;}
  const paragraph=(text,bold=false)=>`<w:p><w:pPr><w:spacing w:before="0" w:after="100" w:line="240"/><w:ind w:firstLine="0"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="20"/>${bold?'<w:b/>':''}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
  function table(headers,rows,widths,groups=[]){
    const row=(cells,header=false)=>`<w:tr>${header?'<w:trPr><w:tblHeader/></w:trPr>':''}${cells.map((t,i)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[i]}" w:type="dxa"/>${header?'<w:shd w:fill="E8EDF3"/>':''}</w:tcPr>${String(t).split('\n').map(line=>paragraph(line,header)).join('')}</w:tc>`).join('')}</w:tr>`;
    let groupRow='';
    if(groups.length){
      let column=0;
      groupRow='<w:tr><w:trPr><w:tblHeader/></w:trPr>'+groups.map(g=>{
        const width=widths.slice(column,column+g.span).reduce((n,w)=>n+w,0);column+=g.span;
        return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:gridSpan w:val="${g.span}"/><w:shd w:fill="D6E3EF"/></w:tcPr>${paragraph(g.title,true)}</w:tc>`;
      }).join('')+'</w:tr>';
    }
    return '<w:tbl><w:tblPr><w:tblW w:w="12960" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(e=>`<w:${e} w:val="single" w:sz="4" w:color="999999"/>`).join('')+'</w:tblBorders></w:tblPr><w:tblGrid>'+widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')+'</w:tblGrid>'+groupRow+row(headers,true)+rows.map(r=>row(r)).join('')+'</w:tbl>';
  }
  const pageBreak='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  function detailsXML(students,values){return students.map((s,i)=>{const p=plan(s,values);return (i?pageBreak:'')+paragraph(`${s.nombre} · ${s.carnet}`,true)+table(['N.º','Actividad','Horas'],[...p.rows.map((a,i)=>[i+1,a.actividad,a.horas]),['','Total por alumno',p.assigned]],[700,10960,1300])+paragraph(`Disponibilidad: ${p.weekly} horas por semana. Horas requeridas por la carrera: ${p.required}.`);}).join('');}
  function wordXML(students,values){const pages=[];for(const s of students){const p=plan(s,values),months=[...new Set(p.periods.filter(x=>!p.finish||x.month<=p.finish.slice(0,7)).map(x=>x.month))];for(let offset=0;offset<months.length;offset+=2){const ps=p.periods.filter(x=>months.slice(offset,offset+2).includes(x.month));const w=Math.floor(8260/ps.length),widths=[3300,...ps.map(()=>w),12960-3300-w*ps.length];pages.push(paragraph(`${s.nombre} · ${s.carnet}`,true)+paragraph([...new Set(ps.map(x=>x.title))].join(' · '),true)+table(['Actividad',...ps.map(x=>`S${x.week}\n${x.label}`),'Subtotal'],[...p.rows.map((a,i)=>[`${i+1}. ${a.actividad}`,...ps.map(x=>a.semanas[x.id]||'—'),ps.reduce((n,x)=>n+cents(a.semanas[x.id]||0),0)/100]),['Total',...ps.map(x=>p.rows.reduce((n,a)=>n+cents(a.semanas[x.id]||0),0)/100),p.rows.reduce((n,a)=>n+ps.reduce((t,x)=>t+cents(a.semanas[x.id]||0),0),0)/100]],widths,[{title:'Mes',span:1},...months.slice(offset,offset+2).map(m=>({title:ps.find(x=>x.month===m).title,span:ps.filter(x=>x.month===m).length})),{title:'Horas',span:1}])+paragraph(`Total del alumno en todo el proyecto: ${p.assigned} h. Disponibilidad: ${p.weekly} h por semana. Finalización prevista: ${p.finish.split('-').reverse().join('/')}.`)+paragraph('Semanas de lunes a domingo, separadas al cambiar de mes. No se descuentan vacaciones ni feriados.'));}}return pages.join(pageBreak);}
  const api={periods,plan,errors,total,move,card,matrix,editor,result,wordXML,detailsXML};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSCronograma=api;
})(typeof window==='undefined'?globalThis:window);
