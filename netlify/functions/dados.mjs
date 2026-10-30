/* =============================================================
   O conteúdo atual, para o site público.

   O site já vem com js/dados.js dentro do pacote e desenha a
   página sem depender disto. Esta função é só a camada por cima:
   se a corretora mudou algo no painel, o site redesenha com o
   que veio daqui. Se esta função cair, o site continua de pé
   com o conteúdo da última publicação.
   ============================================================= */

import { carregar, gerarJS } from "./_nucleo.mjs";

export const config = { path: ["/api/dados", "/api/dados.js"] };

export default async (req) => {
  const url = new URL(req.url);
  const d = await carregar();

  /* Versão para baixar e colar no projeto, voltando a ser estático */
  if (url.pathname.endsWith(".js")) {
    return new Response(gerarJS(d), {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dados.js"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(JSON.stringify(d), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      /* meio minuto de folga: a corretora vê a mudança logo,
         e uma visita em massa não vira uma invocação por pessoa */
      "Cache-Control": "public, max-age=30, stale-while-revalidate=300",
    },
  });
};
