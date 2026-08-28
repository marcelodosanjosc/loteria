import io
import csv
from datetime import date
from typing import List, Dict, Any, Optional
from app.models.lottery import Sorteio
from app.services.advanced_analytics import LOTOFACIL_MOLDURA, LOTOFACIL_CENTRO
from app.services.smart_generator import gerar_top_jogos_inteligentes

PROMPT_TEMPLATES = [
    {
        "id": 1,
        "titulo": "Indicadores Estatísticos Globais (Tabela Completa)",
        "descricao": "Solicita à IA uma tabela analítica com frequências, atrasos, quentes/frias, moldura/centro e paridades.",
        "template": """Atue como um especialista em estatística avançada e análise de dados de loterias brasileiras.

Analise a base dos últimos {qtd_concursos} concursos da Lotofácil enviada abaixo.
Identifique com precisão matemática:
1. Frequência individual de cada uma das 25 dezenas
2. Dezenas mais atrasadas (sem sair há mais concursos)
3. Dezenas quentes (maior presença recente) e dezenas frias
4. Distribuição por linhas e por colunas no volante
5. Balanço de pares e ímpares
6. Comportamento da soma das dezenas
7. Proporção média de dezenas na moldura vs centro (miolo)

Regras rígidas:
- Não invente informações. Baseie-se estritamente nos dados fornecidos.
- Apresente os resultados organizados em tabelas markdown claras.

--- DADOS HISTÓRICOS ({qtd_concursos} CONCURSOS RECENTES) ---
{dados_concursos_tabela}
"""
    },
    {
        "id": 2,
        "titulo": "Padrões Recorrentes & Geração de 5 Jogos com Validação",
        "descricao": "Busca repetições, sequências e grupos frequentes, gerando 5 combinações justificadas.",
        "template": """Atue como um estatístico profissional especializado em combinatória.

Estude a base dos últimos {qtd_concursos} concursos da Lotofácil.
Encontre padrões recorrentes na amostra:
- Repetições do concurso anterior (quantas dezenas costumam se repetir)
- Sequências contíguas mais frequentes (ex: 2 a 4 dezenas consecutivas)
- Grupos de dezenas que costumam sair juntas
- Padrões de linhas e colunas mais equilibrados
- Padrões estatisticamente raros a serem evitados

Com base nesses padrões observados, elabore 5 jogos equilibrados de 15 dezenas.
Para cada jogo gerado, forneça uma breve explicação estatística das escolhas (moldura, paridade, soma, repetidas).

--- DADOS HISTÓRICOS ({qtd_concursos} CONCURSOS RECENTES) ---
{dados_concursos_tabela}
{bloco_resultado_conferencia}
"""
    },
    {
        "id": 3,
        "titulo": "Análise de Curto Prazo (Momento Atual) & Jogos Equilibrados",
        "descricao": "Foca no momento recente (30 a 50 concursos) para capturar ciclos e dezenas quentes.",
        "template": """Você é um analista de dados especialista em amostragem temporal de loterias.

Faça uma análise rigorosa do ciclo recente nos últimos {qtd_concursos} concursos da Lotofácil:
1. Identifique as dezenas em evidência no ciclo atual (quentes) e as que entraram em atraso acentuado.
2. Calcule a média de repetição em relação ao sorteio anterior.
3. Avalie o equilíbrio entre dezenas baixas (01-12) e altas (13-25).

Considerando essa análise de momento, monte cinco jogos equilibrados de 15 dezenas respeitando os seguintes critérios de ouro:
- Entre 8 e 10 dezenas na Moldura
- Entre 7 e 8 dezenas Ímpares
- Entre 8 e 10 dezenas Repetidas do último concurso oficial
- Soma total entre 180 e 220
- Máximo de 4 dezenas consecutivas

Explique cada decisão tomada.

--- DADOS HISTÓRICOS ---
{dados_concursos_tabela}
"""
    },
    {
        "id": 4,
        "titulo": "Análise Estatística com Estrutura de Gráficos e Distribuição",
        "descricao": "Pede à IA que trace o comportamento visual (frequência, somas, linhas/colunas).",
        "template": """Atue como um cientista de dados. Analise a base de {qtd_concursos} concursos da Lotofácil em anexo.

Descreva detalhadamente o comportamento e proponha representações gráficas (em formato textual/tabela) para:
1. Histograma de Frequência das 25 dezenas
2. Curva de tendência da Soma dos concursos ao longo do tempo
3. Dispersão de Pares vs Ímpares
4. Mapa de calor de Linhas e Colunas

Ao final, gere 5 cartões estatisticamente otimizados e justifique suas métricas de cobertura.

--- DADOS HISTÓRICOS ---
{dados_concursos_tabela}
"""
    },
    {
        "id": 5,
        "titulo": "Explicação Matemática e Conceitual de Probabilidades",
        "descricao": "Solicita explicação formal sobre independência de eventos, Lei dos Grandes Números e filtros.",
        "template": """Você é um professor de probabilidade e estatística matemática.

Com base nos princípios da teoria das probabilidades e na Lei dos Grandes Números:
1. Explique por que cada concurso da Lotofácil é um evento estocástico independente (C(25,15) = 3.268.760 combinações).
2. Explique por que a análise estatística do passado identifica padrões de agrupamento (como a distribuição hipergeométrica de moldura/centro e paridade), mas não garante previsão do futuro.
3. Demonstre matematicamente por que jogar combinações muito assimétricas (ex: 15 ímpares ou 15 números seguidos) possui probabilidade combinatória extremamente baixa em comparação a combinações balanceadas.
"""
    },
    {
        "id": 6,
        "titulo": "Abordagem de Estatístico Profissional",
        "descricao": "Persona técnica que prioriza métricas robustas, desvio padrão e testes de hipóteses.",
        "template": """Se você fosse um estatístico profissional encarregado de conduzir uma auditoria analítica sobre estes {qtd_concursos} concursos da Lotofácil:
1. Qual metodologia de amostragem você aplicaria?
2. Quais testes de significância estatística ou métricas de dispersão utilizaria para classificar anomalias?
3. Como organizaria uma estratégia de fechamento reduzido (Set Cover) associada a filtros de corte?

--- AMOSTRA DOS DADOS ---
{dados_concursos_tabela}
"""
    },
    {
        "id": 7,
        "titulo": "Relatório Executivo Completo (Excel + IA) com Top 5 Jogos",
        "descricao": "O prompt mais completo da apostila para gerar um relatório analítico 360° e 5 jogos fortes.",
        "template": """Você é um especialista sênior em estatística aplicada e modelagem no Excel.

Analise minuciosamente os {qtd_concursos} concursos da Lotofácil fornecidos.
Elabore um Relatório Estatístico 360° contendo:
- Tabela de Frequência e Atraso de todas as 25 dezenas
- Média e desvio da Soma total
- Proporções de Pares/Ímpares, Primos e Fibonacci
- Distribuição espacial por Moldura (16 dezenas) e Centro (9 dezenas)
- Distribuição matricial por Linhas (1 a 5) e Colunas (1 a 5)
- Taxa de Repetição em relação ao concurso anterior
- Análise de Sequências Consecutivas e Dezenas Simétricas (Espelho)
- Principais Insights e conclusões estatísticas

No final, gere 5 JOGOS FORTES (estatisticamente balanceados) para estudo.
Para cada jogo, mostre sua ficha técnica (Score de Equilíbrio, Moldura, Pares, Soma, Repetidas e justificativa).

--- BASE DE CONCURSOS ---
{dados_concursos_tabela}
"""
    }
]

