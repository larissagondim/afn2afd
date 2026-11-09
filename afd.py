class AFD:
    """Autômato Finito Determinístico.

    transicoes: {estado: {simbolo: estado destino}}
        diferentemente da AFN, cada par (estado, símbolo) leva a no máximo um estado.
        se a transição não existir, a cadeia é rejeitada 
    """

    def __init__(self, estados, alfabeto, transicoes, inicial, finais):
        self.estados = set(estados)
        self.alfabeto = set(alfabeto)
        self.transicoes = {q: dict(trans) for q, trans in transicoes.items()}
        self.inicial = inicial
        self.finais = set(finais)