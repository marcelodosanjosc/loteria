import random
from typing import List, Dict, Any, Optional, Set
from app.services.advanced_analytics import (
    LOTOFACIL_MOLDURA,
    LOTOFACIL_CENTRO,
    calcular_maior_sequencia_consecutiva,
    obter_linha_coluna
)

PRIMOS_LOTOFACIL = {2, 3, 5, 7, 11, 13, 17, 19, 23}
FIBONACCI_LOTOFACIL = {1, 2, 3, 5, 8, 13, 21}
FIBONACCI_GERAL = {1, 2, 3, 5, 8, 13, 21, 34, 55, 89}

def eh_primo(n: int) -> bool:
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

def avaliar_jogo_lotofacil(
    jogo: List[int],
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """
    Avalia uma combinação de 15 dezenas da Lotofácil,
    atribuindo uma nota estatística de 0 a 100 e gerando justificativas analíticas.
    """
    jogo_set = set(jogo)
    justificativas = []
    score = 0.0
    
    # 1. Moldura vs Centro (Até 25 pontos)
    qtd_moldura = len(jogo_set & LOTOFACIL_MOLDURA)
    qtd_centro = len(jogo_set & LOTOFACIL_CENTRO)
    if qtd_moldura in (9, 10):
        score += 25.0
        justificativas.append(f"{qtd_moldura} dezenas na moldura e {qtd_centro} no centro (faixa de maior frequência histórica)")
    elif qtd_moldura in (8, 11):
        score += 18.0
        justificativas.append(f"{qtd_moldura} dezenas na moldura e {qtd_centro} no centro (boa cobertura espacial)")
    else:
        score += 8.0
        justificativas.append(f"{qtd_moldura} na moldura e {qtd_centro} no centro (distribuição fora da média)")

    # 2. Pares vs Ímpares (Até 20 pontos)
    impares = sum(1 for d in jogo if d % 2 != 0)
    pares = 15 - impares
    if impares in (7, 8):
        score += 20.0
        justificativas.append(f"Equilíbrio de paridade ideal: {impares} ímpares e {pares} pares")
    elif impares in (6, 9):
        score += 13.0
        justificativas.append(f"Paridade aceitável: {impares} ímpares e {pares} pares")
    else:
        score += 5.0
        justificativas.append(f"Paridade assimétrica: {impares} ímpares e {pares} pares")

    # 3. Repetição do concurso anterior (Até 20 pontos)
    repetidas = 0
    if ultimo_sorteio:
        repetidas = len(jogo_set & set(ultimo_sorteio))
        if repetidas in (8, 9, 10):
            score += 20.0
            justificativas.append(f"{repetidas} dezenas repetidas do concurso anterior (padrão em ~80% dos sorteios)")
        elif repetidas in (7, 11):
            score += 12.0
            justificativas.append(f"{repetidas} repetidas do concurso anterior (padrão moderado)")
        else:
            score += 4.0
            justificativas.append(f"{repetidas} repetidas do concurso anterior (raro)")
    else:
        # Se não há último sorteio informado, concede pontuação neutra
        score += 16.0

    # 4. Soma das dezenas (Até 15 pontos)
    soma = sum(jogo)
    if 180 <= soma <= 220:
        score += 15.0
        justificativas.append(f"Soma total de {soma} (dentro da faixa de ouro 180-220)")
    elif 165 <= soma <= 235:
        score += 10.0
        justificativas.append(f"Soma total de {soma} (faixa aceitável)")
    else:
        score += 3.0
        justificativas.append(f"Soma total atípica ({soma})")

    # 5. Primos e Fibonacci (Até 10 pontos)
    primos = len(jogo_set & PRIMOS_LOTOFACIL)
    fibo = len(jogo_set & FIBONACCI_LOTOFACIL)
    if 4 <= primos <= 7:
        score += 5.0
    else:
        score += 2.0
        
    if 3 <= fibo <= 5:
        score += 5.0
    else:
        score += 2.0
    justificativas.append(f"Contém {primos} números primos e {fibo} da sequência de Fibonacci")

    # 6. Sequências Consecutivas (Até 10 pontos)
    max_seq = calcular_maior_sequencia_consecutiva(jogo)
    if 2 <= max_seq <= 4:
        score += 10.0
        justificativas.append(f"Maior sequência contígua de {max_seq} dezenas (sem blocos excessivos)")
    elif max_seq == 5:
        score += 6.0
        justificativas.append(f"Sequência máxima de 5 dezenas")
    else:
        score += 2.0
        justificativas.append(f"Sequência longa de {max_seq} dezenas consecutivas")

    # 7. Destaque de Quentes e Atrasadas
    if dezenas_quentes:
        quentes_incluidas = sorted(list(jogo_set & set(dezenas_quentes[:7])))
        if quentes_incluidas:
            justificativas.append(f"Incorpora {len(quentes_incluidas)} dezenas quentes no ciclo: {quentes_incluidas}")
            
    if dezenas_atrasadas:
        atrasadas_incluidas = sorted(list(jogo_set & set(dezenas_atrasadas[:5])))
        if atrasadas_incluidas:
            justificativas.append(f"Incorpora {len(atrasadas_incluidas)} dezenas em atraso estratégico: {atrasadas_incluidas}")

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

def avaliar_jogo(
    jogo: List[int],
    total_dezenas_globo: int = 25,
    dezenas_por_jogo: int = 15,
    ultimo_sorteio: Optional[List[int]] = None,
    dezenas_quentes: Optional[List[int]] = None,
    dezenas_atrasadas: Optional[List[int]] = None
) -> tuple[float, Dict[str, Any], List[str]]:
    """
    Avalia o equilíbrio de qualquer jogo baseado nas características da modalidade.
    """
    if total_dezenas_globo == 25 and dezenas_por_jogo == 15:
        return avaliar_jogo_lotofacil(jogo, ultimo_sorteio, dezenas_quentes, dezenas_atrasadas)

    jogo_set = set(jogo)
    justificativas = []
    score = 0.0

    # 1. Pares vs Ímpares (Até 30 pontos)
    impares = sum(1 for d in jogo if d % 2 != 0)
    pares = dezenas_por_jogo - impares
    dif_paridade = abs(pares - impares)
    if dif_paridade <= 1:
        score += 30.0
        justificativas.append(f"Excelente balanço de paridade: {impares} ímpares e {pares} pares")
    elif dif_paridade <= 2:
        score += 22.0
        justificativas.append(f"Boa distribuição de paridade: {impares} ímpares e {pares} pares")
    else:
        score += 10.0
        justificativas.append(f"Paridade assimétrica: {impares} ímpares e {pares} pares")

    # 2. Soma das Dezenas (Até 25 pontos)
    soma = sum(jogo)
    media_teorica = (total_dezenas_globo + 1) / 2.0
    soma_esperada = dezenas_por_jogo * media_teorica
    margem_aceitavel = max(15.0, soma_esperada * 0.25)
    desvio_soma = abs(soma - soma_esperada)

    if desvio_soma <= margem_aceitavel * 0.5:
        score += 25.0
        justificativas.append(f"Soma total ({soma}) no centro da faixa estatística esperada")
    elif desvio_soma <= margem_aceitavel:
        score += 18.0
        justificativas.append(f"Soma total ({soma}) dentro da margem padrão")
    else:
        score += 8.0
        justificativas.append(f"Soma total atípica ({soma})")

    # 3. Repetição do concurso anterior (Até 20 pontos)
    repetidas = 0
    if ultimo_sorteio:
        repetidas = len(jogo_set & set(ultimo_sorteio))
        repeticao_esperada = (dezenas_por_jogo * len(ultimo_sorteio)) / max(1, total_dezenas_globo)
        if abs(repetidas - repeticao_esperada) <= 1.5:
            score += 20.0
            justificativas.append(f"{repetidas} dezenas repetidas do concurso anterior (dentro da média)")
        else:
            score += 12.0
            justificativas.append(f"{repetidas} repetidas do último concurso")
    else:
        score += 16.0

    # 4. Sequências Consecutivas (Até 15 pontos)
    max_seq = calcular_maior_sequencia_consecutiva(jogo)
    if max_seq <= 2:
        score += 15.0
        justificativas.append(f"Sem blocos consecutivos excessivos (máx. {max_seq} seguidos)")
    elif max_seq == 3:
        score += 10.0
        justificativas.append(f"Sequência máxima moderada de {max_seq} dezenas")
    else:
        score += 4.0
        justificativas.append(f"Sequência longa de {max_seq} dezenas")

    # 5. Primos e Fibonacci (Até 10 pontos)
    primos = sum(1 for d in jogo if eh_primo(d))
    fibo = len(jogo_set & FIBONACCI_GERAL)
    score += 10.0
    justificativas.append(f"Contém {primos} números primos e {fibo} números de Fibonacci")

    # Quentes e atrasadas
    if dezenas_quentes:
        quentes_incluidas = sorted(list(jogo_set & set(dezenas_quentes[:5])))
        if quentes_incluidas:
            justificativas.append(f"Incorpora {len(quentes_incluidas)} dezenas quentes: {quentes_incluidas}")

    if dezenas_atrasadas:
        atrasadas_incluidas = sorted(list(jogo_set & set(dezenas_atrasadas[:5])))
        if atrasadas_incluidas:
            justificativas.append(f"Incorpora {len(atrasadas_incluidas)} dezenas atrasadas: {atrasadas_incluidas}")

    metricas = {
        "moldura": 0,
        "centro": 0,
        "pares": pares,
        "impares": impares,
        "repetidas_anterior": repetidas,
        "soma": soma,
        "primos": primos,
        "fibonacci": fibo,
        "maior_sequencia": max_seq
    }

    return round(min(100.0, score), 1), metricas, justificativas

def gerar_top_jogos_inteligentes(
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
    com base no Score de Equilíbrio Estatístico.
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
    
    # Geração do pool de candidatos
    tentativas = 0
    while len(jogos_candidatos) < tamanho_pool and tentativas < tamanho_pool * 10:
        tentativas += 1
        # Amostragem sem reposição ponderada
        escolhidas = random.choices(universo_disponivel, weights=pesos_lista, k=vagas_a_preencher * 2)
        # Filtra duplicados preservando ordem
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
        
        score, metricas, just = avaliar_jogo(
            jogo=jogo_completo,
            total_dezenas_globo=total_dezenas_globo,
            dezenas_por_jogo=dezenas_por_jogo,
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

    # Ordenar pelo Score decrescente e retornar os Top N
    jogos_candidatos.sort(key=lambda x: x["score"], reverse=True)
    return jogos_candidatos[:quantidade_jogos]
