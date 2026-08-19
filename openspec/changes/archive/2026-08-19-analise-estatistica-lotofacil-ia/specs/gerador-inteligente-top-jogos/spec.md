## Purpose

Permite gerar combinações otimizadas de jogos com ranqueamento multicritério (Score Estatístico de 0 a 100%) e seleção dos Top Jogos Equilibrados, acompanhados de justificativa analítica.

## ADDED Requirements

### Requirement: Pipeline de geração e filtragem inteligente em 2 etapas
O sistema SHALL gerar um conjunto inicial expandido de jogos (ex: 50 a 100 combinações) baseado no momento estatístico das dezenas e aplicar um ranqueador multicritério para filtrar e retornar a quantidade de jogos fortes solicitada (padrão: 5 jogos).

#### Scenario: Geração de 5 Jogos Fortes para Lotofácil
- **WHEN** o usuário solicitar a geração de jogos inteligentes para a Lotofácil
- **THEN** o sistema SHALL sintetizar 100 cartões candidatos, aplicar a matriz de scoring estatístico e retornar os 5 cartões com maior pontuação de equilíbrio.

### Requirement: Cálculo do Score Estatístico de Equilíbrio
O sistema SHALL atribuir a cada combinação gerada uma pontuação de 0 a 100% calculada a partir de múltiplos critérios: proporção par/ímpar, moldura/centro, soma das dezenas, dezenas primas, Fibonacci e repetições do último sorteio.

#### Scenario: Avaliação de jogo equilibrado
- **WHEN** um cartão possuir parâmetros dentro das faixas estatísticas mais frequentes (ex: 9 ou 10 na moldura, 7 ou 8 ímpares, 8 a 10 repetidas do concurso anterior, soma entre 180 e 220)
- **THEN** o sistema SHALL atribuir um score estatístico elevado (> 85%) e detalhar os pontos fortes da combinação.

### Requirement: Explicação analítica e justificativa de escolhas
O sistema SHALL gerar uma explicação técnica transparente para cada jogo selecionado, listando os motivos da escolha (dezenas quentes incluídas, dezenas atrasadas estrategicamente balanceadas, conformidade espacial).

#### Scenario: Exibição dos cards explicativos no frontend
- **WHEN** os jogos gerados forem apresentados ao usuário
- **THEN** a interface SHALL exibir a lista de dezenas em ordem crescente, o score percentual de equilíbrio e os tópicos com a justificativa de escolha.
