class AFN:
    """automato finito nao deterministico

    transicoes: {estado: {simbolo: {estados destino}}}
        o símbolo "ε" representa movimento vazio e não pertence ao alfabeto.
        estados sem transição podem estar ausentes ou mapear para {}.
    """
    def __init__(self, estados, alfabeto, transicoes, inicial, finais):
        self.estados = set(estados)
        self.alfabeto = set(alfabeto)

        # O JSON traz os destinos como listas; converto para conjuntos para
        # facilitar a união e o ε-fecho (sem duplicatas, sem se preocupar com ordem).
        self.transicoes = {
            q: {s: set(destinos) for s, destinos in trans.items()}
            for q, trans in transicoes.items()
        }

        self.inicial = inicial
        self.finais = set(finais)