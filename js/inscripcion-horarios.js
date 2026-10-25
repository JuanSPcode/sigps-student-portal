(function(root){
  const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  const validTime=value=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  function validate(blocks){
    if(!Array.isArray(blocks)||!blocks.length)return 'Agrega al menos un horario de disponibilidad.';
    for(let i=0;i<blocks.length;i++){
      const block=blocks[i];
      if(!block||!Array.isArray(block.dias)||!block.dias.length||block.dias.some(day=>!Number.isInteger(day)||day<0||day>6))return `Horario ${i+1}: selecciona al menos un día.`;
      if(!validTime(block.inicio)||!validTime(block.fin))return `Horario ${i+1}: completa las horas de inicio y fin.`;
      if(block.otros!=null&&(typeof block.otros!=='string'||block.otros.trim().length>120))return `Horario ${i+1}: usa hasta 120 caracteres para la disponibilidad especial.`;
      if(block.fin<=block.inicio)return `Horario ${i+1}: la hora de fin debe ser posterior al inicio del mismo día.`;
    }
    return '';
  }
  function time(value){const [h,m]=value.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;}
  function normalized(blocks){
    return blocks.map(b=>({...b,dias:[...new Set(b.dias)].sort((a,b)=>a-b)})).sort((a,b)=>a.dias[0]-b.dias[0]||a.inicio.localeCompare(b.inicio)||a.fin.localeCompare(b.fin));
  }
  function rows(blocks,other=''){
    return normalized(blocks).map((b,i)=>({horario:`${time(b.inicio)} a ${time(b.fin)}`,dias:b.dias.map(d=>days[d]).join(', '),otros:String(b.otros??(i===0?other:'')).trim()}));
  }
  const api={days,validate,time,normalized,rows};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SIGPSInscripcionHorarios=api;
})(typeof window==='undefined'?globalThis:window);
