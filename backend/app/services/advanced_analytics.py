from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.lottery import Modalidade, Sorteio

# Definições espaciais para Lotofácil (5x5, 25 dezenas)
LOTOFACIL_MOLDURA = {1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25}
LOTOFACIL_CENTRO = {7, 8, 9, 12, 13, 14, 17, 18, 19}

def calcular_maior_sequencia_consecutiva(dezenas: List[int]) -> int:
    """Calcula o tamanho da maior sequência de dezenas consecutivas em um sorteio."""
    if not dezenas:
        return 0
    ordenadas = sorted(dezenas)
    max_seq = 1
    atual_seq = 1
    for i in range(1, len(ordenadas)):
        if ordenadas[i] == ordenadas[i - 1] + 1:
            atual_seq += 1
            if atual_seq > max_seq:
                max_seq = atual_seq
        elif ordenadas[i] != ordenadas[i - 1]:
            atual_seq = 1
    return max_seq

def obter_linha_coluna(dezena: int, colunas: int = 5) -> tuple[int, int]:
    """Retorna a (linha, coluna) de uma dezena (base 1-indexada)."""
    linha = ((dezena - 1) // colunas) + 1
    coluna = ((dezena - 1) % colunas) + 1
    return linha, coluna

def processar_estatisticas_avancadas(
    sorteios: List[Sorteio],
    total_dezenas: int,
    colunas_volante: int = 5,
    slug: str = "lotofacil"
) -> Dict[str, Any]:
    """
    Calcula indicadores estatísticos avançados, espaciais e temporais
    para a lista de sorteios fornecida.
    """
    if not sorteios:
        return {}

    total_concursos = len(sorteios)
    ultimo_concurso = sorteios[0].numero_concurso
    
    # 1. Frequência e Atraso
    frequencia = {i: 0 for i in range(1, total_dezenas + 1)}
    ultimo_sorteio_dezena = {i: 0 for i in range(1, total_dezenas + 1)}
    
    total_pares = 0
    total_impares = 0
    total_numeros_processados = 0
    somas_historico = []
    
    # Moldura e Centro
    moldura_distribuicao: Dict[int, int] = {}
    total_moldura = 0
    total_centro = 0
    
    # Linhas e Colunas
    dist_linhas = {i: 0 for i in range(1, (total_dezenas // colunas_volante) + 1)}
    dist_colunas = {i: 0 for i in range(1, colunas_volante + 1)}
    
    # Sequências
    sequencias_dist: Dict[int, int] = {}
    soma_maiores_seq = 0
    
    # Altas e Baixas
    ponto_corte = total_dezenas // 2
    total_baixas = 0
    total_altas = 0
    
    # Processar sorteios do mais recente ao mais antigo
    for s in sorteios:
        dezenas = s.dezenas_sorteadas
        soma = sum(dezenas)
        somas_historico.append(soma)
        
        # Moldura vs Centro (Lotofácil ou genérico)
        if slug == "lotofacil":
            qtd_moldura = sum(1 for d in dezenas if d in LOTOFACIL_MOLDURA)
            qtd_centro = len(dezenas) - qtd_moldura
        else:
            qtd_moldura = 0
            qtd_centro = 0
            for d in dezenas:
                l, c = obter_linha_coluna(d, colunas_volante)
                max_l = total_dezenas // colunas_volante
                if l == 1 or l == max_l or c == 1 or c == colunas_volante:
                    qtd_moldura += 1
                else:
                    qtd_centro += 1
                    
        total_moldura += qtd_moldura
        total_centro += qtd_centro
        moldura_distribuicao[qtd_moldura] = moldura_distribuicao.get(qtd_moldura, 0) + 1
        
        # Sequências consecutivas
        m_seq = calcular_maior_sequencia_consecutiva(dezenas)
        soma_maiores_seq += m_seq
        sequencias_dist[m_seq] = sequencias_dist.get(m_seq, 0) + 1
        
        for d in dezenas:
            if 1 <= d <= total_dezenas:
                frequencia[d] += 1
                total_numeros_processados += 1
                if d % 2 == 0:
                    total_pares += 1
                else:
                    total_impares += 1
                    
                if d <= ponto_corte:
                    total_baixas += 1
                else:
                    total_altas += 1
                    
                if ultimo_sorteio_dezena[d] == 0:
                    ultimo_sorteio_dezena[d] = s.numero_concurso
                    
                l, c = obter_linha_coluna(d, colunas_volante)
                if l in dist_linhas:
                    dist_linhas[l] += 1
                if c in dist_colunas:
                    dist_colunas[c] += 1

    # 2. Atrasos
    atraso = {}
    for i in range(1, total_dezenas + 1):
        conc_ocorrido = ultimo_sorteio_dezena[i]
        if conc_ocorrido == 0:
            atraso[i] = total_concursos
        else:
            atraso[i] = ultimo_concurso - conc_ocorrido

    # 3. Repetições do concurso anterior (em ordem cronológica)
    sorteios_cronologicos = list(reversed(sorteios))
    repeticoes_dist: Dict[int, int] = {}
    total_repeticoes = 0
    qtd_pares_comparados = 0
    
    for i in range(1, len(sorteios_cronologicos)):
        anteriores = set(sorteios_cronologicos[i - 1].dezenas_sorteadas)
        atuais = set(sorteios_cronologicos[i].dezenas_sorteadas)
        repetidas = len(anteriores & atuais)
        repeticoes_dist[repetidas] = repeticoes_dist.get(repetidas, 0) + 1
        total_repeticoes += repetidas
        qtd_pares_comparados += 1
        
    media_repeticoes = round(total_repeticoes / max(1, qtd_pares_comparados), 2)

    # 4. Rankings de Quentes, Frias e Atrasadas
    dezenas_ordenadas_freq = sorted(frequencia.items(), key=lambda x: x[1], reverse=True)
    dezenas_quentes = [num for num, _ in dezenas_ordenadas_freq[:10]]
    dezenas_frias = [num for num, _ in dezenas_ordenadas_freq[-10:]]
    
    dezenas_ordenadas_atraso = sorted(atraso.items(), key=lambda x: x[1], reverse=True)
    dezenas_atrasadas = [num for num, _ in dezenas_ordenadas_atraso[:10]]

    # 5. Paridades e Médias
    pares_pct = round((total_pares / max(1, total_numeros_processados)) * 100, 2)
    impares_pct = round(100.0 - pares_pct, 2)
    baixas_pct = round((total_baixas / max(1, total_numeros_processados)) * 100, 2)
    altas_pct = round(100.0 - baixas_pct, 2)
    soma_media = round(sum(somas_historico) / max(1, len(somas_historico)), 2)

    return {
        "total_concursos_analisados": total_concursos,
        "ultimo_concurso": ultimo_concurso,
        "frequencia": frequencia,
        "atraso": atraso,
        "pares_impares": {
            "pares": pares_pct,
            "impares": impares_pct
        },
        "somas_historico": list(reversed(somas_historico[:50])),
        "soma_media": soma_media,
        "moldura_centro": {
            "moldura_media": round(total_moldura / max(1, total_concursos), 2),
            "centro_medio": round(total_centro / max(1, total_concursos), 2),
            "distribuicao": moldura_distribuicao
        },
        "distribuicao_linhas": dist_linhas,
        "distribuicao_colunas": dist_colunas,
        "repeticao_concurso_anterior": {
            "media_repetidas": media_repeticoes,
            "distribuicao": repeticoes_dist
        },
        "sequencias_consecutivas": {
            "maior_sequencia_media": round(soma_maiores_seq / max(1, total_concursos), 2),
            "distribuicao": sequencias_dist
        },
        "altas_baixas": {
            "baixas_pct": baixas_pct,
            "altas_pct": altas_pct
        },
        "dezenas_quentes": dezenas_quentes,
        "dezenas_frias": dezenas_frias,
        "dezenas_atrasadas": dezenas_atrasadas
    }
