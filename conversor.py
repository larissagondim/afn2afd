from collections import deque

from afd import AFD


def formatar_conjunto(conjunto):
    """representação legível de um conjunto de estados, ex: {q0,q1} ou ∅"""
    if not conjunto:
        return "∅"
    return "{" + ",".join(sorted(conjunto, key=str)) + "}"


def converter(afn):
    """converte um AFN (com ou sem ε) em um AFD equivalente pela construção
    de subconjuntos

    retorna (afd, tabela), em que tabela é uma lista de linhas
    (estado do AFD, conjunto do AFN, {simbolo: estado destino do AFD}),
    na ordem em que os conjuntos foram descobertos.
    """
    alfabeto = sorted(afn.alfabeto, key=str)

    # cada conjunto do AFN vira um estado do AFD (D0, D1, ...).
    # frozenset porque precisa ser chave de dicionário.
    nomes = {}
    fila = deque()

    def nome_de(conjunto):
        if conjunto not in nomes:
            nomes[conjunto] = f"D{len(nomes)}"
            fila.append(conjunto)
        return nomes[conjunto]

    inicial = frozenset(afn.epsilon_fecho({afn.inicial}))
    nome_de(inicial)

    transicoes = {}
    tabela = []
    while fila:
        T = fila.popleft()
        origem = nomes[T]
        transicoes[origem] = {}
        for a in alfabeto:
            U = frozenset(afn.epsilon_fecho(afn.mover(T, a)))
            # o conjunto vazio também vira estado: é o poço que completa o AFD
            transicoes[origem][a] = nome_de(U)
        tabela.append((origem, T, transicoes[origem]))

    finais = {nome for conjunto, nome in nomes.items() if conjunto & afn.finais}

    afd = AFD(
        estados=nomes.values(),
        alfabeto=alfabeto,
        transicoes=transicoes,
        inicial=nomes[inicial],
        finais=finais,
    )
    return afd, tabela


def imprimir_tabela(afd, tabela, alfabeto):
    """monta a tabela passo a passo da construção como texto"""
    alfabeto = sorted(alfabeto, key=str)
    conjunto_de = {nome: T for nome, T, _ in tabela}

    cabecalho = ["", "AFD", "conjunto do AFN"] + alfabeto
    linhas = []
    for nome, T, trans in tabela:
        marca = ""
        if nome == afd.inicial:
            marca += "→"
        if nome in afd.finais:
            marca += "*"
        linha = [marca, nome, formatar_conjunto(T)]
        linha += [f"{trans[a]} {formatar_conjunto(conjunto_de[trans[a]])}" for a in alfabeto]
        linhas.append(linha)

    larguras = [max(len(str(l[i])) for l in [cabecalho] + linhas)
                for i in range(len(cabecalho))]

    def fmt(linha):
        return " | ".join(str(c).ljust(w) for c, w in zip(linha, larguras))

    saida = [fmt(cabecalho), "-+-".join("-" * w for w in larguras)]
    saida += [fmt(l) for l in linhas]
    saida.append("(→ inicial, * final)")
    return "\n".join(saida)
