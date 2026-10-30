/* Gera site/js/bairros.js a partir de site/conteudo/bairros.json.
   A lista é a mesma em três lugares: no filtro do site, no painel
   em PHP e no painel do Netlify. Uma fonte só, para não divergirem.

   Rode depois de mexer no JSON:  node gerar-bairros.js  */

import fs from "node:fs";

const bairros = JSON.parse(fs.readFileSync("site/conteudo/bairros.json", "utf8"));
const ordenado = [...bairros].sort((a, b) => a.localeCompare(b, "pt-BR"));

const saida =
  "/* =============================================================\n" +
  "   BAIRROS DE PORTO ALEGRE\n" +
  "   Gerado por gerar-bairros.js a partir de conteudo/bairros.json.\n" +
  "   Não edite à mão: mexa no JSON e rode o gerador.\n" +
  "   ============================================================= */\n\n" +
  "const BAIRROS = " + JSON.stringify(ordenado, null, 2).replace(/\n/g, "\n  ") + ";\n";

fs.writeFileSync("site/js/bairros.js", saida, "utf8");
console.log("site/js/bairros.js: " + ordenado.length + " bairros");
