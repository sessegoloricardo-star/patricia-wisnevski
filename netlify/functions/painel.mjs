/* =============================================================
   A área do gestor, agora como função do Netlify.

   Mesma tela e mesmas regras da versão em PHP. O que muda é
   onde o conteúdo mora: em Netlify Blobs, não em arquivo.
   ============================================================= */

import {
  h, limpo, carregar, gravar, instalado, gravarSenha, entrar,
  lerSessao, cookieSessao, token, tokenOk, bloqueadoPor,
  MAX_BYTES, MAX_FOTOS, tipoDaImagem, nomeDeFoto,
} from "../lib/nucleo.mjs";
import { gravarBin, apagar } from "../lib/armazem.mjs";

export const config = { path: ["/painel", "/painel/", "/painel/sair"] };

const LIM = { titulo: 120, texto: 400, tag: 40, bairro: 80, preco: 40, specs: 120,
              alt: 200, citacao: 200, sobre: 4000, msg: 300 };

/* ---------------------------------------------------------------
   Casca da página
---------------------------------------------------------------- */
function pagina(titulo, corpo, cabecalho) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${h(titulo)}</title>
<link rel="stylesheet" href="/css/estilo.css">
<link rel="stylesheet" href="/css/painel.css">
</head>
<body class="pg">
${cabecalho || ""}
<main class="pg__corpo">
${corpo}
</main>
</body>
</html>`;
}

function topo() {
  return `<header class="pg__topo">
  <div><strong>Painel da Patricia</strong><span>Atualize o site sem mexer em código</span></div>
  <nav class="pg__nav">
    <a href="/" target="_blank" rel="noopener">Ver o site</a>
    <a href="/painel/sair">Sair</a>
  </nav>
</header>`;
}

function avisos(lista, tipo) {
  if (!lista || !lista.length) return "";
  return lista.map((a) => `<p class="pg__aviso pg__aviso--${tipo || "erro"}">${h(a)}</p>`).join("\n");
}

function resposta(html, extra) {
  return new Response(html, {
    status: (extra && extra.status) || 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      ...((extra && extra.headers) || {}),
    },
  });
}

/* ---------------------------------------------------------------
   Telas de entrada
---------------------------------------------------------------- */
function telaPrimeiroAcesso(erros) {
  return pagina("Primeiro acesso", `
<section class="pg__caixa pg__caixa--estreita">
  <h1>Primeiro acesso</h1>
  <p class="pg__lede">Ninguém criou a senha deste painel ainda. Crie agora, antes de
     divulgar o endereço. Ela fica guardada embaralhada e não dá para ler de volta.</p>
  ${avisos(erros)}
  <form method="post">
    <div class="gestor__campo">
      <label for="s1">Senha, de 8 caracteres para cima</label>
      <input id="s1" name="senha" type="password" minlength="8" maxlength="200" required autofocus>
    </div>
    <div class="gestor__campo">
      <label for="s2">Repita a senha</label>
      <input id="s2" name="senha2" type="password" minlength="8" maxlength="200" required>
    </div>
    <button class="botao botao--principal botao--largo" type="submit">Criar a senha</button>
  </form>
</section>`);
}

function telaEntrar(erros) {
  return pagina("Entrar", `
<section class="pg__caixa pg__caixa--estreita">
  <h1>Entrar</h1>
  ${avisos(erros)}
  <form method="post">
    <div class="gestor__campo">
      <label for="s">Senha</label>
      <input id="s" name="senha" type="password" maxlength="200" required autofocus>
    </div>
    <button class="botao botao--principal botao--largo" type="submit">Entrar</button>
  </form>
</section>`, topo());
}

/* ---------------------------------------------------------------
   O painel
---------------------------------------------------------------- */
/* As fotos do pacote vêm com caminho relativo ("assets/..."), que o
   navegador resolveria a partir de /painel/ e daria 404. As enviadas
   pelo painel já vêm absolutas. Aqui as duas viram absolutas. */
function url(src) {
  const s = String(src || "");
  if (!s) return "";
  return /^(https?:)?\/\//.test(s) || s.startsWith("/") ? s : "/" + s;
}

function campo(id, rotulo, valor, atributos) {
  return `<div class="gestor__campo">
  <label for="${id}">${h(rotulo)}</label>
  <input id="${id}" value="${h(valor)}" ${atributos || ""}>
