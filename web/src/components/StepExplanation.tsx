// StepExplanation.tsx: explicação do passo atual (gerado com auxílio do
// Claude; o grupo deve revisar os textos). Os textos são montados a partir
// dos dados do passo exportados pelo Python, nunca escritos à mão por exemplo.
//
// Divulgação progressiva: sempre visível o essencial (o que acontece, por
// quê, a conta em uma linha por etapa, o que mudou); a lista de transições
// usadas fica em "Ver cálculo detalhado".
import type { ReactNode } from "react";
import type { Exemplo, PassoFim, PassoInicio, PassoTransicao } from "../types";
import { fmtConj } from "../lib/texto";
import { Conj, Est, Icone, juntar, Marca, Simb, Tr } from "./Atomos";

interface Conteudo {
  titulo: ReactNode;
  /** frase curta anunciada pelo leitor de tela */
  resumo: string;
  blocos: { titulo: string; corpo: ReactNode }[];
  detalhes: { titulo: ReactNode; itens: ReactNode[] }[] | null;
  extraTopo?: ReactNode;
}

function NotaFinal({ nome, finais }: { nome: string; finais: string[] }) {
  return (
    <>
      <Est s={nome} /> é <b>final</b> porque contém {juntar(finais.map((f) => <Est key={f} s={f} />))}, que{" "}
      {finais.length > 1 ? "são finais" : "é final"} no AFN.
    </>
  );
}

function itensEps(p: PassoInicio | PassoTransicao): ReactNode[] {
  return p.transicoes_epsilon_usadas.length
    ? p.transicoes_epsilon_usadas.map((t) => <><Est s={t[2]} /> entrou porque <Tr t={t} tipo="eps" /></>)
    : ["nenhuma transição ε acrescentou estados"];
}

const Derivacao = ({ etapas }: { etapas: [string, ReactNode][] }) => (
  <ol className="derivacao">
    {etapas.map(([nome, conta]) => (
      <li key={nome}><span className="nome-etapa">{nome}</span><span className="conta">{conta}</span></li>
    ))}
  </ol>
);

const Mudancas = ({ itens }: { itens: [("add" | "igual" | "nota"), ReactNode][] }) => (
  <ul className="mudancas">
    {itens.map(([tipo, texto], i) => <li key={i} className={tipo}><span>{texto}</span></li>)}
  </ul>
);

function explicarInicio(p: PassoInicio, ex: Exemplo): Conteudo {
  const q0 = <Est s={ex.afn.inicial} />;
  const temEps = p.transicoes_epsilon_usadas.length > 0;
  return {
    titulo: "Estado inicial do AFD",
    resumo: `Estado inicial: ${p.estado_afd} = ${fmtConj(p.fecho)}.`,
    blocos: [
      { titulo: "O que está acontecendo?", corpo: <p>O AFD começa no <b>ε-fecho</b> do estado inicial do AFN, {q0}.</p> },
      {
        titulo: "Por quê?",
        corpo: temEps
          ? <p>Antes de ler qualquer símbolo, o AFN já pode estar em {q0} e em todo estado alcançável a partir dele só por transições ε. Esse conjunto inteiro vira um único estado do AFD.</p>
          : <p>Como nenhuma transição ε sai de {q0}, o fecho é só <Conj c={p.fecho} />. Esse conjunto vira o estado inicial do AFD.</p>,
      },
      {
        titulo: "Cálculo",
        corpo: <Derivacao etapas={[
          ["ε-fecho", <><Conj c={p.conjunto} /> → <Conj c={p.fecho} /></>],
          ["estado", <><Est s={p.estado_afd} /> <Marca tipo="novo" /></>],
        ]} />,
      },
      {
        titulo: "O que mudou?",
        corpo: <Mudancas itens={[
          ["add", <>Novo estado do AFD: <Est s={p.estado_afd} /> = <Conj c={p.fecho} />, o estado <b>inicial</b>.</>],
          ["nota", p.e_final
            ? <NotaFinal nome={p.estado_afd} finais={p.finais_no_conjunto} />
            : <><Est s={p.estado_afd} /> não é final: nenhum estado de <Conj c={p.fecho} /> é final no AFN.</>],
          ["nota", <><Est s={p.estado_afd} /> entra na fila. Em seguida será processado com cada símbolo do alfabeto ({juntar(ex.afd.alfabeto.map((a) => <Simb key={a} s={a} />))}).</>],
        ]} />,
      },
    ],
    detalhes: [{ titulo: <>ε-fecho(<Conj c={p.conjunto} />): quem entrou por ε</>, itens: itensEps(p) }],
  };
}

