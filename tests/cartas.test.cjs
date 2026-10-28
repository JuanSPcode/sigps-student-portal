const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const cartasData = require('../js/cartas-data.js');
const cartasDoc = require('../js/cartas-documento.js');
const plantillas = require('../js/cartas-plantillas.js');

const dependencies = { PizZip, Docxtemplater };

test('catálogo de cartas contiene las 6 cartas oficiales con sus rutas y metadatos', () => {
  const keys = Object.keys(cartasData.cartas);
  assert.equal(keys.length, 6);
  assert.deepEqual(keys, ['eliminacion', 'retiro', 'ampliacion', 'prorroga15', 'prorroga3m', 'prorroga6m']);

  for (const key of keys) {
    const carta = cartasData.cartas[key];
    assert.ok(carta.title);
    assert.ok(carta.cuando);
    assert.ok(carta.fileDocx);
    assert.ok(carta.filePdf);
    // Verify files exist on disk
    assert.ok(fs.existsSync(path.join(__dirname, '..', carta.fileDocx)), `Plantilla ${carta.fileDocx} no existe`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', carta.filePdf)), `Ejemplo ${carta.filePdf} no existe`);
    assert.ok(plantillas[key], `Plantilla base64 para ${key} no existe`);
  }
});

test('validación rechaza campos obligatorios vacíos o fechas inválidas', () => {
  const errs = cartasDoc.validate('eliminacion', {});
  assert.ok(errs.carrera);
  assert.ok(errs.numero);
  assert.ok(errs.proyecto);
  assert.ok(errs.nombre);
  assert.ok(errs.carnet);
  assert.ok(errs.inicio);
  assert.ok(errs.fin);
  assert.ok(errs.motivo);

  const groupErrs = cartasDoc.validate('retiro', {});
  assert.ok(groupErrs.estudiantes_activos);
  assert.ok(groupErrs.estudiante_retiro_nombre);
  assert.ok(groupErrs.estudiante_retiro_carnet);
});

test('generación de Word para las 6 cartas produce documentos válidos y sin etiquetas pendientes', () => {
  for (const key of Object.keys(cartasData.cartas)) {
    const demoData = cartasDoc.demo(key);
    const templateBase64 = plantillas[key];
    const docBytes = cartasDoc.generate(templateBase64, key, demoData, dependencies);

    assert.ok(docBytes instanceof Uint8Array);
    assert.ok(docBytes.length > 50000);

    const zip = new PizZip(docBytes);
    const xml = zip.file('word/document.xml').asText();

    // No leftover curly brace tags
    const leftover = xml.match(/\{[a-zA-Z0-9_#\/]+\}/g);
    assert.equal(leftover, null, `Etiquetas sobrantes en ${key}: ${leftover}`);

    // Check project data is rendered
    assert.ok(xml.includes(demoData.numero));
    assert.ok(xml.includes(demoData.carrera));

    if (key === 'retiro') {
      assert.ok(xml.includes(demoData.estudiante_retiro_nombre));
      assert.ok(xml.includes(demoData.estudiante_retiro_carnet));
    } else {
      assert.ok(xml.includes(demoData.nombre));
      assert.ok(xml.includes(demoData.carnet));
    }
  }
});

test('eliminación de proyecto grupal incluye la firma de todos los estudiantes', () => {
  const data = {
    carrera: 'Ingeniería de Sistemas Informáticos',
    numero: '22-2025',
    proyecto: 'Plataforma de Gestión Social',
    institucion: 'Alcaldía Municipal de San Miguel',
    inicio: '2025-08-01',
    fin: '2026-03-15',
    tutor: 'Ing. Carlos René Gómez',
    coordinador: 'Inga. María Elena Campos',
    fecha_emision: '2026-10-27',
    motivo: 'debido a cambios sustanciales en las prioridades de la institución contraparte',
    estudiantes: [
      { nombre: 'Juan Carlos Pérez', carnet: 'PS20001' },
      { nombre: 'Ana María Rodríguez', carnet: 'AR20002' },
      { nombre: 'Luis Alberto Hernández', carnet: 'LH20003' }
    ]
  };

  const docBytes = cartasDoc.generate(plantillas.eliminacion, 'eliminacion', data, dependencies);
  assert.ok(docBytes instanceof Uint8Array);

  const zip = new PizZip(docBytes);
  const xml = zip.file('word/document.xml').asText();

  // All 3 students are mentioned in presentation and each has a signature block
  assert.ok(xml.includes('Nosotros, Juan Carlos Pérez con Carnet No. PS20001, Ana María Rodríguez con Carnet No. AR20002 y Luis Alberto Hernández con Carnet No. LH20003'));
  assert.ok(xml.includes('solicitamos la ELIMINACIÓN DEL PROYECTO'));
  assert.ok(xml.includes('Juan Carlos Pérez'));
  assert.ok(xml.includes('Ana María Rodríguez'));
  assert.ok(xml.includes('Luis Alberto Hernández'));
  assert.ok(xml.includes('PS20001'));
  assert.ok(xml.includes('AR20002'));
  assert.ok(xml.includes('LH20003'));
});

test('retiro de estudiante solicita integrantes, señala quién se retira y firma todo el resto del equipo', () => {
  const data = {
    carrera: 'Licenciatura en Ciencias Jurídicas',
    numero: '#330099',
    proyecto: 'Apoyo en Actividades Administrativas y Jurídicas',
    institucion: 'Fiscalía General de la República',
    inicio: '2025-08-07',
    fin: '2026-03-03',
    tutor: 'Lic. Carlos Arnoldo Díaz Guevara',
    coordinador: 'Ernesto de la Paz Hernández Balenciaga',
    fecha_emision: '2026-10-27',
    motivo: 'el estudiante se encuentra atravesando una situación laboral y económica demandante',
    estudiantes: [
      { nombre: 'José Elías Sandoval Paiz', carnet: 'SP23077' },
      { nombre: 'José Santo Sandoval Guevara', carnet: 'SG23077' },
      { nombre: 'Marvin Mauricio Molina Maldonado', carnet: 'MM23077' }
    ],
    estudiante_retiro_idx: 2 // Marvin se retira
  };

  const docBytes = cartasDoc.generate(plantillas.retiro, 'retiro', data, dependencies);
  assert.ok(docBytes instanceof Uint8Array);

  const zip = new PizZip(docBytes);
  const xml = zip.file('word/document.xml').asText();

  // Marvin is the withdrawn student
  assert.ok(xml.includes('RETIRO DEL ESTUDIANTE Marvin Mauricio Molina Maldonado con Carnet No. MM23077'));
  // Continuing students are the applicants
  assert.ok(xml.includes('Nosotros, José Elías Sandoval Paiz con Carnet No. SP23077 y José Santo Sandoval Guevara con Carnet No. SG23077'));
  // Continuing students sign
  assert.ok(xml.includes('José Elías Sandoval Paiz'));
  assert.ok(xml.includes('José Santo Sandoval Guevara'));
  assert.ok(xml.includes('SP23077'));
  assert.ok(xml.includes('SG23077'));
});
