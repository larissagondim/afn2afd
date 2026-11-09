// App.tsx: composição da página (gerado com auxílio do Claude).
// Ordem de leitura: cabeçalho → player → explicação → AFN → AFD → tabela →
// testar cadeia.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Exemplo } from "./types";
import { indiceExemplos } from "./data/examples";
import { indexarPassos } from "./lib/passos";
import { usePlayer } from "./hooks/usePlayer";
import { ExampleSelect } from "./components/ExampleSelect";
import { PlayerControls } from "./components/PlayerControls";
import { StepExplanation } from "./components/StepExplanation";
import { GrafoAfd, GrafoAfn } from "./components/Grafos";
import { ConstructionTable } from "./components/ConstructionTable";
import { StringTester } from "./components/StringTester";

type Carga = { estado: "carregando" } | { estado: "ok"; ex: Exemplo } | { estado: "erro"; mensagem: string };

function Visualizador({ ex, detalhesAbertos, aoAlternarDetalhes }: {
  ex: Exemplo; detalhesAbertos: boolean; aoAlternarDetalhes: (v: boolean) => void;
}) {
  const ind = useMemo(() => indexarPassos(ex.passos), [ex]);
  // índice e total do passo existem só aqui; tudo abaixo recebe por props
  const { estado, despachar } = usePlayer(ex.passos.length);
  const k = estado.indice;
  return (
    <>
      <PlayerControls estado={estado} despachar={despachar} />
      <main className="palco">
        <div className="coluna-explicacao">
          <StepExplanation ex={ex} indice={k} total={estado.total}
            detalhesAbertos={detalhesAbertos} aoAlternarDetalhes={aoAlternarDetalhes} />
        </div>
        <div className="coluna-grafos">
          <GrafoAfn ex={ex} k={k} />
          <GrafoAfd ex={ex} ind={ind} k={k} />
        </div>
        <div className="coluna-tabela">
          <ConstructionTable ex={ex} ind={ind} k={k} />
        </div>
      </main>
      <StringTester ex={ex} />
    </>
  );
}

function Aviso({ titulo, detalhe, aoTentar }: { titulo: string; detalhe: string; aoTentar?: () => void }) {
  return (
    <main className="palco palco-aviso">
      <section className="cartao aviso" role="alert">
        <h2>{titulo}</h2>
        <p>
          Escolha outro exemplo no menu <b>Exemplo</b>, no topo da página, ou tente de novo. Se os arquivos de dados
          não existirem, rode <code className="mono">python gerar_passos.py</code> na raiz do projeto (ou{" "}
          <code className="mono">npm run dados</code> dentro de <code className="mono">web/</code>) e recarregue a página.
        </p>
        <p className="texto-suave">Detalhe técnico: {detalhe}</p>
        {aoTentar && <button type="button" className="botao-texto" onClick={aoTentar}>Tentar de novo</button>}
      </section>
    </main>
  );
}

export function App() {
  const [nome, setNome] = useState(indiceExemplos[0]?.nome ?? "");
  const [cargas, setCargas] = useState<Record<string, Carga>>({});
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);

  const carregar = useCallback((n: string) => {
    const item = indiceExemplos.find((i) => i.nome === n);
    if (!item) return;
    setCargas((c) => ({ ...c, [n]: { estado: "carregando" } }));
    item.carregar()
      .then((ex) => setCargas((c) => ({ ...c, [n]: { estado: "ok", ex } })))
      .catch((e: unknown) => {
        console.error(e);
        setCargas((c) => ({ ...c, [n]: { estado: "erro", mensagem: e instanceof Error ? e.message : String(e) } }));
      });
  }, []);

  // carrega todos de uma vez (são pequenos) para o menu já mostrar as descrições
  useEffect(() => { indiceExemplos.forEach((i) => carregar(i.nome)); }, [carregar]);

  const opcoes = indiceExemplos.map((i) => {
    const c = cargas[i.nome];
    return {
      nome: i.nome,
      descricao: c?.estado === "ok" ? c.ex.descricao : c?.estado === "erro" ? "não carregou" : "",
    };
  });
  const atual = cargas[nome];

  return (
    <div className="pagina">
      <a className="pular" href="#explicacao">Pular para a explicação do passo</a>
      <header className="cabecalho">
        <h1>
          AFN <span aria-hidden="true">→</span><span className="visualmente-oculto">para</span> AFD
          <span className="subtitulo">construção de subconjuntos, passo a passo</span>
        </h1>
        {opcoes.length > 0 && <ExampleSelect opcoes={opcoes} valor={nome} aoEscolher={setNome} />}
      </header>

      {indiceExemplos.length === 0 ? (
        <Aviso titulo="Nenhum exemplo encontrado." detalhe="a pasta web/dados/ está vazia" />
      ) : !atual || atual.estado === "carregando" ? (
        <main className="palco palco-aviso"><p className="texto-suave">Carregando o exemplo…</p></main>
      ) : atual.estado === "erro" ? (
        <Aviso titulo={`Não consegui carregar o exemplo “${nome}”.`} detalhe={atual.mensagem} aoTentar={() => carregar(nome)} />
      ) : (
        // key: trocar de exemplo recomeça o player do passo 1
        <Visualizador key={nome} ex={atual.ex} detalhesAbertos={detalhesAbertos} aoAlternarDetalhes={setDetalhesAbertos} />
      )}
    </div>
  );
}
