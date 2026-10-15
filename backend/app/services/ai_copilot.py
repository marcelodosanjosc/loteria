import io
import csv
from typing import TYPE_CHECKING, List, Dict, Any, Optional
if TYPE_CHECKING:
    from app.models.lottery import Sorteio
else:
    Sorteio = Any
from app.services.smart_generator import gerar_top_jogos_inteligentes

MODALIDADE_SPECS = {
    "lotofacil": {
        "nome": "Lotofácil",
        "total_dezenas": 25,
        "dezenas_padrao": 15,
        "faixa_soma": "180 a 220",
        "faixa_paridade": "7 a 8 ímpares / 7 a 8 pares",
        "faixa_repetidas": "8 a 10 dezenas do concurso anterior",
        "geometria": "Volante 5x5 (16 dezenas na moldura e 9 no centro)",
        "premio_maximo": "15 Pontos",
        "faixas_premiacao": [11, 12, 13, 14, 15]
    },
    "mega-sena": {
        "nome": "Mega-Sena",
        "total_dezenas": 60,
        "dezenas_padrao": 6,
        "faixa_soma": "130 a 220",
        "faixa_paridade": "3P/3I, 4P/2I ou 2P/4I",
        "faixa_repetidas": "0 ou 1 dezena do concurso anterior",
        "geometria": "Volante 6x10 (4 quadrantes de 15 dezenas)",
        "premio_maximo": "Sena (6 acertos)",
        "faixas_premiacao": [4, 5, 6]
    },
    "quina": {
        "nome": "Quina",
        "total_dezenas": 80,
        "dezenas_padrao": 5,
        "faixa_soma": "150 a 250",
        "faixa_paridade": "2P/3I ou 3P/2I",
        "faixa_repetidas": "0 ou 1 dezena do concurso anterior",
        "geometria": "Volante 8x10 (alta dispersão em linhas e colunas)",
        "premio_maximo": "Quina (5 acertos)",
        "faixas_premiacao": [2, 3, 4, 5]
    },
    "lotomania": {
        "nome": "Lotomania",
        "total_dezenas": 100,
        "dezenas_padrao": 50,
        "faixa_soma": "2.350 a 2.700",
        "faixa_paridade": "23 a 27 pares / 23 a 27 ímpares",
        "faixa_repetidas": "8 a 12 dezenas das 20 sorteadas",
        "geometria": "Volante 10x10 (4 quadrantes de 25 dezenas + Bilhete Espelho)",
        "premio_maximo": "20 Acertos e 0 Acertos",
        "faixas_premiacao": [0, 15, 16, 17, 18, 19, 20]
    },
    "dupla-sena": {
        "nome": "Dupla-Sena",
        "total_dezenas": 50,
        "dezenas_padrao": 6,
        "faixa_soma": "120 a 190",
        "faixa_paridade": "3P/3I, 4P/2I ou 2P/4I",
        "faixa_repetidas": "0 ou 1 dezena do concurso anterior",
        "geometria": "Volante 5x10 (duplo sorteio por concurso)",
        "premio_maximo": "Sena (6 acertos no 1º ou 2º sorteio)",
        "faixas_premiacao": [3, 4, 5, 6]
    }
}

PRIZE_TIERS_CONFIG = {
    "lotofacil": {
        "faixas": [11, 12, 13, 14, 15],
        "labels": {11: "11 Pontos", 12: "12 Pontos", 13: "13 Pontos", 14: "14 Pontos", 15: "15 Pontos (Prêmio Máximo)"},
        "min_destaque": 11
    },
    "mega-sena": {
        "faixas": [4, 5, 6],
        "labels": {4: "Quadra (4 acertos)", 5: "Quina (5 acertos)", 6: "Sena (6 acertos - Prêmio Máximo)"},
        "min_destaque": 4
    },
    "quina": {
        "faixas": [2, 3, 4, 5],
        "labels": {2: "Duque (2 acertos)", 3: "Terno (3 acertos)", 4: "Quadra (4 acertos)", 5: "Quina (5 acertos - Prêmio Máximo)"},
        "min_destaque": 2
    },
    "lotomania": {
        "faixas": [0, 15, 16, 17, 18, 19, 20],
        "labels": {
            0: "0 Acertos (Prêmio Especial)",
            15: "15 Acertos", 16: "16 Acertos", 17: "17 Acertos",
            18: "18 Acertos", 19: "19 Acertos", 20: "20 Acertos (Prêmio Máximo)"
        },
        "min_destaque": 15
    },
    "dupla-sena": {
        "faixas": [3, 4, 5, 6],
        "labels": {3: "Terno (3 acertos)", 4: "Quadra (4 acertos)", 5: "Quina (5 acertos)", 6: "Sena (6 acertos - Prêmio Máximo)"},
        "min_destaque": 3
    }
}


