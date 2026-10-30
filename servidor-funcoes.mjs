/* =============================================================
   Servidor local com as funções ligadas.

   Serve publicar/ como o Netlify serve, e manda /painel e /api
   para as funções de netlify/functions/, do mesmo jeito que lá
   em cima. Serve para ver o painel funcionando antes de publicar.

   Rode:  node publicar.js && node servidor-funcoes.mjs

   O conteúdo fica em .armazem-local/, não em Blobs: é a sua
   máquina, não o Netlify.
   ============================================================= */

process.env.PAINEL_LOCAL = "1";

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(__dirname, "publicar");
const PORTA = Number(process.argv[2] || 4182);

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".mp4": "video/mp4", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml", ".woff2": "font/woff2",
};

/* ---------------------------------------------------------------
   Carrega as funções e monta a tabela de rotas
---------------------------------------------------------------- */
const rotas = [];
const pasta = path.join(__dirname, "netlify", "functions");
for (const arquivo of fs.readdirSync(pasta)) {
  /* Tudo que estiver aqui é função. O que é peça interna mora em
     netlify/lib/, fora desta pasta: o Netlify publica como função
     cada arquivo daqui, inclusive os que começam com sublinhado. */
  if (!arquivo.endsWith(".mjs")) continue;
  const mod = await import(new URL("netlify/functions/" + arquivo, import.meta.url));
  const caminhos = [].concat((mod.config && mod.config.path) || []);
  for (const c of caminhos) {
    const nomes = [];
    const regex = new RegExp("^" + c.replace(/:(\w+)/g, (m, n) => {
      nomes.push(n); return "([^/]+)";
    }) + "$");
    rotas.push({ regex, nomes, fn: mod.default, origem: arquivo, padrao: c });
  }
}
console.log("Funções ligadas:");
rotas.forEach((r) => console.log("  " + r.padrao + "  ->  " + r.origem));

/* ---------------------------------------------------------------
   Ponte entre o http do Node e o Request/Response da web
---------------------------------------------------------------- */
async function paraRequest(req, base) {
  const corpo = ["GET", "HEAD"].includes(req.method) ? undefined : await new Promise((ok) => {
    const partes = [];
    req.on("data", (c) => partes.push(c));
    req.on("end", () => ok(Buffer.concat(partes)));
  });
  return new Request(new URL(req.url, base), {
    method: req.method,
    headers: req.headers,
    body: corpo,
  });
}

function estatico(res, caminhoRel) {
  let arquivo = path.join(RAIZ, path.normalize(caminhoRel));
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); return res.end("Fora da pasta."); }
  if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) {
    arquivo = path.join(arquivo, "index.html");
  }
  if (!fs.existsSync(arquivo)) { res.writeHead(404); return res.end("Não encontrado."); }
  const tipo = TIPOS[path.extname(arquivo).toLowerCase()] || "application/octet-stream";
  const dados = fs.readFileSync(arquivo);
  res.writeHead(200, { "Content-Type": tipo, "Content-Length": dados.length });
  res.end(dados);
}

/* ---------------------------------------------------------------
   O servidor
---------------------------------------------------------------- */
http.createServer(async (req, res) => {
  const base = "http://localhost:" + PORTA;
  const caminho = decodeURIComponent(new URL(req.url, base).pathname);

  for (const rota of rotas) {
    const m = caminho.match(rota.regex);
    if (!m) continue;
    const params = {};
    rota.nomes.forEach((n, i) => { params[n] = m[i + 1]; });
    try {
      const resposta = await rota.fn(await paraRequest(req, base), { params });
      const cabecalhos = {};
      resposta.headers.forEach((v, k) => { cabecalhos[k] = v; });
      res.writeHead(resposta.status, cabecalhos);
      const corpo = Buffer.from(await resposta.arrayBuffer());
      return res.end(corpo);
    } catch (e) {
      console.error("Erro em " + rota.origem + ":", e);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Erro na função: " + e.message);
    }
  }

  estatico(res, caminho === "/" ? "/index.html" : caminho);
}).listen(PORTA, () => {
  console.log("");
  console.log("Site em   http://localhost:" + PORTA);
  console.log("Painel em http://localhost:" + PORTA + "/painel/");
});