</div>`;
}

function telaPainel(d, tk, recados, erros) {
  const galeria = (o, i) => {
    const fotos = o.fotos || [];
    const cartoes = fotos.map((f, j) => `
    <li class="pg__foto">
      <img src="${h(url(f.src))}" alt="" loading="lazy">
      ${j === 0 ? '<span class="pg__capa">Capa</span>' : ""}
      <input type="hidden" name="op[${i}][fotos][${j}][src]" value="${h(f.src)}">
      <label class="pg__foto-ordem">
        <span>Ordem</span>
        <input name="op[${i}][fotos][${j}][ordem]" type="number" min="1" max="${MAX_FOTOS}"
               value="${j + 1}" aria-label="Ordem da foto ${j + 1}">
      </label>
      <label class="pg__foto-alt">
        <span>Descrição</span>
        <input name="op[${i}][fotos][${j}][alt]" value="${h(f.alt || "")}" maxlength="${LIM.alt}"
               placeholder="O que aparece na foto" aria-label="Descrição da foto ${j + 1}">
      </label>
      <label class="pg__foto-fora">
        <input type="checkbox" name="op[${i}][fotos][${j}][remover]" value="1"> Remover
      </label>
    </li>`).join("");

    const cheio = fotos.length >= MAX_FOTOS;
    return `
  <div class="pg__galeria">
    <p class="pg__galeria-topo">
      <strong>Fotos deste imóvel</strong>
      <span>${fotos.length} de ${MAX_FOTOS}. A primeira é a capa, que aparece no card.</span>
    </p>
    ${cartoes ? `<ul class="pg__fotos">${cartoes}</ul>`
              : '<p class="pg__sem-foto">Nenhuma foto ainda.</p>'}
    ${cheio
      ? `<p class="pg__sem-foto">Chegou no limite de ${MAX_FOTOS} fotos. Remova alguma para enviar outra.</p>`
      : `<label class="pg__arquivo"><span>Adicionar fotos, pode escolher várias</span>
           <input type="file" name="novas[${i}]" multiple
                  accept="image/jpeg,image/png,image/webp"></label>`}
  </div>`;
  };

  const itens = d.opcoes.map((o, i) => `
<div class="pg__item pg__item--largo">
  <div class="pg__item-campos">
    <div class="pg__dupla">
      ${campo(`t${i}`, "Título", o.titulo, `name="op[${i}][titulo]" maxlength="${LIM.titulo}"`)}
      ${campo(`o${i}`, "Ordem", i + 1, `name="op[${i}][ordem]" type="number" min="1" max="99"`)}
    </div>
    <div class="gestor__campo">
      <label for="x${i}">Descrição</label>
      <textarea id="x${i}" name="op[${i}][texto]" rows="2" maxlength="${LIM.texto}">${h(o.texto || "")}</textarea>
    </div>
    <div class="pg__tripla">
      ${campo(`g${i}`, "Etiqueta", o.tag, `name="op[${i}][tag]" maxlength="${LIM.tag}"`)}
      ${campo(`b${i}`, "Bairro", o.bairro, `name="op[${i}][bairro]" maxlength="${LIM.bairro}"`)}
      ${campo(`p${i}`, "Preço", o.preco, `name="op[${i}][preco]" maxlength="${LIM.preco}"`)}
    </div>
    ${campo(`e${i}`, "Características, separadas por vírgula",
      (o.specs || []).join(", "), `name="op[${i}][specs]" maxlength="${LIM.specs}"`)}
    ${galeria(o, i)}
    <label class="pg__remover">
      <input type="checkbox" name="op[${i}][remover]" value="1"> Remover este imóvel ao salvar
    </label>
  </div>
</div>`).join("\n");

  return pagina("Painel", `
