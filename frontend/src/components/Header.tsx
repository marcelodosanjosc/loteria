"use client";

import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState<boolean>(false);

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

  const fecharMenu = () => setMenuAberto(false);

  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 20px',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(15, 23, 42, 0.92)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(90deg, #10b981, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>LottoMath</a>
        </h1>
        
        {/* Navegação Desktop */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Dashboard</a>
          <a href="/simulador" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Simulador</a>
          <a href="/fechamento" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Fechamentos</a>
          <a href="/filtros" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Filtros</a>
          <a href="/estatisticas" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Estatísticas</a>
          <a href="/analise-ia" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🤖 IA & Prompts</a>
          {email && (
            <a href="/jogos-salvos" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Meus Jogos</a>
          )}
          
          {email ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: '10px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '14px' }}>
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
              style={{ padding: '6px 16px', fontSize: '13px', marginLeft: '10px' }}
            >
              Entrar
            </a>
          )}
        </nav>

        {/* Botão Mobile Hambúrguer */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="mobile-menu-btn"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          style={{
            background: 'none',
            border: 'none',
            color: '#e2e8f0',
            cursor: 'pointer',
            padding: '6px',
            display: 'none'
          }}
        >
          {menuAberto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Menu Gaveta Mobile */}
      {menuAberto && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <a onClick={fecharMenu} href="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 500 }}>Dashboard</a>
          <a onClick={fecharMenu} href="/simulador" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 500 }}>Simulador</a>
          <a onClick={fecharMenu} href="/fechamento" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 500 }}>Fechamentos</a>
          <a onClick={fecharMenu} href="/filtros" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 500 }}>Filtros</a>
          <a onClick={fecharMenu} href="/estatisticas" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 500 }}>Estatísticas</a>
          <a onClick={fecharMenu} href="/analise-ia" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 600 }}>🤖 IA & Prompts</a>
          {email && (
            <a onClick={fecharMenu} href="/jogos-salvos" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 500 }}>Meus Jogos</a>
          )}
          
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px', marginTop: '4px' }}>
            {email ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600 }}>{email}</span>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                >
                  Sair
                </button>
              </div>
            ) : (
              <a 
                onClick={fecharMenu}
                href="/login" 
                className="btn btn-primary" 
                style={{ display: 'block', textAlign: 'center', padding: '8px 16px', fontSize: '14px' }}
              >
                Entrar na Conta
              </a>
            )}
          </div>
        </div>
      )}

      {/* Estilos para responsividade em CSS Puro */}
      <style jsx>{`
        @media (max-width: 860px) {
          :global(.desktop-nav) {
            display: none !important;
          }
          :global(.mobile-menu-btn) {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
}
