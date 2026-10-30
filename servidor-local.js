/* Servidor local só para visualizar o site durante o desenvolvimento.
   Uso:  node servidor-local.js     →  http://localhost:4178
   Não precisa ir para a hospedagem. */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* Pasta a servir. Sem argumento, site/. Para ver o pacote do Netlify:
   node servidor-local.js publicar  */
const RAIZ = path.join(__dirname, process.argv[2] || "site");
const PORTA = process.env.PORT || 4180;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";

  const arquivo = path.join(RAIZ, path.normalize(rel));
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403).end("403");
    return;
  }

  fs.readFile(arquivo, (erro, dados) => {
    if (erro) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 — não encontrado");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TIPOS[path.extname(arquivo).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    }).end(dados);
  });
}).listen(PORTA, () => {
  console.log("Site em http://localhost:" + PORTA);
});
