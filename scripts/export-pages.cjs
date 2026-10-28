// Copy only public assets. No compilation or dependency installation required.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const publicFiles = ['index.html', 'procesos.html', 'checklist.html', 'cartas.html', 'css', 'js', 'assets', 'documentos'];
fs.mkdirSync(output, {recursive: true});
for (const file of publicFiles) {
  fs.cpSync(path.join(root, file), path.join(output, file), {recursive: true, dereference: true});
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Portal estático listo en dist/. Publica su contenido completo.');
