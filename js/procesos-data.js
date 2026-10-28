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
      documents:[
        ['1. Carta de la Institución que solicita el o los estudiantes de Servicio Social','Documento formal de solicitud emitido por la institución receptora. Puede incluirse en el Word si no se cuenta con formato propio.'],
        ['2. Formulario No. 1: Hoja de Inscripción para realizar el Servicio social','Ficha individual obligatoria (F1) con datos del estudiante, plan de trabajo y disponibilidad semanal. Se genera una por alumno en el Word.'],
        ['3. Carta No. 1: Asignación del Tutor de Servicio Social','Carta oficial emitida por la Coordinación de Subunidad asignando al docente tutor del proyecto para el equipo.'],
        ['4. Carta No. 2: Constancia de aprobación del Plan de Trabajo del Servicio social','Constancia emitida por Coordinación y Tutor que certifica la aprobación del plan de trabajo y horas.'],
        ['5. Constancia de la Administración académica con el 60% de la carrera','Certificación oficial de avance emitida por Administración Académica de la FMO–UES. Se tramita en ventanilla y se adjunta al final.']
      ],
      note:'Genera el Formulario n.º 1 individual y las cartas n.º 1 y n.º 2 para tu equipo. También puedes incluir la carta institucional si no cuentas con una previa. El archivo descargado está listo en Word para revisión y firmas.',
      fields:[['direccion','Dirección del estudiante','text',true],['fijo','Teléfono fijo','tel',false],['movil','Teléfono móvil','tel',true],['email','Correo electrónico','email',true],['porcentaje','Porcentaje de carrera cursada','number',true],['horario','Horario disponible','text',true],['dias','Días disponibles','text',true],['otros','Otra disponibilidad','text',false],['observaciones','Observaciones','textarea',false]]
    },
    proyecto: {
      title:'Presentar mi proyecto', short:'Proyecto', number:'02',
      intro:'Después de la inscripción, desarrolla el proyecto con tu tutor y gestiona su revisión.',
      output:'Proyecto de servicio social en Word', source:'Guía de presentación del proyecto FMO–UES.',
      steps:[
        ['Elabora el proyecto con tu tutor','Prepara portada, índice, introducción, objetivos, metas, recursos, cronogramas y anexos.'],
        ['Revisa el contenido y las actividades','Distribuye las actividades por semanas y horas en el cronograma oficial del equipo.'],
        ['Solicita revisión del tutor','Corrige las observaciones si las hubiera. Al aprobarlo, el tutor firma y sella el proyecto.'],
        ['Presenta a coordinación y a la UPS','Coordinación revisa y remite a la Unidad de Proyección Social para ratificación.'],
        ['Conserva la aprobación','La resolución favorable de la UPS autoriza formalmente la ejecución de las actividades.']
      ],
      documents:[['Proyecto y cronogramas','Portada institucional, desarrollo de contenidos y cálculo de horas.'],['Anexo A · Documentos de inscripción','Expediente de inscripción aprobado para todos los participantes.'],['Anexo B · Respaldos del proyecto','Mapas, cartas de apoyo o documentos de respaldo pertinentes.'],['Anexo C · Cuadro resumen','Síntesis de objetivos, población beneficiada y presupuesto.'],['Anexo D · Solicitud institucional','Copia de la carta de solicitud emitida por la institución.']],
      note:'El proyecto debe presentarse tras la inscripción para revisión de tu tutor y ratificación de la Subunidad.',
      fields:[['numero','Número de proyecto','text',true],['participantes','Otros participantes: nombre, carnet y carrera por línea','textarea',false],['area','Área de conocimiento','select',false],['beneficiarios','Población beneficiada y cantidad','textarea',false],['introduccion','Introducción','textarea',false],['problema','Identificación del problema','textarea',false],['delimitacion','Delimitación del problema','textarea',false],['objetivo','Objetivo general','textarea',false],['especificos','Objetivos específicos','textarea',false],['metas','Metas medibles','textarea',false],['humanos','Recursos humanos (cantidades y composición)','textarea',false],['materiales','Recursos materiales','textarea',false],['financieros','Presupuesto y procedencia de fondos','textarea',false],['referencias','Referencias citadas (una por párrafo, en formato APA)','textarea',false],['anexos','Respaldos del Anexo B (mapas, fotografías u otros)','textarea',false]]
    },
    memoria: {
      title:'Preparar mi memoria', short:'Memoria', number:'03',
      intro:'Documenta lo que realizaste, reúne las evidencias y presenta tu memoria para revisión.',
      output:'Memoria de servicio social en Word', source:'Guía de memoria FMO–UES.',
      steps:[
        ['Comprueba tus antecedentes','Reúne el expediente de inscripción, la carta de asignación del tutor y el proyecto aprobado.'],
        ['Redacta la memoria','Incluye portada, desarrollo de actividades, logros, conclusiones, recomendaciones y cuadro resumen.'],
        ['Reúne anexos y firmas','Gestiona con el tutor, la coordinación y la institución los informes de avance y constancias.'],
        ['Presenta para revisión final','Prepara tu expediente ordenado con firmas originales para la Subunidad de tu departamento.'],
        ['Gestiona tu certificación','Tras la aprobación final, la UPS emite la certificación oficial de tu servicio social.']
      ],
      documents:[['Informes del 50 % y del 100 %','Formularios 3 y 4 completados con el docente tutor.'],['Supervisión y evaluación','Formularios 5 y 6 completados por la institución y tutor.'],['Constancias de tutoría y cierre','Cartas 3, 4 y 6 emitidas por tutor, coordinación e institución.'],['Modelo de certificación final','Carta 5 para emisión de certificación por la UPS.'],['Asistencia y formulario MINED','Formularios 7 y 8 de registro de horas.'],['Antecedentes del proyecto','Copia del proyecto aprobado y constancias de inscripción.']],
      note:'Presenta tu memoria dentro de los 3 meses posteriores a la finalización de actividades para gestionar tu certificación.',
      fields:[['numero','Número de proyecto','text',true],['participantes','Otros participantes: nombre, carnet y carrera por línea','textarea',false],['area','Área de conocimiento','select',false],['beneficiarios','Población beneficiada y cantidad','textarea',false],['objetivo','Objetivos del proyecto','textarea',false],['introduccion','Introducción (máximo 2 páginas)','textarea',false],['desarrollo','Desarrollo (máximo 6 páginas)','textarea',false],['resultados','Resultados: alcances y obstáculos (máximo 2 páginas)','textarea',false],['conclusiones','Conclusiones (máximo 2 páginas)','textarea',false],['recomendaciones','Recomendaciones (máximo 2 páginas)','textarea',false],['humanos','Recursos humanos (cantidades y composición)','textarea',false],['materiales','Recursos materiales','textarea',false],['financieros','Recursos financieros (montos y gastos)','textarea',false],['procedenciaFondos','Procedencia de los fondos','textarea',false],['anexos','Relación de anexos que agregarás','textarea',false]]
    }
  };
  const projectFieldsFor=stage=>[...['numero','area'].flatMap(key=>stages[stage].fields.filter(f=>f[0]===key)),...projectFields];
  const contentFieldsFor=stage=>stages[stage].fields.filter(f=>!['numero','area','participantes'].includes(f[0]));
  const api={common,stages,teamFields,studentFields,projectFields,projectFieldsFor,contentFieldsFor};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.SIGPSProcessData=api;
})(typeof window==='undefined'?globalThis:window);
