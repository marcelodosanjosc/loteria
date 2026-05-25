# Documento de Requisitos de Produto (PRD) & Documentação do Backend

Este documento serve como o PRD e guia de especificações técnicas do motor matemático e serviços de API do LottoMath.

---

## 1. Visão Geral do Sistema
O backend do LottoMath gerencia o armazenamento de dados históricos de resultados das loterias da Caixa, executa cálculos de probabilidade combinatória $C(N, K)$, gera combinações otimizadas de fechamentos usando algoritmos vetorizados rápidos e filtra jogos de acordo com critérios estatísticos.

## 2. Tecnologias Utilizadas
- **Linguagem**: Python 3.11
- **Framework Web**: FastAPI
- **Banco de Dados**: PostgreSQL 16
- **ORM / Interface**: SQLAlchemy
- **Processamento de Matrizes**: NumPy (para aceleração matricial)
- **Agendamento**: APScheduler (para sincronização diária)

---

## 3. Modelo de Dados (Banco de Dados)

### Tabela `usuarios` (User)
Representa as contas de usuários cadastrados no sistema.
- `id` (UUID): Chave primária.
- `nome` (String): Nome completo.
- `email` (String): Endereço de e-mail (único, indexado).
- `senha_hash` (String): Senha criptografada com `bcrypt`.
- `limite_diario_geracao` (Integer): Cota padrão de jogos que podem ser salvos por dia (Padrão: 100).

### Tabela `modalidades` (Modalidade)
Representa as loterias registradas no sistema.
- `id` (UUID): Chave primária.
- `nome` (String): Nome amigável (ex: "Mega-Sena").
- `codigo_slug` (String): Slug identificador exclusivo (ex: "mega-sena").
- `tipo_prognostico` (String): Tipo ("numerico").
- `total_dezenas_globo` (Integer): Número de bolas no globo (Mega=60, LotoFácil=25, Quina=80, Lotomania=100, Dupla-Sena=50).
- `min_dezenas_aposta` (Integer): Número mínimo de marcações em um bilhete simples.
- `max_dezenas_aposta` (Integer): Número máximo de marcações.

### Tabela `sorteios` (Sorteio)
Resultados oficiais históricos de cada concurso.
- `id` (UUID): Chave primária.
- `modalidade_id` (UUID): Relacionamento com a modalidade.
- `numero_concurso` (Integer): Número do concurso oficial Caixa.
- `data_sorteio` (Date): Data de realização do sorteio.
- `dezenas_sorteadas` (ARRAY of Integer): Lista de dezenas sorteadas.
- `detalhes_ganhadores` (JSONB): Prêmios distribuídos e faixas.
- `acumulou` (Boolean): Se acumulou para o próximo concurso.
- `valor_acumulado` (Numeric): Valor acumulado estimado para o próximo prêmio.

### Tabela `jogos_usuario` (JogoUsuario)
Fechamentos e apostas que foram gerados e salvos pelos usuários.
- `id` (UUID): Chave primária.
- `usuario_id` (UUID): Dono do jogo.
- `modalidade_id` (UUID): Loteria associada.
- `tipo_geracao` (String): Tipo do jogo ('aleatorio', 'fechamento', 'filtrado').
- `jogos` (JSONB): Array bidimensional contendo as dezenas dos bilhetes gerados.

---

## 4. Funcionalidades e Motor Matemático

### 4.1 Aceleração Combinatória com NumPy (`Gerar Fechamento`)
O gerador de fechamentos em [combinatorics.py](file:///home/marcelo/Documentos/loteria/backend/app/services/combinatorics.py) utiliza **álgebra linear** com NumPy para resolver o problema de Set Cover (Fechamento Matemático) com alta velocidade:
1. Gera-se o espaço amostral completo $C(N, M)$ de subconjuntos de dezenas jogadas.
2. Gera-se o espaço condicional $C(N, T)$ de cenários de acertos.
3. Constrói-se uma matriz booleana que relaciona a correspondência de acertos $K$ de cada bilhete contra cada cenário.
4. O algoritmo guloso seleciona o bilhete que cobre a maior quantidade de cenários restantes através de multiplicação de matrizes de alta performance (`np.dot`).

**Limites Físicos Configurados no Servidor (`wheeling.py`):**
- **Mega-Sena**: Tamanho bilhete = 6, limite de seleção $N \le 15$ dezenas.
- **Lotofácil**: Tamanho bilhete = 15, limite de seleção $N \le 21$ dezenas.
- **Quina**: Tamanho bilhete = 5, limite de seleção $N \le 18$ dezenas.
- **Dupla-Sena**: Tamanho bilhete = 6, limite de seleção $N \le 15$ dezenas.
- **Lotomania**: Tamanho bilhete = 50, limite de seleção obrigatório de $50 \le N \le 55$ dezenas (devido à complexidade computacional para bilhetes grandes).

### 4.2 Filtros de Padrões Estatísticos (`filtrar_jogos`)
Filtra cartões indesejados a partir dos critérios:
- **Números Primos**: Verifica quantos números são primos no conjunto `{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97}`.
- **Fibonacci**: Verifica a presença no conjunto `{1, 2, 3, 5, 8, 13, 21, 34, 55, 89}`.
- **Pares / Ímpares**: Razão de paridade.
- **Moldura**: Presença na borda do volante clássico (10 colunas ou 5 colunas para Lotofácil).
- **Consecutivos**: Restrição do tamanho máximo de números vizinhos.

---

## 5. Rotas de API (Endpoints)

### Autenticação (`/api/v1/auth`)
- `POST /register`: Cria nova conta de usuário.
- `POST /login`: Retorna o token de acesso Bearer JWT em formato `application/x-www-form-urlencoded`.

### Análise e Sincronização (`/api/v1/analise`)
- `POST /probabilidade`: Calcula custos e chances teóricas de acerto.
- `POST /sincronizar-todos`: Sincroniza os últimos 100 sorteios de todas as modalidades numéricas.
- `POST /{slug}/sincronizar`: Sincroniza uma modalidade específica.
- `GET /{slug}/estatisticas`: Calcula estatísticas de atrasos, frequências e paridades do histórico local de sorteios.
- `GET /{slug}/sorteios`: Lista o histórico paginado de concursos.

### Fechamentos e Filtros (`/api/v1/fechamentos`)
- `POST /gerar`: Rota central do motor matemático para gerar matrizes de fechamento.
- `POST /filtrar`: Filtra uma lista de jogos gerados de acordo com os filtros selecionados.

### Jogos do Usuário (`/api/v1/jogos`)
- `POST /salvar` [Protegida por Token]: Salva jogos gerados no perfil, validando o limite diário de cotas.
- `GET /` [Protegida por Token]: Lista os jogos salvos do usuário autenticado de forma ordenada cronologicamente.
