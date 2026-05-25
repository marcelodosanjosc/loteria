import './globals.css';
import React from 'react';
import Header from '../components/Header';

export const metadata = {
  title: 'Loteria & Probabilidades - Simulador e Fechamento',
  description: 'Estudo matemático de probabilidades, aplicação de fechamentos e filtros inteligentes para loterias da Caixa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="container">
          {children}
        </main>
        <footer style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#64748b',
          fontSize: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          marginTop: '60px'
        }}>
          <p>© 2026 LottoMath - Desenvolvido para fins de estudos matemáticos.</p>
          <p style={{ marginTop: '8px', color: '#f59e0b' }}>Atenção: Aposta não é investimento. Jogue com responsabilidade. Menores de 18 anos são proibidos de apostar.</p>
        </footer>
      </body>
    </html>
  );
}
