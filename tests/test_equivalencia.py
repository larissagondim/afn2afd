import glob
import os
import random
import re

import pytest

from afn import AFN
from conversor import converter
from main import afn_de_dict, cadeias, ler_afn, verificar_equivalencia

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXEMPLOS = sorted(glob.glob(os.path.join(RAIZ, "exemplos", "*.json")))


def assert_equivalentes(afn, tamanho_max=7):
    afd, _ = converter(afn)
    total, divergencias = verificar_equivalencia(afn, afd, tamanho_max)
    assert total > 0
    assert divergencias == []
    return afd


@pytest.mark.parametrize("caminho", EXEMPLOS, ids=os.path.basename)
def test_exemplos(caminho):
    assert_equivalentes(ler_afn(caminho))


def test_afn1_linguagem():
    # afn1 aceita cadeias que terminam em 'a' ou 'ab' (o ε de q1 leva ao final)
    afd = assert_equivalentes(ler_afn(os.path.join(RAIZ, "exemplos", "afn1.json")))
    for w in cadeias("ab", 6):
        assert afd.aceita(w) == (w.endswith("a") or w.endswith("ab"))


def test_afn2_terceiro_do_fim():
    # afn2 aceita cadeias cujo terceiro símbolo a partir do fim é 1
    afd = assert_equivalentes(ler_afn(os.path.join(RAIZ, "exemplos", "afn2.json")))
    for w in cadeias("01", 7):
        assert afd.aceita(w) == (len(w) >= 3 and w[-3] == "1")
    # caso clássico: o AFD tem 2^3 = 8 estados (sem poço, pois sempre há q0)
    assert len(afd.estados) == 8


def test_afn3_a_estrela_b_estrela_c_estrela():
    afd = assert_equivalentes(ler_afn(os.path.join(RAIZ, "exemplos", "afn3.json")))
    for w in cadeias("abc", 6):
        assert afd.aceita(w) == bool(re.fullmatch("a*b*c*", w))


def test_epsilon_fecho_com_ciclo():
    afn = AFN(
        estados={"a", "b", "c"},
        alfabeto={"x"},
        transicoes={"a": {"ε": ["b"]}, "b": {"ε": ["a", "c"]}},
        inicial="a",
        finais={"c"},
    )
    assert afn.epsilon_fecho({"a"}) == {"a", "b", "c"}
    assert afn.aceita("")


def test_estado_poco():
    # só aceita "a"; qualquer outra coisa deve cair no poço (conjunto vazio)
    afn = afn_de_dict({
        "alfabeto": ["a", "b"],
        "inicial": "q0",
        "finais": ["q1"],
        "transicoes": {"q0": {"a": ["q1"]}},
    })
    afd, tabela = converter(afn)
    conjuntos = [T for _, T, _ in tabela]
    assert frozenset() in conjuntos
    # AFD completo: toda combinação estado × símbolo tem destino
    for q in afd.estados:
        assert set(afd.transicoes[q]) == afd.alfabeto
    assert afd.aceita("a")
    assert not afd.aceita("aa")
    assert not afd.aceita("b")
    assert not afd.aceita("")


def test_linguagem_vazia():
    afn = afn_de_dict({"alfabeto": ["a"], "inicial": "q0", "finais": [], "transicoes": {}})
    afd = assert_equivalentes(afn)
    assert not afd.finais


def _afn_aleatorio(rng):
    n = rng.randint(1, 5)
    estados = [f"q{i}" for i in range(n)]
    alfabeto = ["a", "b"]
    transicoes = {}
    for q in estados:
        transicoes[q] = {}
        for s in alfabeto + ["ε"]:
            destinos = [p for p in estados if rng.random() < 0.3]
            if destinos:
                transicoes[q][s] = destinos
    finais = [q for q in estados if rng.random() < 0.4]
    return AFN(estados, alfabeto, transicoes, estados[0], finais)


@pytest.mark.parametrize("semente", range(200))
def test_afns_aleatorios(semente):
    assert_equivalentes(_afn_aleatorio(random.Random(semente)), tamanho_max=6)
