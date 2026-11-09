"""ponte Python → site (arquivo gerado com auxílio do Claude; revisado pelo grupo)

roda a conversão AFN → AFD para cada arquivo de exemplos/ e grava, em web/dados/:
  - <nome>.json : AFN, AFD, mapeamento estado do AFD → conjunto do AFN, os
                  passos da construção de subconjuntos na ordem real da fila,
                  e a simulação do AFN pré-calculada para a interface;
  - indice.json : lista dos exemplos;
  - dados.js    : os mesmos dados numa variável global, para o site abrir
                  direto do disco (file://), onde o navegador bloqueia fetch.

o AFD vem de conversor.converter. aqui só se registra o "porquê" de cada passo
(quais transições foram usadas) usando os métodos de AFN, e cada resultado é
conferido com o que a conversão produziu (asserts).

uso: python gerar_passos.py
"""
import glob
import json
import os

from conversor import converter
from main import afd_para_dict, cadeias, ler_afn, verificar_equivalencia

RAIZ = os.path.dirname(os.path.abspath(__file__))
PASTA_EXEMPLOS = os.path.join(RAIZ, "exemplos")
PASTA_DADOS = os.path.join(RAIZ, "web", "dados")

# a interface testa cadeias com o AFN pré-calculado; limita o volume de dados
MAX_CADEIAS = 2000
MAX_TAMANHO = 8


def ordenar(conjunto):
    return sorted(conjunto, key=str)


def fecho_explicado(afn, conjunto):
    """ε-fecho de `conjunto` e, para cada estado que entrou por ε, a transição
    que o trouxe. o conjunto final é conferido com afn.epsilon_fecho"""
    fecho = set(conjunto)
    pilha = ordenar(conjunto)
    usadas = []
    while pilha:
        q = pilha.pop()
        for destino in ordenar(afn.destinos(q, "ε")):
            if destino not in fecho:
                fecho.add(destino)
                pilha.append(destino)
                usadas.append([q, "ε", destino])
    assert fecho == afn.epsilon_fecho(conjunto)
    return fecho, usadas


def gerar_passos(afn, afd, tabela):
    """lista de passos na ordem em que converter() os executa: o conjunto
    inicial e depois, para cada conjunto tirado da fila, um passo por símbolo
    do alfabeto (em ordem)"""
    alfabeto = ordenar(afn.alfabeto)
    conjunto_de = {nome: T for nome, T, _ in tabela}
    descobertos = []
    passos = []

    inicial = tabela[0][0]
    fecho, eps = fecho_explicado(afn, {afn.inicial})
    assert frozenset(fecho) == conjunto_de[inicial]
    descobertos.append(inicial)
    passos.append({
        "tipo": "inicio",
        "conjunto": [afn.inicial],
        "fecho": ordenar(fecho),
        "transicoes_epsilon_usadas": eps,
        "estado_afd": inicial,
        "novo": True,
        "e_final": inicial in afd.finais,
        "finais_no_conjunto": ordenar(fecho & afn.finais),
    })

    for origem, T, trans in tabela:
        for a in alfabeto:
            mover = afn.mover(T, a)
            usadas = [[q, a, d] for q in ordenar(T) for d in ordenar(afn.destinos(q, a))]
            fecho, eps = fecho_explicado(afn, mover)
            destino = trans[a]
            assert frozenset(fecho) == conjunto_de[destino]

            novo = destino not in descobertos
            if novo:
                descobertos.append(destino)
            passos.append({
                "tipo": "transicao",
                "origem": origem,
                "conjunto": ordenar(T),
                "simbolo": a,
                "mover": ordenar(mover),
                "transicoes_afn_usadas": usadas,
                "sem_transicao": [q for q in ordenar(T) if not afn.destinos(q, a)],
                "fecho": ordenar(fecho),
                "transicoes_epsilon_usadas": eps,
                "destino": destino,
                "destino_novo": novo,
                "e_final": destino in afd.finais,
                "finais_no_conjunto": ordenar(fecho & afn.finais),
                "poco": not fecho,
            })

    # a tabela sai na ordem em que os conjuntos saíram da fila (FIFO), que é a
    # mesma ordem em que foram descobertos: confere que os passos batem com ela
    assert descobertos == [nome for nome, _, _ in tabela]

    poco = [nome for nome, T, _ in tabela if not T]
    passos.append({
        "tipo": "fim",
        "n_afn": len(afn.estados),
        "n_afd": len(afd.estados),
        "finais": ordenar(afd.finais),
        "poco": poco[0] if poco else None,
    })
    return passos


