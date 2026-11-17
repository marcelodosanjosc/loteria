import unittest
from types import SimpleNamespace
from app.services.saved_games import validar_e_normalizar_jogos, validar_tipo_geracao


class TestSavedGamesValidation(unittest.TestCase):
    def setUp(self):
        self.mega = SimpleNamespace(
            nome="Mega-Sena",
            codigo_slug="mega-sena",
            min_dezenas_aposta=6,
            max_dezenas_aposta=20,
            total_dezenas_globo=60,
        )
        self.lotomania = SimpleNamespace(
            nome="Lotomania",
            codigo_slug="lotomania",
            min_dezenas_aposta=50,
            max_dezenas_aposta=50,
            total_dezenas_globo=100,
        )

    def test_mega_sena_ordena_dezenas_validas(self):
        resultado = validar_e_normalizar_jogos([[42, 5, 18, 1, 60, 23]], self.mega)
        self.assertEqual(resultado, [[1, 5, 18, 23, 42, 60]])

    def test_lotomania_converte_zero_para_100(self):
        cartao = [0] + list(range(1, 50))
        resultado = validar_e_normalizar_jogos([cartao], self.lotomania)
        self.assertEqual(len(resultado[0]), 50)
        self.assertIn(100, resultado[0])
        self.assertNotIn(0, resultado[0])
        self.assertEqual(resultado[0][-1], 100)

    def test_rejeita_zero_fora_da_lotomania(self):
        with self.assertRaises(ValueError):
            validar_e_normalizar_jogos([[0, 1, 2, 3, 4, 5]], self.mega)

    def test_rejeita_duplicatas_no_mesmo_cartao(self):
        with self.assertRaises(ValueError) as ctx:
            validar_e_normalizar_jogos([[1, 2, 3, 4, 5, 5]], self.mega)
        self.assertIn("duplicadas", str(ctx.exception))

    def test_rejeita_dezena_acima_do_globo(self):
        with self.assertRaises(ValueError):
            validar_e_normalizar_jogos([[1, 2, 3, 4, 5, 61]], self.mega)

    def test_rejeita_quantidade_invalida_de_dezenas(self):
        with self.assertRaises(ValueError):
            validar_e_normalizar_jogos([[1, 2, 3, 4, 5]], self.mega)

    def test_rejeita_lote_vazio_ou_acima_do_limite(self):
        with self.assertRaises(ValueError):
            validar_e_normalizar_jogos([], self.mega)
        with self.assertRaises(ValueError):
            validar_e_normalizar_jogos([[1, 2, 3, 4, 5, 6]] * 501, self.mega)

    def test_rejeita_bool_como_numero(self):
        with self.assertRaises(ValueError):
            validar_e_normalizar_jogos([[True, 2, 3, 4, 5, 6]], self.mega)

    def test_valida_tipo_geracao(self):
        self.assertEqual(validar_tipo_geracao("externo"), "externo")
        self.assertEqual(validar_tipo_geracao("MANUAL"), "manual")
        with self.assertRaises(ValueError):
            validar_tipo_geracao("invalido")


if __name__ == "__main__":
    unittest.main()
