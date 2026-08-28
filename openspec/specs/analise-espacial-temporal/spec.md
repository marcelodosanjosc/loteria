## Purpose

Fornece análises estatísticas espaciais no volante (moldura vs centro, linhas e colunas) e temporais configuráveis (30, 50, 100, 500 ou todos os concursos), incluindo repetição de sorteios anteriores e sequências.

## Requirements

### Requirement: Amostragem temporal parametrizável
O sistema SHALL permitir que o usuário selecione a janela de concursos a ser analisada (`limit=30, 50, 100, 500, todos`) para calcular métricas com base no momento recente ou na tendência global.

#### Scenario: Consulta com recorte de 30 concursos
- **WHEN** o usuário requisitar estatísticas para a modalidade com parâmetro `limit=30`
- **THEN** o sistema SHALL calcular frequências, atrasos e distribuições considerando estritamente os últimos 30 concursos cadastrados.

### Requirement: Análise de Moldura vs Centro (Miolo)
O sistema SHALL calcular a distribuição de dezenas sorteadas na moldura e no centro do volante da Lotofácil (16 dezenas na moldura: 01 a 05, 06, 10, 11, 15, 16, 20, 21 a 25; e 9 dezenas no centro: 07, 08, 09, 12, 13, 14, 17, 18, 19).

#### Scenario: Cálculo do histórico de moldura e centro
- **WHEN** a análise estatística da Lotofácil for gerada
- **THEN** o sistema SHALL retornar a contagem média e a distribuição percentual de acertos na moldura e no centro por concurso.

### Requirement: Análise de Distribuição por Linhas e Colunas
O sistema SHALL calcular a quantidade de dezenas sorteadas em cada linha (1 a 5) e em cada coluna (1 a 5) da matriz do volante.

#### Scenario: Mapa de calor espacial
- **WHEN** o relatório estatístico for consultado
- **THEN** o sistema SHALL fornecer a frequência de preenchimento de cada linha e coluna para a janela selecionada.

### Requirement: Indicador de Repetição do Concurso Anterior
O sistema SHALL calcular a quantidade de dezenas repetidas entre cada concurso e seu concurso imediatamente anterior.

#### Scenario: Estatística de dezenas repetidas
- **WHEN** as estatísticas da Lotofácil forem solicitadas
- **THEN** o sistema SHALL retornar a média histórica de dezenas repetidas e a distribuição de ocorrências (ex: 8, 9, 10 repetidas).

### Requirement: Métricas de Sequências Consecutivas e Altas/Baixas
O sistema SHALL identificar a maior sequência contígua de dezenas em cada sorteio e o equilíbrio entre dezenas baixas (1 a 12) e altas (13 a 25).

#### Scenario: Identificação de sequências
- **WHEN** os concursos forem processados
- **THEN** o sistema SHALL calcular o comprimento médio e máximo das sequências consecutivas encontradas nos sorteios da amostragem.
