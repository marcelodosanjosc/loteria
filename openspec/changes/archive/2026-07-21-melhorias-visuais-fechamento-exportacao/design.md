## Context

O projeto LottoMath utiliza React/Next.js no frontend para proporcionar simulação de probabilidade, geração de matrizes de fechamento e filtragem de apostas. Anteriormente, os arquivos TXT exportados continham vírgulas ou textos com formatação genérica (ex: `Jogo 001: 01 - 02...`), dificultando o uso direto em automações lotéricas.

## Goals / Non-Goals

**Goals:**
- Formatação de exportação TXT limpa (números com 2 dígitos separados por espaços, 1 jogo por linha).
- Ações de cópia de bilhetes (todas as apostas ou unitárias) via área de transferência (`navigator.clipboard`).
- Atualização do design system visual com vidro translúcido, gradientes dinâmicos por modalidade e barra de métricas do volante em tempo real.
- Suporte a seleção aleatória rápida ("Surpresinha Rápida") no gerador de fechamentos.

**Non-Goals:**
- Alteração nos algoritmos matemáticos de fechamento (Monte Carlo / Garantia K-T) do backend.

## Decisions

- **Decisão 1: Formatação com `padStart(2, '0')` e `.join(' ')`**:
  - *Razão*: Padroniza o texto de saída como `01 02 03 04 05 06`, sem vírgulas ou hífens.
  - *Alternativas*: Manter vírgulas ou usar `-` (descartados por incompatibilidade com software de bilhetes).

- **Decisão 2: Classes Temáticas por Modalidade em CSS**:
  - *Razão*: Permite aplicar estilos dinâmicos (`.lottery-ball.active.mega-sena`, `.lotofacil`, etc.) diretamente via classe React, melhorando a responsividade e o feedback visual.

## Risks / Trade-offs

- **[Risk] Suporte a Clipboard em navegadores sem HTTPS**: O uso de `navigator.clipboard` pode falhar em conexões HTTP inseguras não-localhost.
  - *Mitigação*: Feedback visual com fallbacks legíveis via notificações Toast.
