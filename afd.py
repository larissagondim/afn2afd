class AFD:
    """automato finito deterministico

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

        if self.inicial not in self.estados:
            raise ValueError("estado inicial não pertence aos estados")
        if not self.finais <= self.estados:
            raise ValueError("estados finais devem estar em estados")

    def aceita(self, cadeia):
        """retorna True se a cadeia é aceita pelo autômato"""
        estado = self.inicial
        for simbolo in cadeia:
            estado = self.transicoes.get(estado, {}).get(simbolo)
            if estado is None:
                return False
        return estado in self.finais