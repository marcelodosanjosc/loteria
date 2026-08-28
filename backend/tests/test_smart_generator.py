import unittest
from unittest.mock import MagicMock
from datetime import date
from app.services.smart_generator import (
    avaliar_jogo_lotofacil,
    gerar_top_jogos_inteligentes
)
from app.services.ai_copilot import (
    PROMPT_TEMPLATES,
    construir_prompt_ia,
    executar_teste_cego
)
from app.models.lottery import Sorteio

class TestSmartGeneratorAndCopilot(unittest.TestCase):
    def test_avaliar_jogo_lotofacil(self):
        jogo_equilibrado = [1, 2, 4, 5, 7, 9, 10, 14, 15, 16, 18, 19, 20, 21, 25]
        ultimo = [1, 2, 4, 5, 8, 9, 14, 15, 17, 18, 20, 21, 23, 24, 25]
        
        score, metricas, just = avaliar_jogo_lotofacil(
            jogo=jogo_equilibrado,
            ultimo_sorteio=ultimo,
            dezenas_quentes=[1, 2, 5, 9, 21],
            dezenas_atrasadas=[7, 16]
        )

        self.assertGreaterEqual(score, 80.0)
        self.assertEqual(metricas["moldura"], 10)
        self.assertEqual(metricas["centro"], 5)
        self.assertGreaterEqual(len(just), 4)

    def test_gerar_top_jogos_inteligentes(self):
        jogos = gerar_top_jogos_inteligentes(
            total_dezenas_globo=25,
            dezenas_por_jogo=15,
            quantidade_jogos=5,
            ultimo_sorteio=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            dezenas_quentes=[1, 3, 5, 7, 9, 11, 13],
            dezenas_atrasadas=[16, 18, 20, 22]
        )

        self.assertEqual(len(jogos), 5)
        for item in jogos:
            self.assertEqual(len(item["jogo"]), 15)
            self.assertGreater(item["score"], 0)
            self.assertGreater(len(item["justificativa"]), 0)

    def test_ai_copilot_templates_and_prompt(self):
        self.assertEqual(len(PROMPT_TEMPLATES), 7)
        s1 = MagicMock(spec=Sorteio)
        s1.numero_concurso = 3001
        s1.data_sorteio = date(2026, 8, 18)
        s1.dezenas_sorteadas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

        prompt_res = construir_prompt_ia(
            template_id=1,
            sorteios=[s1],
            ia_destino="deepseek"
        )

        self.assertEqual(prompt_res["template_id"], 1)
        self.assertIn("Lotofácil", prompt_res["prompt_formatado"])
        self.assertIn("3001", prompt_res["prompt_formatado"])

    def test_executar_teste_cego(self):
        s1 = MagicMock(spec=Sorteio)
        s1.numero_concurso = 3002
        s1.data_sorteio = date(2026, 8, 18)
        s1.dezenas_sorteadas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

        s2 = MagicMock(spec=Sorteio)
        s2.numero_concurso = 3001
        s2.data_sorteio = date(2026, 8, 17)
        s2.dezenas_sorteadas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 16, 17, 18, 19, 20]

        resultado = executar_teste_cego(
            sorteios=[s1, s2],
            jogos_custom=[[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]],
            amostragem_treino=1
        )

        self.assertEqual(resultado["concurso_auditado"], 3002)
        self.assertEqual(resultado["jogos_resultados"][0]["acertos"], 15)
        self.assertTrue(resultado["jogos_resultados"][0]["premiado"])

if __name__ == "__main__":
    unittest.main()