function explicarTransicao(p: PassoTransicao): Conteudo {
  const S = <Simb s={p.simbolo} />;
  const origemPoco = p.conjunto.length === 0;

  const porque: ReactNode[] = [];
  if (origemPoco) {
    porque.push(<>O conjunto vazio não tem nenhum estado do AFN de onde sair, então lendo {S} o resultado continua vazio.</>);
  } else if (p.mover.length === 0) {
    porque.push(<>Nenhum estado de <Conj c={p.conjunto} /> tem transição com {S}. Todos os caminhos do AFN morrem aqui e o resultado é o conjunto vazio.</>);
  } else if (p.mover.length > 1) {
    porque.push(<>Como o AFN é não-determinístico, lendo {S} ele pode ir para {juntar(p.mover.map((q) => <Est key={q} s={q} />))} <b>ao mesmo tempo</b>. O AFD representa todas essas possibilidades com <b>um único estado</b>, que guarda o conjunto inteiro.</>);
  } else {
    porque.push(<>Lendo {S}, o único estado que o AFN alcança é <Est s={p.mover[0]} />.</>);
  }
  if (p.transicoes_epsilon_usadas.length) {
    porque.push(<>Depois de ler o símbolo, o AFN ainda pode seguir transições ε sem consumir nada. Por isso o resultado passa pelo ε-fecho.</>);
  }
  if (!p.destino_novo && !origemPoco) {
    porque.push(<>O conjunto <Conj c={p.fecho} /> já tinha aparecido antes como <Est s={p.destino} />, então o AFD reaproveita esse estado.</>);
  }

  const itensMover: ReactNode[] = p.transicoes_afn_usadas.map((t) => <Tr t={t} tipo="usada" />);
  if (p.sem_transicao.length) {
    itensMover.push(<>{juntar(p.sem_transicao.map((q) => <Est key={q} s={q} />))} não {p.sem_transicao.length > 1 ? "têm" : "tem"} transição com {S}</>);
  }
  if (!itensMover.length) itensMover.push("o conjunto de partida é vazio: não há transições a seguir");

  const D = <Est s={p.destino} />;
  const mudou: [("add" | "igual" | "nota"), ReactNode][] = [];
  if (p.destino_novo) mudou.push(["add", <>Novo estado do AFD: {D} = <Conj c={p.fecho} /></>]);
  mudou.push(["add", <>Nova transição: <Tr t={[p.origem, p.simbolo, p.destino]} /></>]);
  if (!p.destino_novo) mudou.push(["igual", <>{D} já existia; só a transição foi adicionada.</>]);
  if (p.destino_novo && p.e_final) mudou.push(["nota", <NotaFinal nome={p.destino} finais={p.finais_no_conjunto} />]);
  if (p.destino_novo && !p.e_final && !p.poco) {
    mudou.push(["nota", <>{D} não é final: nenhum estado de <Conj c={p.fecho} /> é final no AFN.</>]);
  }
  if (p.poco && p.destino_novo) {
    mudou.push(["nota", <>{D} é o <b>estado poço</b>: representa “nenhum caminho do AFN sobrevive”. A partir dele, qualquer símbolo leva de volta a ele, porque o vazio continua vazio. Ele completa o AFD: toda combinação de estado e símbolo passa a ter destino.</>]);
  } else if (p.poco) {
    mudou.push(["nota", <>{D} é o poço: a partir daqui nenhuma leitura leva à aceitação.</>]);
  }
  if (p.destino_novo) mudou.push(["nota", <>{D} entra na fila para ser processado depois.</>]);

  return {
    titulo: <><span className="mono">{p.origem}</span> lendo {S}</>,
    resumo: `${p.origem} lendo ${p.simbolo} vai para ${p.destino}${p.destino_novo ? ", estado novo" : ", que já existia"}${p.poco ? " (poço)" : ""}.`,
    blocos: [
      {
        titulo: "O que está acontecendo?",
        corpo: origemPoco
          ? <p>Estamos no estado <Est s={p.origem} /> = ∅, o poço. Vamos ver o que acontece lendo {S}.</p>
          : <p>Estamos no estado <Est s={p.origem} /> = <Conj c={p.conjunto} /> do AFD. Vamos ver para onde o AFN pode ir, a partir desses estados, lendo {S}.</p>,
      },
      { titulo: "Por quê?", corpo: porque.map((x, i) => <p key={i}>{x}</p>) },
      {
        titulo: "Cálculo",
        corpo: <Derivacao etapas={[
          ["mover", <><Conj c={p.conjunto} /> —{p.simbolo}→ <Conj c={p.mover} /></>],
          ["ε-fecho", <><Conj c={p.mover} /> → <Conj c={p.fecho} /></>],
          ["destino", <>{D} <Marca tipo={p.destino_novo ? "novo" : "existente"} /></>],
        ]} />,
      },
      { titulo: "O que mudou?", corpo: <Mudancas itens={mudou} /> },
    ],
    detalhes: [
      { titulo: <>mover(<Conj c={p.conjunto} />, {S}): transições do AFN usadas</>, itens: itensMover },
      { titulo: <>ε-fecho(<Conj c={p.mover} />): quem entrou por ε</>, itens: itensEps(p) },
    ],
  };
}

