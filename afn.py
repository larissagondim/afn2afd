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

        if self.inicial not in self.estados:
            raise ValueError("estado inicial não pertence aos estados")
        if not self.finais <= self.estados:
            raise ValueError("estados finais devem estar em estados")

    def destinos(self, estado, simbolo):
        """conjunto de estados alcançados de `estado` lendo `simbolo`"""
        return self.transicoes.get(estado, {}).get(simbolo, set())

    def epsilon_fecho(self, conjunto):
        """estados alcançáveis a partir de `conjunto` usando só movimentos ε
        (inclui os próprios estados de `conjunto`)"""
        fecho = set(conjunto)
        pilha = list(conjunto)
        while pilha:
            q = pilha.pop()
            for destino in self.destinos(q, "ε"):
                if destino not in fecho:
                    fecho.add(destino)
                    pilha.append(destino)
        return fecho

    def mover(self, conjunto, simbolo):
        """união dos destinos de cada estado de `conjunto` lendo `simbolo`"""
        resultado = set()
        for q in conjunto:
            resultado |= self.destinos(q, simbolo)
        return resultado

    def aceita(self, cadeia):
        """retorna True se existe algum caminho que aceita a cadeia"""
        atuais = self.epsilon_fecho({self.inicial})
        for simbolo in cadeia:
            atuais = self.epsilon_fecho(self.mover(atuais, simbolo))
            if not atuais:
                return False
        return bool(atuais & self.finais)