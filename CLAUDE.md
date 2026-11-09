# CLAUDE.md: Interface do afn2afd

## Contexto

Projeto 1 da disciplina Linguagens Formais e Computabilidade. O projeto converte
um AFN (com transições ε) em um AFD equivalente pela **construção de
subconjuntos**. A lógica já está implementada em Python (`afn.py`, `afd.py`,
`conversor.py`). Sua tarefa é construir a **interface web** que mostra,
graficamente e passo a passo, essa conversão.

Você atua como **desenvolvedor front-end**. O público são estudantes de
graduação que estão aprendendo autômatos: a interface deve ensinar, não só
exibir o resultado.

## Regras que não podem ser quebradas

1. **Não reimplemente o algoritmo em JavaScript.** Toda a lógica da conversão
   (ε-fecho, mover, subconjuntos) vem do Python. O front-end apenas **lê e
   exibe** os dados gerados por ele.
2. **Não altere** `afn.py`, `afd.py` nem a lógica de `conversor.py`. Se faltar
   algum dado para a interface, descreva o que falta e proponha a mudança em
   vez de editar por conta própria. A única exceção é o script de exportação
   descrito abaixo.
3. Os textos explicativos devem ser fiéis ao que o algoritmo realmente faz.
   Nunca invente comportamento.
4. Todo texto da interface em **português do Brasil**.

## Arquitetura

- **Site estático**: HTML + CSS + JavaScript puro, sem etapa de build e sem
  framework obrigatório. Deve abrir com um servidor simples
  (`python -m http.server`) ou direto no navegador.
- Pasta sugerida: `web/` com `index.html`, `estilo.css`, `app.js` e
  `dados/` (JSONs de passos gerados pelo Python).
- Bibliotecas externas só via CDN com versão fixada, ou copiadas para
  `web/vendor/`. Para desenhar grafos, prefira Cytoscape.js ou SVG feito à mão.
  Justifique a escolha em um comentário no topo do `app.js`.
- **Ponte Python → site**: um script `gerar_passos.py` (a ser criado) roda a
  conversão para cada arquivo de `exemplos/` e grava `web/dados/<nome>.json`
  com o formato descrito abaixo. O site carrega esses arquivos.

### Formato do JSON de passos

A conversão precisa registrar cada passo. Formato esperado (ajuste os nomes
junto com o código Python, mantendo o conteúdo):

```json
{
  "afn": {
    "estados": ["q0", "q1", "q2"],
    "alfabeto": ["a", "b"],
    "inicial": "q0",
    "finais": ["q2"],
    "transicoes": { "q0": { "a": ["q0", "q1"], "b": ["q0"] },
                    "q1": { "b": ["q2"], "ε": ["q2"] },
                    "q2": {} }
  },
  "afd": {
    "estados": ["S0", "S1"],
    "alfabeto": ["a", "b"],
    "inicial": "S0",
    "finais": ["S1"],
    "transicoes": { "S0": { "a": "S1", "b": "S0" } }
  },
  "mapeamento": { "S0": ["q0"], "S1": ["q0", "q1", "q2"] },
  "passos": [
    {
      "tipo": "inicio",
      "conjunto": ["q0"],
      "fecho": ["q0"],
      "transicoes_epsilon_usadas": [],
      "estado_afd": "S0",
      "novo": true
    },
    {
      "tipo": "transicao",
      "origem": "S0",
      "simbolo": "a",
      "mover": ["q0", "q1"],
      "transicoes_afn_usadas": [["q0", "a", "q0"], ["q0", "a", "q1"]],
      "fecho": ["q0", "q1", "q2"],
      "transicoes_epsilon_usadas": [["q1", "ε", "q2"]],
      "destino": "S1",
      "destino_novo": true,
      "e_final": true
    }
  ]
}
```

Os passos devem seguir a ordem real de execução do algoritmo (a fila de
conjuntos). Se o conjunto resultante for vazio, o passo deve indicar o
**estado poço**.

## O que a interface deve mostrar

### 1. Visão geral (tela principal)
- Dois painéis lado a lado: **AFN (original)** à esquerda e **AFD (sendo
  construído)** à direita.
- O AFD começa vazio e **cresce a cada passo**: estados e transições aparecem
  conforme o algoritmo os descobre.
- Estado inicial com seta de entrada; estados finais com círculo duplo.
- Rótulos de transição agrupados quando houver vários símbolos entre os mesmos
  estados (`a, b`). A transição ε aparece como `ε`, em estilo diferente
  (tracejada).

### 2. Controle passo a passo
- Botões **Anterior / Próximo / Reiniciar / Reproduzir** (com controle de
  velocidade) e uma barra de progresso com o número do passo.
- Atalhos de teclado (←, →, espaço).
- Deve ser possível voltar a qualquer passo sem perder o estado.

### 3. Painel de explicação (o mais importante)
Para cada passo, um texto curto em linguagem simples que responde:
- **O que está acontecendo?** Ex.: "Estamos no estado S0 = {q0}. Vamos ver para
  onde o AFN pode ir lendo `a`."
- **Por quê?** Ex.: "Como o AFN é não-determinístico, lendo `a` em q0 ele pode
  ir para q0 ou q1 ao mesmo tempo. O AFD representa isso com **um único
  estado** que guarda os dois."
