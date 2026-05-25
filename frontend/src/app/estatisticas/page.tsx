"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { loteriaApi, EstatisticasResponse } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EstatisticasPage() {
  const [modalidade, setModalidade] = useState<string>("mega-sena");
  const [stats, setStats] = useState<EstatisticasResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await loteriaApi.getEstatisticas(modalidade);
        setStats(res);
      } catch (err) {
        console.error("Erro ao carregar estatísticas do backend:", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [modalidade]);

  // Processa as 10 dezenas mais frequentes
  const maisFrequentes = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.frequencia)
      .map(([num, freq]) => ({ numero: Number(num), frequencia: freq }))
      .sort((a, b) => b.frequencia - a.frequencia)
      .slice(0, 10);
  }, [stats]);

  // Processa as 10 dezenas mais atrasadas
  const maisAtrasadas = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.atraso)
      .map(([num, delay]) => ({ numero: Number(num), atraso: delay }))
      .sort((a, b) => b.atraso - a.atraso)
      .slice(0, 10);
  }, [stats]);

  // Formata os dados da soma histórica para o gráfico
  const dadosGraficoSoma = useMemo(() => {
    if (!stats) return [];
    return stats.somas_historico.map((soma, idx) => ({
      concurso: `C-${idx + 1}`,
      soma: soma
    }));
  }, [stats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Análise Estatística Avançada</h2>
          <p style={{ color: '#94a3b8' }}>Estude as dezenas quentes, frias e as tendências de somas acumuladas no banco de dados.</p>
        </div>
        
        {/* Seletor de Modalidade */}
        <select 
          value={modalidade} 
          onChange={(e) => setModalidade(e.target.value)}
          style={{ 
            padding: '10px 20px', 
            borderRadius: '8px', 
            backgroundColor: '#1e293b', 
            border: '1px solid #334155', 
            color: 'white', 
            fontSize: '14px', 
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <option value="mega-sena">Mega-Sena</option>
          <option value="lotofacil">Lotofácil</option>
          <option value="quina">Quina</option>
          <option value="lotomania">Lotomania</option>
          <option value="dupla-sena">Dupla-Sena</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Processando histórico de resultados...
        </div>
      ) : stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Frequência vs Atraso */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Dezenas Quentes */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>🔥 Dezenas Mais Sorteadas (Quentes)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {maisFrequentes.map((item) => (
                  <div key={item.numero} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span className="lottery-ball active" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                      {item.numero === 100 ? '00' : String(item.numero).padStart(2, '0')}
                    </span>
                    <div style={{ flexGrow: 1, margin: '0 16px', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, (item.frequencia / maisFrequentes[0].frequencia) * 100)}%`, 
                        height: '100%', 
                        backgroundColor: '#10b981',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <span style={{ fontWeight: 600, color: '#94a3b8' }}>{item.frequencia}x</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dezenas Atrasadas */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>❄️ Dezenas Mais Atrasadas (Frias)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {maisAtrasadas.map((item) => (
                  <div key={item.numero} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span className="lottery-ball" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                      {item.numero === 100 ? '00' : String(item.numero).padStart(2, '0')}
                    </span>
                    <div style={{ flexGrow: 1, margin: '0 16px', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, (item.atraso / Math.max(1, maisAtrasadas[0].atraso)) * 100)}%`, 
                        height: '100%', 
                        backgroundColor: '#ef4444',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <span style={{ fontWeight: 600, color: '#94a3b8' }}>Há {item.atraso} conc.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gráfico de Somas e Paridade */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Gráfico de Linha de Somas */}
            <div className="glass-panel" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>📈 Distribuição e Soma das Dezenas (Últimos 50 Concursos)</h3>
              <div style={{ width: '100%', height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGraficoSoma}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="concurso" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: 'white' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line type="monotone" dataKey="soma" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Paridade Card */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>⚖️ Balanço Par / Ímpar</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span style={{ color: '#38bdf8' }}>Dezenas Pares</span>
                    <strong style={{ color: '#38bdf8' }}>{stats.pares_impares.pares}%</strong>
                  </div>
                  <div style={{ height: '12px', backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.pares_impares.pares}%`, height: '100%', backgroundColor: '#38bdf8' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span style={{ color: '#fb7185' }}>Dezenas Ímpares</span>
                    <strong style={{ color: '#fb7185' }}>{stats.pares_impares.impares}%</strong>
                  </div>
                  <div style={{ height: '12px', backgroundColor: '#1e293b', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.pares_impares.impares}%`, height: '100%', backgroundColor: '#fb7185' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
          Não foi possível conectar ao banco de dados local para extrair estatísticas.
        </div>
      )}
    </div>
  );
}
