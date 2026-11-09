// texto.ts: formatação de conjuntos e listas (gerado com auxílio do Claude).
import type { Estado } from "../types";

/** {q0, q1} ou ∅ */
export const fmtConj = (c: readonly Estado[]): string => (c.length ? `{${c.join(", ")}}` : "∅");

/** "a", "a e b", "a, b e c" */
export function listaNatural(itens: readonly string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}