- **O que mudou?** Lista explícita: "Novo estado do AFD: S1 = {q0, q1, q2}",
  "Nova transição: S0 --a--> S1", ou "Estado já existia, só a transição foi
  adicionada".
- Os três cálculos do passo em sequência: **mover** → **ε-fecho** → **destino**,
  mostrando os conjuntos de cada etapa.
- Quando o ε-fecho acrescentar estados, explicar quais transições ε os
  trouxeram (ex.: "q2 entrou porque q1 --ε--> q2").
- Marcar quando um estado é **final** e por quê ("contém q2, que é final no
  AFN").
- Marcar o **estado poço** e explicar que ele representa "nenhum caminho do AFN
  sobrevive".

### 4. Destaque visual do que mudou
- No AFN: realçar os **estados do conjunto atual** e as **transições do AFN
  usadas** no passo (cor forte), e as transições ε usadas (outra cor).
- No AFD: realçar o **estado de origem**, a **transição recém-criada** e o
  **estado novo** (com uma animação discreta de entrada).
- Estados e transições antigos ficam em cor neutra; não use só cor para
  distinguir (veja acessibilidade).

### 5. Tabela de construção
- Tabela com uma linha por estado do AFD: nome (`S0`), conjunto de estados do
  AFN (`{q0, q1}`), uma coluna por símbolo com o destino, e coluna "final?".
- A linha e a célula do passo atual ficam destacadas; células ainda não
  calculadas aparecem vazias.
- Essa tabela é a peça central para o vídeo: deve ficar legível quando
  gravada em tela.

### 6. Resumo final
- Ao terminar: comparação com números (estados do AFN vs. do AFD) e uma frase
  sobre o que isso significa (crescimento no pior caso é exponencial, 2ⁿ).
- Campo para **testar uma cadeia**: simular nos dois autômatos e mostrar o
  caminho percorrido em cada um, com o resultado (aceita/rejeita) lado a lado.
  A simulação deve usar os dados exportados (ou resultados pré-calculados pelo
  Python), sem reimplementar o algoritmo de conversão.

### 7. Seleção de exemplos
- Menu para escolher entre os exemplos de `exemplos/`, incluindo ao menos um
  caso com ε-transições e um caso em que o AFD cresce bastante.
- Opcional: carregar um JSON do usuário (só se o fluxo com Python permitir).

## Diretrizes de design

**Bonito, mas legível. Clareza vence enfeite.**

- Layout limpo, com bastante espaço em branco; hierarquia clara: grafos
  grandes, explicação sempre visível sem rolar a página no desktop.
- Paleta curta e consistente (ex.: uma cor para "atual", outra para "novo", outra
  para ε, neutros para o resto). Defina como variáveis CSS em `:root`.
- Suporte a modo claro e escuro via `prefers-color-scheme`.
- Tipografia legível (corpo ≥ 16px, rótulos dos grafos ≥ 14px). Estados e
  conjuntos em fonte monoespaçada.
- Animações curtas (≤ 400 ms) e respeitando `prefers-reduced-motion`.
- Layout dos grafos estável: o posicionamento dos nós **não pode ficar
  mudando** a cada passo, senão o usuário se perde. Calcule posições uma vez.
- Responsivo: em telas estreitas, empilhe os painéis.

### Acessibilidade
- Contraste mínimo WCAG AA.
- Não depender só de cor: use também forma, espessura de linha, ícones ou
  texto ("novo", "atual", "final").
- Controles acessíveis por teclado, com rótulos (`aria-label`) e foco visível.
- Explicação do passo em região `aria-live="polite"`.

## Organização do código

- `app.js` dividido em funções pequenas e nomeadas (carregar dados, desenhar
  AFN, desenhar AFD, renderizar passo, renderizar tabela, explicação).
- O estado da interface fica em **um único objeto** (passo atual, dados
  carregados); renderizar é uma função do estado, e voltar ao passo anterior é
  só renderizar de novo.
- Textos de explicação gerados por funções a partir dos dados do passo, não
  escritos à mão para cada exemplo.
- Comentários em português, explicando o **porquê**, não o óbvio.
- Sem dependências desnecessárias; evite `localStorage` para algo essencial.

## Como validar o trabalho

Antes de dizer que terminou, confira:

- [ ] Todos os exemplos de `exemplos/` carregam e percorrem todos os passos.
- [ ] O AFD final exibido é idêntico ao do JSON gerado pelo Python.
- [ ] Voltar e avançar passos produz sempre a mesma tela para o mesmo passo.
- [ ] Cada passo explica o que aconteceu, por quê, e o que mudou.
- [ ] Estado poço e ε-transições aparecem e são explicados.
- [ ] Funciona só com teclado e é legível em tela pequena.
- [ ] Nenhum trecho do front-end recalcula ε-fecho, mover ou subconjuntos.

## Sobre o uso de LLMs neste projeto

O professor exige que o grupo declare como usou LLMs. Por isso:
- Registre no início de cada arquivo gerado por você o que ele faz, para o grupo
  conseguir explicar o código no vídeo.
- Não escreva roteiro de apresentação nem explicações destinadas ao vídeo; os
  textos da **interface** são permitidos, mas o grupo deve revisá-los.