// Atomos.tsx: pedaços de texto reutilizados (gerado com auxílio do Claude).
// Mesmo componente, mesma aparência em explicação, tabela e teste de cadeia.
import { Fragment, type ReactNode } from "react";
import type { Estado, Simbolo, Transicao } from "../types";
import { fmtConj } from "../lib/texto";

export const Conj = ({ c }: { c: readonly Estado[] }) => <span className="mono conj">{fmtConj(c)}</span>;
export const Est = ({ s }: { s: Estado }) => <b className="mono">{s}</b>;
export const Simb = ({ s }: { s: Simbolo }) => <code className="mono simb">{s}</code>;

export function Tr({ t, tipo }: { t: Transicao; tipo?: "usada" | "eps" }) {
  const [o, s, d] = t;
  return <span className={`mono tr ${tipo ? `tr-${tipo}` : ""}`}>{o} —{s}→ {d}</span>;
}

export type TipoMarca = "novo" | "atual" | "existente" | "poco";
const TEXTO_MARCA: Record<TipoMarca, string> = { novo: "novo", atual: "atual", existente: "já existia", poco: "poço" };

export const Marca = ({ tipo }: { tipo: TipoMarca }) => <span className={`marca marca-${tipo}`}>{TEXTO_MARCA[tipo]}</span>;

/** junta nós como em português: "a", "a e b", "a, b e c" */
export function juntar(nos: ReactNode[]): ReactNode {
  return nos.map((n, i) => (
    <Fragment key={i}>
      {i > 0 && (i === nos.length - 1 ? " e " : ", ")}
      {n}
    </Fragment>
  ));
}

/** ícones em SVG inline (sem biblioteca) */
export type NomeIcone = "primeiro" | "anterior" | "play" | "pausa" | "proximo" | "ajuda" | "seta" | "certo" | "errado";
const CAMINHOS: Record<NomeIcone, string> = {
  primeiro: "M6 5v14M18 5l-9 7 9 7z",
  anterior: "M15 5 8 12l7 7",
  play: "M8 5v14l11-7z",
  pausa: "M8 5v14M16 5v14",
  proximo: "m9 5 7 7-7 7",
  ajuda: "M9.1 9a3 3 0 1 1 4.2 2.7c-.8.4-1.3 1.2-1.3 2.1V15M12 18.5v.01",
  seta: "m9 5 7 7-7 7",
  certo: "M5 12.5l4.5 4.5L19 7.5",
  errado: "M6 6l12 12M18 6 6 18",
};

export function Icone({ nome, preenchido = false }: { nome: NomeIcone; preenchido?: boolean }) {
  return (
    <svg className={`icone ${preenchido ? "icone-cheio" : ""}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={CAMINHOS[nome]} />
    </svg>
  );
}
