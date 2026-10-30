/* =============================================================
   O miolo do painel. Mesmas regras da versão em PHP, em JS.
   ============================================================= */

import crypto from "node:crypto";
import { lerJSON, gravarJSON } from "./_armazem.mjs";

export const MAX_BYTES = 4 * 1024 * 1024;   /* o Netlify não aceita envio maior */
export const MAX_FALHAS = 5;
export const ESPERA_SEG = 900;              /* 15 minutos */
const SESSAO_SEG = 60 * 60 * 8;

/* ---------------------------------------------------------------
   Texto
---------------------------------------------------------------- */
export function h(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export function limpo(v, max) {
  /* tira caracteres de controle, menos a quebra de linha */
  let s = String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  s = s.replace(/\r\n?/g, "\n").trim();
  return s.length > max ? s.slice(0, max) : s;
}
function semAcento(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/* ---------------------------------------------------------------
   Conteúdo
---------------------------------------------------------------- */
export const MAX_FOTOS = 12;

/* Um imóvel passou a ter várias fotos. O formato antigo guardava uma
   só, em "imagem" e "alt". Aqui o antigo vira o novo sem ninguém
   precisar fazer nada, e "imagem" continua existindo, espelhando a
   primeira foto: o painel em PHP e qualquer dados.js antigo seguem
   lendo o que esperam. */
export function normalizarOpcao(bruto) {
  const o = (bruto && typeof bruto === "object") ? { ...bruto } : {};

  let fotos = Array.isArray(o.fotos) ? o.fotos : null;
  if (!fotos) fotos = o.imagem ? [{ src: o.imagem, alt: o.alt || "" }] : [];

  o.fotos = fotos
    .map((f) => (typeof f === "string" ? { src: f, alt: "" } : f))
    .filter((f) => f && typeof f.src === "string" && f.src.trim())
    .map((f) => ({ src: String(f.src).trim(), alt: limpo(f.alt, 200) }))
    .slice(0, MAX_FOTOS);

  o.imagem = o.fotos.length ? o.fotos[0].src : "";
  o.alt = o.fotos.length ? o.fotos[0].alt : "";
  o.specs = Array.isArray(o.specs) ? o.specs : [];
  return o;
}

export function normalizar(d) {
  const o = (d && typeof d === "object") ? { ...d } : {};
  o.contato = {
    whatsapp: "", mensagemPadrao: "Olá, Patricia! Vim pelo seu site e gostaria de conversar.",
    instagram: "", email: "", cidade: "", creci: "", ...(o.contato || {}),
  };
  o.sobre = { foto: "assets/patricia-sobre.jpg", alt: "", citacao: "", texto: "", ...(o.sobre || {}) };
  o.opcoes = (Array.isArray(o.opcoes) ? o.opcoes : []).map(normalizarOpcao);
  o.faq = Array.isArray(o.faq) ? o.faq : [];
  return o;
}

export async function carregar() {
  return normalizar(await lerJSON("dados"));
}
export async function gravar(d) {
  await gravarJSON("dados", normalizar(d));
}

/* O mesmo arquivo que o site público lê, para quem quiser baixar
   e voltar a ser 100% estático. */
export function gerarJS(d) {
  const j = (v) => JSON.stringify(v, null, 2).replace(/\n/g, "\n  ");
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return "/* =============================================================\n" +
    "   DADOS DO SITE, Patricia Wisnevski\n" +
    "   Gerado pelo painel em " + agora + ".\n" +
    "   Não edite à mão enquanto o painel estiver no ar.\n" +
    "   ============================================================= */\n\n" +
    "const DADOS = {\n" +
    "  contato: " + j(d.contato) + ",\n\n" +
    "  sobre: " + j(d.sobre) + ",\n\n" +
    "  opcoes: " + j(d.opcoes) + ",\n\n" +
    "  faq: " + j(d.faq) + "\n};\n";
}

/* ---------------------------------------------------------------
   Senha
---------------------------------------------------------------- */
export function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const chave = crypto.scryptSync(senha, sal, 64, { N: 16384, r: 8, p: 1 });
  return "scrypt$" + sal.toString("hex") + "$" + chave.toString("hex");
}
export function senhaConfere(senha, guardado) {
  if (typeof guardado !== "string") return false;
  const p = guardado.split("$");
  if (p.length !== 3 || p[0] !== "scrypt") return false;
  let esperado;
  try { esperado = Buffer.from(p[2], "hex"); } catch { return false; }
  const chave = crypto.scryptSync(senha, Buffer.from(p[1], "hex"), esperado.length, { N: 16384, r: 8, p: 1 });
  return chave.length === esperado.length && crypto.timingSafeEqual(chave, esperado);
}

export async function instalado() {
  const c = await lerJSON("conf");
  return !!(c && c.senha);
}
export async function gravarSenha(senha) {
  const conf = (await lerJSON("conf")) || {};
  conf.senha = hashSenha(senha);
  await gravarJSON("conf", conf);
}
async function senhaGuardada() {
  const c = await lerJSON("conf");
  return c && c.senha;
}

/* ---------------------------------------------------------------
   Segredo das assinaturas
---------------------------------------------------------------- */
async function segredo() {
  if (process.env.PAINEL_SEGREDO) return process.env.PAINEL_SEGREDO;
  const conf = (await lerJSON("conf")) || {};
  if (!conf.segredo) {
    conf.segredo = crypto.randomBytes(32).toString("hex");
    await gravarJSON("conf", conf);
  }
  return conf.segredo;
}
function assinar(texto, chave) {
  return crypto.createHmac("sha256", chave).update(texto).digest("base64url");
}
function confereAssinatura(texto, assinatura, chave) {
  const esperada = Buffer.from(assinar(texto, chave));
  const veio = Buffer.from(String(assinatura || ""));
  return esperada.length === veio.length && crypto.timingSafeEqual(esperada, veio);
}

/* ---------------------------------------------------------------
   Sessão, num cookie assinado
---------------------------------------------------------------- */
export async function criarSessao() {
  const corpo = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSAO_SEG,
    id: crypto.randomBytes(8).toString("hex"),
  })).toString("base64url");
  return corpo + "." + assinar(corpo, await segredo());
}
export async function lerSessao(cookie) {
  if (!cookie) return null;
  const m = String(cookie).match(/(?:^|;\s*)painel=([^;]+)/);
  if (!m) return null;
  const partes = decodeURIComponent(m[1]).split(".");
  const corpo = partes[0], assinatura = partes[1];
  if (!corpo || !assinatura) return null;
  if (!confereAssinatura(corpo, assinatura, await segredo())) return null;
  let dados;
  try { dados = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")); } catch { return null; }
  if (!dados.exp || dados.exp < Math.floor(Date.now() / 1000)) return null;
  return dados;
}
export function cookieSessao(valor, segundos) {
  const partes = ["painel=" + encodeURIComponent(valor), "Path=/", "HttpOnly",
    "SameSite=Strict", "Max-Age=" + segundos];
  if (process.env.PAINEL_LOCAL !== "1") partes.push("Secure");
  return partes.join("; ");
}

/* ---------------------------------------------------------------
   CSRF, amarrado à sessão
---------------------------------------------------------------- */
export async function token(sessao) {
  return assinar("csrf:" + ((sessao && sessao.id) || ""), await segredo());
}
export async function tokenOk(sessao, veio) {
  return confereAssinatura("csrf:" + ((sessao && sessao.id) || ""), veio, await segredo());
}

/* ---------------------------------------------------------------
   Trava depois de cinco erros
---------------------------------------------------------------- */
export async function bloqueadoPor() {
  const t = (await lerJSON("tentativas")) || { falhas: 0, ultima: 0 };
  if (t.falhas < MAX_FALHAS) return 0;
  const faltam = ESPERA_SEG - (Math.floor(Date.now() / 1000) - t.ultima);
  return faltam > 0 ? faltam : 0;
}
export async function marcarFalha() {
  const t = (await lerJSON("tentativas")) || { falhas: 0, ultima: 0 };
  const agora = Math.floor(Date.now() / 1000);
  if (t.falhas >= MAX_FALHAS && agora - t.ultima > ESPERA_SEG) t.falhas = 0;
  t.falhas += 1;
  t.ultima = agora;
  await gravarJSON("tentativas", t);
}
export async function limparFalhas() {
  await gravarJSON("tentativas", { falhas: 0, ultima: 0 });
}

/* ---------------------------------------------------------------
   Login
---------------------------------------------------------------- */
export async function entrar(senha) {
  const preso = await bloqueadoPor();
  if (preso > 0) return { ok: false, espera: preso };
  if (!senhaConfere(senha, await senhaGuardada())) {
    await marcarFalha();
    return { ok: false, espera: 0 };
  }
  await limparFalhas();
  return { ok: true, cookie: await criarSessao() };
}

/* ---------------------------------------------------------------
   Imagem: confere a assinatura do arquivo, não a extensão,
   e inventa o nome. Nada que o navegador manda vira caminho.
---------------------------------------------------------------- */
export function tipoDaImagem(b) {
  if (b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 &&
      b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) {
    return { ext: "png", mime: "image/png" };
  }
  if (b.length > 12 && String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
      String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}
export function nomeDeFoto(prefixo, ext) {
  let base = semAcento(String(prefixo || "")).toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!base) base = "foto";
  return base.slice(0, 40) + "-" + crypto.randomBytes(4).toString("hex") + "." + ext;
}
