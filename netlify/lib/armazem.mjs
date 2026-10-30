/* =============================================================
   Onde o conteúdo fica guardado.

   No Netlify, em Blobs. Rodando na sua máquina, em arquivos
   dentro de .armazem-local/, para dar para testar sem subir nada.

   A escolha é explícita: só cai para o disco quando
   PAINEL_LOCAL=1. Assim uma configuração errada lá em cima
   falha na cara, em vez de gravar num lugar que ninguém vê.
   ============================================================= */

import { getStore } from "@netlify/blobs";
import fs from "node:fs/promises";
import path from "node:path";

const LOCAL = process.env.PAINEL_LOCAL === "1";
const PASTA = path.join(process.cwd(), ".armazem-local");

function seguro(chave) {
  if (!/^[A-Za-z0-9._-]+$/.test(chave)) throw new Error("chave inválida: " + chave);
  return chave;
}

let loja = null;
function blobs() {
  if (!loja) loja = getStore({ name: "site", consistency: "strong" });
  return loja;
}

export async function lerJSON(chave) {
  seguro(chave);
  if (LOCAL) {
    try { return JSON.parse(await fs.readFile(path.join(PASTA, chave + ".json"), "utf8")); }
    catch { return null; }
  }
  return await blobs().get(chave, { type: "json" });
}

export async function gravarJSON(chave, valor) {
  seguro(chave);
  if (LOCAL) {
    await fs.mkdir(PASTA, { recursive: true });
    const tmp = path.join(PASTA, chave + ".json.tmp");
    await fs.writeFile(tmp, JSON.stringify(valor, null, 2), "utf8");
    await fs.rename(tmp, path.join(PASTA, chave + ".json"));
    return;
  }
  await blobs().setJSON(chave, valor);
}

export async function lerBin(chave) {
  seguro(chave);
  if (LOCAL) {
    try {
      const dados = await fs.readFile(path.join(PASTA, chave));
      let tipo = "application/octet-stream";
      try { tipo = (await fs.readFile(path.join(PASTA, chave + ".tipo"), "utf8")).trim(); } catch {}
      return { dados: new Uint8Array(dados), tipo };
    } catch { return null; }
  }
  const r = await blobs().getWithMetadata(chave, { type: "arrayBuffer" });
  if (!r) return null;
  return { dados: new Uint8Array(r.data), tipo: (r.metadata && r.metadata.tipo) || "application/octet-stream" };
}

export async function gravarBin(chave, bytes, tipo) {
  seguro(chave);
  if (LOCAL) {
    await fs.mkdir(PASTA, { recursive: true });
    await fs.writeFile(path.join(PASTA, chave), Buffer.from(bytes));
    await fs.writeFile(path.join(PASTA, chave + ".tipo"), tipo, "utf8");
    return;
  }
  await blobs().set(chave, bytes, { metadata: { tipo } });
}

export async function apagar(chave) {
  seguro(chave);
  if (LOCAL) {
    await fs.rm(path.join(PASTA, chave), { force: true });
    await fs.rm(path.join(PASTA, chave + ".json"), { force: true });
    await fs.rm(path.join(PASTA, chave + ".tipo"), { force: true });
    return;
  }
  await blobs().delete(chave);
}
