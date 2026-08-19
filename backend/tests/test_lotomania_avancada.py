import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.filters import (
    obter_quadrante,
    contar_quadrantes_ocupados,
    filtro_quadrantes
)
from app.services.combinatorics import (
    gerar_fechamento_lotomania_avancado,
    gerar_fechamento_guloso
)

class TestLotomaniaAvancada(unittest.TestCase):
    def test_obter_quadrante(self):
        self.assertEqual(obter_quadrante(1), 0)
        self.assertEqual(obter_quadrante(4), 0)
        self.assertEqual(obter_quadrante(5), 1)
        self.assertEqual(obter_quadrante(8), 1)
        self.assertEqual(obter_quadrante(50), 12)
        self.assertEqual(obter_quadrante(97), 24)
        self.assertEqual(obter_quadrante(100), 24)

    def test_contar_quadrantes_ocupados(self):
        self.assertEqual(contar_quadrantes_ocupados([1, 2, 3, 4]), 1)
        self.assertEqual(contar_quadrantes_ocupados([1, 2, 5, 6]), 2)
        jogos_25 = [i * 4 + 1 for i in range(25)]
        self.assertEqual(contar_quadrantes_ocupados(jogos_25), 25)

    def test_filtro_quadrantes(self):
        jogo_50 = list(range(1, 51))
        self.assertTrue(filtro_quadrantes(jogo_50, 15))
        jogo_impares = [i * 2 + 1 for i in range(50)]
        self.assertFalse(filtro_quadrantes(jogo_impares, 15))

    def test_atalho_matematico(self):
        dezenas_52 = list(range(1, 53))
        res = gerar_fechamento_guloso(dezenas_52, 50, 17, 20)
        self.assertEqual(len(res), 1)
        self.assertEqual(len(res[0]), 50)

    def test_algoritmo_avancado_lotomania_n56(self):
        dezenas_56 = list(range(1, 57))
        cartoes = gerar_fechamento_lotomania_avancado(
            dezenas_escolhidas=dezenas_56,
            tamanho_bilhete=50,
            garantia_acerto=16,
            condicao_acerto=20,
            max_quadrantes=15
        )
        self.assertGreaterEqual(len(cartoes), 1)
        for c in cartoes:
            self.assertEqual(len(c), 50)
            self.assertTrue(filtro_quadrantes(c, 15))

if __name__ == "__main__":
    unittest.main()
