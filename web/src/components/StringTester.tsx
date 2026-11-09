// StringTester.tsx: testar uma cadeia nos dois autômatos (gerado com
// auxílio do Claude). O AFD é seguido pela sua tabela de transições (consulta
// direta, não é conversão); o AFN usa a simulação pré-calculada pelo Python.
import { useState, type FormEvent } from "react";
import type { Estado, Exemplo } from "../types";
import { fmtConj } from "../lib/texto";
import { Icone } from "./Atomos";

function Veredito({ aceita }: { aceita: boolean }) {
  return (
    <span className={`veredito ${aceita ? "aceita" : "rejeita"}`}>
      <Icone nome={aceita ? "certo" : "errado"} />
      {aceita ? "aceita" : "rejeita"}
    </span>
  );
}

function Caminho<T>({ estados, simbolos, final, rotulo }: {
  estados: T[]; simbolos: string[]; final: (e: T) => boolean; rotulo: (e: T) => string;
}) {
  return (
    <ol className="caminho">
      {estados.flatMap((e, i) => [
        i > 0 && (
          <li key={`l${i}`} className="leitura">
            <span aria-hidden="true">—<b>{simbolos[i - 1]}</b>→</span>
            <span className="visualmente-oculto">lendo {simbolos[i - 1]}, vai para</span>
          </li>
        ),
        <li key={`e${i}`} className={`passo-caminho mono ${final(e) ? "final" : ""}`}>
          {rotulo(e)}
          {final(e) && <span className="visualmente-oculto"> (final)</span>}
        </li>,
      ])}
    </ol>
  );
}

interface Resultado {
  w: string;
  simbolos: string[];
  caminhoAfd: Estado[];
  aceitaAfd: boolean;
  conjuntosAfn: Estado[][] | null;
  aceitaAfn: boolean | null;
}

export function StringTester({ ex }: { ex: Exemplo }) {
  const [entrada, setEntrada] = useState("");
  const [erro, setErro] = useState("");
  const [res, setRes] = useState<Resultado | null>(null);
  const sim = ex.simulacao_afn;

  function simular(e: FormEvent) {
    e.preventDefault();
    const w = entrada.trim() === "ε" ? "" : entrada.trim();
    const simbolos = [...w];
    const invalidos = [...new Set(simbolos.filter((s) => !ex.afn.alfabeto.includes(s)))];
    if (invalidos.length) {
      setErro(`Símbolo fora do alfabeto: ${invalidos.join(", ")}. Use só ${fmtConj(ex.afn.alfabeto)}.`);
      setRes(null);
      return;
    }
    setErro("");
    const caminhoAfd = [ex.afd.inicial];
    for (const s of simbolos) caminhoAfd.push(ex.afd.transicoes[caminhoAfd[caminhoAfd.length - 1]][s]);
    const cabe = simbolos.length <= sim.tamanho_max;
    setRes({
      w,
      simbolos,
      caminhoAfd,
      aceitaAfd: ex.afd.finais.includes(caminhoAfd[caminhoAfd.length - 1]),
      conjuntosAfn: cabe ? [sim.estados_apos[""], ...simbolos.map((_, i) => sim.estados_apos[w.slice(0, i + 1)])] : null,
      aceitaAfn: cabe ? sim.aceita[w] : null,
    });
  }

  const nomeCadeia = res && (res.w === "" ? "ε (cadeia vazia)" : res.w);
  const mesmosConjuntos = res?.conjuntosAfn?.every((c, i) => fmtConj(c) === fmtConj(ex.mapeamento[res.caminhoAfd[i]]));
  const ultimoAfd = res ? res.caminhoAfd[res.caminhoAfd.length - 1] : "";

  return (
    <section className="testar" id="testar" aria-labelledby="titulo-testar">
      <h2 id="titulo-testar">Testar uma cadeia</h2>
      <p className="testar-ajuda" id="ajuda-cadeia">
        Alfabeto <span className="mono">{fmtConj(ex.afn.alfabeto)}</span>. O AFD é simulado seguindo a sua tabela de
        transições; para o AFN, a interface usa a simulação pré-calculada pelo Python, para cadeias de até{" "}
        {sim.tamanho_max} símbolos.
      </p>
      <form className="form-cadeia" onSubmit={simular} autoComplete="off">
        <label htmlFor="cadeia" className="visualmente-oculto">Cadeia a testar</label>
        <input id="cadeia" type="text" spellCheck={false} value={entrada} onChange={(e) => setEntrada(e.target.value)}
          aria-describedby="ajuda-cadeia erro-cadeia" placeholder="ex.: abba (vazio = cadeia vazia ε)" />
        <button type="submit" className="botao-texto">Simular</button>
      </form>
      <p id="erro-cadeia" className="erro" role="alert">{erro}</p>

      <div className="resultado-cadeia" aria-live="polite">
        {res && (
          <>
            {res.conjuntosAfn && res.aceitaAfn !== null ? (
              <div className="simulacao">
                <h3>AFN <Veredito aceita={res.aceitaAfn} /></h3>
                <Caminho estados={res.conjuntosAfn} simbolos={res.simbolos}
                  final={(c) => c.some((q) => ex.afn.finais.includes(q))} rotulo={fmtConj} />
                <p className="nota-simulacao">Cada caixa é o conjunto de estados em que o AFN pode estar depois de ler aquele símbolo (já com o ε-fecho). Ele aceita se o último conjunto contém um estado final.</p>
              </div>
            ) : (
              <div className="simulacao">
                <h3>AFN</h3>
                <p className="nota-simulacao">O Python pré-calculou o AFN só para cadeias de até {sim.tamanho_max} símbolos. Use uma cadeia menor para comparar.</p>
              </div>
            )}
            <div className="simulacao">
              <h3>AFD <Veredito aceita={res.aceitaAfd} /></h3>
              <Caminho estados={res.caminhoAfd} simbolos={res.simbolos} final={(e) => ex.afd.finais.includes(e)} rotulo={(e) => e} />
              <p className="nota-simulacao">Um único caminho: em cada estado, cada símbolo leva a exatamente um próximo estado. Termina em {ultimoAfd}, que {res.aceitaAfd ? "é" : "não é"} final.</p>
            </div>
            {res.aceitaAfn !== null && (
              <p className="comparacao">
                {res.aceitaAfn === res.aceitaAfd ? "Os dois concordam" : "Os dois DISCORDAM"} sobre “{nomeCadeia}”.
                {mesmosConjuntos && " Repare: a cada símbolo, o conjunto de estados ativos do AFN é exatamente o conjunto que o estado do AFD guarda (coluna “Conjunto do AFN” da tabela)."}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
