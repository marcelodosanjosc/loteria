## 1. Backend - Motor Estatístico Espacial e Temporal

- [x] 1.1 Criar schemas Pydantic para estatísticas espaciais, moldura/centro, linhas/colunas, sequências e recortes temporais em `backend/app/schemas/lottery.py`
- [x] 1.2 Implementar o serviço `backend/app/services/advanced_analytics.py` para calcular métricas espaciais (moldura vs centro, matriz de linhas e colunas), repetições do concurso anterior, maiores sequências e recortes de amostragem (`limit=30, 50, 100, 500`)
- [x] 1.3 Adicionar endpoint `GET /api/v1/analise/{slug}/estatisticas-avancadas` no router FastAPI `backend/app/api/analysis.py`

## 2. Backend - Gerador Inteligente e Ranqueador de Jogos

- [x] 2.1 Implementar o serviço `backend/app/services/smart_generator.py` com pipeline de geração ampla e scoring multicritério (Score 0-100%)
- [x] 2.2 Implementar o gerador de justificativas textuais para os Top Jogos gerados (explicando distribuição, quentes, frias e paridade)
- [x] 2.3 Adicionar endpoint `POST /api/v1/analise/{slug}/gerar-jogos-ia` para retornar os Top 5 Jogos Fortes equilibrados

## 3. Backend - Copilot de Prompts para IA e Teste Cego (Backtesting)

- [x] 3.1 Implementar o serviço `backend/app/services/ai_copilot.py` com os 7 templates de prompts da apostila e do blog com injeção automática de dados dos concursos
- [x] 3.2 Implementar motor de Teste Cego (omissão do concurso mais recente e conferência automática de acertos de 11 a 15 pontos)
- [x] 3.3 Adicionar endpoints `POST /api/v1/analise/{slug}/exportar-prompt-ia`, `GET /api/v1/analise/{slug}/exportar-csv` e `POST /api/v1/analise/{slug}/teste-cego`

## 4. Frontend - Interface de Estatísticas Avançadas e Volante Espacial

- [x] 4.1 Atualizar o cliente HTTP em `frontend/src/services/api.ts` com as novas tipagens e métodos da API
- [x] 4.2 Criar componente de visualização do volante com destaque de Moldura vs Centro e frequências de Linhas/Colunas em `frontend/src/components/SpatialVolante.tsx`
- [x] 4.3 Integrar o seletor de amostragem temporal (30, 50, 100, 500, Todos) e novos gráficos na página `frontend/src/app/estatisticas/page.tsx`

## 5. Frontend - Aba de Jogos Inteligentes com IA & Backtesting

- [x] 5.1 Criar nova página/módulo `frontend/src/app/analise-ia/page.tsx` para o Gerador de Top Jogos Fortes com exibição dos cards de justificativa e badges de score
- [x] 5.2 Implementar modal/copiador de prompts com seletor de IA (DeepSeek / ChatGPT / Gemini) e botão de download CSV para anexar
- [x] 5.3 Implementar painel interativo de Teste Cego para validação de jogos contra resultados históricos

## 6. Testes e Validação Ponta a Ponta

- [x] 6.1 Criar testes automatizados de backend em `backend/tests/test_advanced_analytics.py` e `backend/tests/test_smart_generator.py`
- [x] 6.2 Executar a suíte de testes e validar a integração nos contêineres Docker

