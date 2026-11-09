// Grafos.tsx: cartões do AFN e do AFD (gerado com auxílio do Claude).
// Decide, a partir do passo exportado pelo Python, o que destacar em cada
// grafo. Não recalcula nada da conversão.
import { useMemo } from "react";
import type { Exemplo } from "../types";
import { grafoDoAfd, grafoDoAfn } from "../lib/layout";
import { chave, existe, novoNoPasso, resultadoDoPasso, type Indices } from "../lib/passos";
import { fmtConj } from "../lib/texto";
import { AutomatonGraph } from "./AutomatonGraph";
import { Legend } from "./Legend";

interface Props { ex: Exemplo; ind: Indices; k: number }

const descreverTr = ([o, s, d]: [string, string, string]) => `${o} lendo ${s} vai para ${d}`;

export function GrafoAfn({ ex, k }: Omit<Props, "ind">) {
  const grafo = useMemo(() => grafoDoAfn(ex.afn), [ex]);
  const p = ex.passos[k];
  const origem = new Set(p.tipo === "fim" ? [] : p.conjunto);
  const resultado = new Set(p.tipo === "fim" ? [] : p.fecho);
  const usadasAfn = p.tipo === "transicao" ? p.transicoes_afn_usadas : [];
  const usadasEps = p.tipo === "fim" ? [] : p.transicoes_epsilon_usadas;
  const usadas = new Set(usadasAfn.map(([o, s, d]) => `${o}|${d}|${s}`));
  const eps = new Set(usadasEps.map(([o, , d]) => `${o}|${d}`));

  const base = `AFN com ${ex.afn.estados.length} estados, inicial ${ex.afn.inicial}, finais ${fmtConj(ex.afn.finais)}.`;
  const todas = [...usadasAfn, ...usadasEps];
  const descricao = p.tipo === "fim"
    ? `${base} Nenhum destaque: a construção terminou.`
    : `${base} Conjunto atual ${fmtConj(p.conjunto)} com anel grosso; resultado ${fmtConj(p.fecho)} com halo tracejado. ` +
      (todas.length ? `Transições usadas: ${todas.map(descreverTr).join("; ")}.` : "Nenhuma transição usada neste passo.");

  return (
    <section className="cartao cartao-grafo" aria-labelledby="titulo-afn">
      <header className="cartao-topo">
        <h2 id="titulo-afn">AFN <span className="titulo-nota">original</span></h2>
        <span className="info">{ex.afn.estados.length} estados · alfabeto {fmtConj(ex.afn.alfabeto)}</span>
        <Legend rotulo="Legenda do AFN" itens={["origem", "resultado", "usada", "eps", "final"]} />
      </header>
      <AutomatonGraph
        grafo={grafo}
        titulo="AFN original"
        descricao={descricao}
        no={(id) => {
          const papeis = [origem.has(id) && "no conjunto atual", resultado.has(id) && "no resultado do passo"].filter(Boolean);
          return {
            origem: origem.has(id),
            resultado: resultado.has(id),
            dica: `${id}${ex.afn.finais.includes(id) ? " (final)" : ""}${papeis.length ? `, ${papeis.join(" e ")}` : ""}`,
          };
        }}
        aresta={(a) => {
          const simbolos = a.simbolos.map((s) => ({
            s,
            usado: a.eps ? eps.has(`${a.de}|${a.para}`) : usadas.has(`${a.de}|${a.para}|${s}`),
          }));
          return { simbolos, usada: simbolos.some((x) => x.usado) };
        }}
      />
    </section>
  );
}

export function GrafoAfd({ ex, ind, k }: Props) {
  const grafo = useMemo(() => grafoDoAfd(ex.afd), [ex]);
  const p = ex.passos[k];
  const origem = p.tipo === "transicao" ? p.origem : null;
  const resultado = resultadoDoPasso(p);
  const novo = novoNoPasso(p);
  const visiveis = ex.afd.estados.filter((s) => existe(ind.descobertoEm[s], k));

  const transicoes = visiveis.flatMap((s) => ex.afd.alfabeto
    .filter((a) => existe(ind.criadaEm[chave(s, a)], k))
    .map((a) => descreverTr([s, a, ex.afd.transicoes[s][a]])));
  const descricao = `Estados do AFD até agora: ${visiveis.join(", ")}. ` +
    (transicoes.length ? `Transições: ${transicoes.join("; ")}. ` : "Ainda sem transições. ") +
    (origem ? `Origem do passo: ${origem}. ` : "") +
    (resultado ? `Resultado do passo: ${resultado}${novo ? " (novo)" : ""}.` : "");

  return (
    <section className="cartao cartao-grafo" aria-labelledby="titulo-afd">
      <header className="cartao-topo">
        <h2 id="titulo-afd">AFD <span className="titulo-nota">sendo construído</span></h2>
        <span className="info">
          {p.tipo === "fim" ? `${visiveis.length} estados · completo` : `${visiveis.length} ${visiveis.length === 1 ? "estado" : "estados"} até agora`}
        </span>
        <Legend rotulo="Legenda do AFD" itens={["origem", "resultado", "novo", "usada", "final", "poco"]} />
      </header>
      <AutomatonGraph
        grafo={grafo}
        titulo="AFD sendo construído"
        descricao={descricao}
        no={(id) => {
          if (!existe(ind.descobertoEm[id], k)) return null;
          return {
            origem: id === origem,
            resultado: id === resultado,
            novo: id === novo,
            poco: id === ind.poco,
            dica: `${id} = ${fmtConj(ex.mapeamento[id])}${ex.afd.finais.includes(id) ? " (final)" : ""}`,
          };
        }}
        aresta={(a) => {
          const simbolos = a.simbolos
            .filter((s) => existe(ind.criadaEm[chave(a.de, s)], k))
            .map((s) => ({ s, usado: p.tipo === "transicao" && a.de === origem && s === p.simbolo }));
          if (!simbolos.length) return null;
          const usada = simbolos.some((x) => x.usado);
          // só anima o traço quando o arco inteiro acabou de surgir
          return { simbolos, usada, desenhando: usada && simbolos.length === 1 };
        }}
      />
    </section>
  );
}
