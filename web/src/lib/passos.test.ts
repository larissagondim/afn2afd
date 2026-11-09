// passos.test.ts: testes da camada de dados (gerado com auxílio do Claude).
// Confere que os passos exportados pelo Python reconstroem o AFD esperado e
// que o total de passos é o mesmo que o player mostra.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Exemplo } from "../types";
import { validarExemplo } from "../data/examples";
import { afdParcial, filaNoPasso, indexarPassos } from "./passos";
import { criarPlayer, playerReducer, rotuloPasso } from "../hooks/usePlayer";

const PASTA = fileURLToPath(new URL("../../dados", import.meta.url));
const ler = (nome: string): Exemplo =>
  validarExemplo(JSON.parse(readFileSync(join(PASTA, `${nome}.json`), "utf-8")), nome);

const todos = readdirSync(PASTA)
  .filter((f) => f.endsWith(".json") && f !== "indice.json")
  .map((f) => f.replace(/\.json$/, ""));

describe("afn1 (exemplo do README)", () => {
  const ex = ler("afn1");
  const ind = indexarPassos(ex.passos);

  it("os passos reconstroem o AFD esperado", () => {
    const final = afdParcial(ex, ind, ex.passos.length - 1);
    expect(final).toEqual({
      estados: ["D0", "D1", "D2"],
      alfabeto: ["a", "b"],
      inicial: "D0",
      finais: ["D1", "D2"],
      transicoes: {
        D0: { a: "D1", b: "D0" },
        D1: { a: "D1", b: "D2" },
        D2: { a: "D1", b: "D0" },
      },
    });
    expect(ex.mapeamento).toEqual({ D0: ["q0"], D1: ["q0", "q1", "q2"], D2: ["q0", "q2"] });
  });

  it("o total de passos é o que a interface mostra", () => {
    // 1 (início) + 3 estados × 2 símbolos + 1 (fim)
    expect(ex.passos.length).toBe(8);
    let s = criarPlayer(ex.passos.length);
    expect(rotuloPasso(s)).toBe("Passo 1 / 8");
    s = playerReducer(s, { tipo: "ultimo" });
    expect(rotuloPasso(s)).toBe("Passo 8 / 8");
    s = playerReducer(s, { tipo: "proximo" });
    expect(s.indice).toBe(7); // não passa do último
  });

  it("começa só com D0 e a fila acaba vazia", () => {
    expect(afdParcial(ex, ind, 0).estados).toEqual(["D0"]);
    expect(filaNoPasso(ex, ind, 0)).toEqual(["D0"]);
    expect(filaNoPasso(ex, ind, ex.passos.length - 1)).toEqual([]);
  });
});

describe.each(todos)("%s", (nome) => {
  const ex = ler(nome);
  const ind = indexarPassos(ex.passos);

  it("tem 1 + |estados do AFD| × |Σ| + 1 passos", () => {
    expect(ex.passos.length).toBe(1 + ex.afd.estados.length * ex.afd.alfabeto.length + 1);
  });

  it("o AFD reconstruído pelos passos é idêntico ao exportado", () => {
    expect(afdParcial(ex, ind, ex.passos.length - 1)).toEqual(ex.afd);
  });
});

describe("validação dos dados", () => {
  it("rejeita arquivo fora do formato com mensagem clara", () => {
    expect(() => validarExemplo([], "x")).toThrow("x.json: não é um objeto JSON");
    const semPassos = { ...ler("afn1"), passos: [] };
    expect(() => validarExemplo(semPassos, "x")).toThrow('campo "passos" vazio ou ausente');
  });
});

describe("player", () => {
  it("reproduzir no fim recomeça do primeiro passo e para no último", () => {
    let s = playerReducer(criarPlayer(3), { tipo: "ultimo" });
    s = playerReducer(s, { tipo: "alternar" });
    expect(s).toMatchObject({ indice: 0, tocando: true });
    s = playerReducer(s, { tipo: "tique" });
    s = playerReducer(s, { tipo: "tique" });
    expect(s).toMatchObject({ indice: 2, tocando: false });
  });
});
