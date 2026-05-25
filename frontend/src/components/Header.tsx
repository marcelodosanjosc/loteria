"use client";

import React, { useEffect, useState } from 'react';

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('lottomath_email');
      setEmail(storedEmail);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lottomath_token');
    localStorage.removeItem('lottomath_email');
    setEmail(null);
    window.location.href = '/login';
  };

  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '16px 20px',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(15, 23, 42, 0.8)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(90deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>LottoMath</a>
        </h1>
        
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Dashboard</a>
          <a href="/simulador" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Simulador</a>
          <a href="/fechamento" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Fechamentos</a>
          <a href="/filtros" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Filtros</a>
          <a href="/estatisticas" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Estatísticas</a>
          {email && (
            <a href="/jogos-salvos" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Meus Jogos</a>
          )}
          
          {email ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600 }}>{email}</span>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Sair
              </button>
            </div>
          ) : (
            <a 
              href="/login" 
              className="btn btn-primary" 
              style={{ padding: '6px 16px', fontSize: '13px', marginLeft: '12px' }}
            >
              Entrar
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
