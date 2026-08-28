## Purpose

Gera prompts estruturados para modelos de inteligência artificial (ChatGPT, DeepSeek, Gemini) alimentados com dados reais do banco e oferece um simulador de teste cego (backtesting) para avaliar a performance das combinações.

## Requirements

### Requirement: Construtor de prompts estruturados para IA
O sistema SHALL formatar e exportar prompts especializados seguindo as regras de Engenharia de Prompt (definição de persona de estatístico, janela temporal de amostragem, dados históricos em formato tabular ou JSON/CSV estruturado, regras de equilíbrio e solicitação de explicações).

#### Scenario: Cópia de prompt para análise de 30 concursos
- **WHEN** o usuário escolher o template de prompt "Análise de 30 Concursos" com destino ao DeepSeek ou ChatGPT
- **THEN** o sistema SHALL preencher o prompt com os números oficiais dos 30 últimos concursos e disponibilizar um botão de cópia em 1 clique.

### Requirement: Simulador de Teste Cego (Backtesting)
O sistema SHALL disponibilizar a funcionalidade de Teste Cego, na qual o concurso mais recente é omitido da amostragem de dados para que o usuário ou a IA gere jogos e depois confira os acertos obtidos contra o concurso omitido.

#### Scenario: Execução de teste cego
- **WHEN** o usuário ativar o modo de Teste Cego
- **THEN** o sistema SHALL ocultar o último concurso da base histórica, permitir a geração dos jogos e em seguida realizar a conferência automática destacando as premiações obtidas (11 a 15 pontos na Lotofácil).

### Requirement: Exportação de base histórica em CSV e JSON
O sistema SHALL permitir que o usuário baixe os dados históricos da amostragem selecionada em formato CSV limpo para anexar diretamente em chats de IA ou planilhas Excel.

#### Scenario: Download de CSV de concursos
- **WHEN** o usuário clicar em "Exportar CSV para IA"
- **THEN** o sistema SHALL disparar o download de arquivo `.csv` contendo colunas com Concurso, Data e Dezenas Sorteadas.