def tamanho_simulacao(alfabeto):
    """maior tamanho de cadeia cujo total de cadeias cabe em MAX_CADEIAS"""
    total, n = 1, 0
    while n < MAX_TAMANHO and total + len(alfabeto) ** (n + 1) <= MAX_CADEIAS:
        n += 1
        total += len(alfabeto) ** n
    return n


def simular_afn(afn, tamanho_max):
    """estados ativos do AFN depois de ler cada cadeia (até tamanho_max) e se
    ela é aceita. a cadeia w+a parte do resultado já calculado para w"""
    estados_apos = {"": afn.epsilon_fecho({afn.inicial})}
    for w in cadeias(afn.alfabeto, tamanho_max):
        if w:
            estados_apos[w] = afn.epsilon_fecho(afn.mover(estados_apos[w[:-1]], w[-1]))

    aceita = {w: afn.aceita(w) for w in estados_apos}
    for w, estados in estados_apos.items():
        assert aceita[w] == bool(estados & afn.finais)

    return {
        "tamanho_max": tamanho_max,
        "estados_apos": {w: ordenar(e) for w, e in estados_apos.items()},
        "aceita": aceita,
    }


def exportar(caminho):
    with open(caminho, encoding="utf-8") as f:
        descricao = json.load(f).get("descricao", "")
    afn = ler_afn(caminho)
    afd, tabela = converter(afn)
    tamanho = tamanho_simulacao(afn.alfabeto)
    total, divergencias = verificar_equivalencia(afn, afd, tamanho)

    return {
        "nome": os.path.splitext(os.path.basename(caminho))[0],
        "descricao": descricao,
        "afn": {
            "estados": ordenar(afn.estados),
            "alfabeto": ordenar(afn.alfabeto),
            "inicial": afn.inicial,
            "finais": ordenar(afn.finais),
            "transicoes": {q: {s: ordenar(d) for s, d in t.items()}
                           for q, t in afn.transicoes.items()},
        },
        "afd": {"estados": [nome for nome, _, _ in tabela], **afd_para_dict(afd)},
        "mapeamento": {nome: ordenar(T) for nome, T, _ in tabela},
        "passos": gerar_passos(afn, afd, tabela),
        "simulacao_afn": simular_afn(afn, tamanho),
        "verificacao": {"tamanho_max": tamanho, "total": total,
                        "divergencias": divergencias},
    }


def main():
    os.makedirs(PASTA_DADOS, exist_ok=True)
    todos = {}
    for caminho in sorted(glob.glob(os.path.join(PASTA_EXEMPLOS, "*.json"))):
        dados = exportar(caminho)
        todos[dados["nome"]] = dados
        with open(os.path.join(PASTA_DADOS, f"{dados['nome']}.json"), "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=1)
        v = dados["verificacao"]
        print(f"{dados['nome']}: {len(dados['afn']['estados'])} estados no AFN → "
              f"{len(dados['afd']['estados'])} no AFD, {len(dados['passos'])} passos, "
              f"{v['total']} cadeias testadas, {len(v['divergencias'])} divergência(s)")

    with open(os.path.join(PASTA_DADOS, "indice.json"), "w", encoding="utf-8") as f:
        json.dump(list(todos), f, ensure_ascii=False)
    with open(os.path.join(PASTA_DADOS, "dados.js"), "w", encoding="utf-8") as f:
        f.write("// gerado por gerar_passos.py: não edite à mão\n")
        f.write("window.DADOS_AFN2AFD = ")
        json.dump(todos, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")


if __name__ == "__main__":
    main()