def obter_catalogo_prompts_modalidade(modalidade_slug: str = "lotofacil") -> List[Dict[str, Any]]:
    """Gera o catálogo de templates de prompts dinamicamente customizado para a modalidade."""
    slug = (modalidade_slug or "lotofacil").lower()
    spec = MODALIDADE_SPECS.get(slug, MODALIDADE_SPECS["lotofacil"])
    nome = spec["nome"]
    universo = spec["total_dezenas"]
    k = spec["dezenas_padrao"]
    geom = spec["geometria"]
    soma = spec["faixa_soma"]
    paridade = spec["faixa_paridade"]
    repetidas = spec["faixa_repetidas"]

    return [
        {
            "id": 1,
            "titulo": f"Indicadores Estatísticos Globais ({nome})",
            "descricao": f"Solicita à IA uma tabela analítica completa com frequências, atrasos, quentes/frias, paridades e somas para a {nome}.",
            "template": f"""Atue como um especialista em estatística avançada e análise de dados de loterias brasileiras.

Analise a base dos últimos {{qtd_concursos}} concursos da {nome} (universo de 1 a {universo}) enviada abaixo.
Identifique com precisão matemática:
1. Frequência individual de cada dezena na amostragem
2. Dezenas mais atrasadas (sem sair há mais concursos)
3. Dezenas quentes (maior presença recente) e dezenas frias
4. Distribuição espacial no volante: {geom}
5. Balanço de pares e ímpares (faixa de referência: {paridade})
6. Comportamento da soma das dezenas (faixa média: {soma})
7. Taxa de repetição entre concursos consecutivos (referência: {repetidas})

Regras rígidas:
- Baseie-se estritamente nos dados históricos oficiais fornecidos.
- Apresente os resultados organizados em tabelas markdown claras.

--- DADOS HISTÓRICOS ({{qtd_concursos}} CONCURSOS RECENTES DE {nome.upper()}) ---
{{dados_concursos_tabela}}
"""
        },
        {
            "id": 2,
            "titulo": f"Padrões Recorrentes & 5 Jogos Equilibrados ({nome})",
            "descricao": f"Busca repetições, sequências e grupos frequentes, gerando 5 combinações justificadas de {k} dezenas.",
            "template": f"""Atue como um estatístico profissional especializado em combinatória de loterias.

Estude a base dos últimos {{qtd_concursos}} concursos da {nome} (jogos de {k} dezenas em {universo}).
Encontre padrões recorrentes na amostra:
- Repetições do concurso anterior (esperado: {repetidas})
- Sequências contíguas mais frequentes
- Grupos de dezenas com alta correlação conjunta
- Distribuição espacial no volante ({geom})
- Padrões estatisticamente anômalos a serem evitados

Com base nesses padrões observados, elabore 5 jogos equilibrados de {k} dezenas para a {nome}.
Para cada jogo gerado, forneça uma breve explicação estatística das escolhas (paridade, soma, repetidas, dispersão).

--- DADOS HISTÓRICOS ({{qtd_concursos}} CONCURSOS RECENTES) ---
{{dados_concursos_tabela}}
{{bloco_resultado_conferencia}}
"""
        },
        {
            "id": 3,
            "titulo": f"Análise de Curto Prazo (Momento do Ciclo) ({nome})",
            "descricao": f"Foca no momento recente (30 a 50 concursos) para capturar ciclos e dezenas em evidência na {nome}.",
            "template": f"""Você é um analista de dados especialista em amostragem temporal de loterias.

Faça uma análise rigorosa do ciclo recente nos últimos {{qtd_concursos}} concursos da {nome}:
1. Identifique as dezenas em evidência no ciclo atual (quentes) e as que entraram em atraso acentuado.
2. Calcule a média de repetição em relação ao sorteio anterior.
3. Avalie o equilíbrio de dezenas baixas e altas.

Considerando essa análise de momento, monte cinco jogos equilibrados de {k} dezenas respeitando os critérios de ouro da {nome}:
- Paridade equilibrada: {paridade}
- Soma total na faixa de ouro: {soma}
- Repetição controlada do último concurso: {repetidas}
- Dispersão espacial: {geom}
- Evitar blocos de mais de 2 dezenas consecutivas

Explique cada decisão tomada.

--- DADOS HISTÓRICOS ---
{{dados_concursos_tabela}}
"""
        },
        {
            "id": 4,
            "titulo": f"Análise de Distribuição e Histogramas ({nome})",
            "descricao": f"Pede à IA que trace o comportamento visual, histogramas e tendências da {nome}.",
            "template": f"""Atue como um cientista de dados. Analise a base de {{qtd_concursos}} concursos da {nome} em anexo.

Descreva detalhadamente o comportamento e proponha representações estruturadas (em formato textual/tabela) para:
1. Histograma de Frequência das dezenas no universo de 1 a {universo}
2. Curva de tendência da Soma dos concursos ao longo do tempo (referência: {soma})
3. Dispersão de Pares vs Ímpares
4. Mapa de dispersão no volante: {geom}

Ao final, gere 5 cartões estatisticamente otimizados de {k} dezenas e justifique suas métricas de cobertura.

--- DADOS HISTÓRICOS ---
{{dados_concursos_tabela}}
"""
        },
        {
            "id": 5,
            "titulo": f"Estratégia Matemática de Cobertura Reduzida ({nome})",
            "descricao": f"Persona de pesquisador em otimização combinatória (Set Cover) para a {nome}.",
            "template": f"""Você é um pesquisador em combinatória e otimização de matrizes.

Considerando os {{qtd_concursos}} concursos da {nome} apresentados abaixo:
1. Selecione um grupo elite de dezenas com alto índice de atratividade estatística.
2. Aplique a lógica de matriz reduzida para gerar 5 cartões de {k} dezenas com máxima dispersão.
3. Demonstre matematicamente por que a combinação gerada evita desperdício de redundância combinatória.

--- AMOSTRA DOS DADOS ---
{{dados_concursos_tabela}}
"""
        }
    ]


