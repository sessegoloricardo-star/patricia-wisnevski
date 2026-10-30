/* =============================================================
   As fotos que a corretora enviou pelo painel.

   O nome do arquivo foi inventado por nós na hora do envio, e
   aqui ele ainda passa por um filtro: só letras, números, ponto,
   hífen e sublinhado. Nada que venha do endereço vira caminho.
   ============================================================= */

import { lerBin } from "../lib/armazem.mjs";

export const config = { path: "/api/foto/:nome" };

export default async (req, context) => {
  const nome = String((context.params && context.params.nome) || "");
  if (!/^[A-Za-z0-9._-]+$/.test(nome) || nome.includes("..")) {
    return new Response("Nome inválido.", { status: 400 });
  }

  let foto;
  try { foto = await lerBin("foto_" + nome); } catch { foto = null; }
  if (!foto) return new Response("Não encontrada.", { status: 404 });

  return new Response(foto.dados, {
    headers: {
      "Content-Type": foto.tipo,
      "Content-Length": String(foto.dados.length),
      /* o nome muda a cada envio, então o arquivo nunca muda de conteúdo */
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
