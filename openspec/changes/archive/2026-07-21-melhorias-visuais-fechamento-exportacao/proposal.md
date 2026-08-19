## Why

O sistema de loterias LottoMath precisa de uma interface mais moderna, intuitiva e atraente para otimização de jogos de loteria (Mega-Sena, Lotofácil, Quina, Lotomania e Dupla-Sena). Além disso, a exportação de bilhetes em TXT precisava ser padronizada no formato numérico limpo (números de 2 dígitos separados unicamente por espaços, um cartão por linha), facilitando a importação direta por impressoras e sistemas de apostas lotéricas.

## What Changes

- **Exportação TXT Limpa**: Atualização do gerador de arquivos TXT em Fechamentos, Filtros e Jogos Salvos para emitir apenas dezenas formatadas com 2 dígitos separadas por espaço (ex: `01 02 03 04 05 06`).
- **Ações Rápidas de Cópia**: Adição de botões para copiar todas as apostas no formato limpo para a área de transferência com notificação visual Toast, além de cópia unitária por cartão.
- **Visual Polish & Identidade por Modalidade**: Implementação de temas de cores dinâmicos por modalidade no volante interativo e nos badges do sistema.
- **Experiência do Volante no Fechamento**: Adição de ferramentas de seleção rápida ("Surpresinha Rápida" e "Limpar") e métricas de dezenas (Pares, Ímpares e Total) em tempo real.

## Capabilities

### New Capabilities
- `clean-txt-export`: Exportação e cópia de bilhetes de loteria em formato de texto limpo (apenas dezenas separadas por espaço).
- `lotto-ui-theme`: Design system moderno com vidro translúcido, gradientes dinâmicos por modalidade de loteria e interações responsivas no volante.

### Modified Capabilities
- `fechamento-matrizes`: Interface aprimorada do gerador de fechamentos com resumo estatístico do volante e atalhos de seleção.

## Impact

- **Frontend (`src/app/fechamento/page.tsx`, `src/app/filtros/page.tsx`, `src/app/jogos-salvos/page.tsx`, `src/app/globals.css`)**: Atualização de estilos globais, componentes do volante, ações de cópia e geradores de Blob TXT.
- **Compatibilidade**: Total compatibilidade dos arquivos exportados com softwares e leitores de código de bilhetes lotéricos.
