import argparse
import itertools
import json
import os
import shutil

from afn import AFN
from conversor import converter, imprimir_tabela
from visualizacao import afd_para_dot, afn_para_dot, salvar


def afn_de_dict(dados):
    """cria um AFN a partir do formato JSON descrito no README.
    os estados não são listados no JSON: são deduzidos do inicial, dos finais
    e de tudo que aparece nas transições"""
    transicoes = dados.get("transicoes", {})
    estados = {dados["inicial"], *dados.get("finais", []), *transicoes}
    for trans in transicoes.values():
        for destinos in trans.values():
            estados.update(destinos)

    return AFN(
        estados=estados,
        alfabeto=dados["alfabeto"],
        transicoes=transicoes,
        inicial=dados["inicial"],
        finais=dados.get("finais", []),
    )


def ler_afn(caminho):
    with open(caminho, encoding="utf-8") as f:
        return afn_de_dict(json.load(f))


def afd_para_dict(afd):
    """AFD no mesmo formato da entrada, mas com um único destino por símbolo"""
    return {
        "alfabeto": sorted(afd.alfabeto, key=str),
        "inicial": afd.inicial,
        "finais": sorted(afd.finais, key=str),
        "transicoes": afd.transicoes,
    }


def cadeias(alfabeto, tamanho_max):
    """todas as cadeias sobre o alfabeto com tamanho de 0 até tamanho_max"""
    alfabeto = sorted(alfabeto, key=str)
    for n in range(tamanho_max + 1):
        for tupla in itertools.product(alfabeto, repeat=n):
            yield "".join(tupla)


def verificar_equivalencia(afn, afd, tamanho_max):
    """roda as mesmas cadeias nos dois autômatos; retorna (total, divergencias)"""
    total = 0
    divergencias = []
    for w in cadeias(afn.alfabeto, tamanho_max):
        total += 1
        if afn.aceita(w) != afd.aceita(w):
            divergencias.append(w)
    return total, divergencias


def main():
    parser = argparse.ArgumentParser(description="converte um AFN (JSON) em AFD")
    parser.add_argument("entrada", help="arquivo JSON com o AFN")
    parser.add_argument("-o", "--saida", default="saida",
                        help="pasta onde salvar o AFD e os desenhos (padrão: saida)")
    parser.add_argument("-n", "--tamanho", type=int, default=8,
                        help="tamanho máximo das cadeias testadas (padrão: 8)")
    parser.add_argument("-c", "--cadeia", action="append", default=[],
                        help="cadeia extra para testar (pode repetir)")
    args = parser.parse_args()

    afn = ler_afn(args.entrada)
    afd, tabela = converter(afn)

    print("Construção de subconjuntos:\n")
    print(imprimir_tabela(afd, tabela, afn.alfabeto))

    os.makedirs(args.saida, exist_ok=True)
    nome = os.path.splitext(os.path.basename(args.entrada))[0]
    base = os.path.join(args.saida, nome)

    with open(f"{base}_afd.json", "w", encoding="utf-8") as f:
        json.dump(afd_para_dict(afd), f, ensure_ascii=False, indent=2)
    gerados = [f"{base}_afd.json"]
    gerados += salvar(afn_para_dot(afn), f"{base}_afn")
    gerados += salvar(afd_para_dot(afd, tabela), f"{base}_afd")

    print("\nArquivos gerados:")
    for g in gerados:
        print(f"  {g}")
    if not shutil.which("dot"):
        print("  (Graphviz não encontrado: instale-o para gerar os SVGs)")

    total, divergencias = verificar_equivalencia(afn, afd, args.tamanho)
    print(f"\nEquivalência: {total} cadeias de tamanho até {args.tamanho} testadas, "
          f"{len(divergencias)} divergência(s).")
    for w in divergencias:
        print(f"  divergiu em {w!r}")

    for w in args.cadeia:
        r_afn, r_afd = afn.aceita(w), afd.aceita(w)
        status = "ok" if r_afn == r_afd else "DIVERGE"
        print(f"  {w!r}: AFN={'aceita' if r_afn else 'rejeita'}, "
              f"AFD={'aceita' if r_afd else 'rejeita'} [{status}]")

    return 1 if divergencias else 0


if __name__ == "__main__":
    raise SystemExit(main())