function explicarFim(p: PassoFim, ex: Exemplo): Conteudo {
  const n = p.n_afn;
  const v = ex.verificacao;
  return {
    titulo: "Construção concluída",
    resumo: `Construção concluída: ${n} estados no AFN, ${p.n_afd} no AFD.`,
    extraTopo: (
      <div className="resumo-numeros">
        <div className="numero">{n}<small>estados no AFN</small></div>
        <div className="numero numero-seta" aria-hidden="true">→</div>
        <div className="numero">{p.n_afd}<small>estados no AFD</small></div>
      </div>
    ),
    blocos: [
      {
        titulo: "O que aconteceu?",
        corpo: <>
          <p>A fila esvaziou: todo conjunto descoberto já foi processado com todos os símbolos. O AFD está completo.</p>
          <p>
            Estados finais do AFD: {p.finais.length ? juntar(p.finais.map((f) => <Est key={f} s={f} />)) : "nenhum"}, os conjuntos que contêm algum estado final do AFN.
            {p.poco ? <> O estado <Est s={p.poco} /> é o poço.</> : " Não surgiu estado poço: o conjunto vazio nunca apareceu."}
          </p>
        </>,
      },
      {
        titulo: "O que isso significa?",
        corpo: <p>No pior caso, um AFN com <i>n</i> estados gera um AFD com até 2<sup><i>n</i></sup> estados, um para cada subconjunto. Aqui <i>n</i> = {n}, então o limite seria 2<sup>{n}</sup> = {2 ** n}. Como a construção só cria os conjuntos alcançáveis a partir do estado inicial, o AFD ficou com {p.n_afd}.</p>,
      },
      {
        titulo: "Os dois são equivalentes?",
        corpo: <>
          <p>O Python rodou {v.total} cadeias, de tamanho até {v.tamanho_max}, nos dois autômatos: {v.divergencias.length === 0 ? "todas tiveram o mesmo resultado." : `${v.divergencias.length} deram resultados diferentes.`}</p>
          <p><a href="#testar">Teste você mesmo uma cadeia</a></p>
        </>,
      },
    ],
    detalhes: null,
  };
}

interface Props {
  ex: Exemplo;
  /** índice e total vêm do player: a única fonte desses números */
  indice: number;
  total: number;
  detalhesAbertos: boolean;
  aoAlternarDetalhes: (aberto: boolean) => void;
}

export function StepExplanation({ ex, indice, total, detalhesAbertos, aoAlternarDetalhes }: Props) {
  const p = ex.passos[indice];
  const c = p.tipo === "inicio" ? explicarInicio(p, ex) : p.tipo === "transicao" ? explicarTransicao(p) : explicarFim(p, ex);

  return (
    <section className="cartao cartao-explicacao" id="explicacao" aria-labelledby="titulo-passo">
      {/* anúncio curto: ler o painel inteiro a cada passo cansaria */}
      <p className="visualmente-oculto" aria-live="polite" aria-atomic="true">
        Passo {indice + 1} de {total}. {c.resumo}
      </p>
      <header className="explicacao-topo">
        <p className="passo-num">Passo {indice + 1} de {total}</p>
        <h2 id="titulo-passo" className="passo-titulo">{c.titulo}</h2>
      </header>
      {c.extraTopo}
      {c.blocos.map((b) => (
        <div className="bloco" key={b.titulo}>
          <h3>{b.titulo}</h3>
          {b.corpo}
        </div>
      ))}
      {c.detalhes && (
        <details className="detalhes" open={detalhesAbertos} onToggle={(e) => aoAlternarDetalhes(e.currentTarget.open)}>
          <summary><Icone nome="seta" />Ver cálculo detalhado</summary>
          <div className="detalhes-corpo">
            {c.detalhes.map((g, i) => (
              <div key={i}>
                <p className="grupo">{g.titulo}</p>
                <ul>{g.itens.map((x, j) => <li key={j}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
