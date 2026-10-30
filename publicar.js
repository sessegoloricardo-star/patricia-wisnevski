/* =============================================================
   Monta a pasta publicar/, que é o que vai para o Netlify.

   O Netlify não roda PHP. Então o painel do gestor e a pasta
   conteudo/ ficam de fora de propósito: conteudo/config.php
   guarda o hash da senha e não pode ficar público.

   Rode:  node publicar.js
   ============================================================= */

/* Endereço do painel do gestor.

   "/painel/" é a função que sobe junto, em netlify/functions/painel.mjs.
   Um endereço de fora (a HostGator, por exemplo) também serve.
   Vazio apaga a portinha do rodapé, para site sem painel nenhum. */
var PAINEL = "/painel/";

import fs from "node:fs";
import caminho from "node:path";

var ORIGEM = "site";
var DESTINO = "publicar";
var FORA = ["conteudo", "painel"];          /* pastas que nunca sobem */
var FORA_ARQ = [".htaccess"];               /* o Netlify ignora, e confundiria */

function limpar(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

var copiados = [], pulados = [], bytes = 0;

function copiar(de, para, raiz) {
  fs.readdirSync(de, { withFileTypes: true }).forEach(function (item) {
    var dentro = caminho.join(de, item.name);
    var relativo = caminho.relative(raiz, dentro).split(caminho.sep).join("/");
    if (item.isDirectory()) {
      if (FORA.indexOf(item.name) > -1) { pulados.push(relativo + "/"); return; }
      fs.mkdirSync(caminho.join(para, item.name), { recursive: true });
      copiar(dentro, caminho.join(para, item.name), raiz);
      return;
    }
    if (FORA_ARQ.indexOf(item.name) > -1) { pulados.push(relativo); return; }
    fs.copyFileSync(dentro, caminho.join(para, item.name));
    copiados.push(relativo);
    bytes += fs.statSync(dentro).size;
  });
}

limpar(DESTINO);
copiar(ORIGEM, DESTINO, ORIGEM);

/* A pasta painel/ fica de fora, mas a folha de estilo dela é servida
   ao navegador quando a corretora abre o painel. Então ela vai junto,
   e só quando o painel for junto: sem painel é peso morto. */
var folha = caminho.join(ORIGEM, "painel", "painel.css");
if (PAINEL === "/painel/" && fs.existsSync(folha)) {
  fs.copyFileSync(folha, caminho.join(DESTINO, "css", "painel.css"));
  copiados.push("css/painel.css");
  bytes += fs.statSync(folha).size;
}

/* A porta do gestor: some, ou aponta para onde o painel realmente está. */
var alvo = caminho.join(DESTINO, "index.html");
var html = fs.readFileSync(alvo, "utf8");
var porta = /\n?[ \t]*<a class="porta"[^>]*><\/a>/;
var achou = porta.test(html);

if (!achou) {
  console.error("AVISO: não achei a porta do gestor no index.html. Confira à mão.");
} else if (PAINEL) {
  html = html.replace(porta, function (m) {
    var externo = /^https?:/i.test(PAINEL);
    return m.replace(/href="[^"]*"/,
      'href="' + PAINEL + '"' + (externo ? ' target="_blank" rel="noopener"' : ''));
  });
  console.log("Porta do gestor apontando para " + PAINEL);
} else {
  html = html.replace(porta, "");
  console.log("Porta do gestor removida: não há painel neste endereço.");
}
/* A chave da camada ao vivo. Só acende quando o painel sobe junto,
   no mesmo endereço, servindo /api/dados. Sem ele, o pedido voltaria
   404 em toda visita, e o site já tem o conteúdo que precisa. */
var aoVivo = PAINEL === "/painel/";
html = html.replace("</head>",
  "<script>window.PAINEL_NO_AR=" + (aoVivo ? "true" : "false") + "</script>\n</head>");
console.log(aoVivo
  ? "Camada ao vivo ligada: o site lê o painel."
  : "Camada ao vivo desligada: o site usa só o js/dados.js do pacote.");

fs.writeFileSync(alvo, html, "utf8");

/* Relatório */
function mb(n) { return (n / 1048576).toFixed(2) + " MB"; }
console.log("");
console.log("publicar/ montada: " + copiados.length + " arquivos, " + mb(bytes));
pulados.forEach(function (p) { console.log("  fora: " + p); });

/* Rede de segurança: nada de PHP nem de senha pode ter escapado. */
var vazou = copiados.filter(function (c) {
  return /\.php$/i.test(c) || c.indexOf("conteudo/") === 0 || c.indexOf("painel/") === 0;
});
if (vazou.length) {
  console.error("");
  console.error("PAROU: isto não podia subir:");
  vazou.forEach(function (v) { console.error("  " + v); });
  process.exit(1);
}
console.log("Conferido: nenhum .php e nenhum arquivo de senha na pasta.");
