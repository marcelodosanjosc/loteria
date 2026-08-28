import unittest
from datetime import date
from unittest.mock import MagicMock
from app.services.advanced_analytics import (
    LOTOFACIL_MOLDURA,
    LOTOFACIL_CENTRO,
    calcular_maior_sequencia_consecutiva,
    obter_linha_coluna,
    processar_estatisticas_avancadas
)
from app.models.lottery import Sorteio

class TestAdvancedAnalytics(unittest.TestCase):
    def test_moldura_centro_lotofacil_sets(self):
        self.assertEqual(len(LOTOFACIL_MOLDURA), 16)
        self.assertEqual(len(LOTOFACIL_CENTRO), 9)
        self.assertTrue(LOTOFACIL_MOLDURA.isdisjoint(LOTOFACIL_CENTRO))
        self.assertEqual(LOTOFACIL_MOLDURA | LOTOFACIL_CENTRO, set(range(1, 26)))

    def test_calcular_maior_sequencia_consecutiva(self):
        self.assertEqual(calcular_maior_sequencia_consecutiva([1, 2, 3, 5, 6, 8, 9, 10, 11]), 4)
        self.assertEqual(calcular_maior_sequencia_consecutiva([1, 3, 5, 7, 9]), 1)
        self.assertEqual(calcular_maior_sequencia_consecutiva([]), 0)
        self.assertEqual(calcular_maior_sequencia_consecutiva([1, 2, 4, 5, 6, 7, 10]), 4)

    def test_obter_linha_coluna(self):
        self.assertEqual(obter_linha_coluna(1, 5), (1, 1))
        self.assertEqual(obter_linha_coluna(5, 5), (1, 5))
        self.assertEqual(obter_linha_coluna(6, 5), (2, 1))
        self.assertEqual(obter_linha_coluna(13, 5), (3, 3))
        self.assertEqual(obter_linha_coluna(25, 5), (5, 5))

    def test_processar_estatisticas_avancadas(self):
        s1 = MagicMock(spec=Sorteio)
        s1.numero_concurso = 3002
        s1.data_sorteio = date(2026, 8, 18)
        s1.dezenas_sorteadas = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24]

        s2 = MagicMock(spec=Sorteio)
        s2.numero_concurso = 3001
        s2.data_sorteio = date(2026, 8, 17)
        s2.dezenas_sorteadas = [1, 2, 3, 4, 5, 7, 8, 9, 12, 13, 14, 17, 18, 19, 25]

        sorteios = [s1, s2]
        resultado = processar_estatisticas_avancadas(sorteios, total_dezenas=25, colunas_volante=5, slug="lotofacil")

        self.assertEqual(resultado["total_concursos_analisados"], 2)
        self.assertEqual(resultado["ultimo_concurso"], 3002)
        self.assertIn("moldura_centro", resultado)
        self.assertEqual(resultado["moldura_centro"]["moldura_media"], (15 + 6) / 2)
        self.assertIn("repeticao_concurso_anterior", resultado)
        self.assertEqual(resultado["repeticao_concurso_anterior"]["media_repetidas"], 5.0)

if __name__ == "__main__":
    unittest.main()
