// types.ts: tipos dos dados exportados por gerar_passos.py (gerado com
// auxílio do Claude). O formato é definido pelo Python; aqui só se descreve.

export type Estado = string;
export type Simbolo = string;

/** [origem, símbolo, destino], como o Python exporta */
export type Transicao = [Estado, Simbolo, Estado];

export interface AFN {
  estados: Estado[];
  alfabeto: Simbolo[];
  inicial: Estado;
  finais: Estado[];
  transicoes: Record<Estado, Record<Simbolo, Estado[]>>;
}

export interface AFD {
  estados: Estado[];
  alfabeto: Simbolo[];
  inicial: Estado;
  finais: Estado[];
  transicoes: Record<Estado, Record<Simbolo, Estado>>;
}

export interface PassoInicio {
  tipo: "inicio";
  conjunto: Estado[];
  fecho: Estado[];
  transicoes_epsilon_usadas: Transicao[];
  estado_afd: Estado;
  novo: boolean;
  e_final: boolean;
  finais_no_conjunto: Estado[];
}

export interface PassoTransicao {
  tipo: "transicao";
  origem: Estado;
  conjunto: Estado[];
  simbolo: Simbolo;
  mover: Estado[];
  transicoes_afn_usadas: Transicao[];
  sem_transicao: Estado[];
  fecho: Estado[];
  transicoes_epsilon_usadas: Transicao[];
  destino: Estado;
  destino_novo: boolean;
  e_final: boolean;
  finais_no_conjunto: Estado[];
  poco: boolean;
}

export interface PassoFim {
  tipo: "fim";
  n_afn: number;
  n_afd: number;
  finais: Estado[];
  poco: Estado | null;
}

export type Passo = PassoInicio | PassoTransicao | PassoFim;

export interface SimulacaoAFN {
  tamanho_max: number;
  estados_apos: Record<string, Estado[]>;
  aceita: Record<string, boolean>;
}

export interface Verificacao {
  tamanho_max: number;
  total: number;
  divergencias: string[];
}

export interface Exemplo {
  nome: string;
  descricao: string;
  afn: AFN;
  afd: AFD;
  mapeamento: Record<Estado, Estado[]>;
  passos: Passo[];
  simulacao_afn: SimulacaoAFN;
  verificacao: Verificacao;
}
