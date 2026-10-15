import random
from typing import List, Dict, Any, Optional, Set
from collections import Counter
LOTOFACIL_MOLDURA: Set[int] = {1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25}
LOTOFACIL_CENTRO: Set[int] = {7, 8, 9, 12, 13, 14, 17, 18, 19}

def calcular_maior_sequencia_consecutiva(dezenas: List[int]) -> int:
    if not dezenas:
        return 0
    ordenadas = sorted(dezenas)
    max_seq, atual_seq = 1, 1
    for i in range(1, len(ordenadas)):
        if ordenadas[i] == ordenadas[i - 1] + 1:
            atual_seq += 1
            max_seq = max(max_seq, atual_seq)
        elif ordenadas[i] != ordenadas[i - 1]:
            atual_seq = 1
    return max_seq


PRIMOS_ATE_100: Set[int] = {
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
    53, 59, 61, 67, 71, 73, 79, 83, 89, 97
}
FIBONACCI_ATE_100: Set[int] = {1, 2, 3, 5, 8, 13, 21, 34, 55, 89}


def avaliar_jogo_lotofacil(
    jogo: List[int],
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """Avalia uma combinação da Lotofácil (15 dezenas em 25)."""
    jogo_set = set(jogo)
    k = len(jogo)
    fator = k / 15.0
    justificativas = []
    score = 0.0

    # 1. Moldura vs Centro (Até 25 pontos)
    qtd_moldura = len(jogo_set & LOTOFACIL_MOLDURA)
    qtd_centro = k - qtd_moldura
    min_m, max_m = round(9 * fator), round(10 * fator)
    if min_m <= qtd_moldura <= max_m:
        score += 25.0
        justificativas.append(f"{qtd_moldura} dezenas na moldura e {qtd_centro} no centro (faixa áurea)")
    elif (min_m - 1) <= qtd_moldura <= (max_m + 1):
        score += 17.0
        justificativas.append(f"{qtd_moldura} dezenas na moldura e {qtd_centro} no centro (boa cobertura espacial)")
    else:
        score += 6.0
        justificativas.append(f"{qtd_moldura} na moldura e {qtd_centro} no centro (fora da média)")

    # 2. Pares vs Ímpares (Até 20 pontos)
    impares = sum(1 for d in jogo if d % 2 != 0)
    pares = k - impares
    min_i, max_i = round(7 * fator), round(8 * fator)
    if min_i <= impares <= max_i:
        score += 20.0
        justificativas.append(f"Equilíbrio de paridade ideal: {impares} ímpares e {pares} pares")
    elif (min_i - 1) <= impares <= (max_i + 1):
        score += 13.0
        justificativas.append(f"Paridade aceitável: {impares} ímpares e {pares} pares")
    else:
        score += 4.0

    # 3. Repetição do concurso anterior (Até 20 pontos)
    repetidas = 0
    if ultimo_sorteio:
        repetidas = len(jogo_set & set(ultimo_sorteio))
        min_r, max_r = round(8 * fator), round(10 * fator)
        if min_r <= repetidas <= max_r:
            score += 20.0
            justificativas.append(f"{repetidas} repetidas do concurso anterior (padrão em ~80% dos sorteios)")
        elif (min_r - 1) <= repetidas <= (max_r + 1):
            score += 12.0
        else:
            score += 4.0
    else:
        score += 16.0

    # 4. Soma das dezenas (Até 15 pontos)
    soma = sum(jogo)
    if round(180 * fator) <= soma <= round(220 * fator):
        score += 15.0
        justificativas.append(f"Soma total de {soma} (dentro da faixa de ouro 180-220)")
    elif round(165 * fator) <= soma <= round(235 * fator):
        score += 9.0
    else:
        score += 3.0

    # 5. Primos e Fibonacci (Até 10 pontos)
    primos = len(jogo_set & PRIMOS_ATE_100)
    fibo = len(jogo_set & FIBONACCI_ATE_100)
    if round(4 * fator) <= primos <= round(7 * fator):
        score += 5.0
    else:
        score += 2.0
    if round(3 * fator) <= fibo <= round(5 * fator):
        score += 5.0
    else:
        score += 2.0
    justificativas.append(f"Contém {primos} números primos e {fibo} de Fibonacci")

    # 6. Sequências Consecutivas (Até 10 pontos)
    max_seq = calcular_maior_sequencia_consecutiva(jogo)
    if 2 <= max_seq <= 4:
        score += 10.0
        justificativas.append(f"Maior sequência de {max_seq} dezenas consecutivas")
    elif max_seq == 5:
        score += 6.0
    else:
        score += 2.0

    # Quentes e atrasadas
    if dezenas_quentes:
        quentes_incluidas = sorted(list(jogo_set & set(dezenas_quentes[:7])))
        if quentes_incluidas:
            justificativas.append(f"Incorpora {len(quentes_incluidas)} dezenas quentes: {quentes_incluidas}")
    if dezenas_atrasadas:
        atrasadas_incluidas = sorted(list(jogo_set & set(dezenas_atrasadas[:5])))
        if atrasadas_incluidas:
            justificativas.append(f"Incorpora {len(atrasadas_incluidas)} dezenas atrasadas: {atrasadas_incluidas}")

    metricas = {
        "moldura": qtd_moldura,
        "centro": qtd_centro,
        "pares": pares,
        "impares": impares,
        "repetidas_anterior": repetidas,
        "soma": soma,
        "primos": primos,
        "fibonacci": fibo,
        "maior_sequencia": max_seq
    }
    return round(min(100.0, score), 1), metricas, justificativas


def avaliar_jogo_megasena(
    jogo: List[int],
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """Avalia uma combinação da Mega-Sena (6 dezenas em 60, volante 6x10)."""
    jogo_set = set(jogo)
    k = len(jogo)
    fator = k / 6.0
    justificativas = []
    score = 0.0

    # 1. Quadrantes no volante 6x10 (25 pts)
    quadrantes = {1: 0, 2: 0, 3: 0, 4: 0}
    for n in jogo:
        linha = (n - 1) // 10  # 0 a 5
        col = (n - 1) % 10     # 0 a 9
        if linha < 3 and col < 5:
            quadrantes[1] += 1
        elif linha < 3 and col >= 5:
            quadrantes[2] += 1
        elif linha >= 3 and col < 5:
            quadrantes[3] += 1
        else:
            quadrantes[4] += 1

    quads_ativos = sum(1 for v in quadrantes.values() if v > 0)
    max_por_quad = max(quadrantes.values())
    if quads_ativos >= 3 and max_por_quad <= max(3, round(2.5 * fator)):
        score += 25.0
        justificativas.append(f"Excelente dispersão em {quads_ativos} quadrantes do volante")
    elif quads_ativos >= 2:
        score += 14.0
        justificativas.append(f"Distribuição em {quads_ativos} quadrantes")
    else:
        score += 4.0

    # 2. Pares e Ímpares (20 pts)
    impares = sum(1 for d in jogo if d % 2 != 0)
    pares = k - impares
    prop_impar = impares / k
    if 0.45 <= prop_impar <= 0.55:
        score += 20.0
        justificativas.append(f"Simetria perfeita Par/Ímpar ({pares}P / {impares}I)")
    elif 0.30 <= prop_impar <= 0.70:
        score += 16.0
        justificativas.append(f"Balanço Par/Ímpar equilibrado ({pares}P / {impares}I)")
    else:
        score += 4.0

    # 3. Soma das dezenas (20 pts) - Faixa ouro: 130 a 220
    soma = sum(jogo)
    if round(130 * fator) <= soma <= round(220 * fator):
        score += 20.0
        justificativas.append(f"Soma na faixa áurea da Mega-Sena ({soma})")
    elif round(105 * fator) <= soma <= round(245 * fator):
        score += 10.0
    else:
        score += 3.0

    # 4. Repetidas do Concurso Anterior (15 pts) - Ouro: 0 ou 1
    repetidas = 0
    if ultimo_sorteio:
        repetidas = len(jogo_set & set(ultimo_sorteio))
        if repetidas <= round(1 * fator):
            score += 15.0
            justificativas.append(f"Renovação estatística ideal ({repetidas} repetida do anterior)")
        elif repetidas == round(2 * fator):
            score += 7.0
        else:
            score += 1.0
    else:
        score += 15.0

    # 5. Primos (10 pts)
    primos = len(jogo_set & PRIMOS_ATE_100)
    if round(1 * fator) <= primos <= round(3 * fator):
        score += 10.0
        justificativas.append(f"Quantidade ideal de números primos ({primos})")
    elif primos == 0 or primos == round(4 * fator):
        score += 5.0
    else:
        score += 1.0

    # 6. Sequências e Linhas (10 pts)
    max_seq = calcular_maior_sequencia_consecutiva(jogo)
    linhas_usadas = len({(n - 1) // 10 for n in jogo})
    if max_seq <= 2 and linhas_usadas >= min(4, k - 1):
        score += 10.0
        justificativas.append(f"Alta dispersão por linhas ({linhas_usadas} linhas)")
    elif max_seq <= 2:
        score += 6.0
    else:
        score += 2.0

    if dezenas_quentes:
        quentes_incluidas = sorted(list(jogo_set & set(dezenas_quentes[:5])))
        if quentes_incluidas:
            justificativas.append(f"Incorpora {len(quentes_incluidas)} dezenas quentes: {quentes_incluidas}")
    if dezenas_atrasadas:
        atrasadas_incluidas = sorted(list(jogo_set & set(dezenas_atrasadas[:4])))
        if atrasadas_incluidas:
            justificativas.append(f"Incorpora {len(atrasadas_incluidas)} dezenas atrasadas: {atrasadas_incluidas}")

    metricas = {
        "quadrantes": f"{quadrantes[1]}-{quadrantes[2]}-{quadrantes[3]}-{quadrantes[4]}",
        "pares": pares,
        "impares": impares,
        "repetidas_anterior": repetidas,
        "soma": soma,
        "primos": primos,
        "maior_sequencia": max_seq
    }
    return round(min(100.0, score), 1), metricas, justificativas


def avaliar_jogo_quina(
    jogo: List[int],
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """Avalia uma combinação da Quina (5 dezenas em 80, volante 8x10)."""
    jogo_set = set(jogo)
    k = len(jogo)
    fator = k / 5.0
    justificativas = []
    score = 0.0

    # 1. Dispersão em Linhas e Colunas (25 pts)
    linhas = {(n - 1) // 10 for n in jogo}
    colunas = {(n - 1) % 10 for n in jogo}
    if len(linhas) >= min(4, k - 1) and len(colunas) >= min(4, k - 1):
        score += 25.0
        justificativas.append(f"Ampla dispersão na malha ({len(linhas)} linhas e {len(colunas)} colunas)")
    elif len(linhas) >= 3 and len(colunas) >= 3:
        score += 14.0
    else:
        score += 5.0

    # 2. Pares e Ímpares (20 pts) - 2P/3I ou 3P/2I (~63%)
    impares = sum(1 for d in jogo if d % 2 != 0)
    pares = k - impares
    prop_impar = impares / k
    if 0.35 <= prop_impar <= 0.65:
        score += 20.0
        justificativas.append(f"Balanço Par/Ímpar de máxima ocorrência ({pares}P / {impares}I)")
    elif 0.20 <= prop_impar <= 0.80:
        score += 10.0
    else:
        score += 2.0

    # 3. Soma das Dezenas (20 pts) - Faixa ouro: 150 a 250
    soma = sum(jogo)
    if round(150 * fator) <= soma <= round(250 * fator):
        score += 20.0
        justificativas.append(f"Soma calibrada na curva normal da Quina ({soma})")
    elif round(120 * fator) <= soma <= round(280 * fator):
        score += 10.0
    else:
        score += 2.0

    # 4. Repetidas do Concurso Anterior (15 pts) - Ouro: 0 ou 1
    repetidas = 0
    if ultimo_sorteio:
        repetidas = len(jogo_set & set(ultimo_sorteio))
        if repetidas <= 1:
            score += 15.0
            justificativas.append(f"Baixa colisão com concurso anterior ({repetidas} repetida)")
        elif repetidas == 2:
            score += 5.0
        else:
            score += 0.0
    else:
        score += 15.0

    # 5. Primos (10 pts)
    primos = len(jogo_set & PRIMOS_ATE_100)
    if 1 <= primos <= round(2.5 * fator):
        score += 10.0
        justificativas.append(f"Presença equilibrada de números primos ({primos})")
    elif primos == 0 or primos == round(3 * fator):
        score += 5.0
    else:
        score += 1.0

    # 6. Sequências (10 pts)
    max_seq = calcular_maior_sequencia_consecutiva(jogo)
    if max_seq <= 2:
        score += 10.0
        justificativas.append("Sem sequências consecutivas excessivas")
    else:
        score += 2.0

    if dezenas_quentes:
        quentes_incluidas = sorted(list(jogo_set & set(dezenas_quentes[:5])))
        if quentes_incluidas:
            justificativas.append(f"Incorpora {len(quentes_incluidas)} dezenas quentes: {quentes_incluidas}")
    if dezenas_atrasadas:
        atrasadas_incluidas = sorted(list(jogo_set & set(dezenas_atrasadas[:4])))
        if atrasadas_incluidas:
            justificativas.append(f"Incorpora {len(atrasadas_incluidas)} dezenas atrasadas: {atrasadas_incluidas}")

    metricas = {
        "linhas": len(linhas),
        "colunas": len(colunas),
        "pares": pares,
        "impares": impares,
        "repetidas_anterior": repetidas,
        "soma": soma,
        "primos": primos,
        "maior_sequencia": max_seq
    }
    return round(min(100.0, score), 1), metricas, justificativas


def avaliar_jogo_lotomania(
    jogo: List[int],
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """Avalia uma combinação da Lotomania (50 dezenas em 100, volante 10x10)."""
    jogo_set = set(jogo)
    k = len(jogo)
    justificativas = []
    score = 0.0

    # 1. Equilíbrio nos 4 Quadrantes de 25 dezenas (25 pts)
    quads = {1: 0, 2: 0, 3: 0, 4: 0}
    linhas_count = Counter()
    for n in jogo:
        idx = (n - 1) if n > 0 else 99
        lin = idx // 10
        col = idx % 10
        linhas_count[lin] += 1
        if lin < 5 and col < 5:
            quads[1] += 1
        elif lin < 5 and col >= 5:
            quads[2] += 1
        elif lin >= 5 and col < 5:
            quads[3] += 1
        else:
            quads[4] += 1

    min_q, max_q = min(quads.values()), max(quads.values())
    quad_str = f"{quads[1]}-{quads[2]}-{quads[3]}-{quads[4]}"
    if 10 <= min_q and max_q <= 15:
        score += 25.0
        justificativas.append(f"Simetria perfeita nos 4 quadrantes ({quad_str})")
    elif 8 <= min_q and max_q <= 17:
        score += 15.0
        justificativas.append(f"Distribuição aceitável nos quadrantes ({quad_str})")
    else:
        score += 5.0

    # 2. Equilíbrio Par/Ímpar (25 pts)
    impares = sum(1 for d in jogo if d % 2 != 0)
    pares = k - impares
    if 23 <= impares <= 27:
        score += 25.0
        justificativas.append(f"Balanço harmônico Par/Ímpar ({pares}P / {impares}I)")
    elif 20 <= impares <= 30:
        score += 14.0
    else:
        score += 4.0

    # 3. Homogeneidade de Linhas (20 pts)
    linhas_equilibradas = sum(1 for l in range(10) if 3 <= linhas_count[l] <= 7)
    if linhas_equilibradas >= 8:
        score += 20.0
        justificativas.append(f"Cobertura homogênea em {linhas_equilibradas}/10 linhas")
    elif linhas_equilibradas >= 6:
        score += 10.0
    else:
        score += 4.0

    # 4. Soma Global (15 pts) - Faixa ouro: 2350 a 2700
    soma = sum(jogo)
    if 2350 <= soma <= 2700:
        score += 15.0
        justificativas.append(f"Soma na faixa de ouro ({soma})")
    elif 2200 <= soma <= 2850:
        score += 8.0
    else:
        score += 2.0

    # 5. Repetidas do sorteio de 20 dezenas (15 pts) - Média teórica: 10
    repetidas = 0
    if ultimo_sorteio:
        repetidas = len(jogo_set & set(ultimo_sorteio))
        if 8 <= repetidas <= 12:
            score += 15.0
            justificativas.append(f"Retenção estatística ideal ({repetidas}/20 do último sorteio)")
        elif 6 <= repetidas <= 14:
            score += 8.0
        else:
            score += 2.0
    else:
        score += 15.0

    primos = len(jogo_set & PRIMOS_ATE_100)
    max_seq = calcular_maior_sequencia_consecutiva(jogo)

    metricas = {
        "quadrantes": quad_str,
        "pares": pares,
        "impares": impares,
        "repetidas_anterior": repetidas,
        "soma": soma,
        "primos": primos,
        "maior_sequencia": max_seq
    }
    return round(min(100.0, score), 1), metricas, justificativas


def avaliar_jogo_duplasena(
    jogo: List[int],
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """Avalia uma combinação da Dupla-Sena (6 dezenas em 50, volante 5x10)."""
    jogo_set = set(jogo)
    k = len(jogo)
    fator = k / 6.0
    justificativas = []
    score = 0.0

    # 1. Cobertura de Linhas no volante 5x10 (25 pts)
    linhas = {(n - 1) // 10 for n in jogo}
    if len(linhas) >= 4:
        score += 25.0
        justificativas.append(f"Distribuído em {len(linhas)} faixas horizontais do volante")
    elif len(linhas) == 3:
        score += 13.0
    else:
        score += 4.0

    # 2. Pares e Ímpares (20 pts)
    impares = sum(1 for d in jogo if d % 2 != 0)
    pares = k - impares
    if impares in (2, 3, 4):
        score += 20.0
        justificativas.append(f"Simetria Par/Ímpar ideal ({pares}P / {impares}I)")
    else:
        score += 6.0

    # 3. Soma das Dezenas (20 pts) - Faixa ouro: 120 a 190
    soma = sum(jogo)
    if round(120 * fator) <= soma <= round(190 * fator):
        score += 20.0
        justificativas.append(f"Soma na faixa áurea da Dupla-Sena ({soma})")
    elif round(95 * fator) <= soma <= round(215 * fator):
        score += 10.0
    else:
        score += 2.0

    # 4. Repetidas do Concurso Anterior (15 pts) - Ouro: 0 ou 1
    repetidas = 0
    if ultimo_sorteio:
        repetidas = len(jogo_set & set(ultimo_sorteio))
        if repetidas <= 1:
            score += 15.0
            justificativas.append(f"Renovação ideal com {repetidas} repetida")
        elif repetidas == 2:
            score += 6.0
        else:
            score += 1.0
    else:
        score += 15.0

    # 5. Primos (10 pts)
    primos = len(jogo_set & PRIMOS_ATE_100)
    if 1 <= primos <= round(3 * fator):
        score += 10.0
        justificativas.append(f"Presença harmônica de primos ({primos})")
    else:
        score += 3.0

    # 6. Sequências (10 pts)
    max_seq = calcular_maior_sequencia_consecutiva(jogo)
    if max_seq <= 2:
        score += 10.0
    else:
        score += 2.0

    metricas = {
        "linhas": len(linhas),
        "pares": pares,
        "impares": impares,
        "repetidas_anterior": repetidas,
        "soma": soma,
        "primos": primos,
        "maior_sequencia": max_seq
    }
    return round(min(100.0, score), 1), metricas, justificativas


def avaliar_jogo_por_modalidade(
    modalidade_slug: str,
    jogo: List[int],
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """Dispatcher polimórfico para avaliar jogos de qualquer modalidade."""
    slug = (modalidade_slug or "lotofacil").lower()
    if slug == "mega-sena":
        return avaliar_jogo_megasena(jogo, ultimo_sorteio, dezenas_quentes, dezenas_atrasadas)
    elif slug == "quina":
        return avaliar_jogo_quina(jogo, ultimo_sorteio, dezenas_quentes, dezenas_atrasadas)
    elif slug == "lotomania":
        return avaliar_jogo_lotomania(jogo, ultimo_sorteio, dezenas_quentes, dezenas_atrasadas)
    elif slug == "dupla-sena":
        return avaliar_jogo_duplasena(jogo, ultimo_sorteio, dezenas_quentes, dezenas_atrasadas)
    else:
        return avaliar_jogo_lotofacil(jogo, ultimo_sorteio, dezenas_quentes, dezenas_atrasadas)


def gerar_top_jogos_inteligentes(
    modalidade_slug: str = "lotofacil",
    total_dezenas_globo: int = 25,
    dezenas_por_jogo: int = 15,
    quantidade_jogos: int = 5,
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None,
    dezenas_fixas: Optional[List[int]] = None,
    dezenas_excluidas: Optional[List[int]] = None,
    tamanho_pool: int = 120
) -> List[Dict[str, Any]]:
    """
    Gera um conjunto amplo de cartões candidatos e seleciona os melhores
    com base no Score de Equilíbrio Estatístico da modalidade selecionada.
    """
    dezenas_fixas_set = set(dezenas_fixas or [])
    dezenas_excluidas_set = set(dezenas_excluidas or [])
    universo_disponivel = [
        d for d in range(1, total_dezenas_globo + 1)
        if d not in dezenas_fixas_set and d not in dezenas_excluidas_set
    ]
    
    vagas_a_preencher = dezenas_por_jogo - len(dezenas_fixas_set)
    if vagas_a_preencher <= 0 or len(universo_disponivel) < vagas_a_preencher:
        raise ValueError("Configuração inválida de dezenas fixas/excluídas.")

    # Pesos ponderados para amostragem probabilística
    pesos = {}
    quentes_set = set(dezenas_quentes or [])
    atrasadas_set = set(dezenas_atrasadas or [])
    
    for d in universo_disponivel:
        p = 1.0
        if d in quentes_set:
            p += 0.4
        if d in atrasadas_set:
            p += 0.2
        pesos[d] = p
        
    pesos_lista = [pesos[d] for d in universo_disponivel]

    jogos_candidatos = []
    jogos_vistos: Set[tuple] = set()
    
    tentativas = 0
    while len(jogos_candidatos) < tamanho_pool and tentativas < tamanho_pool * 10:
        tentativas += 1
        escolhidas = random.choices(universo_disponivel, weights=pesos_lista, k=vagas_a_preencher * 2)
        escolhidas_unicas = []
        for x in escolhidas:
            if x not in escolhidas_unicas:
                escolhidas_unicas.append(x)
            if len(escolhidas_unicas) == vagas_a_preencher:
                break
                
        if len(escolhidas_unicas) < vagas_a_preencher:
            faltam = [d for d in universo_disponivel if d not in escolhidas_unicas]
            random.shuffle(faltam)
            escolhidas_unicas.extend(faltam[:vagas_a_preencher - len(escolhidas_unicas)])
            
        jogo_completo = sorted(list(dezenas_fixas_set) + escolhidas_unicas)
        chave = tuple(jogo_completo)
        if chave in jogos_vistos:
            continue
        jogos_vistos.add(chave)
        
        score, metricas, just = avaliar_jogo_por_modalidade(
            modalidade_slug=modalidade_slug,
            jogo=jogo_completo,
            ultimo_sorteio=ultimo_sorteio,
            dezenas_quentes=dezenas_quentes,
            dezenas_atrasadas=dezenas_atrasadas
        )
        
        jogos_candidatos.append({
            "jogo": jogo_completo,
            "score": score,
            "metricas": metricas,
            "justificativa": just
        })

    jogos_candidatos.sort(key=lambda x: x["score"], reverse=True)
    return jogos_candidatos[:quantidade_jogos]