${avisos(erros)}
${avisos(recados, "ok")}
<form method="post" enctype="multipart/form-data">
  <input type="hidden" name="csrf" value="${h(tk)}">

  <section class="pg__caixa">
    <h2>Imóveis e opções</h2>
    <p class="pg__lede">Preenchendo bairro, preço e características, o card deixa de ser
       categoria e vira anúncio. A barra de busca do site se monta a partir daqui.</p>
    ${itens || '<p class="pg__lede">Nenhum item ainda. Use o botão de adicionar ali embaixo.</p>'}
  </section>

  <section class="pg__caixa">
    <h2>Sobre</h2>
    <div class="pg__item">
      <div class="pg__item-foto">
        <img src="${h(url(d.sobre.foto))}" alt="" loading="lazy">
        <label class="pg__arquivo"><span>Trocar a foto</span>
          <input type="file" name="sobre_foto" accept="image/jpeg,image/png,image/webp"></label>
      </div>
      <div class="pg__item-campos">
        ${campo("sc", "Frase de destaque", d.sobre.citacao, `name="sobre_citacao" maxlength="${LIM.citacao}"`)}
        <div class="gestor__campo">
          <label for="st">Texto de apresentação</label>
          <textarea id="st" name="sobre_texto" rows="12" maxlength="${LIM.sobre}">${h(d.sobre.texto || "")}</textarea>
          <p class="gestor__dica">Deixe uma linha em branco entre os parágrafos.</p>
        </div>
        ${campo("sa", "Descrição da foto, para quem não enxerga", d.sobre.alt, `name="sobre_alt" maxlength="${LIM.alt}"`)}
      </div>
    </div>
  </section>

  <section class="pg__caixa">
    <h2>Contato</h2>
    <div class="pg__tripla">
      ${campo("w", "WhatsApp, só números com 55 e DDD", d.contato.whatsapp,
        'name="whatsapp" inputmode="numeric" maxlength="15" placeholder="5551999998888"')}
      ${campo("ig", "Instagram", d.contato.instagram, 'name="instagram" maxlength="200"')}
      ${campo("em", "E-mail", d.contato.email, 'name="email" type="email" maxlength="120"')}
    </div>
    <div class="gestor__campo">
      <label for="mp">A mensagem que já vem escrita no WhatsApp</label>
      <input id="mp" name="mensagemPadrao" maxlength="${LIM.msg}" value="${h(d.contato.mensagemPadrao || "")}">
      <p class="gestor__dica">É o texto que aparece digitado quando alguém clica em Falar com a
        Patricia. Os cards de imóvel usam uma mensagem própria, com o nome do imóvel.</p>
    </div>
    <div class="pg__dupla">
      ${campo("cr", "CRECI", d.contato.creci, 'name="creci" maxlength="60"')}
      ${campo("ci", "Cidade", d.contato.cidade, 'name="cidade" maxlength="80"')}
    </div>
  </section>

  <div class="pg__barra">
    <button class="botao botao--principal" name="salvar" value="1" type="submit">Salvar e publicar</button>
    <button class="botao botao--vazado" name="adicionar" value="1" type="submit" formnovalidate>Salvar e adicionar imóvel</button>
    <span class="pg__nota">Salvar já publica. O site muda na hora.</span>
  </div>
