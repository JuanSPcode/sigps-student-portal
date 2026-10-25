/* Guías FMO proporcionadas por el equipo. No equivalen al catálogo DSI F1–F8. */
(function (root) {
  const teamFields = [
    ['carrera','Carrera de todos los alumnos','text',true],
    ['codigo','Código de carrera','text',false],
    ['cantidad','¿Cuántos alumnos participarán en el proyecto?','number',true],
    ['departamento','Departamento académico','text',true],
    ['seccion','Sección académica (si aplica)','text',false]
  ];
  const studentFields = [
    ['nombre','Nombre completo','text',true],
    ['carnet','Carnet','text',true]
  ];
  const projectFields = [
    ['titulo','Nombre del proyecto o plan de trabajo','text',true],
    ['institucion','Comunidad o institución receptora','text',true],
    ['direccionInstitucion','Dirección de la institución','text',true],
    ['telefonoInstitucion','Teléfono de la institución','tel',false],
    ['responsable','Responsable de la institución','text',false],
    ['tutor','Nombre del docente tutor','text',false],
    ['inicio','Fecha de inicio','date',true],
    ['fin','Fecha de finalización','date',true],
    ['lugar','Lugar de emisión','text',true],
    ['entrega','Fecha del documento','date',true]
  ];
  const common = [
    {title:'Equipo', intro:'Indica la carrera, el departamento y la cantidad de alumnos que participarán en el proyecto.', fields: teamFields},
    {title:'Alumnos', intro:'Completa los datos de cada estudiante tal como aparecen en sus documentos oficiales.', fields: studentFields},
    {title:'Tu proyecto', intro:'Usaremos estos datos en el documento. Las fechas deben corresponder a tu proyecto.', fields: projectFields}
  ];
  const stages = {
    inscripcion: {
      title:'Inscribir mi servicio social', short:'Inscripción', number:'01',
      intro:'Reúne los documentos de ingreso y solicita la inscripción antes de comenzar tu servicio social.',
      output:'Inscripción del proyecto en un solo Word', source:'Guía de inscripción, páginas 1–5. Hoja individual: página 3.',
      steps:[
        ['Reúne los requisitos','Solicita la carta de la institución receptora y la constancia de Administración Académica que acredita el 60 % de la carrera.'],
        ['Prepara tu hoja de inscripción','Completa tus datos, los de la institución y el plan de trabajo. Gestiona la asignación del tutor y la constancia de aprobación del plan con coordinación.'],
        ['Obtén las firmas y sellos','La hoja debe llevar tu firma y la del tutor. Reúne las cartas firmadas y selladas en original; la guía indica tinta azul.'],
        ['Entrega el expediente a coordinación','Escanea los cinco documentos en el orden indicado y entrégalos en un solo PDF al coordinador de la Subunidad de tu departamento o sección. La guía pide escaneos, no fotografías.'],
        ['Espera la inscripción en la UPS','Coordinación remite el expediente a la UPS. No inicies el servicio social antes de la inscripción; consulta la carta de asignación devuelta a coordinación.']
      ],
      documents:[['Carta de la institución solicitante','La emite la institución receptora.'],['Formulario n.º 1: hoja de inscripción','Una por cada alumno; gestionar sus firmas.'],['Carta n.º 1: asignación del tutor','La emite coordinación.'],['Carta n.º 2: aprobación del plan','Una por alumno; revisión y emisión por coordinación.'],['Constancia del 60 % de la carrera','Una por alumno; se solicita en Administración Académica y se agrega al final.']],
      note:'Siempre se generan el Formulario n.º 1 y las cartas n.º 1 y n.º 2. Si la institución aún no elaboró su carta, puedes activar su generación opcional. Indica cuántos alumnos participan: se repiten el Formulario n.º 1 y la Carta n.º 2 por alumno; la carta de tutor incluye al grupo. El Word rellena los modelos originales para revisión de sus responsables. Agrega las constancias académicas y entrega el expediente firmado y sellado en un solo PDF escaneado, en el orden indicado.',
      fields:[['direccion','Dirección del estudiante','text',true],['fijo','Teléfono fijo','tel',false],['movil','Teléfono móvil','tel',true],['email','Correo electrónico','email',true],['porcentaje','Porcentaje de carrera cursada','number',true],['horario','Horario disponible','text',true],['dias','Días disponibles','text',true],['otros','Otra disponibilidad','text',false],['observaciones','Observaciones','textarea',false]]
    },
    proyecto: {
      title:'Presentar mi proyecto', short:'Proyecto', number:'02',
      intro:'Después de la inscripción, desarrolla el proyecto con tu tutor y gestiona su revisión.',
      output:'Proyecto de servicio social en Word', source:'Guía de presentación del proyecto, páginas 1–8.',
      steps:[
        ['Elabora el proyecto con tu tutor','Prepara portada, índice, introducción, identificación y delimitación del problema, objetivos, metas, recursos, cronogramas y anexos.'],
        ['Revisa el contenido y las actividades','Incluye cronograma por períodos y por horas, cuadro resumen, documentación de inscripción y los respaldos del proyecto.'],
        ['Solicita revisión del tutor','Si hay observaciones, corrígelas y vuelve a presentar el proyecto. Si lo aprueba, el tutor firma y sella.'],
        ['Presenta a coordinación y a la UPS','Coordinación revisa y remite a la UPS para ratificación. Entrega un único PDF escaneado, ordenado, con firmas y sellos originales.'],
        ['Confirma el resultado','La UPS comunica a coordinación si el proyecto se aprueba. Conserva esa respuesta y los documentos para tu memoria.']
      ],
      documents:[['Proyecto y cronogramas','Portada, índice y contenido revisado con el tutor.'],['Anexo A · Documentos de inscripción','El expediente de todos los participantes.'],['Anexo B · Respaldos del proyecto','Mapas, fotografías y otros respaldos pertinentes.'],['Anexo C · Cuadro resumen','Se genera con los datos que ingreses.'],['Anexo D · Solicitud de la institución','Consulta si debes repetir la carta del Anexo A o referenciarla.']],
      note:'La guía menciona 15 días para orientar y presentar el proyecto, y una prórroga si no se presenta en ese plazo. Confirma con coordinación desde qué fecha se cuentan.',
      fields:[['numero','Número de proyecto','text',true],['participantes','Otros participantes: nombre, carnet y carrera por línea','textarea',false],['area','Área de conocimiento','select',false],['beneficiarios','Población beneficiada y cantidad','textarea',false],['introduccion','Introducción','textarea',false],['problema','Identificación del problema','textarea',false],['delimitacion','Delimitación del problema','textarea',false],['objetivo','Objetivo general','textarea',false],['especificos','Objetivos específicos','textarea',false],['metas','Metas medibles','textarea',false],['humanos','Recursos humanos (cantidades y composición)','textarea',false],['materiales','Recursos materiales','textarea',false],['financieros','Presupuesto y procedencia de fondos','textarea',false],['referencias','Referencias citadas (una por párrafo, en formato APA)','textarea',false],['anexos','Respaldos del Anexo B (mapas, fotografías u otros)','textarea',false]]
    },
    memoria: {
      title:'Preparar mi memoria', short:'Memoria', number:'03',
      intro:'Documenta lo que realizaste, reúne las evidencias y presenta tu memoria para revisión.',
      output:'Memoria de servicio social en Word', source:'Guía de memoria, páginas 1–6; modelos y anexos: páginas 7–16.',
      steps:[
        ['Comprueba tus antecedentes','El proyecto debe haberse presentado previamente. Reúne la inscripción, la carta de asignación, el proyecto y las prórrogas, si las hubo.'],
        ['Redacta la memoria','Incluye portada, índice, introducción, desarrollo, resultados, conclusiones, recomendaciones, cuadro resumen y anexos. Cada sección principal comienza en página aparte.'],
        ['Reúne los anexos y las firmas','Consulta la lista de informes, evaluación, asistencia y constancias. Gestiona con el tutor, coordinación e institución los documentos que ellos emiten.'],
        ['Presenta la memoria para revisión','Prepara un único PDF escaneado, en orden, con firmas y sellos originales. Incluye evidencias de las actividades; los planos y mapas se incorporan como imágenes JPEG.'],
        ['Gestiona la certificación','Tras la aprobación, la UPS emite la certificación y gestiona las firmas correspondientes. Consulta su disponibilidad y retírala personalmente.']
      ],
      documents:[['Informes del 50 % y del 100 %','Formularios 3 y 4 del manual; gestionar firmas.'],['Supervisión y evaluación','Formulario 5; lo completan los responsables de evaluar.'],['Constancias del tutor, coordinación e institución','Cartas 3, 4 y 6; las emiten sus responsables.'],['Modelo de certificación','Carta 5: la guía lo lista como anexo, pero indica emisión posterior a la aprobación. Confirma con UPS cuándo incorporarlo.'],['Desempeño, asistencia y MINED','Formularios 6, 7 y 8 del manual.'],['Proyecto, inscripción y prórrogas','Agrega antecedentes y evidencias del servicio social.']],
      note:'Presenta la memoria dentro de los tres meses posteriores a finalizar el proyecto. La guía contempla una única prórroga de hasta tres meses, justificada y autorizada por la UPS; después de 18 meses indica acudir a Junta Directiva.',
      fields:[['numero','Número de proyecto','text',true],['participantes','Otros participantes: nombre, carnet y carrera por línea','textarea',false],['area','Área de conocimiento','select',false],['beneficiarios','Población beneficiada y cantidad','textarea',false],['objetivo','Objetivos del proyecto','textarea',false],['introduccion','Introducción (máximo 2 páginas)','textarea',false],['desarrollo','Desarrollo (máximo 6 páginas)','textarea',false],['resultados','Resultados: alcances y obstáculos (máximo 2 páginas)','textarea',false],['conclusiones','Conclusiones (máximo 2 páginas)','textarea',false],['recomendaciones','Recomendaciones (máximo 2 páginas)','textarea',false],['humanos','Recursos humanos (cantidades y composición)','textarea',false],['materiales','Recursos materiales','textarea',false],['financieros','Recursos financieros (montos y gastos)','textarea',false],['procedenciaFondos','Procedencia de los fondos','textarea',false],['anexos','Relación de anexos que agregarás','textarea',false]]
    }
  };
  const projectFieldsFor=stage=>[...['numero','area'].flatMap(key=>stages[stage].fields.filter(f=>f[0]===key)),...projectFields];
  const contentFieldsFor=stage=>stages[stage].fields.filter(f=>!['numero','area','participantes'].includes(f[0]));
  const api={common,stages,teamFields,studentFields,projectFields,projectFieldsFor,contentFieldsFor};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.SIGPSProcessData=api;
})(typeof window==='undefined'?globalThis:window);
