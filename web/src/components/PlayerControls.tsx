// PlayerControls.tsx: controles de reprodução (gerado com auxílio do Claude).
// Botões, slider, "Passo X / Y" e velocidade num só componente. O contador
// usa rotuloPasso(estado), a mesma fonte da explicação.
import type { Dispatch } from "react";
import { rotuloPasso, VELOCIDADES, type AcaoPlayer, type EstadoPlayer } from "../hooks/usePlayer";
import { Icone } from "./Atomos";

interface Props { estado: EstadoPlayer; despachar: Dispatch<AcaoPlayer> }

export function PlayerControls({ estado, despachar }: Props) {
  const { indice, total, tocando, intervalo } = estado;
  const ultimo = total - 1;
  return (
    <nav className="player" aria-label="Controle dos passos">
      <div className="player-botoes">
        <button type="button" className="botao-icone" aria-label="Voltar ao primeiro passo" title="Primeiro passo (Home)"
          disabled={indice === 0} onClick={() => despachar({ tipo: "primeiro" })}>
          <Icone nome="primeiro" />
        </button>
        <button type="button" className="botao-icone" aria-label="Passo anterior" title="Anterior (←)"
          disabled={indice === 0} onClick={() => despachar({ tipo: "anterior" })}>
          <Icone nome="anterior" />
        </button>
        <button type="button" className="botao-icone botao-principal" aria-label={tocando ? "Pausar" : "Reproduzir"}
          aria-pressed={tocando} title="Reproduzir / pausar (espaço)" disabled={ultimo === 0}
          onClick={() => despachar({ tipo: "alternar" })}>
          {tocando ? <Icone nome="pausa" /> : <Icone nome="play" preenchido />}
        </button>
        <button type="button" className="botao-icone" aria-label="Próximo passo" title="Próximo (→)"
          disabled={indice === ultimo} onClick={() => despachar({ tipo: "proximo" })}>
          <Icone nome="proximo" />
        </button>
      </div>

      <div className="player-progresso">
        <input
          type="range"
          min={0}
          max={ultimo}
          value={indice}
          aria-label="Passo"
          aria-valuetext={`Passo ${indice + 1} de ${total}`}
          onChange={(e) => despachar({ tipo: "ir", indice: Number(e.target.value) })}
        />
        <output className="contador mono" aria-hidden="true">{rotuloPasso(estado)}</output>
      </div>

      <label className="player-velocidade">
        <span>Velocidade</span>
        <select value={intervalo} aria-label="Velocidade da reprodução"
          onChange={(e) => despachar({ tipo: "velocidade", intervalo: Number(e.target.value) })}>
          {VELOCIDADES.map((v) => <option key={v.intervalo} value={v.intervalo}>{v.rotulo}</option>)}
        </select>
      </label>
    </nav>
  );
}
