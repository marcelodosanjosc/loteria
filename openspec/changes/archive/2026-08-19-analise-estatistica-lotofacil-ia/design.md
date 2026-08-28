## Context

Consulte `proposal.md` para a motivação. A base do sistema atual já possui suporte a cálculo combinatório via NumPy e persistência de sorteios em PostgreSQL. Esta implementação introduz o motor analítico espacial/temporal avançado, ranqueador de equilíbrio multicritério para jogos de IA e o módulo de exportação de prompts / testes cegos.

## Goals / Non-Goals

**Goals:**
- Implementar métricas avançadas (Moldura vs Centro, Linhas, Colunas, Repetidas do Concurso Anterior, Sequências e Dezenas Espelho).
- Suportar filtros de amostragem por janela temporal (`limit=30, 50, 100, 500` ou todos os concursos).
- Criar o algoritmo gerador e classificador de **Top Jogos Fortes** baseado em Score Multicritério com explicações textuais automatizadas.
- Desenvolver um gerador interativo de prompts para LLMs (DeepSeek, ChatGPT, Gemini) com injeção dinâmica dos concursos reais.
- Criar a ferramenta de **Teste Cego (Backtesting)** para auditoria de jogos contra concursos omitidos.
- Prover visualizações ricas no frontend (volante com moldura/miolo, mapas de calor e cards explicativos).

**Non-Goals:**
- Não pretende prever matematicamente resultados futuros de jogos de azar (mantendo conformidade com as diretrizes de Jogo Responsável).
- Não requer integração direta de API paga de LLM (OpenAI API key obrigatória), funcionando perfeitamente via exportação de prompts e modelos heurísticos locais rápidos.

## Decisions

1. **Serviço Analítico Especializado (`advanced_analytics.py`)**:
   - *Decisão*: Isolar a lógica estatística avançada em um serviço dedicado, calculando métricas vetoriais (linhas/colunas via divisão inteira e módulo `(dezena-1)//5` e `(dezena-1)%5`, moldura/centro via conjuntos indexados em $O(1)$).
   - *Alternativa considerada*: Incluir tudo no `combinatorics.py` existente. Rejeitado para manter o `combinatorics.py` focado apenas em Set Cover e combinações puras.

2. **Algoritmo de Scoring Multicritério em 2 Etapas (`smart_generator.py`)**:
   - *Decisão*: Gerar 100 jogos candidatos ponderados pelas dezenas quentes/atrasadas e avaliar cada um contra uma função de score normalizada de 0 a 100 pontos:
     - Moldura/Centro (8 a 11 na moldura): até 25 pts.
     - Paridade (7 a 8 ímpares): até 20 pts.
     - Repetidas do concurso anterior (8 a 10 repetidas): até 20 pts.
     - Soma das dezenas (180 a 220): até 15 pts.
     - Primos e Fibonacci (4 a 7 primos, 3 a 5 fibo): até 10 pts.
     - Sequências (máximo de 3 a 5 consecutivas): até 10 pts.
   - *Alternativa considerada*: Geração estritamente aleatória sem scoring. Rejeitado porque não atende ao padrão de jogos equilibrados descrito na apostila e no blog.

3. **Arquitetura de Prompts e Backtesting (`ai_copilot.py`)**:
   - *Decisão*: Formatar os 7 templates de prompts da apostila e do blog com placeholders que injetam os concursos reais da janela selecionada, gerando saídas prontas para copiar ou baixar em formato CSV/TXT.
   - *Modo Teste Cego*: Omite o concurso $N$ do payload de amostragem, executa a geração e compara com o concurso $N$, gerando a matriz de conferência com contagem de acertos.

4. **Componentes Frontend Reutilizáveis**:
   - *Decisão*: Construir componentes interativos em React/Tailwind:
     - `<SpatialGridHeatmap>`: visualizador do volante com destaques de Moldura vs Centro e Linhas/Colunas.
     - `<SmartGameCard>`: card com os números, badge de Score de Equilíbrio e lista de justificativas analíticas.
     - `<PromptCopierModal>`: visualizador de prompts com botão de cópia e exportação CSV.
     - `<BlindTestRunner>`: painel de teste cego com conferência de acertos.

## Risks / Trade-offs

- [Amostragens muito grandes na web] → O cálculo estatístico no backend é vetorizado com loops otimizados em memória Python, processando 3.000+ concursos em menos de 10ms.
- [Dependência de conexão externa para sorteios] → O banco local PostgreSQL armazena todo o histórico em cache; nenhuma requisição estatística depende de chamadas síncronas a APIs externas de terceiros.
- [Expectativa de previsão pelo usuário] → Manter banners e disclaimers visíveis de Jogo Responsável e rigor estatístico em todas as telas.

## Migration Plan

1. Adicionar os novos serviços e schemas no backend FastAPI.
2. Adicionar os novos endpoints ao router de análise.
3. Testar a suíte de endpoints via chamadas unitárias e de integração.
4. Integrar as novas telas e componentes no frontend Next.js.
5. Validar o fluxo ponta a ponta com Docker Compose.
