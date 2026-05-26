import math
import itertools
import numpy as np
from typing import List, Tuple
import logging
import time

logger = logging.getLogger(__name__)

def calcular_combinacao(n: int, k: int) -> int:
    """Calcula C(n, k) = n! / (k! * (n-k)!)"""
    if k < 0 or k > n:
        return 0
    return math.comb(n, k)

def calcular_probabilidade(dezenas_jogadas: int, total_bolas: int, dezenas_sorteio: int) -> Tuple[int, int, float]:
    """
    Calcula:
    1. Total de combinacoes possíveis na loteria
    2. Quantidade de jogos simples gerados pela aposta múltipla
    3. Probabilidade de acerto (1 em X)
    """
    total_possivel = calcular_combinacao(total_bolas, dezenas_sorteio)
    jogos_simples = calcular_combinacao(dezenas_jogadas, dezenas_sorteio)
    
    if jogos_simples == 0:
        return total_possivel, 0, 0.0
        
    probabilidade_1_em = total_possivel / jogos_simples
    return total_possivel, jogos_simples, probabilidade_1_em

def gerar_fechamento_guloso(
    dezenas_escolhidas: List[int],
    tamanho_bilhete: int,
    garantia_acerto: int,
    condicao_acerto: int
) -> List[List[int]]:
    """
    Gera uma matriz de fechamento otimizada usando NumPy para multiplicação de matrizes binárias.
    
    n = len(dezenas_escolhidas)
    tamanho_bilhete = tamanho de cada aposta (ex: 6 para Mega-Sena, 15 para Lotofácil)
    garantia_acerto = garantia de acertos (ex: 11 pontos na Lotofácil)
    condicao_acerto = quantos números do sorteio devem cair no nosso grupo escolhido (ex: acertando 15)
    
    Retorna a lista de jogos (dezenas combinadas).
    """
    inicio_tempo = time.time()
    dezenas_escolhidas = sorted(list(set(dezenas_escolhidas)))
    n = len(dezenas_escolhidas)
    
    logger.info(
        f"Iniciando fechamento guloso: dezenas={n}, tamanho_bilhete={tamanho_bilhete}, "
        f"garantia={garantia_acerto}, condicao={condicao_acerto}"
    )
    
    # Atalho 1: Se o número de dezenas escolhidas for igual ao tamanho do bilhete,
    # há apenas 1 aposta possível contendo todos os números selecionados.
    if n == tamanho_bilhete:
        logger.info("Atalho acionado: dezenas_escolhidas == tamanho_bilhete. Retornando aposta única.")
        return [dezenas_escolhidas]
        
    # Atalho 2: Se mesmo no pior caso de sorteio, qualquer bilhete individual já garante
    # o acerto mínimo (ex: n=53, tamanho_bilhete=50, condicao_acerto=20, garantia=17 ->
    # qualquer aposta de 50 dezenas deixa fora 3 dezenas, garantindo no mínimo 20 - 3 = 17 acertos).
    # Então, apenas 1 único bilhete é necessário.
    pior_caso_acertos = tamanho_bilhete - (n - condicao_acerto)
    if pior_caso_acertos >= garantia_acerto:
        logger.info(
            f"Atalho acionado: o pior caso de acertos ({pior_caso_acertos}) já garante o acerto mínimo "
            f"({garantia_acerto}). Retornando 1 bilhete simples."
        )
        return [dezenas_escolhidas[:tamanho_bilhete]]
        
    # 1. Calcular o número teórico de combinações para validar segurança contra estouro de memória
    num_bilhetes = calcular_combinacao(n, tamanho_bilhete)
    num_sorteios = calcular_combinacao(n, condicao_acerto)
    
    logger.info(f"Cenários calculados: {num_bilhetes} bilhetes possíveis e {num_sorteios} cenários de sorteio.")
    
    # Barreira de segurança para evitar consumo extremo de memória / travamento do servidor
    LIMITE_SEGURANCA = 150000
    if num_bilhetes > LIMITE_SEGURANCA:
        msg_erro = (
            f"Quantidade de bilhetes muito complexa ({num_bilhetes} bilhetes). "
            f"Para a segurança do servidor, o limite máximo permitido de bilhetes é {LIMITE_SEGURANCA}. "
            "Por favor, reduza a quantidade de dezenas selecionadas."
        )
        logger.warning(f"Processamento rejeitado por limite de segurança de bilhetes: {msg_erro}")
        raise ValueError(msg_erro)
        
    # 2. Gerar todos os bilhetes possíveis (tamanho_bilhete) a partir das dezenas escolhidas
    combinacoes_bilhetes = list(itertools.combinations(dezenas_escolhidas, tamanho_bilhete))
    
    # 3. Gerar ou amostrar os cenários possíveis de sorteio (condicao_acerto)
    import random
    if num_sorteios > 100000:
        logger.info(
            f"Cenários de sorteio muito extensos ({num_sorteios}). "
            "Ativando Amostragem Estatística de Monte Carlo (15.000 amostras únicas)."
        )
        # Sorteamos 15.000 amostras de sorteios únicos de forma ultra-rápida
        sorteios_amostrados = set()
        max_amostras = 15000
        tentativas_maximas = max_amostras * 3
        tentativas = 0
        
        while len(sorteios_amostrados) < max_amostras and tentativas < tentativas_maximas:
            amostra = tuple(sorted(random.sample(dezenas_escolhidas, condicao_acerto)))
            sorteios_amostrados.add(amostra)
            tentativas += 1
            
        combinacoes_sorteios = list(sorteios_amostrados)
        logger.info(f"Amostragem concluída com sucesso: {len(combinacoes_sorteios)} cenários representativos gerados.")
    else:
        combinacoes_sorteios = list(itertools.combinations(dezenas_escolhidas, condicao_acerto))
    
    # Criar mapeamento de dezenas para índices 0..n-1
    dezena_para_indice = {d: idx for idx, d in enumerate(dezenas_escolhidas)}
    
    # Representar os conjuntos como matrizes binárias de tamanho (M, n)
    T_bin = np.zeros((len(combinacoes_bilhetes), n), dtype=bool)
    for idx, c in enumerate(combinacoes_bilhetes):
        for d in c:
            T_bin[idx, dezena_para_indice[d]] = True
            
    D_bin = np.zeros((len(combinacoes_sorteios), n), dtype=bool)
    for idx, c in enumerate(combinacoes_sorteios):
        for d in c:
            D_bin[idx, dezena_para_indice[d]] = True
            
    # 4. Multiplicação de matrizes em blocos (Chunks) para obter cobertura de forma segura
    # Isso impede picos de alocação de ~24GB de RAM na conversão para int32/int64
    logger.info("Construindo matriz de cobertura de forma chunked...")
    cobertura = np.zeros((len(combinacoes_bilhetes), len(combinacoes_sorteios)), dtype=bool)
    chunk_size = 2000
    D_bin_T = D_bin.astype(np.int8).T
    
    for i in range(0, len(combinacoes_bilhetes), chunk_size):
        chunk_T = T_bin[i:i+chunk_size].astype(np.int8)
        # np.dot calcula o produto escalar que representa o tamanho da intersecção.
        # Comparar com garantia_acerto gera booleanos diretamente, evitando manter int32 em memória.
        cobertura[i:i+chunk_size] = np.dot(chunk_T, D_bin_T) >= garantia_acerto
        
    # Limpeza imediata de memória dos vetores binários não mais necessários
    del T_bin
    del D_bin
    del D_bin_T
    
    # 5. Algoritmo Guloso Set Cover otimizado de forma incremental 1D vetorizada
    logger.info("Executando laço de otimização set cover...")
    jogos_selecionados_indices = []
    cobertos = np.zeros(len(combinacoes_sorteios), dtype=bool)
    bilhetes_ativos = np.ones(len(combinacoes_bilhetes), dtype=bool)
    
    # Rastreia de forma 1D quantos cenários ainda não cobertos cada bilhete cobre.
    cobertura_counts = np.sum(cobertura, axis=1)
    
    # Executa até cobrir todos os cenários ou não haver mais bilhetes úteis
    while not np.all(cobertos):
        # Encontra o bilhete ativo que cobre mais cenários restantes
        best_idx = np.argmax(np.where(bilhetes_ativos, cobertura_counts, -1))
        
        if cobertura_counts[best_idx] <= 0:
            break
            
        # Adiciona o bilhete selecionado
        jogos_selecionados_indices.append(best_idx)
        bilhetes_ativos[best_idx] = False
        
        # Identifica novos cenários que foram cobertos por este bilhete
        novas_coberturas = cobertura[best_idx] & ~cobertos
        newly_covered_indices = np.where(novas_coberturas)[0]
        
        if len(newly_covered_indices) == 0:
            break
            
        cobertos[newly_covered_indices] = True
        
        # Atualiza a contagem dos bilhetes ativos de forma 100% vetorizada e rápida.
        # Em vez de re-escanear a matriz 2D inteira, deduzimos as contagens das colunas cobertas.
        cobertura_counts -= np.sum(cobertura[:, newly_covered_indices], axis=1)
        
    tempo_decorrido = time.time() - inicio_tempo
    logger.info(
        f"Fechamento finalizado: {len(jogos_selecionados_indices)} jogos selecionados "
        f"em {tempo_decorrido:.3f} segundos."
    )
    
    # Converter índices de volta para dezenas reais
    return [sorted(list(combinacoes_bilhetes[idx])) for idx in jogos_selecionados_indices]
