/* =============================================================
   Recebe UMA foto por vez, já encolhida pelo navegador.

   Por que não pelo formulário: o Netlify corta qualquer
   requisição acima de 6 MB, e foto de celular tem de 3 a 8 MB.
   Escolher duas já estourava, e a requisição morria antes de
   chegar no nosso código, sem mensagem nenhuma na tela.

   Aqui chega uma só, em bytes crus, depois de o navegador
   reduzir para 1920px. Fica em torno de 400 KB.
   ============================================================= */

import { lerSessao, tokenOk, MAX_BYTES, tipoDaImagem, nomeDeFoto } from "../lib/nucleo.mjs";
import { gravarBin } from "../lib/armazem.mjs";

export const config = { path: "/painel/enviar" };

function erro(mensagem, status) {
  return new Response(JSON.stringify({ erro: mensagem }), {
    status: status || 400,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export default async (req) => {
  if (req.method !== "POST") return erro("Use POST.", 405);

  const sessao = await lerSessao(req.headers.get("cookie"));
  if (!sessao) return erro("Sessão expirada. Entre de novo no painel.", 401);

  /* O token vai no cabeçalho, porque o corpo é a foto */
  if (!(await tokenOk(sessao, req.headers.get("x-csrf")))) {
    return erro("Pedido recusado. Recarregue o painel.", 400);
  }

  const bytes = new Uint8Array(await req.arrayBuffer());
  if (!bytes.length) return erro("Chegou vazio.");
  if (bytes.length > MAX_BYTES) {
    return erro("A foto ficou acima de 4 MB mesmo depois de reduzida.", 413);
  }

  const tipo = tipoDaImagem(bytes);
  if (!tipo) return erro("Isso não é uma imagem JPG, PNG ou WEBP.");

  /* O título vem codificado no cabeçalho, porque cabeçalho só
     aceita ASCII. Sem desfazer isso, "Lançamentos" vira
     "lan-c3-a7amentos" no nome do arquivo. */
  let titulo = req.headers.get("x-nome") || "imovel";
  try { titulo = decodeURIComponent(titulo); } catch { /* fica como veio */ }
  const nome = nomeDeFoto(titulo, tipo.ext);
  await gravarBin("foto_" + nome, bytes, tipo.mime);

  return new Response(JSON.stringify({ src: "/api/foto/" + nome }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
};
