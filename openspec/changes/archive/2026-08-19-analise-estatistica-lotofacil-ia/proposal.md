## Why

A plataforma LottoMath atualmente conta com análises básicas de paridade, frequências simples e somas. Com base na apostila *"ChatGPT para Análise Estatística da Lotofácil"* e nos estudos práticos do blog *"30 Concursos Lotofácil no DeepSeek"*, identificou-se a oportunidade de enriquecer significativamente o motor estatístico com métricas espaciais (Moldura vs Centro, Linhas e Colunas), recortes temporais dinâmicos (30, 50, 100, 500 concursos), repetição do concurso anterior, gerador de "Top 5 Jogos Equilibrados" por score estatístico e um ecossistema de exportação de dados / geração de prompts estruturados para IA (DeepSeek, ChatGPT, Gemini) com suporte a testes cegos (backtesting).

## What Changes

- **Motor Estatístico Espacial e Temporal Avançado**:
  - Filtro e amostragem temporal configurável nos endpoints de estatísticas (`limit=30, 50, 100, 500, todos`).
  - Cálculo de proporção e distribuição de **Moldura vs Centro/Miolo** (16 dezenas na moldura e 9 no miolo para Lotofácil, expansível para outras loterias).
  - Análise espacial de **Distribuição por Linhas e Colunas** no volante.
  - Indicador de **Repetição do Concurso Anterior** (frequência de repetições entre concursos consecutivos).
  - Métricas de **Dezenas Consecutivas** (maior sequência e quantidade de blocos contíguos), **Altas vs Baixas** e **Dezenas Espelho/Simetria**.
- **Gerador Otimizado de Jogos Balanceados (Top 5 Jogos Fortes)**:
  - Mecanismo em 2 etapas: geração de pool estendido de combinações e refinamento baseado em Score Estatístico Multicritério (0 a 100%).
  - Retorno com explicação/racional estatístico de cada jogo gerado (por que cada dezena/jogo foi escolhido).
- **Módulo de Assistente de Prompts de IA & Teste Cego (Backtesting)**:
  - Gerador de Prompts estruturados (Persona, Contexto de Dados, Recorte de Amostragem e Explicações) pré-formatados com os dados reais do banco para envio direto a LLMs (ChatGPT, DeepSeek, Gemini).
  - Modo "Teste Cego" (Backtesting): omite o último concurso sorteado para testar se os jogos gerados teriam pontuado no concurso de auditoria.
- **Interface e Visualização no Frontend**:
  - Nova aba/sessão com visualização interativa do volante (Moldura vs Miolo, Mapa de Calor de Linhas e Colunas).
  - Seletor de janela de concursos (30, 50, 100, 500, Geral).
  - Painel do Gerador Inteligente de Jogos Fortes com cards explicativos de cada bilhete.
  - Copiador de Prompts e simulador de Teste Cego interativo.

## Capabilities

### New Capabilities
- `analise-espacial-temporal`: Análise estatística com recortes temporais (30 a 500 concursos), distribuição espacial (moldura/centro, linhas/colunas), repetições do concurso anterior, sequências e dezenas espelho.
- `gerador-inteligente-top-jogos`: Geração e ranqueamento de jogos por Score Estatístico de Equilíbrio (0 a 100%), extraindo os Top Jogos Fortes com justificativa de seleção.
- `ia-prompt-copilot`: Construtor de prompts estruturados para IA com dados reais injetados e ferramenta de auditoria/teste cego (backtesting).

### Modified Capabilities
<!-- No requirement changes to existing specs -->

## Impact

- **Backend**:
  - Novo módulo de serviço `backend/app/services/advanced_analytics.py` e `backend/app/services/smart_generator.py`.
  - Novos endpoints no router de análise (`/analise/{slug}/estatisticas-avancadas`, `/analise/{slug}/gerar-jogos-ia`, `/analise/{slug}/exportar-prompt-ia`, `/analise/{slug}/teste-cego`).
  - Atualização dos schemas Pydantic em `backend/app/schemas/lottery.py`.
- **Frontend**:
  - Atualização da página de Estatísticas (`/estatisticas`) com gráficos de moldura, linhas, colunas e seletor de amostragem.
  - Nova seção / página de IA & Prompts para geração de jogos inteligentes e exportação de prompts para DeepSeek/ChatGPT.
  - Atualização do cliente HTTP `frontend/src/services/api.ts`.
