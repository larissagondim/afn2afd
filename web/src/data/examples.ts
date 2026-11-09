// examples.ts: os exemplos do seletor (gerado com auxílio do Claude).
// Os arquivos vêm de web/dados/, gravados por `python gerar_passos.py`
// a partir de exemplos/*.json. Nada é calculado aqui: só carregar e validar.
import type { Exemplo, Passo } from "../types";

// carregamento sob demanda: se um arquivo estiver corrompido, só aquele
// exemplo falha e os outros continuam disponíveis
const carregadores = import.meta.glob<unknown>(
  ["../../dados/*.json", "!../../dados/indice.json"],
  { import: "default" },
);

export interface ItemIndice {
  nome: string;
  carregar: () => Promise<Exemplo>;
}

const nomeDoArquivo = (caminho: string): string =>
  caminho.split("/").pop()?.replace(/\.json$/, "") ?? caminho;

export const indiceExemplos: ItemIndice[] = Object.entries(carregadores)
  .map(([caminho, carregar]) => ({
    nome: nomeDoArquivo(caminho),
    carregar: async () => validarExemplo(await carregar(), nomeDoArquivo(caminho)),
  }))
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }));

function objeto(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

const TIPOS_PASSO: ReadonlyArray<Passo["tipo"]> = ["inicio", "transicao", "fim"];

/** confere o mínimo do formato para a interface não quebrar no meio */
export function validarExemplo(dados: unknown, nome: string): Exemplo {
  const falha = (motivo: string): never => {
    throw new Error(`${nome}.json: ${motivo}`);
  };
  if (!objeto(dados)) return falha("não é um objeto JSON");
  for (const campo of ["afn", "afd", "mapeamento", "simulacao_afn", "verificacao"]) {
    if (!objeto(dados[campo])) falha(`campo "${campo}" ausente ou inválido`);
  }
  const passos = dados.passos;
  if (!Array.isArray(passos) || passos.length === 0) return falha('campo "passos" vazio ou ausente');
  for (const p of passos) {
    if (!objeto(p) || !TIPOS_PASSO.includes(p.tipo as Passo["tipo"])) falha("passo com tipo desconhecido");
  }
  if ((passos[passos.length - 1] as { tipo: string }).tipo !== "fim") falha('o último passo deveria ser "fim"');
  return dados as unknown as Exemplo;
}
