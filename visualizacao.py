import shutil
import subprocess


def _aspas(texto):
    return '"' + str(texto).replace('"', '\\"').replace("\n", "\\n") + '"'


def _dot(nome, estados, inicial, finais, arestas, rotulos=None):
    """monta o texto DOT; arestas é {(origem, destino): [simbolos]}"""
    rotulos = rotulos or {}
    linhas = [f"digraph {_aspas(nome)} {{", "    rankdir=LR;",
              '    __inicio [shape=point, label=""];']

    for q in sorted(estados, key=str):
        forma = "doublecircle" if q in finais else "circle"
        rotulo = rotulos.get(q, q)
        linhas.append(f"    {_aspas(q)} [shape={forma}, label={_aspas(rotulo)}];")

    linhas.append(f"    __inicio -> {_aspas(inicial)};")

    # símbolos com mesma origem e destino ficam numa aresta só: "a, b"
    for (origem, destino), simbolos in sorted(arestas.items(), key=str):
        rotulo = ", ".join(sorted(simbolos, key=str))
        linhas.append(f"    {_aspas(origem)} -> {_aspas(destino)} [label={_aspas(rotulo)}];")

    linhas.append("}")
    return "\n".join(linhas) + "\n"


def afn_para_dot(afn):
    arestas = {}
    for origem, trans in afn.transicoes.items():
        for simbolo, destinos in trans.items():
            for destino in destinos:
                arestas.setdefault((origem, destino), []).append(simbolo)
    return _dot("AFN", afn.estados, afn.inicial, afn.finais, arestas)


def afd_para_dot(afd, tabela=None):
    """se `tabela` (saída do conversor) for passada, cada estado mostra
    também o conjunto do AFN que ele representa"""
    from conversor import formatar_conjunto

    arestas = {}
    for origem, trans in afd.transicoes.items():
        for simbolo, destino in trans.items():
            arestas.setdefault((origem, destino), []).append(simbolo)

    rotulos = {}
    if tabela:
        rotulos = {nome: f"{nome}\n{formatar_conjunto(T)}" for nome, T, _ in tabela}
    return _dot("AFD", afd.estados, afd.inicial, afd.finais, arestas, rotulos)


def salvar(dot, caminho_base):
    """salva `caminho_base`.dot e, se o Graphviz estiver instalado,
    `caminho_base`.svg. retorna a lista de arquivos gerados"""
    caminho_dot = f"{caminho_base}.dot"
    with open(caminho_dot, "w", encoding="utf-8") as f:
        f.write(dot)
    gerados = [caminho_dot]

    if shutil.which("dot"):
        caminho_svg = f"{caminho_base}.svg"
        subprocess.run(["dot", "-Tsvg", caminho_dot, "-o", caminho_svg], check=True)
        gerados.append(caminho_svg)
    return gerados
