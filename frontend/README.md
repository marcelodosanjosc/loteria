# Documento de Requisitos de Produto (PRD) & Documentação do Frontend

Este documento serve como o PRD e guia de especificações técnicas do portal web LottoMath.

---

## 1. Visão Geral do Sistema
O frontend do LottoMath é uma SPA construída sobre Next.js 13 que renderiza volantes interativos para simulações e fechamentos de loterias Caixa, plota gráficos estatísticos das dezenas sorteadas de forma responsiva e fornece uma área autenticada para gerenciar as apostas salvas.

## 2. Tecnologias Utilizadas
- **Framework**: Next.js 13.5.6 (App Router)
- **Linguagem**: TypeScript 5.3
- **Biblioteca de Interface**: React 18.2
- **Gráficos**: Recharts 2.12 (para visualização de somas históricas)
- **Cliente HTTP**: Axios (com interceptador automático de tokens JWT)
- **Estilização**: Vanilla CSS (com tokens definidos no [globals.css](file:///home/marcelo/Documentos/loteria/frontend/src/app/globals.css))

---

## 3. Design System & Temas (globals.css)
O portal web do LottoMath utiliza uma paleta de cores voltada para o tema escuro moderno com técnicas de Glassmorphism:

### 3.1 Tokens de Cores principais
- `Background`: Slate 900 (`#0f172a`)
- `Foreground`: Slate 50 (`#f8fafc`)
- `Card Background`: Slate 800 translúcido (`rgba(30, 41, 59, 0.7)`) com blur de `12px` e borda fina de `rgba(255, 255, 255, 0.08)`.
- `Primary / Dezenas Selecionadas`: Emerald 500 (`#10b981`)
- `Accent / Dezenas Sorteadas`: Indigo 500 (`#6366f1`)
- `Warning / Alertas e Jogo Responsável`: Amber 500 (`#f59e0b`)
- `Muted / Secundários`: Slate 500 (`#64748b`)

### 3.2 Componentes e Elementos CSS
- `.glass-panel`: Painel de visualização com efeito de vidro, bordas arredondadas e sombra suave.
- `.lottery-ball`: Dezenas circulares interativas de tamanho `44px` (ou `36px` em volantes densos). Suporta os estados `.active` (esmeralda brilhante) e `.drawn` (índigo brilhante).
- `.volante-grid`: Grid responsivo baseado em colunas que gerencia a disposição física das bolas.
- `.btn`: Botões modernos com micro-transições no estado hover.

---

## 4. Estrutura de Páginas & Funcionalidades

### 4.1 Dashboard (`/page.tsx`)
A página inicial exibe os resultados dos últimos sorteios oficiais puxados e cacheados localmente, além de cartões de acesso rápido às ferramentas de simulação, fechamento e filtragem.

### 4.2 Simulador (`/simulador/page.tsx`)
Renderiza o volante dinamicamente baseado na modalidade escolhida:
- **Mega-Sena**: 60 números, grid de 10 colunas.
- **Lotofácil**: 25 números, grid de 5 colunas.
- **Quina**: 80 números, grid de 10 colunas.
- **Lotomania**: 100 números, grid de 10 colunas (número `100` é exibido como `'00'`).
- **Dupla-Sena**: 50 números, grid de 10 colunas.
Calcula a chance de ganho em tempo real ao alterar a seleção de dezenas.

### 4.3 Fechamento (`/fechamento/page.tsx`)
Permite selecionar o grupo de dezenas para cercar as garantias de acerto.
- O usuário escolhe o prêmio garantido ($K$) caso acerte $T$ dezenas sorteadas.
- Suporta a seleção de até 70 dezenas na Lotomania (limite ampliado de 55 para 70).
- Exibe dinamicamente o controle deslizante (slider) de **Filtro de Quadrantes** para a Lotomania quando a seleção é maior que 55 dezenas (com valor sugerido inteligente correspondente a `quadrantes_ocupados - 1`).
- O resultado gera uma lista de bilhetes otimizados que podem ser exportados como arquivo `.txt` para o computador ou salvos no perfil do usuário.
- Inclui o botão **Filtrar Resultados** para enviar as combinações geradas diretamente para a tela de filtros sem a necessidade de digitação manual.

### 4.4 Filtros Avançados (`/filtros/page.tsx`)
Aplica restrições matemáticas e remove cartões de baixa probabilidade.
- Os sliders ajustam o intervalo aceitável para a soma total de dezenas da aposta.
- Inputs numéricos configuram a quantidade aceitável de dezenas primas, pares e números de Fibonacci.
- Selectors configuram o limite máximo tolerado de dezenas vizinhas consecutivas.
- O painel de resultados "Jogos Filtrados e Aceitos" possui um botão **Exportar TXT** para baixar diretamente o arquivo `.txt` contendo a listagem dos jogos que passaram com sucesso pelos filtros aplicados.

### 4.5 Estatísticas (`/estatisticas/page.tsx`)
Estudo gráfico e analítico do histórico local de resultados oficiais:
- Dezenas Quentes (Mais frequentes) e Frias (Mais atrasadas).
- Gráfico interativo com a soma das dezenas nos últimos 50 concursos com `ResponsiveContainer` e `LineChart` do Recharts.
- Barra de balanço percentual entre dezenas Pares e Ímpares.

### 4.6 Jogos Salvos (`/jogos-salvos/page.tsx`)
Visualização e gestão das apostas salvas pelo usuário autenticado. Exibe uma prévia dos primeiros 3 cartões e permite baixar o arquivo `.txt` contendo a listagem completa.

---

## 5. Fluxo Integrado Directo (Fechamento ➡️ Filtro)
A integração de dados entre páginas ocorre através do `sessionStorage` do navegador:
1. No Fechamento, clicar em "Filtrar Resultados" salva o array de jogos na chave `lottomath_jogos_transfer` e a modalidade na chave `lottomath_modalidade_transfer`.
2. A tela de Filtros detecta essa presença na inicialização, carrega automaticamente os dados de entrada correspondentes, ajusta a modalidade ativa de forma transparente e apaga as chaves da sessão para manter a memória limpa.
