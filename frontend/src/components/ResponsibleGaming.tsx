import React from 'react';

export default function ResponsibleGaming() {
  return (
    <div className="responsible-banner" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
        ⚠️ Jogo Responsável e Alerta Legal
      </h3>
      <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
        Loterias são baseadas puramente em eventos aleatórios. Nenhum método matemático ou fechamento pode alterar as probabilidades fundamentais de sorteio de cada dezena ou garantir ganhos financeiros.
      </p>
      <p style={{ fontSize: '13px', color: '#94a3b8' }}>
        Apostas devem ser vistas estritamente como entretenimento. Defina limites de gastos e nunca jogue recursos destinados a despesas essenciais. Se você ou alguém que você conhece apresentar sinais de dependência de jogos (ludopatia), busque orientação profissional. Ligue para apoio ou consulte os órgãos governamentais de saúde.
      </p>
    </div>
  );
}
