// Fictitious examples for Proyecto and Memoria, generated afresh on each click. Never student records.
(function(root){
  function create(stage, count){
    if(![1,3,5].includes(count)) throw new RangeError('Elige 1, 3 o 5 alumnos de prueba.');
    const names=['Ana Ejemplo López','Luis Ejemplo Pérez','Marta Ejemplo García','Carlos Ejemplo Ruiz','Sofía Ejemplo Díaz'];
    const carnets=['EL22001','EP22002','EG22003','ER22004','ED22005'];

    const students = Array.from({length: count}, (_, i) => ({
      nombre: names[i],
      carnet: carnets[i]
    }));

    const values = {
      cantidad: String(count),
      nombre: students[0].nombre,
      carnet: students[0].carnet,
      participantes: students.slice(1).map(s => `${s.nombre} · ${s.carnet} · Ingeniería de Sistemas Informáticos`).join('\n'),
      id_departamento: '2',
      id_carrera: '3',
      carrera: 'Ingeniería de Sistemas Informáticos',
      codigo: 'ISI-2026',
      horas: '500',
      departamento: 'Departamento de Ingeniería y Arquitectura',
      seccion: 'Sistemas Informáticos',
      titulo: 'Proyecto de prueba: biblioteca comunitaria digital',
      institucion: 'Centro Comunitario San Miguel',
      direccionInstitucion: 'Final 4.ª Calle Poniente, Barrio San Felipe, San Miguel',
      telefonoInstitucion: '26610000',
      responsable: 'Lic. María Elena Ramos',
      tutor: 'Ing. Pedro Antonio Gómez',
      inicio: '2026-11-01',
      fin: '2027-05-01',
      lugar: 'San Miguel',
      entrega: '2026-10-22',
      numero: 'PR-2026-042',
      area: 'TECNOLOGÍA',
      beneficiarios: '150 jóvenes y adultos de la comunidad',
      introduccion: 'El presente proyecto tiene como propósito diseñar e implementar una biblioteca digital comunitaria que facilite el acceso a recursos bibliográficos, educativos y tecnológicos para estudiantes y habitantes del sector.',
      problema: 'La falta de acceso a material bibliográfico actualizado y terminales con conectividad en la comunidad limita el rendimiento académico de los estudiantes de la zona.',
      delimitacion: 'El proyecto se ejecutará en las instalaciones del Centro Comunitario de San Miguel durante un período de seis meses (noviembre 2026 a mayo 2027), cubriendo un total planificado de 500 horas de servicio social.',
      objetivo: 'Implementar una biblioteca digital comunitaria con catálogo electrónico y áreas de consulta para promover el estudio e investigación en la comunidad.',
      especificos: '1. Diagnosticar las necesidades bibliográficas y de equipamiento tecnológico en la comunidad.\n2. Instalar y configurar la plataforma de gestión bibliotecaria de software libre.\n3. Capacitar a los encargados locales y usuarios en el aprovechamiento de los recursos digitales.',
      metas: '1. Habilitar un espacio con terminales de consulta y red local operativa.\n2. Catalogar e incorporar al menos 500 títulos y recursos educativos abiertos.\n3. Capacitar a un mínimo de 50 usuarios de la comunidad.',
      humanos: `${count} ${count === 1 ? 'estudiante' : 'estudiantes'} de la carrera de Ingeniería de Sistemas Informáticos y 1 docente tutor asignado por la coordinación.`,
      materiales: 'Computadoras de escritorio, cableado de red UTP, switch de comunicaciones, router inalámbrico, mobiliario y material de oficina.',
      financieros: 'Presupuesto total estimado: $650.00 USD, financiado mediante donaciones comunitarias y recursos propios de los estudiantes.',
      anexos: 'Esquema de distribución física de las terminales y fotografías del espacio de trabajo.',
      desarrollo: 'Durante el desarrollo del servicio social se llevaron a cabo las fases de diagnóstico, instalación física y lógica de la red, configuración del catálogo digital y talleres de formación comunitaria, cumpliendo con la programación establecida.',
      resultados: 'Se logró la puesta en marcha exitosa de la biblioteca comunitaria, beneficiando de forma directa a 150 habitantes e indirecta a la población estudiantil de la zona.',
      conclusiones: 'La implementación de herramientas tecnológicas comunitarias fortalece las capacidades de autoaprendizaje y cierra brechas de acceso a la información en sectores vulnerables.',
      recomendaciones: 'Se recomienda a la coordinación del centro comunitario calendarizar jornadas periódicas de mantenimiento preventivo y actualización del acervo digital.'
    };

    const activities = [
      {
        actividad: 'Diagnóstico de necesidades y levantamiento de requerimientos',
        metodologia: 'Entrevistas y encuestas a líderes comunitarios',
        responsable: 'Equipo de estudiantes',
        recursos: 'Guías de entrevista y papelería',
        inicio: '2026-11-01',
        fin: '2026-12-15',
        horas: '150'
      },
      {
        actividad: 'Instalación y configuración de la plataforma bibliotecaria',
        metodologia: 'Despliegue de software libre en red local',
        responsable: 'Equipo de estudiantes',
        recursos: 'Equipos de cómputo y herramientas de red',
        inicio: '2026-12-16',
        fin: '2027-02-28',
        horas: '200'
      },
      {
        actividad: 'Capacitación a encargados y usuarios de la comunidad',
        metodologia: 'Talleres prácticos presenciales',
        responsable: 'Equipo de estudiantes con supervisión de tutor',
        recursos: 'Material didáctico y proyector',
        inicio: '2027-03-01',
        fin: '2027-05-01',
        horas: '150'
      }
    ];

    if(stage==='proyecto')students.forEach((s,i)=>{
      s.cronograma={dias:i%2?[8,8,8,8,8,8,0]:[4,4,4,4,4,0,0],actividades:activities.map(a=>({actividad:a.actividad,horas:a.horas}))};
      if(i%2)s.cronograma.actividades[1].actividad='Organización y digitalización del catálogo comunitario';
    });
    values.procedenciaFondos='Donaciones comunitarias y recursos propios de los estudiantes.';
    return { values, students, activities };
  }

  const api = { create };
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SIGPSProcesosEjemplos = api;
})(typeof window === 'undefined' ? globalThis : window);
