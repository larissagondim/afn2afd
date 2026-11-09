// layout.ts: posição fixa dos estados e geometria das arestas (gerado com
// auxílio do Claude). Calculado UMA vez por exemplo, sobre o grafo completo,
// para nada mudar de lugar entre um passo e outro. Puro, sem DOM.
import type { AFD, AFN, Estado, Simbolo } from "../types";

export const RAIO = 30;
const DX = 170; // distância entre colunas (camadas)
const DY = 120; // distância entre estados na mesma coluna

export interface Ponto { x: number; y: number }

export interface Aresta {
  id: string;
  de: Estado;
  para: Estado;
  eps: boolean;
  simbolos: Simbolo[];
  /** caminho SVG e posição do rótulo */
  d: string;
  rotulo: Ponto;
}

export interface Grafo {
  ids: Estado[];
  pos: Record<Estado, Ponto & { camada: number }>;
  arestas: Aresta[];
  inicial: Estado;
  finais: ReadonlySet<Estado>;
  viewBox: { x: number; y: number; largura: number; altura: number };
}

type ArestaBase = Omit<Aresta, "d" | "rotulo">;

// símbolos com mesma origem e destino num único arco ("a, b"); ε separado
// porque é desenhado tracejado
export function arestasAfn(afn: AFN): ArestaBase[] {
  const grupos = new Map<string, ArestaBase>();
  for (const [de, t] of Object.entries(afn.transicoes)) {
    for (const [s, destinos] of Object.entries(t)) {
      for (const para of destinos) {
        const eps = s === "ε";
        const id = `${de}|${para}|${eps ? "ε" : ""}`;
        const g = grupos.get(id) ?? { id, de, para, eps, simbolos: [] };
        g.simbolos.push(s);
        grupos.set(id, g);
      }
    }
  }
  for (const g of grupos.values()) {
    g.simbolos.sort((a, b) => afn.alfabeto.indexOf(a) - afn.alfabeto.indexOf(b));
  }
  return [...grupos.values()];
}

export function arestasAfd(afd: AFD): ArestaBase[] {
  const grupos = new Map<string, ArestaBase>();
  for (const de of afd.estados) {
    for (const s of afd.alfabeto) {
      const para = afd.transicoes[de][s];
      const id = `${de}|${para}`;
      const g = grupos.get(id) ?? { id, de, para, eps: false, simbolos: [] };
      g.simbolos.push(s);
      grupos.set(id, g);
    }
  }
  return [...grupos.values()];
}

// camadas da esquerda para a direita pela distância (BFS) a partir do
// inicial; dentro de cada camada, uma passada de baricentro para reduzir
// cruzamentos
function calcularPosicoes(ids: Estado[], arestas: ArestaBase[], inicial: Estado): Grafo["pos"] {
  const saida = new Map(ids.map((id) => [id, [] as Estado[]]));
  const vizinhos = new Map(ids.map((id) => [id, new Set<Estado>()]));
  for (const a of arestas) {
    if (a.de === a.para) continue;
    saida.get(a.de)?.push(a.para);
    vizinhos.get(a.de)?.add(a.para);
    vizinhos.get(a.para)?.add(a.de);
  }

  const camada = new Map<Estado, number>([[inicial, 0]]);
  const fila = [inicial];
  while (fila.length) {
    const u = fila.shift() as Estado;
    for (const v of saida.get(u) ?? []) {
      if (!camada.has(v)) {
        camada.set(v, (camada.get(u) ?? 0) + 1);
        fila.push(v);
      }
    }
  }
  const ultima = Math.max(...camada.values());
  for (const id of ids) if (!camada.has(id)) camada.set(id, ultima + 1); // inalcançáveis

  const colunas: Estado[][] = [];
  for (const id of ids) (colunas[camada.get(id) ?? 0] ??= []).push(id);

  for (let c = 1; c < colunas.length; c++) {
    const anterior = new Map(colunas[c - 1].map((id, i) => [id, i]));
    const peso = new Map(colunas[c].map((id, i) => {
      const ps = [...(vizinhos.get(id) ?? [])].filter((v) => anterior.has(v)).map((v) => anterior.get(v) ?? 0);
      return [id, ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : i];
    }));
    colunas[c].sort((x, y) => (peso.get(x) ?? 0) - (peso.get(y) ?? 0));
  }

  const pos: Grafo["pos"] = {};
  colunas.forEach((col, c) => col.forEach((id, i) => {
    pos[id] = { x: c * DX, y: (i - (col.length - 1) / 2) * DY, camada: c };
  }));
  return pos;
}

function geometriaLaco(p: Ponto): Pick<Aresta, "d" | "rotulo"> {
  const a1 = -Math.PI / 2 - 0.6;
  const a2 = -Math.PI / 2 + 0.6;
  const s = { x: p.x + RAIO * Math.cos(a1), y: p.y + RAIO * Math.sin(a1) };
  const e = { x: p.x + RAIO * Math.cos(a2), y: p.y + RAIO * Math.sin(a2) };
  const topo = p.y - RAIO - 46;
  return {
    d: `M${s.x},${s.y} C${p.x - 44},${topo} ${p.x + 44},${topo} ${e.x},${e.y}`,
    // rótulo logo acima do topo do laço
    rotulo: { x: p.x, y: topo - 2 },
  };
}

interface Curva { s: Ponto; c: Ponto; e: Ponto; n: Ponto; lado: number }