def formatar_concursos_tabela_markdown(sorteios: List[Sorteio], modalidade_slug: str = "lotofacil") -> str:
    """Gera uma tabela Markdown limpa com os concursos e estatísticas calculadas."""
    slug = (modalidade_slug or "lotofacil").lower()
    linhas = [
        "| Concurso | Data | Dezenas Sorteadas | Soma | Pares/Ímp |",
        "|---|---|---|---|---|"
    ]
    for s in sorteios:
        dezenas_fmt = " ".join(f"{d:02d}" for d in sorted(s.dezenas_sorteadas))
        soma = sum(s.dezenas_sorteadas)
        pares = sum(1 for d in s.dezenas_sorteadas if d % 2 == 0)
        impares = len(s.dezenas_sorteadas) - pares
        data_str = s.data_sorteio.strftime("%d/%m/%Y") if hasattr(s.data_sorteio, "strftime") else str(s.data_sorteio)
        linhas.append(f"| {s.numero_concurso} | {data_str} | {dezenas_fmt} | {soma} | {pares}P/{impares}I |")
    return "\n".join(linhas)


def exportar_concursos_csv_string(sorteios: List[Sorteio], modalidade_slug: str = "lotofacil") -> str:
    """Exporta a lista de sorteios em formato CSV estruturado."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["concurso", "data", "dezenas", "soma", "pares", "impares"])
    for s in sorteios:
        dezenas_str = "-".join(f"{d:02d}" for d in sorted(s.dezenas_sorteadas))
        soma = sum(s.dezenas_sorteadas)
        pares = sum(1 for d in s.dezenas_sorteadas if d % 2 == 0)
        impares = len(s.dezenas_sorteadas) - pares
        data_str = s.data_sorteio.strftime("%Y-%m-%d") if hasattr(s.data_sorteio, "strftime") else str(s.data_sorteio)
        writer.writerow([s.numero_concurso, data_str, dezenas_str, soma, pares, impares])
    return output.getvalue()


def construir_prompt_ia(
    template_id: int,
    sorteios: List[Sorteio],
    modalidade_slug: str = "lotofacil",
    ia_destino: str = "deepseek",
    incluir_concurso_resultado: bool = True
) -> Dict[str, Any]:
    """Preenche o template de prompt selecionado com os dados reais dos sorteios da modalidade."""
    catalogo = obter_catalogo_prompts_modalidade(modalidade_slug)
    template_info = next((t for t in catalogo if t["id"] == template_id), catalogo[0])

    bloco_conferencia = ""
    if incluir_concurso_resultado and sorteios:
        ultimo = sorteios[0]
        dez_str = " - ".join(f"{d:02d}" for d in sorted(ultimo.dezenas_sorteadas))
        bloco_conferencia = f"\nPor fim, compare seus jogos gerados com o Resultado Real do Concurso {ultimo.numero_concurso}: {dez_str}"

    tabela_dados = formatar_concursos_tabela_markdown(sorteios, modalidade_slug)

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
    modalidade_slug: str = "lotofacil",
    total_dezenas_globo: int = 25,
    dezenas_por_jogo: int = 15,
    jogos_custom: Optional[List[List[int]]] = None,
    amostragem_treino: int = 30
) -> Dict[str, Any]:
    """
    Executa o Teste Cego para qualquer modalidade:
    - Concurso 0 (mais recente) é reservado para auditoria.
    - Concursos 1 até N são usados como histórico de treino para gerar/avaliar os jogos.
    - Os jogos são conferidos contra as faixas oficiais de premiação da modalidade.
    """
    if len(sorteios) < 2:
        raise ValueError("São necessários pelo menos 2 concursos cadastrados para realizar o teste cego.")

    slug = (modalidade_slug or "lotofacil").lower()
    concurso_alvo = sorteios[0]
    dezenas_alvo_set = set(concurso_alvo.dezenas_sorteadas)

    sorteios_treino = sorteios[1:amostragem_treino + 1]

    if not jogos_custom:
        ultimo_sorteio_treino = sorteios_treino[0].dezenas_sorteadas if sorteios_treino else None

        freq = {i: 0 for i in range(1, total_dezenas_globo + 1)}
        for s in sorteios_treino:
            for d in s.dezenas_sorteadas:
                if d in freq:
                    freq[d] += 1
        quentes = [num for num, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:8]]
        atrasadas = [num for num, _ in sorted(freq.items(), key=lambda x: x[1])[:6]]

        jogos_gerados_obj = gerar_top_jogos_inteligentes(
            modalidade_slug=slug,
            total_dezenas_globo=total_dezenas_globo,
            dezenas_por_jogo=dezenas_por_jogo,
            quantidade_jogos=5,
            ultimo_sorteio=ultimo_sorteio_treino,
            dezenas_quentes=quentes,
            dezenas_atrasadas=atrasadas
        )
        jogos_para_testar = [item["jogo"] for item in jogos_gerados_obj]
    else:
        jogos_para_testar = jogos_custom

    tier_config = PRIZE_TIERS_CONFIG.get(slug, PRIZE_TIERS_CONFIG["lotofacil"])
    faixas_premiadas = set(tier_config["faixas"])
    labels_map = tier_config["labels"]
    min_destaque = tier_config["min_destaque"]

    resultados_itens = []
    resumo_acertos: Dict[int, int] = {}

    for jogo in jogos_para_testar:
        jogo_set = set(jogo)
        acertos_set = jogo_set & dezenas_alvo_set
        acertos_qtd = len(acertos_set)

        premiado = acertos_qtd in faixas_premiadas
        faixa = labels_map.get(acertos_qtd)

        resumo_acertos[acertos_qtd] = resumo_acertos.get(acertos_qtd, 0) + 1

        item_res = {
            "jogo": sorted(jogo),
            "acertos": acertos_qtd,
            "dezenas_acertadas": sorted(list(acertos_set)),
            "premiado": premiado,
            "faixa_premio": faixa
        }

        # Na Lotomania, inclui métrica do espelho
        if slug == "lotomania":
            acertos_espelho = len(dezenas_alvo_set) - acertos_qtd
            item_res["espelho_acertos"] = acertos_espelho
            item_res["espelho_premiado"] = acertos_espelho in faixas_premiadas
            item_res["espelho_faixa"] = labels_map.get(acertos_espelho)

        resultados_itens.append(item_res)

    return {
        "modalidade_slug": slug,
        "concurso_auditado": concurso_alvo.numero_concurso,
        "data_sorteio": concurso_alvo.data_sorteio,
        "dezenas_sorteadas": sorted(concurso_alvo.dezenas_sorteadas),
        "total_jogos_testados": len(jogos_para_testar),
        "jogos_resultados": resultados_itens,
        "resumo_acertos": {k: v for k, v in resumo_acertos.items() if v > 0}
    }