</form>`, topo());
}

/* ---------------------------------------------------------------
   Leitura do formulário
---------------------------------------------------------------- */
function texto(form, nome, max) {
  return limpo(form.get(nome), max);
}

async function guardarFoto(arquivo, prefixo) {
  if (!arquivo || typeof arquivo === "string" || !arquivo.size) return { caminho: null, erro: null };
  if (arquivo.size > MAX_BYTES) {
    return { caminho: null, erro: "A foto passou de 4 MB. Reduza antes de enviar." };
  }
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const tipo = tipoDaImagem(bytes);
  if (!tipo) return { caminho: null, erro: "Esse arquivo não é uma imagem JPG, PNG ou WEBP." };
  const nome = nomeDeFoto(prefixo, tipo.ext);
  await gravarBin("foto_" + nome, bytes, tipo.mime);
  return { caminho: "/api/foto/" + nome, erro: null };
}

/* Só apaga o que nós mesmos guardamos. Arquivo que veio no pacote
   do site não é nosso para apagar. */
async function apagarSeNossa(caminho) {
  const m = String(caminho || "").match(/^\/api\/foto\/([A-Za-z0-9._-]+)$/);
  if (m) { try { await apagar("foto_" + m[1]); } catch {} }
}

async function lerFormulario(form, antes) {
  const erros = [];
  const d = { contato: {}, sobre: {}, opcoes: [], faq: antes.faq };

  /* WhatsApp: ela digita como quiser, aqui vira o que o wa.me entende */
  let zap = String(form.get("whatsapp") || "").replace(/\D/g, "");
  if (zap.length === 10 || zap.length === 11) zap = "55" + zap;
  if (zap && !/^55\d{10,11}$/.test(zap)) {
    erros.push("O WhatsApp não parece certo. Use DDD mais o número, como 51999998888. " +
      "Enquanto ele não estiver válido, os botões continuam indo para o Instagram.");
    zap = "";
  }
  const msg = texto(form, "mensagemPadrao", LIM.msg);
  d.contato = {
    whatsapp: zap,
    mensagemPadrao: msg || "Olá, Patricia! Vim pelo seu site e gostaria de conversar.",
    instagram: texto(form, "instagram", 200),
    email: texto(form, "email", 120),
    creci: texto(form, "creci", 60),
    cidade: texto(form, "cidade", 80),
  };

  /* Sobre */
  const fotoSobre = await guardarFoto(form.get("sobre_foto"), "patricia-sobre");
  if (fotoSobre.erro) erros.push(fotoSobre.erro);
  if (fotoSobre.caminho) await apagarSeNossa(antes.sobre.foto);
  d.sobre = {
    foto: fotoSobre.caminho || antes.sobre.foto,
    alt: texto(form, "sobre_alt", LIM.alt),
    citacao: texto(form, "sobre_citacao", LIM.citacao),
    texto: texto(form, "sobre_texto", LIM.sobre),
  };

  /* Imóveis */
  const indices = new Set();
  for (const chave of form.keys()) {
    const m = chave.match(/^op\[(\d+)\]/);
    if (m) indices.add(Number(m[1]));
  }
  const lista = [];
  for (const i of [...indices].sort((a, b) => a - b)) {
    const g = (c) => form.get(`op[${i}][${c}]`);
    const anterior = antes.opcoes[i] || {};
    const titulo = limpo(g("titulo"), LIM.titulo);

    /* Item inteiro fora: leva as fotos dele junto, senão viram lixo
       ocupando espaço que ninguém mais alcança. */
    if (g("remover")) {
      for (const f of anterior.fotos || []) await apagarSeNossa(f.src);
      continue;
    }

    /* As fotos que já estavam, menos as marcadas, na ordem pedida */
    const fotos = [];
    const vistos = new Set();
    for (const chave of form.keys()) {
      const m = chave.match(new RegExp(`^op\\[${i}\\]\\[fotos\\]\\[(\\d+)\\]\\[src\\]$`));
      if (m) vistos.add(Number(m[1]));
    }
    for (const j of [...vistos].sort((a, b) => a - b)) {
      const gf = (c) => form.get(`op[${i}][fotos][${j}][${c}]`);
      const src = limpo(gf("src"), 300);
      if (!src) continue;
      if (gf("remover")) { await apagarSeNossa(src); continue; }
      fotos.push({ src, alt: limpo(gf("alt"), LIM.alt), ordem: Number(gf("ordem")) || (j + 1) });
    }
    fotos.sort((a, b) => a.ordem - b.ordem);

    /* As que ela acabou de enviar entram no fim */
    const vagas = MAX_FOTOS - fotos.length;
    const enviadas = form.getAll(`novas[${i}]`).filter((f) => f && f.size);
    if (enviadas.length > vagas) {
      erros.push(`${titulo || "Item " + (i + 1)}: cabem mais ${vagas} foto(s), ` +
        `e vieram ${enviadas.length}. Guardei as primeiras.`);
    }
    for (const arquivo of enviadas.slice(0, Math.max(0, vagas))) {
      const nova = await guardarFoto(arquivo, titulo || "imovel");
      if (nova.erro) { erros.push(`${titulo || "Item " + (i + 1)}: ${nova.erro}`); continue; }
      fotos.push({ src: nova.caminho, alt: "", ordem: 999 });
    }

    const specs = limpo(g("specs"), LIM.specs).split(",")
      .map((s) => s.trim()).filter(Boolean).slice(0, 4);
    lista.push({
      ordem: Number(g("ordem")) || (i + 1),
      titulo,
      texto: limpo(g("texto"), LIM.texto),
      tag: limpo(g("tag"), LIM.tag),
      bairro: limpo(g("bairro"), LIM.bairro),
      preco: limpo(g("preco"), LIM.preco),
      specs,
      fotos: fotos.map(({ src, alt }) => ({ src, alt })),
    });
  }
  lista.sort((a, b) => a.ordem - b.ordem);
  d.opcoes = lista.map(({ ordem, ...resto }) => resto);

  if (form.get("adicionar")) {
    d.opcoes.push({ titulo: "Novo imóvel", texto: "", tag: "", bairro: "", preco: "",
      specs: [], fotos: [] });
  }
  return { dados: d, erros };
}

/* ---------------------------------------------------------------
   A função
---------------------------------------------------------------- */
export default async (req) => {
  const url = new URL(req.url);
  const cookie = req.headers.get("cookie");

  if (url.pathname === "/painel/sair") {
    return new Response("", { status: 302,
      headers: { Location: "/painel/", "Set-Cookie": cookieSessao("", 0) } });
  }

  const temSenha = await instalado();

  /* Primeiro acesso */
  if (!temSenha) {
    if (req.method === "POST") {
      const form = await req.formData();
      const a = String(form.get("senha") || ""), b = String(form.get("senha2") || "");
      const erros = [];
      if (a.length < 8) erros.push("A senha precisa de pelo menos 8 caracteres.");
      if (a !== b) erros.push("As duas senhas não são iguais.");
      if (erros.length) return resposta(telaPrimeiroAcesso(erros));
      await gravarSenha(a);
      const s = await entrar(a);
      return new Response("", { status: 302,
        headers: { Location: "/painel/", "Set-Cookie": cookieSessao(s.cookie, 60 * 60 * 8) } });
    }
    return resposta(telaPrimeiroAcesso([]));
  }

  const sessao = await lerSessao(cookie);

  /* Login */
  if (!sessao) {
    if (req.method === "POST") {
      const form = await req.formData();
      const r = await entrar(String(form.get("senha") || ""));
      if (r.ok) {
        return new Response("", { status: 302,
          headers: { Location: "/painel/", "Set-Cookie": cookieSessao(r.cookie, 60 * 60 * 8) } });
      }
      const falta = r.espera > 0
        ? `Muitas tentativas. Espere ${Math.ceil(r.espera / 60)} minuto(s) e tente de novo.`
        : "Senha incorreta.";
      return resposta(telaEntrar([falta]), { status: 401 });
    }
    const preso = await bloqueadoPor();
    return resposta(telaEntrar(preso > 0
      ? [`Muitas tentativas. Espere ${Math.ceil(preso / 60)} minuto(s).`] : []), { status: 401 });
  }

  /* Dentro */
  const tk = await token(sessao);

  if (req.method === "POST") {
    const form = await req.formData();
    if (!(await tokenOk(sessao, form.get("csrf")))) {
      return resposta(pagina("Pedido recusado",
        '<section class="pg__caixa pg__caixa--estreita"><h1>Pedido recusado</h1>' +
        '<p class="pg__lede">A página ficou aberta tempo demais. Volte ao painel e tente de novo.</p>' +
        '<p><a class="botao botao--principal" href="/painel/">Voltar ao painel</a></p></section>'),
        { status: 400 });
    }
    const antes = await carregar();
    const { dados, erros } = await lerFormulario(form, antes);
    await gravar(dados);
    const recados = erros.length ? [] : ["Salvo. O site já está com as alterações."];
    return resposta(telaPainel(await carregar(), tk, recados, erros));
  }

  return resposta(telaPainel(await carregar(), tk, [], []));
};
