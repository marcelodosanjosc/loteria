from typing import Any, List

TIPOS_GERACAO_VALIDOS = {
    "aleatorio",
    "fechamento",
    "filtrado",
    "ia_smart",
    "externo",
    "manual",
}


def validar_tipo_geracao(tipo_geracao: str) -> str:
    tipo = (tipo_geracao or "").strip().lower()
    if tipo not in TIPOS_GERACAO_VALIDOS:
        raise ValueError(
            f"Tipo de geração inválido: '{tipo_geracao}'. Valores aceitos: {', '.join(sorted(TIPOS_GERACAO_VALIDOS))}."
        )
    return tipo


def validar_e_normalizar_jogos(jogos: List[List[int]], modalidade: Any) -> List[List[int]]:
    """Valida limites, duplicatas e intervalo do globo por modalidade, normalizando '0 -> 100' na Lotomania."""
    if not isinstance(jogos, list) or len(jogos) < 1:
        raise ValueError("Envie pelo menos 1 cartão para salvar.")
    if len(jogos) > 500:
        raise ValueError("O limite máximo por lote é de 500 cartões.")

    slug = (modalidade.codigo_slug or "").lower()
    min_dez = modalidade.min_dezenas_aposta
    max_dez = modalidade.max_dezenas_aposta
    total_globo = modalidade.total_dezenas_globo

    jogos_normalizados: List[List[int]] = []
    for idx, cartao in enumerate(jogos, start=1):
        if not isinstance(cartao, list):
            raise ValueError(f"Cartão #{idx} possui formato inválido.")

        dezenas_convertidas: List[int] = []
        for n in cartao:
            if isinstance(n, bool) or not isinstance(n, int):
                raise ValueError(f"Cartão #{idx} contém valores não inteiros.")
            valor = 100 if (slug == "lotomania" and n == 0) else n
            if valor < 1 or valor > total_globo:
                raise ValueError(
                    f"Cartão #{idx}: dezena {n} fora do intervalo permitido (1 a {total_globo}) para {modalidade.nome}."
                )
            dezenas_convertidas.append(valor)

        if len(set(dezenas_convertidas)) != len(dezenas_convertidas):
            raise ValueError(f"Cartão #{idx} contém dezenas duplicadas.")

        qtd = len(dezenas_convertidas)
        if qtd < min_dez or qtd > max_dez:
            faixa = f"{min_dez}" if min_dez == max_dez else f"entre {min_dez} e {max_dez}"
            raise ValueError(
                f"Cartão #{idx} possui {qtd} dezenas, mas {modalidade.nome} exige {faixa} dezenas."
            )

        jogos_normalizados.append(sorted(dezenas_convertidas))

    return jogos_normalizados
