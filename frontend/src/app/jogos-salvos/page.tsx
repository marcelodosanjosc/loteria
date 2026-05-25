"use client";

import React, { useEffect, useState } from 'react';
import { loteriaApi, JogoUsuarioResponse } from '../../services/api';

export default function JogosSalvosPage() {
  const [jogos, setJogos] = useState<JogoUsuarioResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJogos = async () => {
      const token = localStorage.getItem('lottomath_token');
      if (!token) {
        setError("Apenas usuários autenticados podem visualizar seus jogos salvos. Por favor, faça login.");
        setLoading(false);
        return;
      }

      try {
        const res = await loteriaApi.listarJogos();
        setJogos(res);
      } catch (err: any) {
        console.error(err);
        setError("Erro ao carregar seus jogos do servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchJogos();
  }, []);

  const exportarParaTxt = (jogo: JogoUsuarioResponse) => {
    const txt = jogo.jogos.map(j => j.join(',')).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jogos-${jogo.tipo_geracao}-${jogo.id.slice(0, 8)}.txt`;
    a.click();
  };

  const formatarData = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const obterNomeModalidade = (modalidadeId: string) => {
    if (jogos.length > 0) {
      const primeiroJogo = jogos.find(j => j.modalidade_id === modalidadeId);
      if (primeiroJogo && primeiroJogo.jogos.length > 0) {
        const n = primeiroJogo.jogos[0].length;
        if (n === 6) return "Mega-Sena / Dupla-Sena";
        if (n === 15) return "Lotofácil";
        if (n === 5) return "Quina";
        if (n === 50) return "Lotomania";
      }
    }
    return "Loteria";
  };

  const formatarNumeroDezena = (n: number, modalidadeNome?: string, ticketSize?: number) => {
    const isLotomania = (modalidadeNome && modalidadeNome.toLowerCase().includes("mania")) || ticketSize === 50;
    if (isLotomania && n === 100) return "00";
    return String(n).padStart(2, '0');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>Carregando seus jogos salvos...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="glass-panel" style={{ maxWidth: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#f87171', fontSize: '15px' }}>{error}</p>
          {!localStorage.getItem('lottomath_token') && (
            <a href="/login" className="btn btn-primary">Fazer Login</a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Meus Jogos Salvos</h2>
        <p style={{ color: '#94a3b8' }}>Acesse e exporte as combinações e fechamentos otimizados salvos em sua conta.</p>
      </div>

      {jogos.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          Você ainda não salvou nenhum jogo no sistema. Vá para a aba <strong>Fechamentos</strong> para gerar e salvar suas matrizes!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {jogos.map((jogo) => (
            <div key={jogo.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                      {jogo.modalidade_nome || obterNomeModalidade(jogo.modalidade_id)}
                    </h3>
                    <span style={{ 
                      fontSize: '11px', 
                      backgroundColor: jogo.tipo_geracao === 'fechamento' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                      color: jogo.tipo_geracao === 'fechamento' ? '#818cf8' : '#34d399', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>
                      {jogo.tipo_geracao}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Salvo em: {formatarData(jogo.criado_em)}
                  </span>
                </div>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => exportarParaTxt(jogo)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Exportar TXT
                </button>
              </div>

              {/* Pré-visualização simplificada das dezenas (primeiros 3 jogos) */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Apostas Geradas ({jogo.jogos.length} no total):
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {jogo.jogos.slice(0, 3).map((cartao, cIdx) => (
                    <div key={cIdx} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center', width: '30px' }}>#{cIdx + 1}</span>
                      {cartao.map((n, nIdx) => (
                        <span 
                          key={nIdx} 
                          style={{ 
                            fontSize: '12px', 
                            background: '#1e293b', 
                            border: '1px solid #334155', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            fontWeight: 600
                          }}
                        >
                          {formatarNumeroDezena(n, jogo.modalidade_nome, cartao.length)}
                        </span>
                      ))}
                    </div>
                  ))}
                  {jogo.jogos.length > 3 && (
                    <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginLeft: '30px', marginTop: '4px' }}>
                      ...e mais {jogo.jogos.length - 3} cartões (clique em Exportar TXT para obter a lista completa).
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
