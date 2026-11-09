// usePlayer.ts: estado único do player (gerado com auxílio do Claude).
// Índice do passo, total, play/pause e velocidade moram SÓ aqui: todo lugar
// que mostra "passo X de Y" lê deste estado.
import { useEffect, useReducer } from "react";

export const VELOCIDADES = [
  { intervalo: 2400, rotulo: "0,5×" },
  { intervalo: 1400, rotulo: "1×" },
  { intervalo: 700, rotulo: "2×" },
] as const;

export interface EstadoPlayer {
  indice: number;
  total: number;
  tocando: boolean;
  intervalo: number;
}

export type AcaoPlayer =
  | { tipo: "ir"; indice: number }
  | { tipo: "anterior" }
  | { tipo: "proximo" }
  | { tipo: "primeiro" }
  | { tipo: "ultimo" }
  | { tipo: "alternar" }
  | { tipo: "tique" }
  | { tipo: "velocidade"; intervalo: number };

const limitar = (i: number, total: number): number => Math.max(0, Math.min(total - 1, i));

export function criarPlayer(total: number): EstadoPlayer {
  return { indice: 0, total, tocando: false, intervalo: VELOCIDADES[1].intervalo };
}

export function playerReducer(s: EstadoPlayer, a: AcaoPlayer): EstadoPlayer {
  const ultimo = s.total - 1;
  switch (a.tipo) {
    // navegação manual pausa a reprodução
    case "ir": return { ...s, tocando: false, indice: limitar(a.indice, s.total) };
    case "anterior": return { ...s, tocando: false, indice: limitar(s.indice - 1, s.total) };
    case "proximo": return { ...s, tocando: false, indice: limitar(s.indice + 1, s.total) };
    case "primeiro": return { ...s, tocando: false, indice: 0 };
    case "ultimo": return { ...s, tocando: false, indice: ultimo };
    case "alternar":
      if (s.tocando) return { ...s, tocando: false };
      // play no fim recomeça do primeiro passo
      return { ...s, tocando: ultimo > 0, indice: s.indice === ultimo ? 0 : s.indice };
    case "tique": {
      if (!s.tocando) return s;
      const indice = limitar(s.indice + 1, s.total);
      return { ...s, indice, tocando: indice < ultimo };
    }
    case "velocidade": return { ...s, intervalo: a.intervalo };
  }
}

/** texto do contador: a ÚNICA forma de escrever "Passo X / Y" */
export const rotuloPasso = (s: EstadoPlayer): string => `Passo ${s.indice + 1} / ${s.total}`;

const ehCampo = (alvo: EventTarget | null): boolean =>
  alvo instanceof HTMLElement &&
  (["INPUT", "SELECT", "TEXTAREA", "SUMMARY"].includes(alvo.tagName) || alvo.isContentEditable);

export function usePlayer(total: number) {
  const [estado, despachar] = useReducer(playerReducer, total, criarPlayer);

  // reprodução automática
  useEffect(() => {
    if (!estado.tocando) return undefined;
    const t = window.setTimeout(() => despachar({ tipo: "tique" }), estado.intervalo);
    return () => window.clearTimeout(t);
  }, [estado.tocando, estado.indice, estado.intervalo]);

  // um único listener de teclado, removido ao desmontar
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || ehCampo(e.target)) return;
      const acoes: Record<string, AcaoPlayer> = {
        ArrowRight: { tipo: "proximo" },
        ArrowLeft: { tipo: "anterior" },
        Home: { tipo: "primeiro" },
        End: { tipo: "ultimo" },
      };
      if (e.key in acoes) {
        e.preventDefault();
        despachar(acoes[e.key]);
      } else if (e.key === " ") {
        // em botões e links o espaço já ativa o próprio elemento
        const tag = e.target instanceof HTMLElement ? e.target.tagName : "";
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        despachar({ tipo: "alternar" });
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  return { estado, despachar };
}
