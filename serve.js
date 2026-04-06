const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '127.0.0.1';
const port = 4173;
const root = __dirname;
const entryFiles = ['index.html', 'ats.html'];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function resolveEntryFile() {
  const existing = entryFiles
    .map(name => {
      const filePath = path.join(root, name);
      try {
        return { name, filePath, stat: fs.statSync(filePath) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!existing.length) {
    return path.join(root, 'index.html');
  }

  existing.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  return existing[0].filePath;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${host}:${port}`);
  const isEntryRequest = ['/', '/index.html', '/ats.html'].includes(url.pathname);
  const filePath = isEntryRequest
    ? resolveEntryFile()
    : path.join(root, path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''));

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    });
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`ATS server running at http://${host}:${port}/`);
});
