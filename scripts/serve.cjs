// Optional local preview. The portal itself executes in the browser.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8765);
const publicPages = new Set(['index.html', 'procesos.html', 'checklist.html']);
const publicFolders = new Set(['css', 'js', 'assets', 'images', 'img', 'fonts', 'documentos']);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword'
};

const server = http.createServer(async (req, res) => {
  const fail = (status, message) => {
    res.writeHead(status, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end(req.method === 'HEAD' ? undefined : message);
  };
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return fail(405, 'Método no permitido.');
  }
  let segments;
  try {
    segments = decodeURIComponent(req.url.split('?')[0]).split('/').filter(Boolean);
    if (!segments.length) segments = ['index.html'];
    if (segments.some(part => part.startsWith('.') || /[\\\0]/.test(part))) return fail(404, 'No encontrado.');
  } catch { return fail(400, 'Dirección inválida.'); }
  if (!(segments.length === 1 && publicPages.has(segments[0])) && !publicFolders.has(segments[0])) {
    return fail(404, 'No encontrado.');
  }
  try {
    const file = await fs.promises.realpath(path.join(root, ...segments));
    if (!file.startsWith(root + path.sep)) return fail(404, 'No encontrado.');
    const stat = await fs.promises.stat(file);
    if (!stat.isFile()) return fail(404, 'No encontrado.');
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(file);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch { fail(404, 'No encontrado.'); }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `El puerto ${port} ya está ocupado. Cierra el servidor anterior o usa PORT=8766 npm start.`
    : `No se pudo iniciar el servidor: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Portal: http://127.0.0.1:${port}/procesos.html#inscripcion`));
