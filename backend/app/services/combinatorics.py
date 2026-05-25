import math
import itertools
import numpy as np
from typing import List, Tuple

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
    dezenas_escolhidas = sorted(list(set(dezenas_escolhidas)))
    n = len(dezenas_escolhidas)
    
    # 1. Gerar todos os bilhetes possíveis (tamanho_bilhete) a partir das dezenas escolhidas
    combinacoes_bilhetes = list(itertools.combinations(dezenas_escolhidas, tamanho_bilhete))
    # 2. Gerar todos os cenários possíveis de sorteio (condicao_acerto)
    combinacoes_sorteios = list(itertools.combinations(dezenas_escolhidas, condicao_acerto))
    
    # Criar mapeamento de dezenas para índices 0..n-1
    dezena_para_indice = {d: idx for idx, d in enumerate(dezenas_escolhidas)}
    
    # 3. Representar os conjuntos como matrizes binárias de tamanho (M, n)
    # Cada linha representa um bilhete/sorteio e as colunas indicam a presença das dezenas
    T_bin = np.zeros((len(combinacoes_bilhetes), n), dtype=bool)
    for idx, c in enumerate(combinacoes_bilhetes):
        for d in c:
            T_bin[idx, dezena_para_indice[d]] = True
            
    D_bin = np.zeros((len(combinacoes_sorteios), n), dtype=bool)
    for idx, c in enumerate(combinacoes_sorteios):
        for d in c:
            D_bin[idx, dezena_para_indice[d]] = True
            
    # 4. Multiplicação de matrizes (Dot Product) para obter o tamanho das intersecções
    # intersec[i, j] = número de elementos em comum entre o bilhete i e o cenário j
    intersecoes = np.dot(T_bin.astype(np.int8), D_bin.astype(np.int8).T)
    
    # 5. Criar matriz de cobertura (booleana): True se cobre (intersecção >= garantia_acerto)
    cobertura = intersecoes >= garantia_acerto
    
    # Algoritmo Guloso Set Cover otimizado em NumPy
    jogos_selecionados_indices = []
    cobertos = np.zeros(len(combinacoes_sorteios), dtype=bool)
    bilhetes_ativos = np.ones(len(combinacoes_bilhetes), dtype=bool)
    
    # Executa até cobrir todos os cenários ou não haver mais bilhetes úteis
    while not np.all(cobertos):
        # Para cada bilhete ativo, conta quantos cenários ainda não cobertos ele cobre
        # cobertura * ~cobertos -> conta apenas True onde o cenário ainda está False
        novas_coberturas = np.sum(cobertura & ~cobertos, axis=1)
        
        # Filtra apenas os bilhetes ativos
        novas_coberturas[~bilhetes_ativos] = -1
        
        best_idx = np.argmax(novas_coberturas)
        if novas_coberturas[best_idx] <= 0:
            break
            
        # Adiciona o bilhete selecionado
        jogos_selecionados_indices.append(best_idx)
        
        # Atualiza o vetor de cenários cobertos
        cobertos |= cobertura[best_idx]
        
        # Desativa o bilhete selecionado para não ser escolhido novamente
        bilhetes_ativos[best_idx] = False
        
    # Converter índices de volta para dezenas reais
    return [sorted(list(combinacoes_bilhetes[idx])) for idx in jogos_selecionados_indices]
