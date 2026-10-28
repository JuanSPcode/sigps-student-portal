/* Asistente y Catálogo de Cartas Oficiales FMO-UES */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('cartas-form') && !document.getElementById('cartas-catalog-view')) return;
  if (!window.SIGPSCartasData || !window.SIGPSCartasDocumento) return;

  const { cartas, steps } = window.SIGPSCartasData;
  const docEngine = window.SIGPSCartasDocumento;
  const plantillas = window.SIGPSCartasPlantillas;
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = id => document.getElementById(id);

  let viewMode = 'catalog'; // 'catalog' | 'wizard'
  let activeCarta = 'eliminacion';
  let currentStep = 0; // 0: Estudiantes, 1: Proyecto, 2: Motivo, 3: Descarga
  let values = docEngine.defaults();
  let generatedBytes = null;
  let downloadUrl = null;

  function scrollToSection(targetId = 'cartas') {
    const target = $(targetId) || $('cartas-builder-title');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Catálogo académico
  const catalogAPI = window.SIGPSCatalogoAcademico;
  const usesCatalog = Boolean(window.SIGPSApiConfig?.localCatalog || window.SIGPSApiConfig?.baseURL);
  let storage; try { storage = window.localStorage; } catch {}
  const catalogClient = catalogAPI?.createClient ? catalogAPI.createClient({
    baseURL: window.SIGPSApiConfig?.baseURL,
    localCatalog: window.SIGPSApiConfig?.localCatalog,
    storage
  }) : null;
  let catalogState = null, catalogLoading = false, catalogError = '';

  async function loadCatalog() {
    if (!catalogClient || catalogLoading) return;
    catalogLoading = true; catalogError = '';
    try { catalogState = await catalogClient.load(); }
    catch (e) { catalogError = e.message; }
    finally {
      catalogLoading = false;
      if (viewMode === 'wizard' && currentStep === 0) renderWizardStep();
    }
  }

  function academicErrors() {
    if (!usesCatalog || !catalogAPI) return {};
    try {
      if (!catalogState) throw new Error(catalogLoading ? 'Cargando carreras...' : catalogError || 'Catálogo no cargado.');
      const selected = catalogAPI.snapshot(catalogState.catalog, values.id_departamento, values.id_carrera, catalogState);
      Object.assign(values, selected, { catalogoAcademico: selected });
      return {};
    } catch (e) { return { id_carrera: e.message }; }
  }

  function academicFields() {
    if (!catalogAPI || !usesCatalog) {
      return `
        <div class="form-field wide">
          <label for="field-carrera">Carrera completa *</label>
          <input id="field-carrera" type="text" name="carrera" data-field="carrera" value="${escape(values.carrera || '')}" required placeholder="Ej. Ingeniería de Sistemas Informáticos">
          <span class="field-error" id="error-carrera"></span>
        </div>`;
    }
    return catalogAPI.renderFields({
      state: catalogState,
      values,
      loading: catalogLoading,
      error: catalogError,
      esc: escape,
      prefix: 'field',
      dataAttribute: 'data-field',
      errorPrefix: 'error-',
      retryId: 'cartas-catalog-retry'
    });
  }

  function initFromURL() {
    const hash = window.location.hash.replace('#', '').trim();
    const params = new URLSearchParams(window.location.search);
    const paramCarta = params.get('carta') || params.get('doc');

    const matchedCarta = (paramCarta && cartas[paramCarta])
      ? paramCarta
      : (cartas[hash] ? hash : null);

    if (matchedCarta) {
      activeCarta = matchedCarta;
      viewMode = 'wizard';
      currentStep = 0;
      initStudentsForLetter(activeCarta);
    } else {
      viewMode = 'catalog';
    }
  }

  function initStudentsForLetter(letterKey) {
    if (!Array.isArray(values.estudiantes) || values.estudiantes.length === 0) {
      values.estudiantes = [{ nombre: values.nombre || '', carnet: values.carnet || '' }];
    }
    if (letterKey === 'retiro') {
      if (values.estudiantes.length < 2) {
        values.estudiantes.push({ nombre: '', carnet: '' });
      }
      if (typeof values.estudiante_retiro_idx !== 'number' || values.estudiante_retiro_idx >= values.estudiantes.length) {
        values.estudiante_retiro_idx = values.estudiantes.length - 1;
      }
    }
  }

  function saveCurrentStepFields() {
    const form = $('cartas-form');
    if (!form || viewMode !== 'wizard') return;

    // Campos data-field directos
    form.querySelectorAll('[data-field]').forEach(input => {
      values[input.dataset.field] = input.value.trim();
    });

    // Campos de estudiantes dinámicos
    if (currentStep === 0) {
      const studentInputs = form.querySelectorAll('[data-student-idx]');
      studentInputs.forEach(input => {
        const idx = Number(input.dataset.studentIdx);
        const fld = input.dataset.studentField;
        if (!values.estudiantes[idx]) {
          values.estudiantes[idx] = { nombre: '', carnet: '' };
        }
        values.estudiantes[idx][fld] = input.value.trim();
      });

      // Retiro radio
      const checkedRetiro = form.querySelector('input[name="estudiante_retiro_idx"]:checked');
      if (checkedRetiro) {
        values.estudiante_retiro_idx = Number(checkedRetiro.value);
      }
    }
  }

  function renderCatalogView() {
    const catalogView = $('cartas-catalog-view');
    const wizardView = $('cartas-wizard-view');
    if (!catalogView) return;

    if (catalogView) catalogView.hidden = false;
    if (wizardView) wizardView.hidden = true;

    const catalogGrid = $('cartas-catalog-grid') || catalogView.querySelector('.letter-selector-grid');
    if (catalogGrid) {
      catalogGrid.innerHTML = Object.values(cartas).map(c => `
        <article class="letter-card" data-letter-id="${c.id}">
          <div class="letter-card-top">
            <span class="letter-badge">${c.badge}</span>
            <span class="letter-num">0${c.docNum}</span>
          </div>
          <h4 class="letter-title">${c.title}</h4>
          <p class="letter-desc">${c.desc}</p>
          <div class="carta-card-actions">
            <button type="button" class="carta-btn-generate" data-action="generate" data-letter-id="${c.id}">
              Generar carta →
            </button>
            <div class="carta-btn-downloads">
              <a href="${c.filePdf}" download class="carta-btn-sub" title="Descargar ejemplo oficial resuelto en PDF">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Descargar ejemplo
              </a>
              <a href="${c.fileDocx}" download class="carta-btn-sub" title="Descargar plantilla Word oficial en blanco">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Descargar plantilla
              </a>
            </div>
          </div>
        </article>
      `).join('');

      catalogGrid.querySelectorAll('.carta-btn-generate').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          activeCarta = btn.dataset.letterId;
          initStudentsForLetter(activeCarta);
          viewMode = 'wizard';
          currentStep = 0;
          if (usesCatalog && !catalogState) loadCatalog();
          render();
          scrollToSection('cartas-wizard-view');
        });
      });
    }
  }

  function renderProgress() {
    const progressEl = $('cartas-progress');
    if (!progressEl) return;
    progressEl.innerHTML = steps.map((s, idx) => {
      const isCurrent = idx === currentStep;
      return `<li${isCurrent ? ' aria-current="step"' : ''}>${s.number}. ${s.title}</li>`;
    }).join('');
    const stepInd = $('cartas-step-indicator');
    if (stepInd) stepInd.textContent = `Paso ${currentStep + 1} de ${steps.length}`;
  }

  function showErrors(errs) {
    const errorBox = $('cartas-errors');
    if (!errorBox) return false;
    const keys = Object.keys(errs);
    if (keys.length === 0) {
      errorBox.hidden = true;
      return false;
    }
    errorBox.innerHTML = '<strong>Revisa los siguientes campos:</strong><ul>' +
      keys.map(k => `<li>${escape(errs[k])}</li>`).join('') + '</ul>';
    errorBox.hidden = false;

    keys.forEach(k => {
      const field = $(`field-${k}`);
      const errSpan = $(`error-${k}`);
      if (field) field.setAttribute('aria-invalid', 'true');
      if (errSpan) errSpan.textContent = errs[k];
    });

    errorBox.focus();
    return true;
  }

  function clearErrors() {
    const errorBox = $('cartas-errors');
    if (errorBox) errorBox.hidden = true;
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  }

  function renderStudentsSection() {
    const isRetiro = activeCarta === 'retiro';
    const isEliminacion = activeCarta === 'eliminacion';
    const list = values.estudiantes;
    const rIdx = values.estudiante_retiro_idx ?? (list.length - 1);

    let helperText = '';
    let sectionTitle = '';
    if (isRetiro) {
      sectionTitle = 'Integrantes del equipo de proyecto';
      helperText = 'Ingresa todos los estudiantes del proyecto e indica quién será retirado. Todos los estudiantes que continúan deben firmar la solicitud.';
    } else if (isEliminacion) {
      sectionTitle = 'Estudiantes del proyecto';
      helperText = 'Para solicitar la eliminación del proyecto se requiere la firma de todos los estudiantes inscritos en el proyecto.';
    } else {
      sectionTitle = 'Estudiante o equipo solicitante';
      helperText = 'Ingresa los datos del estudiante o agrega integrantes si el proyecto se realiza en grupo.';
    }

    let cardsHTML = list.map((est, idx) => {
      const isRetirado = isRetiro && idx === rIdx;
      return `
        <div class="cartas-student-card ${isRetirado ? 'is-retirado' : ''}" data-idx="${idx}">
          <div class="cartas-student-header">
            <div class="cartas-student-title">
              <strong>Estudiante ${idx + 1}</strong>
              ${isRetiro ? `
                <label class="student-retiro-label">
                  <input type="radio" name="estudiante_retiro_idx" value="${idx}" ${isRetirado ? 'checked' : ''} data-action="toggle-retiro">
                  <span class="student-status-badge ${isRetirado ? 'badge-danger' : 'badge-ok'}">
                    ${isRetirado ? '🔴 Se retira del proyecto' : '🟢 Continúa y firma la solicitud'}
                  </span>
                </label>
              ` : `
                <span class="student-status-badge badge-ok">✍️ Firma la solicitud</span>
              `}
            </div>
            ${list.length > (isRetiro ? 2 : 1) ? `
              <button type="button" class="btn-remove-student" data-action="remove-student" data-idx="${idx}" title="Quitar estudiante">
                ✕ Quitar
              </button>
            ` : ''}
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label for="student-${idx}-nombre">Nombre completo *</label>
              <input id="student-${idx}-nombre" type="text" data-student-idx="${idx}" data-student-field="nombre" value="${escape(est.nombre || '')}" required placeholder="Ej. Juan Carlos Pérez">
              <span class="field-error" id="error-estudiante_${idx}_nombre"></span>
            </div>
            <div class="form-field">
              <label for="student-${idx}-carnet">Carnet (DUE) *</label>
              <input id="student-${idx}-carnet" type="text" data-student-idx="${idx}" data-student-field="carnet" value="${escape(est.carnet || '')}" required placeholder="Ej. PS20001" style="text-transform:uppercase">
              <span class="field-error" id="error-estudiante_${idx}_carnet"></span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cartas-group-card">
        <div class="cartas-group-header">
          <div>
            <h4 class="cartas-group-title" style="margin:0 0 4px">${sectionTitle}</h4>
            <p class="small-copy" style="margin:0">${helperText}</p>
          </div>
          <span class="field-error" id="error-estudiantes"></span>
        </div>

        <div class="cartas-students-list" id="cartas-students-list">
          ${cardsHTML}
        </div>

        ${list.length < 5 ? `
          <button type="button" class="btn-add-student" id="btn-add-student">
            + Agregar otro estudiante ${isRetiro ? 'al equipo' : 'al proyecto'}
          </button>
        ` : ''}

        ${isRetiro ? `
          <div class="cartas-retiro-summary-note">
            <strong>Resumen del trámite:</strong>
            ${list[rIdx]?.nombre ? `El alumno <strong>${escape(list[rIdx].nombre)}</strong> (${escape(list[rIdx].carnet || 'DUE')}) causará baja del proyecto.` : 'Selecciona el estudiante que se retira.'}
            Firmarán la solicitud: <strong>${escape(list.filter((_, i) => i !== rIdx).map(e => e.nombre || 'Integrante').join(', ') || 'los demás integrantes')}</strong>.
          </div>
        ` : ''}
      </div>
    `;
  }

  function attachStudentsListeners() {
    const listContainer = $('cartas-students-list');
    if (!listContainer) return;

    // Cambios de texto
    listContainer.querySelectorAll('[data-student-idx]').forEach(input => {
      input.addEventListener('input', () => {
        const idx = Number(input.dataset.studentIdx);
        const fld = input.dataset.studentField;
        if (values.estudiantes[idx]) {
          values.estudiantes[idx][fld] = input.value.trim();
        }
      });
    });

    // Radio de retiro
    listContainer.querySelectorAll('input[name="estudiante_retiro_idx"]').forEach(radio => {
      radio.addEventListener('change', () => {
        saveCurrentStepFields();
        values.estudiante_retiro_idx = Number(radio.value);
        renderWizardStep();
      });
    });

    // Botones quitar estudiante
    listContainer.querySelectorAll('[data-action="remove-student"]').forEach(btn => {
      btn.addEventListener('click', () => {
        saveCurrentStepFields();
        const removeIdx = Number(btn.dataset.idx);
        values.estudiantes.splice(removeIdx, 1);
        if (values.estudiante_retiro_idx >= values.estudiantes.length) {
          values.estudiante_retiro_idx = values.estudiantes.length - 1;
        }
        renderWizardStep();
      });
    });

    // Botón agregar estudiante
    $('btn-add-student')?.addEventListener('click', () => {
      saveCurrentStepFields();
      if (values.estudiantes.length < 5) {
        values.estudiantes.push({ nombre: '', carnet: '' });
      }
      renderWizardStep();
    });
  }

  function renderWizardStep() {
    renderProgress();
    clearErrors();

    const catalogView = $('cartas-catalog-view');
    const wizardView = $('cartas-wizard-view');
    const form = $('cartas-form');
    const fieldsContainer = $('cartas-fields');
    const reviewContainer = $('cartas-review');
    const prevBtn = $('cartas-back');
    const nextBtn = $('cartas-next');
    const titleEl = $('cartas-builder-title');

    if (catalogView) catalogView.hidden = true;
    if (wizardView) wizardView.hidden = false;
    if (form) form.hidden = currentStep === 3;
    if (reviewContainer) reviewContainer.hidden = currentStep !== 3;

    const currentCarta = cartas[activeCarta];

    // Topbar update
    if (titleEl) {
      titleEl.textContent = `Carta 0${currentCarta.docNum} · ${currentCarta.title}`;
    }

    $('cartas-btn-catalog')?.addEventListener('click', () => {
      saveCurrentStepFields();
      viewMode = 'catalog';
      render();
      scrollToSection('cartas');
    });

    // Paso 1: Estudiantes y Carrera
    if (currentStep === 0) {
      if (prevBtn) {
        prevBtn.hidden = false;
        prevBtn.textContent = '← Catálogo de cartas';
      }
      if (nextBtn) nextBtn.textContent = 'Continuar a Proyecto →';

      if (fieldsContainer) {
        fieldsContainer.innerHTML = `
          <div class="cartas-group-card">
            <div class="cartas-group-title">Carrera académica</div>
            ${academicFields()}
          </div>
          ${renderStudentsSection()}
        `;
        attachStudentsListeners();
      }
    }

    // Paso 2: Datos de PROMETEO
    else if (currentStep === 1) {
      if (prevBtn) {
        prevBtn.hidden = false;
        prevBtn.textContent = '← Anterior';
      }
      if (nextBtn) nextBtn.textContent = 'Continuar a Motivo →';

      if (fieldsContainer) {
        fieldsContainer.innerHTML = `
          <div class="cartas-group-card">
            <div class="cartas-group-title">Identificación del proyecto en PROMETEO</div>
            <div class="form-grid">
              <div class="form-field">
                <label for="field-numero">Número de proyecto *</label>
                <input id="field-numero" type="text" name="numero" data-field="numero" value="${escape(values.numero || '')}" required placeholder="Ej. 15-2025 o #330099">
                <span class="field-error" id="error-numero"></span>
              </div>
              <div class="form-field">
                <label for="field-institucion">Institución o contraparte receptora *</label>
                <input id="field-institucion" type="text" name="institucion" data-field="institucion" value="${escape(values.institucion || '')}" required placeholder="Ej. Alcaldía Municipal de San Miguel">
                <span class="field-error" id="error-institucion"></span>
              </div>
            </div>
            <div class="form-field wide">
              <label for="field-proyecto">Nombre oficial del proyecto *</label>
              <input id="field-proyecto" type="text" name="proyecto" data-field="proyecto" value="${escape(values.proyecto || '')}" required placeholder="Ej. Sistema de Información para la Gestión de Expedientes">
              <span class="field-error" id="error-proyecto"></span>
            </div>
          </div>
          <div class="cartas-group-card">
            <div class="cartas-group-title">Período de ejecución y docentes asignados</div>
            <div class="form-grid">
              <div class="form-field">
                <label for="field-inicio">Fecha de inicio *</label>
                <input id="field-inicio" type="date" name="inicio" data-field="inicio" value="${escape(values.inicio || '')}" required>
                <span class="field-error" id="error-inicio"></span>
              </div>
              <div class="form-field">
                <label for="field-fin">Fecha de finalización *</label>
                <input id="field-fin" type="date" name="fin" data-field="fin" value="${escape(values.fin || '')}" required>
                <span class="field-error" id="error-fin"></span>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-field">
                <label for="field-tutor">Docente tutor asignado *</label>
                <input id="field-tutor" type="text" name="tutor" data-field="tutor" value="${escape(values.tutor || '')}" required placeholder="Ej. Ing. Carlos René Gómez">
                <span class="field-error" id="error-tutor"></span>
              </div>
              <div class="form-field">
                <label for="field-coordinador">Coordinador/a de Sub-Unidad *</label>
                <input id="field-coordinador" type="text" name="coordinador" data-field="coordinador" value="${escape(values.coordinador || 'Inga. María Elena Campos')}" required placeholder="Ej. Inga. María Elena Campos">
                <span class="field-error" id="error-coordinador"></span>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Paso 3: Motivo y Fecha
    else if (currentStep === 2) {
      if (prevBtn) {
        prevBtn.hidden = false;
        prevBtn.textContent = '← Anterior';
      }
      if (nextBtn) nextBtn.textContent = 'Revisar y generar →';

      if (fieldsContainer) {
        fieldsContainer.innerHTML = `
          <div class="cartas-group-card">
            <div class="cartas-group-title">Motivo y justificación de la solicitud</div>
            <div class="form-field wide">
              <label for="field-motivo">Explicación justificada *</label>
              <textarea id="field-motivo" name="motivo" data-field="motivo" rows="5" required placeholder="Explica detalladamente las razones por las cuales se realiza esta solicitud especial.">${escape(values.motivo || '')}</textarea>
              <span class="field-error" id="error-motivo"></span>
            </div>
            <div class="form-grid">
              <div class="form-field">
                <label for="field-fecha_emision">Fecha de emisión del documento *</label>
                <input id="field-fecha_emision" type="date" name="fecha_emision" data-field="fecha_emision" value="${escape(values.fecha_emision || docEngine.defaults().fecha_emision)}" required>
                <span class="field-error" id="error-fecha_emision"></span>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Paso 4: Revisión y Generación
    else if (currentStep === 3) {
      let payloadData;
      try {
        payloadData = docEngine.payload(activeCarta, values);
      } catch (e) {
        showErrors(e.issues || { general: e.message });
        currentStep = 0;
        renderWizardStep();
        return;
      }

      if (reviewContainer) {
        const isRetiro = activeCarta === 'retiro';
        reviewContainer.innerHTML = `
          <div class="letter-review-card">
            <div class="letter-review-header">
              <h3>Carta 0${currentCarta.docNum} · ${currentCarta.title}</h3>
              <p>Dirigida a: <strong>${escape(currentCarta.destinatario)}</strong></p>
            </div>
            <dl class="letter-review-dl">
              ${isRetiro ? `
                <dt>Estudiante a retirar:</dt>
                <dd><strong style="color:#b91c1c">${escape(payloadData.estudiante_retiro_nombre)} (${escape(payloadData.estudiante_retiro_carnet)})</strong></dd>
                <dt>Estudiantes que firman:</dt>
                <dd>${escape(payloadData.estudiantes_activos)}</dd>
              ` : `
                <dt>Estudiantes firmantes:</dt>
                <dd>${escape(payloadData.firmas_estudiantes.map(e => `${e.nombre} (${e.carnet})`).join(', '))}</dd>
              `}
              <dt>Carrera:</dt>
              <dd>${escape(payloadData.carrera)}</dd>
              <dt>Proyecto:</dt>
              <dd>No. ${escape(payloadData.numero)} · ${escape(payloadData.proyecto)}</dd>
              <dt>Institución:</dt>
              <dd>${escape(payloadData.institucion)}</dd>
              <dt>Período:</dt>
              <dd>${escape(payloadData.inicio)} al ${escape(payloadData.fin)}</dd>
              <dt>Tutor y Coordinación:</dt>
              <dd>${escape(payloadData.tutor)} · Coord.: ${escape(payloadData.coordinador)}</dd>
              <dt>Fecha de emisión:</dt>
              <dd>Ciudad Universitaria de Oriente, ${escape(payloadData.fecha_emision)}</dd>
              <div class="letter-review-motivo">
                <strong>Motivo de la solicitud:</strong>
                <p>${escape(payloadData.motivo)}</p>
              </div>
            </dl>
          </div>

          <div class="review-download-box">
            <h3>Descarga tu documento oficial</h3>
            <p>Archivo Word (.docx) con membrete oficial, membretado institucional y espacios para firmas.</p>
            <div class="review-download-actions">
              <button type="button" id="btn-generar-word" class="flow-button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Descargar Carta en Word (.docx)
              </button>
              <a id="btn-descargar-generado" class="flow-button" style="display:none" download="carta_${activeCarta}.docx">
                Descargar archivo Word
              </a>
            </div>
            <div class="review-download-links">
              <a href="${currentCarta.filePdf}" download class="carta-btn-sub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Descargar ejemplo (.pdf)
              </a>
              <a href="${currentCarta.fileDocx}" download class="carta-btn-sub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Descargar plantilla (.docx)
              </a>
              <button type="button" id="btn-editar-datos" class="text-link">Editar datos</button>
              <span class="card-link-sep">·</span>
              <button type="button" id="btn-volver-catalogo" class="text-link">Volver al catálogo de cartas</button>
            </div>
            <p id="cartas-status-msg" class="small-copy" style="margin-top:10px;color:#851a2b" hidden></p>
          </div>
        `;

        $('btn-editar-datos')?.addEventListener('click', () => {
          currentStep = 0;
          renderWizardStep();
          scrollToSection('cartas-wizard-view');
        });

        $('btn-volver-catalogo')?.addEventListener('click', () => {
          viewMode = 'catalog';
          render();
          scrollToSection('cartas');
        });

        const btnGen = $('btn-generar-word');
        const btnDown = $('btn-descargar-generado');
        const msg = $('cartas-status-msg');

        btnGen?.addEventListener('click', async () => {
          btnGen.disabled = true;
          btnGen.textContent = 'Generando documento...';
          if (msg) msg.hidden = true;

          try {
            const templateBase64 = plantillas && plantillas[activeCarta];
            if (!templateBase64) {
              throw new Error(`No se encontró la plantilla para la carta "${activeCarta}".`);
            }

            const bytes = docEngine.generate(templateBase64, activeCarta, values, {
              PizZip: window.PizZip,
              Docxtemplater: window.docxtemplater
            });

            const blob = new Blob([bytes], {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
            downloadUrl = URL.createObjectURL(blob);

            btnDown.href = downloadUrl;
            btnDown.download = `Carta_${currentCarta.docNum}_${activeCarta}_${Date.now()}.docx`;
            btnDown.click();

            btnGen.textContent = '✓ Documento generado (Descargar nuevamente)';
            btnGen.disabled = false;
          } catch (err) {
            console.error('Error al generar carta Word:', err);
            if (msg) {
              msg.textContent = 'Ocurrió un error al generar la carta: ' + (err.message || err);
              msg.hidden = false;
            }
            btnGen.textContent = 'Reintentar generación en Word';
            btnGen.disabled = false;
          }
        });
      }
    }
  }

  function render() {
    if (viewMode === 'catalog') {
      renderCatalogView();
    } else {
      renderWizardStep();
    }
  }

  function validateStep(stepIdx) {
    saveCurrentStepFields();
    const isRetiro = activeCarta === 'retiro';

    if (stepIdx === 0) {
      const errs = academicErrors();
      if (!values.carrera) {
        errs.carrera = 'Indica el nombre de tu carrera.';
      }

      if (!Array.isArray(values.estudiantes) || values.estudiantes.length === 0) {
        errs.estudiantes = 'Ingresa al menos un estudiante.';
      } else {
        const carnets = new Set();
        values.estudiantes.forEach((est, idx) => {
          if (!est.nombre) errs[`estudiante_${idx}_nombre`] = 'Ingresa el nombre completo.';
          if (!est.carnet) errs[`estudiante_${idx}_carnet`] = 'Ingresa el carnet (DUE).';
          else if (carnets.has(est.carnet.toUpperCase())) {
            errs[`estudiante_${idx}_carnet`] = 'Carnet repetido en el equipo.';
          } else {
            carnets.add(est.carnet.toUpperCase());
          }
        });

        if (isRetiro) {
          if (values.estudiantes.length < 2) {
            errs.estudiantes = 'Para solicitar el retiro se requieren al menos 2 integrantes (el que se retira y quien continúa).';
          }
          const rIdx = values.estudiante_retiro_idx ?? -1;
          if (rIdx < 0 || rIdx >= values.estudiantes.length) {
            errs.estudiante_retiro = 'Marca cuál estudiante se retira del proyecto.';
          }
        }
      }

      if (Object.keys(errs).length > 0) {
        showErrors(errs);
        return false;
      }
      return true;
    }

    if (stepIdx === 1) {
      const errs = {};
      if (!values.numero) errs.numero = 'Indica el número de proyecto en PROMETEO.';
      if (!values.proyecto) errs.proyecto = 'Indica el nombre oficial del proyecto.';
      if (!values.institucion) errs.institucion = 'Indica la institución receptora.';
      if (!values.inicio) errs.inicio = 'Indica la fecha de inicio.';
      if (!values.fin) errs.fin = 'Indica la fecha de finalización.';
      if (values.inicio && values.fin && values.fin < values.inicio) {
        errs.fin = 'La fecha de fin no puede ser anterior a la de inicio.';
      }
      if (!values.tutor) errs.tutor = 'Indica el nombre del docente tutor.';
      if (!values.coordinador) errs.coordinador = 'Indica el nombre de la coordinación.';

      if (Object.keys(errs).length > 0) {
        showErrors(errs);
        return false;
      }
      return true;
    }

    if (stepIdx === 2) {
      const errs = {};
      if (!values.motivo || values.motivo.length < 10) {
        errs.motivo = 'Redacta los motivos de la solicitud (mínimo 10 caracteres).';
      }
      if (!values.fecha_emision) {
        errs.fecha_emision = 'Indica la fecha de emisión del documento.';
      }
      if (Object.keys(errs).length > 0) {
        showErrors(errs);
        return false;
      }
      return true;
    }

    return true;
  }

  // Event Listeners para Form Navigation
  const form = $('cartas-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (validateStep(currentStep)) {
        currentStep++;
        renderWizardStep();
        scrollToSection('cartas-wizard-view');
      }
    });
  }

  $('cartas-back')?.addEventListener('click', () => {
    saveCurrentStepFields();
    if (currentStep === 0) {
      viewMode = 'catalog';
      render();
      scrollToSection('cartas');
    } else {
      currentStep--;
      renderWizardStep();
      scrollToSection('cartas-wizard-view');
    }
  });

  // Botón datos demo
  $('cartas-load-demo')?.addEventListener('click', () => {
    const demoData = docEngine.demo(activeCarta);
    Object.assign(values, demoData);
    renderWizardStep();
  });

  // Inicialización
  initFromURL();
  render();
});
