// Fictitious examples, generated afresh on each click. Never student records.
(function(root){
  function create(count){
    if(![1,5,3].includes(count))throw new RangeError('Elige 1, 5 o 3 alumnos de prueba.');
    const api=typeof module!=='undefined'&&module.exports?require('./inscripcion-documento.js'):root.SIGPSInscripcionDocumento;
    const project={...api.defaults(),
      incluirCartaInstitucion:false,cantidad:String(count),
      id_departamento:'2',id_carrera:'3',
      carrera:'Ingeniería de Sistemas Informáticos',codigo:'DEMO',
      departamento:'Departamento de Ingeniería y Arquitectura',seccion:'Sistemas Informáticos',
      titulo:'Proyecto de prueba: biblioteca comunitaria',institucion:'Centro Comunitario de Ejemplo',
      direccionInstitucion:'Calle de Ejemplo, San Miguel',lugarEjecucion:'Centro Comunitario de Ejemplo, San Miguel',
      responsable:'María Ejemplo',telefonoInstitucion:'26000000',
      inicio:'2026-11-01',fin:'2027-05-01',tutor:'Lic. Pedro Ejemplo',coordinador:'Lic. Carlos Ejemplo',
      destinatario:'Coordinación de Proyección Social',costos:'1200',
      horas:'500'
    };
    const names=['Ana Ejemplo López','Luis Ejemplo Pérez','Marta Ejemplo García','Carlos Ejemplo Ruiz','Sofía Ejemplo Díaz'];
    const students=Array.from({length:count},(_,i)=>({
      nombre:names[i],carnet:'DEMO2200'+(i+1),direccion:'Calle de Ejemplo, casa '+(i+1)+', San Miguel',
      fijo:'2600000'+(i+1),movil:'7000000'+(i+1),
      porcentaje:'80',disponibilidad:[{dias:[0,1],inicio:'08:00',fin:'12:00',otros:'Solo en interciclo'},{dias:[2],inicio:'08:00',fin:'16:00'},{dias:[3],inicio:'08:00',fin:'10:00'},{dias:[3],inicio:'13:00',fin:'16:00',otros:'A partir del 15 de noviembre'},{dias:[4],inicio:'08:00',fin:'10:00'}],
      observaciones:'Datos ficticios para probar la generación del Word.'
    }));
    return {project,students};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={create};else root.SIGPSInscripcionEjemplos={create};
})(typeof window==='undefined'?globalThis:window);
