const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createClient, snapshot} = require('../js/catalogo-academico.js');
const root = path.join(__dirname, '..');

test('el modo estático conserva el catálogo y sus relaciones sin hacer peticiones', async () => {
  const context = {window: {}};
  vm.createContext(context);
  for (const file of ['catalogo-local.js', 'api-config.js']) vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  const config = context.window.SIGPSApiConfig;
  assert.equal(config.templateMode, 'static');
  assert.equal(config.baseURL, '');
  const client = createClient({...config, fetchImpl: () => {throw new Error('El modo estático no debe usar la red');}});
  const result = await client.load();
  const department = result.catalog.departamentos[0], career = department.carreras[0];
  assert.equal(snapshot(result.catalog, department.id_departamento, career.id_carrera, result).carrera, career.nombre);
  assert.throws(() => snapshot(result.catalog, '999', career.id_carrera, result));
});

test('las tres páginas tienen recursos relativos existentes para un sitio Pages de proyecto', () => {
  for (const page of ['index.html', 'procesos.html', 'checklist.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /js\/modo-documentos\.js/);
    for (const [, ref] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      if (/^(?:https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
      assert.ok(!ref.startsWith('/'), `${page}: ${ref} pierde el prefijo de Pages`);
      assert.ok(fs.existsSync(path.join(root, decodeURIComponent(ref.split(/[?#]/)[0]))), `${page}: ${ref}`);
    }
  }
});
