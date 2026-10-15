"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { loteriaApi, EstatisticaAvancadaResponse } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SpatialVolante from '../../components/SpatialVolante';
import Link from 'next/link';

function EstatisticasContent() {
  const searchParams = useSearchParams();
  const urlMod = searchParams.get('modalidade');

  const [modalidade, setModalidade] = useState<string>(() => {
    if (urlMod && ['lotofacil', 'mega-sena', 'quina', 'lotomania', 'dupla-sena'].includes(urlMod)) {
      return urlMod;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lottomath_modalidade');
      if (saved && ['lotofacil', 'mega-sena', 'quina', 'lotomania', 'dupla-sena'].includes(saved)) {
        return saved;
      }
    }
    return "lotofacil";
  });
  const [limiteAmostragem, setLimiteAmostragem] = useState<number>(30);
  const [stats, setStats] = useState<EstatisticaAvancadaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sincroniza se o parâmetro de URL mudar
  useEffect(() => {
    if (urlMod && ['lotofacil', 'mega-sena', 'quina', 'lotomania', 'dupla-sena'].includes(urlMod)) {
      setModalidade(urlMod);
    }
  }, [urlMod]);

  const handleModalidadeChange = (novaModalidade: string) => {
    setModalidade(novaModalidade);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lottomath_modalidade', novaModalidade);
      const url = new URL(window.location.href);
      url.searchParams.set('modalidade', novaModalidade);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await loteriaApi.getEstatisticasAvancadas(modalidade, limiteAmostragem);
        setStats(res);
      } catch (err) {
        console.error("Erro ao carregar estatísticas do backend:", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [modalidade, limiteAmostragem]);

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
      {/* Header com Filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>📊 Painel Estatístico & Espacial</h2>
          <p style={{ color: '#94a3b8' }}>
            Análise aprofundada de distribuição espacial no volante, moldura/centro, repetições e recortes temporais.
          </p>
        </div>

        {/* Filtros e Ações */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Seletor de Janela Temporal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Amostra:</span>
            <select
              value={limiteAmostragem}
              onChange={(e) => setLimiteAmostragem(Number(e.target.value))}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value={30}>Últimos 30 Concursos (Momento)</option>
              <option value={50}>Últimos 50 Concursos</option>
              <option value={100}>Últimos 100 Concursos</option>
              <option value={500}>Últimos 500 Concursos</option>
            </select>
          </div>

          {/* Seletor de Modalidade */}
          <select
            value={modalidade}
            onChange={(e) => handleModalidadeChange(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="lotofacil">Lotofácil</option>
            <option value="mega-sena">Mega-Sena</option>
            <option value="quina">Quina</option>
            <option value="lotomania">Lotomania</option>
            <option value="dupla-sena">Dupla-Sena</option>
          </select>

          {/* Botão para Gerador IA & Prompts contextualizado */}
          <Link
            href={`/analise-ia?modalidade=${modalidade}&aba=prompts`}
            className="btn btn-primary"
            style={{
              backgroundColor: '#6366f1',
              padding: '8px 16px',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            🤖 IA & Prompts
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Processando estatísticas dos últimos {limiteAmostragem} concursos...
        </div>
      ) : stats ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Destaques Rápidos de Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Média na Moldura</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                {stats.moldura_centro.moldura_media} <span style={{ fontSize: '13px', color: '#64748b' }}>/ 15</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Centro: {stats.moldura_centro.centro_medio} dezenas</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Repetição Anterior</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {stats.repeticao_concurso_anterior.media_repetidas} <span style={{ fontSize: '13px', color: '#64748b' }}>dezenas</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Padrão mais frequente: 9 repetidas</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Soma Média</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {stats.soma_media}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Faixa ideal: 180 a 220</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sequência Média</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#ec4899', marginTop: '4px' }}>
                {stats.sequencias_consecutivas.maior_sequencia_media} <span style={{ fontSize: '13px', color: '#64748b' }}>contíguas</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Máx. contínuo por sorteio</div>
            </div>
          </div>

          {/* Volante Espacial Interativo (para Lotofácil) */}
          {modalidade === 'lotofacil' && (
            <SpatialVolante
              frequencia={stats.frequencia}
              atraso={stats.atraso}
              dezenasQuentes={stats.dezenas_quentes}
              dezenasAtrasadas={stats.dezenas_atrasadas}
              totalConcursos={stats.total_concursos_analisados}
            />
          )}

          {/* Frequência vs Atraso */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Dezenas Quentes */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>🔥 Dezenas Mais Sorteadas (Quentes no Ciclo)</h3>
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

          {/* Gráfico de Somas e Balanço Par/Ímpar e Baixas/Altas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Gráfico de Linha de Somas */}
            <div className="glass-panel" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>📈 Distribuição e Soma das Dezenas (Últimos {Math.min(50, stats.total_concursos_analisados)} Concursos)</h3>
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

            {/* Paridade & Altas/Baixas Card */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>⚖️ Balanço Paridade & Quadrantes</h3>
              
              {/* Par / Ímpar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: '#38bdf8' }}>Pares ({stats.pares_impares.pares}%)</span>
                    <span style={{ color: '#fb7185' }}>Ímpares ({stats.pares_impares.impares}%)</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#1e293b', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${stats.pares_impares.pares}%`, backgroundColor: '#38bdf8' }}></div>
                    <div style={{ width: `${stats.pares_impares.impares}%`, backgroundColor: '#fb7185' }}></div>
                  </div>
                </div>

                {/* Baixas / Altas */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: '#10b981' }}>Baixas 01-12 ({stats.altas_baixas.baixas_pct}%)</span>
                    <span style={{ color: '#a855f7' }}>Altas 13-25 ({stats.altas_baixas.altas_pct}%)</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#1e293b', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${stats.altas_baixas.baixas_pct}%`, backgroundColor: '#10b981' }}></div>
                    <div style={{ width: `${stats.altas_baixas.altas_pct}%`, backgroundColor: '#a855f7' }}></div>
                  </div>
                </div>
              </div>

              {/* Botão Download CSV */}
              <a
                href={loteriaApi.getExportarCsvUrl(modalidade, limiteAmostragem)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px'
                }}
              >
                📥 Baixar Amostra em CSV (Excel / IA)
              </a>
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

export default function EstatisticasPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>Carregando Painel Estatístico...</div>}>
      <EstatisticasContent />
    </Suspense>
  );
}

