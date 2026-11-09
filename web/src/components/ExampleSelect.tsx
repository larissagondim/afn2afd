// ExampleSelect.tsx: seletor de exemplo (gerado com auxílio do Claude).
interface Props {
  opcoes: { nome: string; descricao: string }[];
  valor: string;
  aoEscolher: (nome: string) => void;
}

export function ExampleSelect({ opcoes, valor, aoEscolher }: Props) {
  return (
    <label className="seletor">
      <span>Exemplo</span>
      <select value={valor} onChange={(e) => aoEscolher(e.target.value)} aria-label="Escolher exemplo">
        {opcoes.map((o) => (
          <option key={o.nome} value={o.nome}>
            {o.nome}{o.descricao ? `: ${o.descricao}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