def formatar_concursos_tabela_markdown(sorteios: List[Sorteio]) -> str:
    """Gera uma tabela Markdown limpa com os concursos e estatísticas calculadas."""
    linhas = [
        "| Concurso | Data | Dezenas Sorteadas | Soma | Pares/Ímp | Moldura |",
        "|---|---|---|---|---|---|"
    ]
    for s in sorteios:
        dezenas_fmt = " ".join(f"{d:02d}" for d in sorted(s.dezenas_sorteadas))
        soma = sum(s.dezenas_sorteadas)
        pares = sum(1 for d in s.dezenas_sorteadas if d % 2 == 0)
        impares = len(s.dezenas_sorteadas) - pares
        moldura = sum(1 for d in s.dezenas_sorteadas if d in LOTOFACIL_MOLDURA)
        data_str = s.data_sorteio.strftime("%d/%m/%Y") if hasattr(s.data_sorteio, "strftime") else str(s.data_sorteio)
        linhas.append(f"| {s.numero_concurso} | {data_str} | {dezenas_fmt} | {soma} | {pares}P/{impares}I | {moldura}/15 |")
    return "\n".join(linhas)

def exportar_concursos_csv_string(sorteios: List[Sorteio]) -> str:
    """Exporta a lista de sorteios em formato CSV estruturado."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "concurso", "data", "dezenas", "soma", "pares", "impares", "moldura", "centro"
    ])
    for s in sorteios:
        dezenas_str = "-".join(f"{d:02d}" for d in sorted(s.dezenas_sorteadas))
        soma = sum(s.dezenas_sorteadas)
        pares = sum(1 for d in s.dezenas_sorteadas if d % 2 == 0)
        impares = len(s.dezenas_sorteadas) - pares
        moldura = sum(1 for d in s.dezenas_sorteadas if d in LOTOFACIL_MOLDURA)
        centro = len(s.dezenas_sorteadas) - moldura
        data_str = s.data_sorteio.strftime("%Y-%m-%d") if hasattr(s.data_sorteio, "strftime") else str(s.data_sorteio)
        writer.writerow([
            s.numero_concurso, data_str, dezenas_str, soma, pares, impares, moldura, centro
        ])
    return output.getvalue()

def construir_prompt_ia(
    template_id: int,
    sorteios: List[Sorteio],
    ia_destino: str = "deepseek",
    incluir_concurso_resultado: bool = True
) -> Dict[str, Any]:
    """Preenche o template de prompt selecionado com os dados reais dos sorteios."""
    template_info = next((t for t in PROMPT_TEMPLATES if t["id"] == template_id), PROMPT_TEMPLATES[0])
    
    # Se incluir resultado do último concurso para conferência
    bloco_conferencia = ""
    if incluir_concurso_resultado and sorteios:
        ultimo = sorteios[0]
        dez_str = " - ".join(str(d) for d in sorted(ultimo.dezenas_sorteadas))
        bloco_conferencia = f"\nPor fim, compare seus jogos com o Resultado do Concurso {ultimo.numero_concurso}: {dez_str}"

    tabela_dados = formatar_concursos_tabela_markdown(sorteios)
    
    prompt_preenchido = template_info["template"].format(
        qtd_concursos=len(sorteios),
        dados_concursos_tabela=tabela_dados,
        bloco_resultado_conferencia=bloco_conferencia
    )
    
    return {
        "template_id": template_info["id"],
        "titulo": template_info["titulo"],
        "ia_destino": ia_destino,
        "prompt_formatado": prompt_preenchido.strip(),
        "dados_concursos_usados": len(sorteios)
    }

def executar_teste_cego(
    sorteios: List[Sorteio],
    jogos_custom: Optional[List[List[int]]] = None,
    amostragem_treino: int = 30
) -> Dict[str, Any]:
    """
    Executa o Teste Cego:
    - Concurso 0 (mais recente) é reservado para auditoria.
    - Concursos 1 até N são usados como histórico de treino para gerar/avaliar os jogos.
    - Os jogos são conferidos contra as dezenas do Concurso 0.
    """
    if len(sorteios) < 2:
        raise ValueError("São necessários pelo menos 2 concursos cadastrados para realizar o teste cego.")
        
    concurso_alvo = sorteios[0]
    dezenas_alvo_set = set(concurso_alvo.dezenas_sorteadas)
    
    sorteios_treino = sorteios[1:amostragem_treino + 1]
    
    # Se o usuário não enviou jogos prontos, gera 5 jogos inteligentes com o treino
    if not jogos_custom:
        ultimo_sorteio_treino = sorteios_treino[0].dezenas_sorteadas if sorteios_treino else None
        
        # Calcular frequências no treino
        freq = {i: 0 for i in range(1, 26)}
        for s in sorteios_treino:
            for d in s.dezenas_sorteadas:
                if 1 <= d <= 25:
                    freq[d] += 1
        quentes = [num for num, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:7]]
        atrasadas = [num for num, _ in sorted(freq.items(), key=lambda x: x[1])[:5]]
        
        jogos_gerados_obj = gerar_top_jogos_inteligentes(
            total_dezenas_globo=25,
            dezenas_por_jogo=15,
            quantidade_jogos=5,
            ultimo_sorteio=ultimo_sorteio_treino,
            dezenas_quentes=quentes,
            dezenas_atrasadas=atrasadas
        )
        jogos_para_testar = [item["jogo"] for item in jogos_gerados_obj]
    else:
        jogos_para_testar = jogos_custom

    resultados_itens = []
    resumo_acertos: Dict[int, int] = {i: 0 for i in range(9, 16)}
    
    for jogo in jogos_para_testar:
        jogo_set = set(jogo)
        acertos_set = jogo_set & dezenas_alvo_set
        acertos_qtd = len(acertos_set)
        
        premiado = acertos_qtd >= 11
        faixa = None
        if acertos_qtd == 15:
            faixa = "15 Pontos (Faixa Principal)"
        elif acertos_qtd == 14:
            faixa = "14 Pontos"
        elif acertos_qtd == 13:
            faixa = "13 Pontos"
        elif acertos_qtd == 12:
            faixa = "12 Pontos"
        elif acertos_qtd == 11:
            faixa = "11 Pontos"
            
        if acertos_qtd in resumo_acertos:
            resumo_acertos[acertos_qtd] += 1
        else:
            resumo_acertos[acertos_qtd] = 1
            
        resultados_itens.append({
            "jogo": sorted(jogo),
            "acertos": acertos_qtd,
            "dezenas_acertadas": sorted(list(acertos_set)),
            "premiado": premiado,
            "faixa_premio": faixa
        })

    return {
        "concurso_auditado": concurso_alvo.numero_concurso,
        "data_sorteio": concurso_alvo.data_sorteio,
        "dezenas_sorteadas": sorted(concurso_alvo.dezenas_sorteadas),
        "total_jogos_testados": len(jogos_para_testar),
        "jogos_resultados": resultados_itens,
        "resumo_acertos": {k: v for k, v in resumo_acertos.items() if v > 0}
    }
