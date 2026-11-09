class AFD:
    def __init__(self, estados, alfabeto, transicoes, inicial, finais):
        self.estados = set(estados)
        self.alfabeto = set(alfabeto)
        self.transicoes = set(transicoes)
        self.inicial = inicial
        self.finais = set(finais)