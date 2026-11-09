// Legend.tsx: legenda de um grafo num popover "?" (gerado com auxílio do
// Claude). Fica junto do grafo em vez de ocupar uma faixa da página.
import { useEffect, useId, useRef, useState } from "react";
import { Icone } from "./Atomos";

export type ItemLegenda = "origem" | "resultado" | "novo" | "usada" | "eps" | "final" | "poco";

const ITENS: Record<ItemLegenda, { texto: string; amostra: JSX.Element }> = {
  origem: {
    texto: "Conjunto atual (origem do passo): anel grosso",
    amostra: <circle cx="20" cy="12" r="8" className="leg-origem" />,
  },
  resultado: {
    texto: "Resultado do passo: halo tracejado",
    amostra: <><circle cx="20" cy="12" r="6" className="leg-base leg-resultado-fundo" /><circle cx="20" cy="12" r="10" className="leg-resultado" /></>,
  },
  novo: {
    texto: "Estado criado neste passo: etiqueta “novo”",
    amostra: <><rect x="4" y="5" width="32" height="14" rx="7" className="leg-novo" /><text x="20" y="12.5" className="leg-novo-texto">novo</text></>,
  },
  usada: {
    texto: "Transição usada no passo: linha grossa, símbolo sublinhado",
    amostra: <path d="M4 12h32" className="leg-usada" />,
  },
  eps: {
    texto: "Transição ε: tracejada",
    amostra: <path d="M4 12h32" className="leg-eps" />,
  },
  final: {
    texto: "Estado final: círculo duplo",
    amostra: <><circle cx="20" cy="12" r="9" className="leg-base" /><circle cx="20" cy="12" r="6" className="leg-base" /></>,
  },
  poco: {
    texto: "Estado poço (conjunto vazio): contorno pontilhado e “poço”",
    amostra: <circle cx="20" cy="12" r="8" className="leg-base leg-poco" />,
  },
};

export function Legend({ rotulo, itens }: { rotulo: string; itens: ItemLegenda[] }) {
  const [aberta, setAberta] = useState(false);
  const id = useId();
  const caixa = useRef<HTMLDivElement>(null);

  // fecha com Esc ou clique fora
  useEffect(() => {
    if (!aberta) return undefined;
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === "Escape") setAberta(false); };
    const aoClicar = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberta(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicar);
    };
  }, [aberta]);

  return (
    <div className="legenda" ref={caixa}>
      <button
        type="button"
        className="botao-icone botao-ajuda"
        aria-label={rotulo}
        aria-expanded={aberta}
        aria-controls={id}
        onClick={() => setAberta((v) => !v)}
      >
        <Icone nome="ajuda" />
      </button>
      {aberta && (
        <ul className="legenda-painel" id={id}>
          {itens.map((item) => (
            <li key={item}>
              <svg viewBox="0 0 40 24" aria-hidden="true">{ITENS[item].amostra}</svg>
              {ITENS[item].texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
