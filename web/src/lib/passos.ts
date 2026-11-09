// passos.ts: o que mostrar em cada passo (gerado com auxílio do Claude).
//
// Funções puras, sem DOM. NÃO calculam ε-fecho, mover nem subconjuntos: a
// construção já vem pronta do Python (lista de passos em web/dados/). Aqui só
// se indexa essa lista para responder perguntas como "no passo k, quais
// estados do AFD já existem?" ou "qual célula da tabela está sendo
// preenchida?".
import type { AFD, Estado, Exemplo, Passo, Simbolo } from "../types";

export interface Indices {
  /** passo em que cada estado do AFD aparece pela primeira vez */
  descobertoEm: Record<Estado, number>;
  /** passo em que cada transição "origem|símbolo" do AFD é criada */
  criadaEm: Record<string, number>;
  /** primeiro passo em que o estado é processado (sai da fila) */
  saiDaFilaEm: Record<Estado, number>;
  /** estado poço, se existir */
  poco: Estado | null;
}

export const chave = (origem: Estado, simbolo: Simbolo): string => `${origem}|${simbolo}`;

export function indexarPassos(passos: readonly Passo[]): Indices {
  const descobertoEm: Record<Estado, number> = {};
  const criadaEm: Record<string, number> = {};
  const saiDaFilaEm: Record<Estado, number> = {};
  let poco: Estado | null = null;
  passos.forEach((p, i) => {
    if (p.tipo === "inicio") descobertoEm[p.estado_afd] = i;
    if (p.tipo === "transicao") {
      if (p.destino_novo) descobertoEm[p.destino] = i;
      criadaEm[chave(p.origem, p.simbolo)] = i;
      if (!(p.origem in saiDaFilaEm)) saiDaFilaEm[p.origem] = i;
    }
    if (p.tipo === "fim") poco = p.poco;
  });
  return { descobertoEm, criadaEm, saiDaFilaEm, poco };
}

export const existe = (passoDoEvento: number | undefined, k: number): boolean =>
  passoDoEvento !== undefined && passoDoEvento <= k;

/** AFD com só o que já foi descoberto até o passo k */
export function afdParcial(ex: Exemplo, ind: Indices, k: number): AFD {
  const estados = ex.afd.estados.filter((s) => existe(ind.descobertoEm[s], k));
  const transicoes: AFD["transicoes"] = {};
  for (const s of estados) {
    transicoes[s] = {};
    for (const a of ex.afd.alfabeto) {
      if (existe(ind.criadaEm[chave(s, a)], k)) transicoes[s][a] = ex.afd.transicoes[s][a];
    }
  }
  return {
    estados,
    alfabeto: ex.afd.alfabeto,
    inicial: ex.afd.inicial,
    finais: ex.afd.finais.filter((s) => estados.includes(s)),
    transicoes,
  };
}

/** estado do AFD que é o resultado do passo (destino ou estado inicial) */
export function resultadoDoPasso(p: Passo): Estado | null {
  if (p.tipo === "inicio") return p.estado_afd;
  if (p.tipo === "transicao") return p.destino;
  return null;
}

/** estado do AFD criado neste passo, se houver */
export function novoNoPasso(p: Passo): Estado | null {
  if (p.tipo === "inicio") return p.estado_afd;
  if (p.tipo === "transicao" && p.destino_novo) return p.destino;
  return null;
}

/** descobertos que ainda não começaram a ser processados */
export function filaNoPasso(ex: Exemplo, ind: Indices, k: number): Estado[] {
  if (ex.passos[k].tipo === "fim") return [];
  return ex.afd.estados.filter((s) => existe(ind.descobertoEm[s], k) && !existe(ind.saiDaFilaEm[s], k));
}
