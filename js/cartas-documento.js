/* Generador oficial de Cartas de Solicitud en Word (.docx) para Servicio Social FMO-UES */
(function(root) {
  const dateValid = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function formatDateLong(dateStr) {
    if (!dateValid(dateStr || '')) return String(dateStr || '________________');
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayStr = String(day).padStart(2, '0');
    return `${dayStr} de ${months[month - 1]} de ${year}`;
  }

  function formatEmissionDate(dateStr) {
    if (!dateValid(dateStr || '')) {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = months[now.getMonth()];
      const y = now.getFullYear();
      return `${d} de ${m} de ${y}`;
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayStr = String(day).padStart(2, '0');
    return `${dayStr} de ${months[month - 1]} de ${year}`;
  }

  function defaults(now = new Date()) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      fecha_emision: `${y}-${m}-${d}`,
      coordinador: 'Inga. María Elena Campos',
      estudiantes: [
        { nombre: '', carnet: '' }
      ],
      estudiante_retiro_idx: 0
    };
  }

  function formatStudentList(list) {
    if (!list || list.length === 0) return '';
    const formatted = list.map(e => `${e.nombre} con Carnet No. ${e.carnet}`);
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} y ${formatted[1]}`;
    return `${formatted.slice(0, -1).join(', ')} y ${formatted[formatted.length - 1]}`;
  }

  function validate(letterType, v) {
    const out = {};
    const clean = key => String(v[key] ?? '').trim();

    if (!clean('carrera')) out.carrera = 'Indica el nombre de tu carrera.';
    if (!clean('numero')) out.numero = 'Indica el número de proyecto en PROMETEO.';
    if (!clean('proyecto')) out.proyecto = 'Indica el nombre oficial del proyecto.';
    if (!clean('institucion')) out.institucion = 'Indica la empresa, comunidad o institución.';
    if (!clean('tutor')) out.tutor = 'Indica el nombre del docente tutor.';
    if (!clean('coordinador')) out.coordinador = 'Indica el nombre del/la coordinador/a de subunidad.';
    if (!clean('motivo') || clean('motivo').length < 10) out.motivo = 'Redacta los motivos de la solicitud (mínimo 10 caracteres).';

    if (!clean('inicio')) out.inicio = 'Indica la fecha de inicio del proyecto.';
    else if (!dateValid(clean('inicio'))) out.inicio = 'Escribe una fecha válida.';

    if (!clean('fin')) out.fin = 'Indica la fecha de finalización del proyecto.';
    else if (!dateValid(clean('fin'))) out.fin = 'Escribe una fecha válida.';

    if (dateValid(clean('inicio')) && dateValid(clean('fin')) && clean('fin') < clean('inicio')) {
      out.fin = 'La fecha de finalización no puede ser anterior a la de inicio.';
    }

    if (clean('fecha_emision') && !dateValid(clean('fecha_emision'))) {
      out.fecha_emision = 'Escribe una fecha de emisión válida.';
    }

    // Validación de estudiantes
    if (Array.isArray(v.estudiantes) && v.estudiantes.length > 0) {
      const carnetsSet = new Set();
      v.estudiantes.forEach((est, idx) => {
        const nom = String(est?.nombre ?? '').trim();
        const car = String(est?.carnet ?? '').trim().toUpperCase();
        if (!nom) out[`estudiante_${idx}_nombre`] = `Indica el nombre del estudiante ${idx + 1}.`;
        if (!car) out[`estudiante_${idx}_carnet`] = `Indica el carnet del estudiante ${idx + 1}.`;
        else if (!/^[A-Z0-9._-]+$/i.test(car)) out[`estudiante_${idx}_carnet`] = `El carnet ${car} no es válido.`;
        else if (carnetsSet.has(car)) out[`estudiante_${idx}_carnet`] = `El carnet ${car} está repetido.`;
        else carnetsSet.add(car);
      });

      if (letterType === 'retiro') {
        if (v.estudiantes.length < 2) {
          out.estudiantes = 'Para solicitar el retiro se requieren al menos 2 integrantes (el que se retira y quien continúa).';
        }
        const rIdx = Number(v.estudiante_retiro_idx ?? -1);
        if (Number.isNaN(rIdx) || rIdx < 0 || rIdx >= v.estudiantes.length) {
          out.estudiante_retiro = 'Selecciona cuál de los estudiantes será retirado del proyecto.';
        }
      }
    } else {
      // Modo formulario clásico o plano
      if (letterType === 'retiro') {
        if (!clean('estudiante_retiro_nombre')) out.estudiante_retiro_nombre = 'Indica el nombre completo del alumno a retirar.';
        if (!clean('estudiante_retiro_carnet')) out.estudiante_retiro_carnet = 'Indica el carnet del alumno a retirar.';
        if (!clean('estudiantes_activos') && !clean('nombre_estudiante_1')) {
          out.estudiantes_activos = 'Indica los nombres y carnets de los integrantes que continúan y firman.';
        }
      } else {
        if (!clean('nombre')) out.nombre = 'Escribe tu nombre completo.';
        if (!clean('carnet')) out.carnet = 'Escribe tu número de carnet (DUE).';
        else if (!/^[a-z0-9._-]+$/i.test(clean('carnet'))) out.carnet = 'Escribe un carnet válido, sin espacios.';
      }
    }

    return out;
  }

  function payload(letterType, v) {
    const issues = validate(letterType, v);
    if (Object.keys(issues).length > 0) {
      const err = new Error('Revisa los datos del formulario antes de generar la carta.');
      err.issues = issues;
      throw err;
    }

    const clean = key => String(v[key] ?? '').trim();
    const data = {
      fecha_emision: formatEmissionDate(clean('fecha_emision')),
      carrera: clean('carrera'),
      numero: clean('numero'),
      inicio: formatDateLong(clean('inicio')),
      fin: formatDateLong(clean('fin')),
      proyecto: clean('proyecto'),
      institucion: clean('institucion'),
      tutor: clean('tutor'),
      coordinador: clean('coordinador'),
      motivo: clean('motivo')
    };

    if (letterType === 'retiro') {
      if (Array.isArray(v.estudiantes) && v.estudiantes.length >= 2) {
        let rIdx = Number(v.estudiante_retiro_idx ?? -1);
        if (Number.isNaN(rIdx) || rIdx < 0 || rIdx >= v.estudiantes.length) {
          rIdx = v.estudiantes.length - 1;
        }
        const ret = v.estudiantes[rIdx];
        const activos = v.estudiantes.filter((_, idx) => idx !== rIdx);

        data.estudiante_retiro_nombre = String(ret.nombre).trim();
        data.estudiante_retiro_carnet = String(ret.carnet).trim().toUpperCase();
        data.estudiantes_activos = formatStudentList(activos);
        data.firmas_estudiantes = activos.map(e => ({
          nombre: String(e.nombre).trim(),
          carnet: String(e.carnet).trim().toUpperCase()
        }));

        if (activos.length === 1) {
          data.presentacion_solicitante = `Yo, ${activos[0].nombre} con Carnet No. ${activos[0].carnet}`;
          data.estudiante_condicion = 'estudiante';
          data.verbo_solicitud = 'solicito';
        } else {
          data.presentacion_solicitante = `Nosotros, ${data.estudiantes_activos}`;
          data.estudiante_condicion = 'estudiantes';
          data.verbo_solicitud = 'solicitamos';
        }

        data.nombre_estudiante_1 = activos[0]?.nombre || '';
        data.nombre_estudiante_2 = activos[1]?.nombre || '';
      } else {
        // Fallback plano
        data.estudiante_retiro_nombre = clean('estudiante_retiro_nombre');
        data.estudiante_retiro_carnet = clean('estudiante_retiro_carnet');
        data.estudiantes_activos = clean('estudiantes_activos') || clean('nombre_estudiante_1');
        data.presentacion_solicitante = `Nosotros, ${data.estudiantes_activos}`;
        data.estudiante_condicion = 'estudiantes';
        data.verbo_solicitud = 'solicitamos';
        data.nombre_estudiante_1 = clean('nombre_estudiante_1') || clean('estudiantes_activos');
        data.nombre_estudiante_2 = clean('nombre_estudiante_2') || clean('nombre_estudiante_1');
        data.firmas_estudiantes = [];
        if (data.nombre_estudiante_1) data.firmas_estudiantes.push({ nombre: data.nombre_estudiante_1, carnet: '' });
        if (data.nombre_estudiante_2 && data.nombre_estudiante_2 !== data.nombre_estudiante_1) {
          data.firmas_estudiantes.push({ nombre: data.nombre_estudiante_2, carnet: '' });
        }
      }
    } else {
      // Eliminación, Ampliación, Prórrogas
      let lista = [];
      if (Array.isArray(v.estudiantes) && v.estudiantes.length > 0) {
        lista = v.estudiantes.map(e => ({
          nombre: String(e.nombre || '').trim(),
          carnet: String(e.carnet || '').trim().toUpperCase()
        }));
      } else {
        lista = [{
          nombre: clean('nombre'),
          carnet: clean('carnet').toUpperCase()
        }];
      }

      data.nombre = lista[0].nombre;
      data.carnet = lista[0].carnet;
      data.firmas_estudiantes = lista;

      if (lista.length === 1) {
        data.presentacion_solicitante = `Yo, ${lista[0].nombre}. Con Carnet No. ${lista[0].carnet}`;
        data.estudiante_condicion = 'estudiante';
        data.verbo_solicitud = 'solicito';
      } else {
        data.presentacion_solicitante = `Nosotros, ${formatStudentList(lista)}`;
        data.estudiante_condicion = 'estudiantes';
        data.verbo_solicitud = 'solicitamos';
      }
    }

    return data;
  }

  function generate(template, letterType, v, dependencies) {
    const PizZip = dependencies?.PizZip || root.PizZip;
    const Docxtemplater = dependencies?.Docxtemplater || root.docxtemplater;

    if (typeof PizZip !== 'function' || typeof Docxtemplater !== 'function') {
      throw new Error('No se cargó el motor de Word (PizZip o Docxtemplater).');
    }

    const data = payload(letterType, v);
    let doc;
    try {
      const zip = typeof template === 'string'
        ? new PizZip(template, { base64: true })
        : new PizZip(template);

      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter(part) {
          return '';
        }
      });
      doc.render(data);
    } catch (error) {
      throw new Error('Error al procesar la plantilla Word: ' + (error.message || error));
    }

    return doc.getZip().generate({
      type: 'uint8array',
      compression: 'DEFLATE',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  function demo(letterType) {
    const base = {
      carrera: 'Ingeniería de Sistemas Informáticos',
      numero: '15-2025',
      proyecto: 'Sistema Web para el Control de Expedientes Estudiantiles',
      institucion: 'Alcaldía Municipal de San Miguel',
      inicio: '2025-08-01',
      fin: '2026-03-15',
      tutor: 'Ing. Carlos René Gómez',
      coordinador: 'Inga. María Elena Campos',
      fecha_emision: new Date().toISOString().slice(0, 10)
    };

    switch (letterType) {
      case 'eliminacion':
        return {
          ...base,
          nombre: 'Juan Carlos Pérez Sandoval',
          carnet: 'PS20001',
          estudiantes: [
            { nombre: 'Juan Carlos Pérez Sandoval', carnet: 'PS20001' },
            { nombre: 'Carlos René Gómez Henríquez', carnet: 'GH20002' }
          ],
          motivo: 'debido a la reestructuración interna de la institución contraparte y cierre temporal de la oficina asignada para el desarrollo del proyecto, lo cual imposibilita dar continuidad a las metas programadas'
        };
      case 'retiro':
        return {
          ...base,
          estudiantes: [
            { nombre: 'José Elías Sandoval Paiz', carnet: 'SP23077' },
            { nombre: 'José Santo Sandoval Guevara', carnet: 'SG23077' },
            { nombre: 'Marvin Mauricio Molina Maldonado', carnet: 'MM23077' }
          ],
          estudiante_retiro_idx: 2,
          estudiante_retiro_nombre: 'Marvin Mauricio Molina Maldonado',
          estudiante_retiro_carnet: 'MM23077',
          estudiantes_activos: 'José Elías Sandoval Paiz con Carnet No. SP23077 y José Santo Sandoval Guevara con Carnet No. SG23077',
          nombre_estudiante_1: 'José Elías Sandoval Paiz',
          nombre_estudiante_2: 'José Santo Sandoval Guevara',
          motivo: 'debido a que el estudiante se encuentra atravesando una situación económica difícil que le obliga a asumir responsabilidades laborales de tiempo completo'
        };
      case 'ampliacion':
        return {
          ...base,
          nombre: 'Juan Carlos Pérez Sandoval',
          carnet: 'PS20001',
          estudiantes: [
            { nombre: 'Juan Carlos Pérez Sandoval', carnet: 'PS20001' }
          ],
          motivo: 'debido a retrasos justificados en la entrega de insumos técnicos y licencias institucionales por parte de la entidad receptora, requiriendo 60 días adicionales para concluir la fase de pruebas'
        };
      case 'prorroga15':
        return {
          ...base,
          nombre: 'Juan Carlos Pérez Sandoval',
          carnet: 'PS20001',
          estudiantes: [
            { nombre: 'Juan Carlos Pérez Sandoval', carnet: 'PS20001' }
          ],
          motivo: 'debido a que se requirieron correcciones metodológicas profundas solicitadas por el tutor asignado sobre el cronograma y objetivos antes de formalizar la entrega definitiva ante la UPS'
        };
      case 'prorroga3m':
        return {
          ...base,
          nombre: 'Juan Carlos Pérez Sandoval',
          carnet: 'PS20001',
          estudiantes: [
            { nombre: 'Juan Carlos Pérez Sandoval', carnet: 'PS20001' }
          ],
          motivo: 'debido a demoras en la recolección y firma de las constancias de evaluación y cartas de cumplimiento por parte de las autoridades de la institución receptora'
        };
      case 'prorroga6m':
        return {
          ...base,
          nombre: 'Juan Carlos Pérez Sandoval',
          carnet: 'PS20001',
          estudiantes: [
            { nombre: 'Juan Carlos Pérez Sandoval', carnet: 'PS20001' }
          ],
          motivo: 'debido a quebrantos de salud debidamente comprobados y dificultades administrativas en la obtención de respaldos fotográficos y firmas originales de la contraparte'
        };
      default:
        return base;
    }
  }

  const api = { formatDateLong, formatEmissionDate, formatStudentList, defaults, validate, payload, generate, demo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SIGPSCartasDocumento = api;
})(typeof window === 'undefined' ? globalThis : window);
