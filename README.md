# afn2afd

Conversor de Autômatos Finitos Não-determinísticos (AFN) para Autômatos Finitos
Determinísticos (AFD), desenvolvido como Projeto 1 da disciplina Linguagens
Formais e Computabilidade.

## O que o projeto faz

Dado um AFN descrito em JSON (com suporte a transições ε), o programa:

1. calcula um AFD equivalente usando a **construção de subconjuntos**;
2. mostra o passo a passo da construção em uma tabela (conjunto de estados do
   AFN → estado do AFD);
3. gera o AFD em JSON e uma visualização dos dois autômatos;
4. verifica a equivalência rodando as mesmas cadeias nos dois autômatos.

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

O símbolo `ε` representa o movimento vazio e não faz parte do alfabeto.

## Estrutura

| Arquivo            | Função                                          |
|--------------------|-------------------------------------------------|
| `afn.py`           | classe AFN: ε-fecho, mover e simulação          |
| `afd.py`           | classe AFD e simulação                          |
| `conversor.py`     | construção de subconjuntos                      |
| `visualizacao.py`  | geração dos desenhos (DOT/SVG)                  |
| `main.py`          | interface de linha de comando                   |
| `tests/`           | testes de equivalência entre AFN e AFD          |

## Uso

```bash
python main.py exemplos/afn1.json
```

## Testes

```bash
pytest
```

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