/** ponto da curva quadrática em t, afastado `dist` para o lado de fora */
function pontoNaCurva({ s, c, e, n, lado }: Curva, t: number, dist: number): Ponto {
  const u = 1 - t;
  return {
    x: u * u * s.x + 2 * u * t * c.x + t * t * e.x + n.x * dist * lado,
    y: u * u * s.y + 2 * u * t * c.y + t * t * e.y + n.y * dist * lado,
  };
}

// caixa aproximada do rótulo, em unidades do viewBox (fonte de 18 mono)
const caixaRotulo = (centro: Ponto, simbolos: Simbolo[]) => {
  const largura = simbolos.join(", ").length * 11 + 10;
  return { x: centro.x - largura / 2, y: centro.y - 13, largura, altura: 26 };
};
type Caixa = ReturnType<typeof caixaRotulo>;
const sobrepoe = (a: Caixa, b: Caixa) =>
  a.x < b.x + b.largura && b.x < a.x + a.largura && a.y < b.y + b.altura && b.y < a.y + a.altura;

function curvaArco(p: Ponto, q: Ponto, curva: number): Curva {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const c = { x: (p.x + q.x) / 2 + nx * curva, y: (p.y + q.y) / 2 + ny * curva };
  const unit = (a: Ponto, b: Ponto): Ponto => {
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
  };
  const u1 = unit(p, c);
  const u2 = unit(q, c);
  const s = { x: p.x + u1.x * RAIO, y: p.y + u1.y * RAIO };
  const e = { x: q.x + u2.x * (RAIO + 1), y: q.y + u2.y * (RAIO + 1) };
  // rótulo vai para o lado de fora da curva (em retas, para cima)
  return { s, c, e, n: { x: nx, y: ny }, lado: curva === 0 ? -1 : 1 };
}

// candidatos para o rótulo, do preferido (meio da seta, colado nela) para os
// alternativos (mais perto das pontas ou um pouco mais afastado)
const CANDIDATOS: [number, number][] = [
  [0.5, 16], [0.4, 16], [0.6, 16], [0.3, 16], [0.7, 16], [0.5, 30], [0.4, 30], [0.6, 30], [0.25, 16], [0.75, 16],
];

export function montarGrafo(ids: Estado[], base: ArestaBase[], inicial: Estado, finais: Estado[]): Grafo {
  const pos = calcularPosicoes(ids, base, inicial);
  const existe = new Set(base.map((a) => `${a.de}|${a.para}`));
  const temNormal = new Set(base.filter((a) => !a.eps).map((a) => `${a.de}|${a.para}`));

  // os rótulos já posicionados e os estados são obstáculos para os próximos
  const ocupadas: Caixa[] = ids.map((id) => ({
    x: pos[id].x - RAIO - 4, y: pos[id].y - RAIO - 4, largura: 2 * RAIO + 8, altura: 2 * RAIO + 8,
  }));
  const lacos = base.filter((a) => a.de === a.para);
  const arcos = base.filter((a) => a.de !== a.para);

  const arestas: Aresta[] = lacos.map((a) => {
    const g = geometriaLaco(pos[a.de]);
    ocupadas.push(caixaRotulo(g.rotulo, a.simbolos));
    return { ...a, ...g };
  });

  for (const a of arcos) {
    const p = pos[a.de];
    const q = pos[a.para];
    const vizinhaAFrente = q.camada - p.camada === 1;
    const temVolta = existe.has(`${a.para}|${a.de}`);
    const comprimento = Math.hypot(q.x - p.x, q.y - p.y);
    // reta só quando é a única ligação entre camadas vizinhas; arcos de volta,
    // longos ou na mesma coluna curvam para não atravessar outros estados
    let curva = vizinhaAFrente ? (temVolta ? 26 : 0) : 34 + 0.2 * comprimento;
    if (a.eps && temNormal.has(`${a.de}|${a.para}`)) curva += 34;
    const cv = curvaArco(p, q, curva);

    // primeiro candidato que não encosta em outro rótulo nem em estado
    const pontos = CANDIDATOS.map(([t, dist]) => pontoNaCurva(cv, t, dist));
    const livre = pontos.find((pt) => !ocupadas.some((o) => sobrepoe(caixaRotulo(pt, a.simbolos), o)));
    const rotulo = livre ?? pontos[0];
    ocupadas.push(caixaRotulo(rotulo, a.simbolos));
    arestas.push({ ...a, d: `M${cv.s.x},${cv.s.y} Q${cv.c.x},${cv.c.y} ${cv.e.x},${cv.e.y}`, rotulo });
  }

  const xs = ids.map((id) => pos[id].x).concat(arestas.map((a) => a.rotulo.x));
  const ys = ids.map((id) => pos[id].y).concat(arestas.map((a) => a.rotulo.y));
  const minX = Math.min(...xs) - RAIO - 60; // espaço para a seta de entrada
  const maxX = Math.max(...xs) + RAIO + 30;
  const minY = Math.min(...ys) - RAIO - 24;
  const maxY = Math.max(...ys) + RAIO + 62; // etiquetas "poço" e "novo" abaixo do estado
  return {
    ids,
    pos,
    arestas,
    inicial,
    finais: new Set(finais),
    viewBox: { x: minX, y: minY, largura: maxX - minX, altura: maxY - minY },
  };
}

export const grafoDoAfn = (afn: AFN): Grafo =>
  montarGrafo(afn.estados, arestasAfn(afn), afn.inicial, afn.finais);

export const grafoDoAfd = (afd: AFD): Grafo =>
  montarGrafo(afd.estados, arestasAfd(afd), afd.inicial, afd.finais);
