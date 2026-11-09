# afn2afd

Conversor de Autômatos Finitos Não-determinísticos (AFN) para Autômatos Finitos
Determinísticos (AFD), desenvolvido como Projeto 1 da disciplina Linguagens
Formais e Computabilidade.

## O que o projeto faz

Dado um AFN descrito em JSON (com suporte a transições ε), o programa:

1. calcula um AFD equivalente usando a **construção de subconjuntos**;
2. mostra o passo a passo da construção em uma tabela (conjunto de estados do
   AFN → estado do AFD);
3. gera o AFD em JSON e uma visualização dos dois autômatos (DOT/SVG);
4. verifica a equivalência rodando as mesmas cadeias nos dois autômatos.

Além da linha de comando, há uma **interface web** que mostra a conversão
passo a passo: o AFD crescendo ao lado do AFN, a explicação de cada passo
(mover → ε-fecho → destino), a tabela de construção e um campo para testar
cadeias nos dois autômatos.

## Como funciona

- **ε-fecho:** busca em grafo que encontra todos os estados alcançáveis
  usando apenas movimentos vazios.
- **Estado inicial do AFD:** o ε-fecho do estado inicial do AFN.
- **Transições:** para cada conjunto T e símbolo `a`, o destino é
  ε-fecho(mover(T, a)). Conjuntos novos entram numa fila até não haver mais
  nenhum a processar.
- **Estados finais do AFD:** os conjuntos que contêm pelo menos um estado final
  do AFN.
- **Estado poço:** o conjunto vazio, que completa o AFD.

## Formato de entrada

Por que JSON? Por ser leve, estruturado, legível e universal.

```json
{
  "alfabeto": ["a", "b"],
  "inicial": "q0",
  "finais": ["q2"],
  "transicoes": {
    "q0": { "a": ["q0", "q1"], "b": ["q0"] },
    "q1": { "b": ["q2"], "ε": ["q2"] },
    "q2": {}
  }
}
```

O símbolo `ε` representa o movimento vazio e não faz parte do alfabeto. Os
estados não precisam ser listados: são deduzidos do estado inicial, dos finais
e das transições. O campo opcional `"descricao"` aparece no menu de exemplos
da interface web.

### Exemplos incluídos

| Arquivo               | Linguagem                                   | O que mostra                        |
|-----------------------|---------------------------------------------|-------------------------------------|
| `exemplos/afn1.json`  | cadeias que terminam em `a` ou em `ab`      | transição ε                         |
| `exemplos/afn2.json`  | 3º símbolo a partir do fim é `1`            | crescimento do AFD (4 → 8 estados)  |
| `exemplos/afn3.json`  | `a*b*c*`                                    | várias transições ε e estado poço   |

## Estrutura

| Arquivo            | Função                                           |
|--------------------|--------------------------------------------------|
| `afn.py`           | classe AFN: ε-fecho, mover e simulação           |
| `afd.py`           | classe AFD e simulação                           |
| `conversor.py`     | construção de subconjuntos                       |
| `visualizacao.py`  | geração dos desenhos (DOT/SVG)                   |
| `main.py`          | interface de linha de comando                    |
| `gerar_passos.py`  | exporta os passos da conversão para `web/dados/` |
| `exemplos/`        | AFNs de entrada                                  |
| `tests/`           | testes de equivalência entre AFN e AFD           |
| `web/`             | interface web (React + Vite + TypeScript)        |

Dentro de `web/`:

| Caminho                     | Função                                                   |
|-----------------------------|----------------------------------------------------------|
| `dados/`                    | passos exportados pelo Python (gerado, não editar à mão) |
| `src/data/examples.ts`      | carrega e valida os JSONs de `dados/`                    |
| `src/lib/passos.ts`         | o que mostrar em cada passo (estados visíveis, fila…)    |
| `src/lib/layout.ts`         | posição fixa dos estados e das setas nos grafos          |
| `src/hooks/usePlayer.ts`    | estado do player: passo atual, play/pause, velocidade    |
| `src/components/`           | explicação, grafos, tabela, player, legenda, teste       |
| `src/style.css`             | estilo global, com todos os valores visuais em tokens    |

A interface **não reimplementa o algoritmo**: ε-fecho, mover e subconjuntos
são calculados só no Python. O front-end apenas lê e exibe os passos.

## Uso

Requisitos: Python 3 (testado no 3.12); para a interface web, Node.js 18+. O Graphviz é
opcional (sem ele, só os arquivos `.dot` são gerados).

### Linha de comando

```bash
python main.py exemplos/afn1.json
```

Imprime a tabela da construção, grava o AFD em JSON e os desenhos em `saida/`
e testa a equivalência com todas as cadeias até o tamanho 8. Opções:

| Opção            | Efeito                                         |
|------------------|------------------------------------------------|
| `-o PASTA`       | pasta de saída (padrão: `saida`)               |
| `-n N`           | tamanho máximo das cadeias testadas (padrão: 8)|
| `-c CADEIA`      | testa uma cadeia específica (pode repetir)     |

### Interface web

```bash
python gerar_passos.py        # (re)gera web/dados/ a partir de exemplos/
cd web
npm install
npm run dev                   # abre em http://localhost:5173
```

Rode `gerar_passos.py` de novo sempre que mudar algum arquivo de `exemplos/`.
Para uma versão estática, use `npm run build` (gera `web/dist/`, que precisa
ser servida por um servidor HTTP).

Atalhos de teclado: **←/→** passo anterior/próximo, **espaço** reproduzir ou
pausar, **Home/End** primeiro/último passo.

## Testes

```bash
pytest                        # algoritmo (Python)
cd web && npm test            # interface (Vitest)
```

O pytest confere a equivalência entre AFN e AFD nos exemplos e em 200 AFNs
aleatórios. O Vitest confere que os passos exportados reconstroem exatamente o
AFD do Python e que o total de passos é o mesmo mostrado pela interface.

## Uso de ferramentas baseadas em LLMs

As classes `AFN` e `AFD` e parte significativa do `main.py` e do `conversor.py` foram escritas pelo grupo.

Usamos LLMs para:

- Refatorar e corrigir erros de lógica no conversor
- Função de visualização dos autômatos
- Interface visual web para melhor visualização da lógica de conversão
- Geração de testes e variados exemplos de entrada para verificar integridade do projeto

## Autores

| Aluno | Matrícula |
|--------|-----------|
| LARISSA VILASBOAS GONDIM | 20250017317 |
| LAURA MORAIS TINE DE OLIVEIRA | 20250017335 |
| LUIS AUGUSTO MELO DE QUEIROZ OLIVEIRA | 20250017353 |
| MARIA LUIZA UCHOA CAVALCANTI | 20250018118 |