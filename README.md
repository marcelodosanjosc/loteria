# LottoMath - Portal de Estudos Matemáticos de Loterias

LottoMath é uma plataforma completa e otimizada voltada para o estudo de probabilidades, fechamentos de matrizes e filtros estatísticos condicionados sobre dezenas de loterias brasileiras.

## 🚀 Como Executar o Projeto Completo

O projeto é 100% orquestrado em contêineres Docker, rodando o banco de dados PostgreSQL, o servidor de API FastAPI e o cliente de visualização Next.js de forma integrada.

### Pré-requisitos
- Docker e Docker Compose instalados no sistema.

### Inicialização Rápida
A partir do diretório raiz do projeto, execute o comando abaixo para construir as imagens e iniciar todos os serviços:

```bash
docker compose up --build
```

Os serviços ficarão disponíveis em:
- **Frontend (Next.js)**: `http://localhost:3000` (ou `http://localhost:3001`).
- **Backend (FastAPI)**: `http://localhost:8001` (documentação Swagger em `http://localhost:8001/docs`).
- **Banco de Dados (PostgreSQL)**: Disponível na porta `5434` do host.

---

## 📌 Resumo de Compressão de Contexto (Para Futuros Agentes / Novos Chats)

> [!IMPORTANT]
> **ATENÇÃO AGENTE**: Leia este bloco para entender o estado e decisões técnicas do projeto sem precisar escanear todo o código.

### 1. Escopo e Modalidades Suportadas
O sistema suporta **5 modalidades** numéricas Caixa:
- **Mega-Sena**: 60 dezenas no volante. Aposta padrão de 6 a 20 números.
- **Lotofácil**: 25 dezenas no volante. Aposta padrão de 15 a 20 números.
- **Quina**: 80 dezenas no volante. Aposta padrão de 5 a 15 números.
- **Lotomania**: 100 dezenas no volante. Aposta fixa de 50 números.
  - *Detalhe Visual*: O número `100` é armazenado como `100` no banco e APIs, mas no frontend é exibido visualmente como `'00'` seguindo a estética clássica do cartão físico.
  - *Limitação e Algoritmo de Fechamento*: Para seleções pequenas ($50 \le N \le 55$ dezenas), o fechamento da Lotomania utiliza o algoritmo exato clássico de Set Cover. Para seleções maiores (de **56 a 70 dezenas**), o sistema adota um algoritmo heurístico avançado de Monte Carlo + Set Cover com filtro de quadrantes dinâmico (`max_quadrantes`), permitindo gerar fechamentos otimizados em segundos.
- **Dupla-Sena**: 50 dezenas no volante. Aposta padrão de 6 a 15 números.

### 2. Arquitetura do Backend (FastAPI + NumPy + PostgreSQL)
- **Banco de Dados**: PostgreSQL rodando via Docker. A inicialização e criação de tabelas ocorrem via SQLAlchemy no `main.py`.
- **Seeding & APScheduler (main.py)**:
  - Ao iniciar, o backend roda um script que garante o cadastro das modalidades no banco.
  - Um cron diário (`APScheduler`) está configurado para executar automaticamente todos os dias às **21:05 (Horário de Brasília/SP)** para puxar novos sorteios da Caixa.
  - Rota de sincronização manual: `POST /api/v1/analise/sincronizar-todos` ou `POST /api/v1/analise/{slug}/sincronizar?limit=100`. Os sorteios históricos (100 últimos concursos) já foram semeados para todas as modalidades.
- **Motor de Otimização Combinatória (combinatorics.py)**:
  - Os fechamentos matemáticos utilizam **NumPy** para paralelizar e vetorizar o cálculo do Set Cover, eliminando loops aninhados do Python. Aceleração de mais de 100x na geração de matrizes de fechamento. Para a Lotomania (N > 55), combina-se um pool inicial gerado via simulação de Monte Carlo com heurística de Set Cover e filtro de quadrantes.
- **Autenticação e Limites (auth.py & games.py)**:
  - Sistema de registro e login com hash via `bcrypt` e JWT expiráveis.
  - O endpoint protegido `POST /api/v1/jogos/salvar` gerencia as cotas diárias de salvamento de jogos dos usuários (limite diário padrão de `100` registros por usuário).

### 3. Arquitetura do Frontend (Next.js + Axios)
- **Dashboard (/src/app/page.tsx)**: Exibe os últimos resultados de sorteios de cada loteria e links de ferramentas.
- **Simulador (/src/app/simulador/page.tsx)**: Volante interativo que se adapta à quantidade de dezenas e colunas da modalidade ativa. Calcula custos e chances de ganhar da faixa principal enviando a contagem de dezenas para `/analise/probabilidade`.
- **Fechamento (/src/app/fechamento/page.tsx)**: Gera matrizes cercadas com garantias de acertos (ex: Quadra se acertar 6 na Mega-Sena). Exibe o custo total estimado, permite salvar o jogo no perfil do usuário e exportar para arquivo `.txt`.
- **Filtros (/src/app/filtros/page.tsx)**: Permite excluir cartões baseando-se em filtros matemáticos (somas, dezenas vizinhas, primos, Fibonacci e pares). É dinâmico por modalidade, ajustando as réguas de limites de acordo com a loteria. Permite exportar os jogos resultantes aceitos diretamente para arquivos `.txt`.
- **Estatísticas (/src/app/estatisticas/page.tsx)**: Exibe o balanço de paridade (par/ímpar) e gráficos de somas e tendências dos últimos 50 concursos com `recharts`, além das dezenas mais sorteadas e mais atrasadas.
- **Jogos Salvos (/src/app/jogos-salvos/page.tsx)**: Área autenticada onde o usuário gerencia e exporta seus fechamentos e jogos otimizados de volta em formato `.txt`.

### 4. Fluxo Integrado Directo (Fechamento ➡️ Filtro)
- Na tela de Fechamentos, o botão "Filtrar Resultados" salva temporariamente os jogos gerados e a modalidade ativa em `sessionStorage` (`lottomath_jogos_transfer` e `lottomath_modalidade_transfer`).
- Ao redirecionar para a tela de Filtros, a página carrega os jogos e configura a modalidade ativa de forma imediata, proporcionando excelente experiência de UX.

---

## 📂 Organização dos Diretórios

- `/backend`: Servidor de API Python FastAPI, ORM SQLAlchemy e serviços matemáticos.
- `/frontend`: Aplicação Next.js (TypeScript) com design system e gráficos estatísticos.
- `docker-compose.yml`: Definição de orquestração de rede e contêineres do banco, backend e frontend.


# Iniciar o servidor de desenvolvimento
POSTGRES_SERVER=127.0.0.1 POSTGRES_PORT=5433 uvicorn app.main:app --port 8000 --reload

# Iniciar o servidor de desenvolvimento
npm run dev -- -p 3001