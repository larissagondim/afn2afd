// AutomatonGraph.tsx: desenho de um autômato em SVG feito à mão (gerado com
// auxílio do Claude). Usado para o AFN e para o AFD; quem chama diz, por
// props, o que aparece e o que fica destacado no passo atual.
//
// Distinções por FORMA, não só por cor:
//   origem do passo   → anel grosso contínuo
//   resultado do passo → halo tracejado em volta
//   estado novo        → etiqueta de texto "novo"
//   final              → círculo duplo;  poço → contorno pontilhado + "poço"
//   transição usada    → linha grossa e símbolo sublinhado;  ε → tracejada
import { useId } from "react";
import type { Estado, Simbolo } from "../types";
import { RAIO, type Aresta, type Grafo } from "../lib/layout";

export interface VisualNo {
  origem?: boolean;
  resultado?: boolean;
  novo?: boolean;
  poco?: boolean;
  dica: string;
}

export interface VisualAresta {
  simbolos: { s: Simbolo; usado: boolean }[];
  usada: boolean;
  /** arco que acabou de surgir: anima o traço */
  desenhando?: boolean;
}

interface Props {
  grafo: Grafo;
  titulo: string;
  descricao: string;
  no: (id: Estado) => VisualNo | null;
  aresta: (a: Aresta) => VisualAresta | null;
}

export function AutomatonGraph({ grafo, titulo, descricao, no, aresta }: Props) {
  const id = useId().replace(/:/g, "");
  const { x, y, largura, altura } = grafo.viewBox;
  const ini = grafo.pos[grafo.inicial];
  const visIni = no(grafo.inicial);

  return (
    <div className="grafo-caixa">
      <svg
        className="grafo"
        viewBox={`${x} ${y} ${largura} ${altura}`}
        role="img"
        aria-labelledby={`${id}-t ${id}-d`}
        // largura natural × 1,4 no máximo: grafo pequeno não vira gigante;
        // mínimo de 75% para os rótulos (18px) não ficarem abaixo de 13px
        style={{ maxWidth: `${Math.round(largura * 1.4)}px`, minWidth: `${Math.round(largura * 0.75)}px` }}
      >
        <title id={`${id}-t`}>{titulo}</title>
        <desc id={`${id}-d`}>{descricao}</desc>
        <defs>
          {(["neutra", "usada", "eps", "entrada"] as const).map((tipo) => (
            <marker
              key={tipo}
              id={`${id}-seta-${tipo}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="14"
              markerHeight="14"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className={`seta seta-${tipo}`} />
            </marker>
          ))}
        </defs>

        {/* arestas primeiro, para os estados ficarem por cima */}
        {grafo.arestas.map((a) => {
          const v = aresta(a);
          if (!v) return null;
          const seta = a.eps ? "eps" : v.usada ? "usada" : "neutra";
          return (
            <g key={a.id} className={`aresta ${a.eps ? "eps" : ""} ${v.usada ? "usada" : ""} ${v.desenhando ? "desenhando" : ""}`}>
              <path
                className="linha"
                d={a.d}
                // pathLength só na aresta animada: ele muda a escala do
                // tracejado e apagaria o tracejado do ε nas outras
                pathLength={v.desenhando ? 1 : undefined}
                markerEnd={`url(#${id}-seta-${seta})`}
              />
              <text className="rotulo-aresta" x={a.rotulo.x} y={a.rotulo.y}>
                {v.simbolos.map(({ s, usado }, i) => (
                  <tspan key={s} className={usado ? "simbolo-usado" : undefined}>
                    {i > 0 ? ", " : ""}
                    {s}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {visIni && (
          <path
            className="entrada"
            d={`M${ini.x - RAIO - 48},${ini.y} L${ini.x - RAIO - 1},${ini.y}`}
            markerEnd={`url(#${id}-seta-entrada)`}
          />
        )}

        {grafo.ids.map((estado) => {
          const v = no(estado);
          if (!v) return null;
          const { x: cx, y: cy } = grafo.pos[estado];
          const classes = ["no", v.origem && "origem", v.resultado && "resultado", v.novo && "entrando", v.poco && "poco"]
            .filter(Boolean)
            .join(" ");
          // etiquetas abaixo do estado: "poço" e, embaixo dela, "novo"
          const yPoco = cy + RAIO + 24;
          const yNovo = cy + RAIO + (v.poco ? 44 : 20);
          return (
            <g key={estado} className={classes}>
              <title>{v.dica}</title>
              <circle className="halo" cx={cx} cy={cy} r={RAIO + 8} />
              <circle className="corpo" cx={cx} cy={cy} r={RAIO} />
              {grafo.finais.has(estado) && <circle className="interno" cx={cx} cy={cy} r={RAIO - 5} />}
              <text className="rotulo-no" x={cx} y={cy}>{estado}</text>
              {v.poco && <text className="sub-no" x={cx} y={yPoco}>poço</text>}
              {v.novo && (
                <g className="etiqueta-novo">
                  <rect x={cx - 28} y={yNovo - 12} width={56} height={24} rx={12} />
                  <text x={cx} y={yNovo}>novo</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
