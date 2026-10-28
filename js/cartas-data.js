/* Catálogo de Cartas de Solicitud Especial para Servicio Social FMO-UES */
(function(root) {
  const cartas = {
    eliminacion: {
      id: 'eliminacion',
      docNum: 1,
      title: 'Eliminación de Proyecto',
      short: 'Eliminación',
      desc: 'Cancelar el proyecto inscrito en PROMETEO. Requiere la firma de todos los estudiantes.',
      cuando: 'Cancelar el proyecto inscrito en PROMETEO',
      badge: 'Individual / Grupal',
      fileDocx: 'documentos/cartas/1_Carta_Eliminacion_Proyecto.docx',
      filePdf: 'documentos/cartas/1_carta_eliminacion.pdf',
      templateName: 'carta_eliminacion.docx',
      tipo: 'eliminacion',
      destinatario: 'Lic. Ever Antonio Padilla Lazo / Jefe Unidad de Proyección Social – FMO'
    },
    retiro: {
      id: 'retiro',
      docNum: 2,
      title: 'Retiro de Estudiante',
      short: 'Retiro de integrante',
      desc: 'Dar de baja a un integrante del equipo. Firman todos los estudiantes que continúan.',
      cuando: 'Dar de baja a un integrante del equipo',
      badge: 'Grupal',
      fileDocx: 'documentos/cartas/2_Carta_Retiro_Estudiante.docx',
      filePdf: 'documentos/cartas/2_carta_retiro.pdf',
      templateName: 'carta_retiro.docx',
      tipo: 'retiro',
      destinatario: 'Lic. Ever Antonio Padilla Lazo / Jefe Unidad de Proyección Social – FMO'
    },
    ampliacion: {
      id: 'ampliacion',
      docNum: 3,
      title: 'Carta de Ampliación',
      short: 'Ampliación de tiempo',
      desc: 'Extender el tiempo de ejecución del proyecto antes de que venza el plazo.',
      cuando: 'Extender el tiempo de ejecución del proyecto',
      badge: 'Individual / Grupal',
      fileDocx: 'documentos/cartas/3_Carta_Ampliacion.docx',
      filePdf: 'documentos/cartas/3_ampliacion.pdf',
      templateName: 'carta_ampliacion.docx',
      tipo: 'ampliacion',
      destinatario: 'Lic. Ever Antonio Padilla Lazo / Jefe Unidad de Proyección Social – FMO'
    },
    prorroga15: {
      id: 'prorroga15',
      docNum: 4,
      title: 'Prórroga de 15 Días',
      short: 'Prórroga proyecto',
      desc: 'Entrega tardía del plan de proyecto a la UPS (pasados 15 días).',
      cuando: 'Entrega tardía del plan de proyecto a la UPS',
      badge: 'Individual',
      fileDocx: 'documentos/cartas/4_Prorroga_15_dias.docx',
      filePdf: 'documentos/cartas/4_prorroga_15.pdf',
      templateName: 'carta_prorroga_15.docx',
      tipo: 'prorroga',
      destinatario: 'Lic. Ever Antonio Padilla Lazo / Jefe Unidad de Proyección Social – FMO'
    },
    prorroga3m: {
      id: 'prorroga3m',
      docNum: 5,
      title: 'Prórroga de 3 Meses',
      short: 'Prórroga memoria (3 m)',
      desc: 'Entrega tardía de la memoria final (retraso de 3 a 6 meses).',
      cuando: 'Entrega tardía de la memoria (3 a 6 meses)',
      badge: 'Individual',
      fileDocx: 'documentos/cartas/5_Prorroga_3_meses.docx',
      filePdf: 'documentos/cartas/5_prorroga_3mes.pdf',
      templateName: 'carta_prorroga_3mes.docx',
      tipo: 'prorroga',
      destinatario: 'Lic. Ever Antonio Padilla Lazo / Jefe Unidad de Proyección Social – FMO'
    },
    prorroga6m: {
      id: 'prorroga6m',
      docNum: 6,
      title: 'Prórroga de 6 Meses',
      short: 'Prórroga memoria (6 m)',
      desc: 'Entrega tardía de la memoria final (retraso mayor a 6 meses).',
      cuando: 'Entrega tardía de la memoria (+6 meses)',
      badge: 'Individual',
      fileDocx: 'documentos/cartas/6_Prorroga_6_meses.docx',
      filePdf: 'documentos/cartas/6_prorroga_6mes.pdf',
      templateName: 'carta_prorroga_6mes.docx',
      tipo: 'prorroga',
      destinatario: 'Lic. Ever Antonio Padilla Lazo / Jefe Unidad de Proyección Social – FMO'
    }
  };

  const steps = [
    { number: 1, title: 'Estudiantes' },
    { number: 2, title: 'Proyecto' },
    { number: 3, title: 'Motivo' },
    { number: 4, title: 'Descarga' }
  ];

  const api = { cartas, steps };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SIGPSCartasData = api;
})(typeof window === 'undefined' ? globalThis : window);
