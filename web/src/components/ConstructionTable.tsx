// ConstructionTable.tsx: tabela de construção (gerado com auxílio do Claude).
// Uma linha por estado já descoberto; células ainda não calculadas ficam
// vazias. Mesmos papéis de cor dos grafos: "atual" para a linha em
// processamento, "resultado" para a célula preenchida neste passo.
import type { Exemplo } from "../types";
import { chave, existe, filaNoPasso, novoNoPasso, type Indices } from "../lib/passos";
import { fmtConj } from "../lib/texto";
import { Marca } from "./Atomos";

interface Props { ex: Exemplo; ind: Indices; k: number }

export function ConstructionTable({ ex, ind, k }: Props) {
  const p = ex.passos[k];
  const alf = ex.afd.alfabeto;
  const novo = novoNoPasso(p);
  const origem = p.tipo === "transicao" ? p.origem : null;
  const fila = filaNoPasso(ex, ind, k);
  const linhas = ex.afd.estados.filter((s) => existe(ind.descobertoEm[s], k));

  return (
    <section className="cartao cartao-tabela" aria-labelledby="titulo-tabela">
      <header className="cartao-topo">
        <h2 id="titulo-tabela">Tabela de construção</h2>
        <span className="info">
          {p.tipo === "fim" ? "Fila vazia: construção concluída" : fila.length ? <>Na fila: <span className="mono">{fila.join(", ")}</span></> : "Fila vazia"}
        </span>
      </header>
      {/* rola só na horizontal, e só se não couber */}
      <div className="tabela-rolagem" tabIndex={0} role="region" aria-label="Tabela de construção (rolável)">
        <table>
          <thead>
            <tr>
              <th scope="col">AFD</th>
              <th scope="col">Conjunto do AFN</th>
              {alf.map((a) => <th scope="col" key={a} className="col-simbolo">{a}</th>)}
              <th scope="col">Final?</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((s) => {
              const classes = [s === origem && "linha-atual", s === novo && "linha-nova"].filter(Boolean).join(" ");
              return (
                <tr key={s} className={classes || undefined}>
                  <th scope="row" className="mono">
                    {s === ex.afd.inicial && <><span className="marca-ini" aria-hidden="true">→</span><span className="visualmente-oculto">inicial </span></>}
                    {s}
                  </th>
                  <td>
                    <span className="mono">{fmtConj(ex.mapeamento[s])}</span>
                    {s === ind.poco && <> <Marca tipo="poco" /></>}
                    {s === novo && <> <Marca tipo="novo" /></>}
                    {s === origem && <> <Marca tipo="atual" /></>}
                  </td>
                  {alf.map((a) => {
                    if (!existe(ind.criadaEm[chave(s, a)], k)) {
                      return <td key={a} className="vazia"><span className="visualmente-oculto">ainda não calculado</span></td>;
                    }
                    const atual = s === origem && p.tipo === "transicao" && a === p.simbolo;
                    const dest = ex.afd.transicoes[s][a];
                    return (
                      <td key={a} className={atual ? "celula-atual mono" : "mono"} aria-current={atual ? "true" : undefined}>
                        {dest}
                        <span className="sub">{fmtConj(ex.mapeamento[dest])}</span>
                      </td>
                    );
                  })}
                  <td>{ex.afd.finais.includes(s) ? "sim" : "não"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
