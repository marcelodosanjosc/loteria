"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState<boolean>(false);

  const navLinkStyle = (path: string, isHighlight = false) => {
    const active = pathname === path;
    return {
      color: active ? '#10b981' : isHighlight ? '#818cf8' : '#cbd5e1',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: active || isHighlight ? 700 : 500,
      borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
      paddingBottom: '4px',
      transition: 'all 0.2s',
    };
  };

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
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>LottoMath</Link>
        </h1>
        
        {/* Navegação Desktop */}
        <nav className="desktop-nav" aria-label="Menu principal" style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} style={navLinkStyle('/')}>Dashboard</Link>
          <Link href="/simulador" aria-current={pathname === '/simulador' ? 'page' : undefined} style={navLinkStyle('/simulador')}>Simulador</Link>
          <Link href="/fechamento" aria-current={pathname === '/fechamento' ? 'page' : undefined} style={navLinkStyle('/fechamento')}>Fechamentos</Link>
          <Link href="/filtros" aria-current={pathname === '/filtros' ? 'page' : undefined} style={navLinkStyle('/filtros')}>Filtros</Link>
          <Link href="/estatisticas" aria-current={pathname === '/estatisticas' ? 'page' : undefined} style={navLinkStyle('/estatisticas')}>Estatísticas</Link>
          <Link href="/analise-ia" aria-current={pathname === '/analise-ia' ? 'page' : undefined} style={{ ...navLinkStyle('/analise-ia', true), display: 'inline-flex', alignItems: 'center', gap: '4px' }}>🤖 IA & Prompts</Link>
          {email && (
            <Link href="/jogos-salvos" aria-current={pathname === '/jogos-salvos' ? 'page' : undefined} style={navLinkStyle('/jogos-salvos')}>Meus Jogos</Link>
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
            <Link 
              href="/login" 
              className="btn btn-primary" 
              style={{ padding: '6px 16px', fontSize: '13px', marginLeft: '10px' }}
            >
              Entrar
            </Link>
          )}
        </nav>

        {/* Botão Mobile Hambúrguer */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="mobile-menu-btn"
          aria-expanded={menuAberto}
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
        <nav aria-label="Menu mobile" style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Link onClick={fecharMenu} href="/" style={{ color: pathname === '/' ? '#10b981' : '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: pathname === '/' ? 700 : 500 }}>Dashboard</Link>
          <Link onClick={fecharMenu} href="/simulador" style={{ color: pathname === '/simulador' ? '#10b981' : '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: pathname === '/simulador' ? 700 : 500 }}>Simulador</Link>
          <Link onClick={fecharMenu} href="/fechamento" style={{ color: pathname === '/fechamento' ? '#10b981' : '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: pathname === '/fechamento' ? 700 : 500 }}>Fechamentos</Link>
          <Link onClick={fecharMenu} href="/filtros" style={{ color: pathname === '/filtros' ? '#10b981' : '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: pathname === '/filtros' ? 700 : 500 }}>Filtros</Link>
          <Link onClick={fecharMenu} href="/estatisticas" style={{ color: pathname === '/estatisticas' ? '#10b981' : '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: pathname === '/estatisticas' ? 700 : 500 }}>Estatísticas</Link>
          <Link onClick={fecharMenu} href="/analise-ia" style={{ color: pathname === '/analise-ia' ? '#10b981' : '#818cf8', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: 700 }}>🤖 IA & Prompts</Link>
          {email && (
            <Link onClick={fecharMenu} href="/jogos-salvos" style={{ color: pathname === '/jogos-salvos' ? '#10b981' : '#cbd5e1', textDecoration: 'none', fontSize: '15px', padding: '8px 0', fontWeight: pathname === '/jogos-salvos' ? 700 : 500 }}>Meus Jogos</Link>
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
              <Link 
                onClick={fecharMenu}
                href="/login" 
                className="btn btn-primary" 
                style={{ display: 'block', textAlign: 'center', padding: '8px 16px', fontSize: '14px' }}
              >
                Entrar na Conta
              </Link>
            )}
          </div>
        </nav>
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
