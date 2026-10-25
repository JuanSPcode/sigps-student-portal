const fs=require('node:fs');
for (const [name,source,target] of [
 ['docxtemplater','build/docxtemplater.js','docxtemplater.js'],
 ['pizzip','dist/pizzip.js','pizzip.js']
]) {
 const dir=`node_modules/${name}/`;
 fs.copyFileSync(dir+source,'js/vendor/'+target);
 for(const file of fs.readdirSync(dir).filter(n=>/^licen[cs]e/i.test(n)))fs.copyFileSync(dir+file,`js/vendor/${name}-${file}`);
}
if (fs.existsSync('documentos/plantillas/inscripcion.docx')) {
  const b64 = fs.readFileSync('documentos/plantillas/inscripcion.docx').toString('base64');
  fs.writeFileSync('js/inscripcion-plantilla.js', `(function(root){\n  const base64="${b64}";\n  if(typeof module!=="undefined"&&module.exports)module.exports={base64};\n  else root.SIGPSInscripcionPlantilla={base64};\n})(typeof window==="undefined"?globalThis:window);\n`);
}
