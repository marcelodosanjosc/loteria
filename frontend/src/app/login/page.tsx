"use client";

import React, { useState } from 'react';
import { loteriaApi } from '../../services/api';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const res = await loteriaApi.login(email, senha);
        localStorage.setItem('lottomath_token', res.access_token);
        localStorage.setItem('lottomath_email', email);
        setSuccess("Login efetuado com sucesso! Redirecionando...");
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        await loteriaApi.registrar(nome, email, senha);
        setSuccess("Cadastro realizado com sucesso! Faça login para continuar.");
        setIsLogin(true);
        setSenha('');
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Erro de conexão com o servidor.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <button 
            onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: isLogin ? '#10b981' : '#94a3b8', 
              fontSize: '16px', 
              fontWeight: 700, 
              cursor: 'pointer',
              borderBottom: isLogin ? '2px solid #10b981' : 'none',
              paddingBottom: '4px'
            }}
          >
            Entrar
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: !isLogin ? '#10b981' : '#94a3b8', 
              fontSize: '16px', 
              fontWeight: 700, 
              cursor: 'pointer',
              borderBottom: !isLogin ? '2px solid #10b981' : 'none',
              paddingBottom: '4px'
            }}
          >
            Criar Conta
          </button>
        </div>

        <h3 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 700 }}>
          {isLogin ? 'Acessar LottoMath' : 'Crie sua Conta Grátis'}
        </h3>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '13px', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#94a3b8' }}>Nome Completo</label>
              <input 
                type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', fontSize: '14px' }}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>E-mail</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', fontSize: '14px' }}
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Senha</label>
            <input 
              type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', fontSize: '14px' }}
              placeholder="Sua senha secreta"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
            {loading ? 'Processando...' : isLogin ? 'Acessar Conta' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
