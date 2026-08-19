"use client";

import React, { useState } from 'react';

interface SpatialVolanteProps {
  frequencia: Record<number, number>;
  atraso: Record<number, number>;
  dezenasQuentes?: number[];
  dezenasAtrasadas?: number[];
  totalConcursos: number;
}

const LOTOFACIL_MOLDURA = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
const LOTOFACIL_CENTRO = new Set([7, 8, 9, 12, 13, 14, 17, 18, 19]);

export default function SpatialVolante({
  frequencia,
  atraso,
  dezenasQuentes = [],
  dezenasAtrasadas = [],
  totalConcursos,
}: SpatialVolanteProps) {
  const [modoVisualizacao, setModoVisualizacao] = useState<'moldura' | 'calor' | 'atraso'>('moldura');

  const maxFreq = Math.max(1, ...Object.values(frequencia));
  const maxAtraso = Math.max(1, ...Object.values(atraso));

  // Calcular totais por linha (1 a 5) e coluna (1 a 5)
  const totaisLinhas: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totaisColunas: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (let d = 1; d <= 25; d++) {
    const l = Math.floor((d - 1) / 5) + 1;
    const c = ((d - 1) % 5) + 1;
    const freq = frequencia[d] || 0;
    totaisLinhas[l] = (totaisLinhas[l] || 0) + freq;
    totaisColunas[c] = (totaisColunas[c] || 0) + freq;
  }

  const getEstiloDezena = (dezena: number) => {
    const freq = frequencia[dezena] || 0;
    const delay = atraso[dezena] || 0;
    const isMoldura = LOTOFACIL_MOLDURA.has(dezena);

    if (modoVisualizacao === 'moldura') {
      if (isMoldura) {
        return {
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          borderColor: '#38bdf8',
          color: '#38bdf8',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)',
        };
      } else {
        return {
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          borderColor: '#f43f5e',
          color: '#fb7185',
          boxShadow: '0 0 10px rgba(244, 63, 94, 0.2)',
        };
      }
    }

    if (modoVisualizacao === 'calor') {
      const pct = freq / maxFreq;
      const alpha = Math.max(0.15, pct * 0.85);
      return {
        backgroundColor: `rgba(16, 185, 129, ${alpha})`,
        borderColor: pct > 0.7 ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        fontWeight: pct > 0.7 ? 800 : 500,
      };
    }

    if (modoVisualizacao === 'atraso') {
      const pct = delay / maxAtraso;
      const alpha = Math.max(0.15, pct * 0.85);
      return {
        backgroundColor: `rgba(239, 68, 68, ${alpha})`,
        borderColor: pct > 0.7 ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
        color: 'white',
      };
    }

    return {};
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>🗺️ Mapa Espacial do Volante (5x5)</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Distribuição espacial das 25 dezenas com moldura (16 números) e centro (9 números).
          </p>
        </div>

        {/* Seletor de Modo */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setModoVisualizacao('moldura')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: modoVisualizacao === 'moldura' ? '#38bdf8' : 'transparent',
              color: modoVisualizacao === 'moldura' ? '#0f172a' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Moldura vs Centro
          </button>
          <button
            onClick={() => setModoVisualizacao('calor')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: modoVisualizacao === 'calor' ? '#10b981' : 'transparent',
              color: modoVisualizacao === 'calor' ? '#0f172a' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Mapa de Calor (Freq.)
          </button>
          <button
            onClick={() => setModoVisualizacao('atraso')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: modoVisualizacao === 'atraso' ? '#ef4444' : 'transparent',
              color: modoVisualizacao === 'atraso' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            Atrasos
          </button>
        </div>
      </div>

      {/* Legendas */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
        {modoVisualizacao === 'moldura' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#38bdf8' }}></span>
              <span>Moldura (16 dezenas) - Média: 9 a 10 por sorteio</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f43f5e' }}></span>
              <span>Centro / Miolo (9 dezenas) - Média: 5 a 6 por sorteio</span>
            </div>
          </>
        )}
        {modoVisualizacao === 'calor' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Menos Frequente</span>
            <div style={{ width: '80px', height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, rgba(16,185,129,0.2), #10b981)' }}></div>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Mais Frequente (Quente)</span>
          </div>
        )}
        {modoVisualizacao === 'atraso' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Saiu Recentemente</span>
            <div style={{ width: '80px', height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, rgba(239,68,68,0.2), #ef4444)' }}></div>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Mais Atrasada</span>
          </div>
        )}
      </div>

      {/* Grid Matricial com Headers de Linhas e Colunas */}
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '8px', margin: '0 auto' }}>
        {/* Header das Colunas */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 52px)', gap: '8px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
          <div></div>
          {[1, 2, 3, 4, 5].map((col) => (
            <div key={col} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>C{col}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{totaisColunas[col]}x</span>
            </div>
          ))}
        </div>

        {/* Linhas 1 a 5 */}
        {[1, 2, 3, 4, 5].map((linha) => (
          <div key={linha} style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 52px)', gap: '8px', alignItems: 'center' }}>
            {/* Header da Linha */}
            <div style={{ textAlign: 'right', paddingRight: '8px', fontSize: '11px', color: '#64748b' }}>
              <span style={{ fontWeight: 600 }}>L{linha}</span>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{totaisLinhas[linha]}x</div>
            </div>

            {/* 5 Dezenas da Linha */}
            {[1, 2, 3, 4, 5].map((col) => {
              const dezena = (linha - 1) * 5 + col;
              const freq = frequencia[dezena] || 0;
              const delay = atraso[dezena] || 0;
              const isHot = dezenasQuentes.includes(dezena);
              const isOverdue = dezenasAtrasadas.includes(dezena);

              return (
                <div
                  key={dezena}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                    position: 'relative',
                    transition: 'all 0.2s',
                    ...getEstiloDezena(dezena),
                  }}
                  title={`Dezena ${dezena}: saiu ${freq} vezes (${Math.round((freq / totalConcursos) * 100)}%), atraso atual: ${delay} conc.`}
                >
                  <span style={{ fontSize: '16px', fontWeight: 800 }}>
                    {String(dezena).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>
                    {freq}x {delay > 0 ? `(-${delay})` : '•'}
                  </span>
                  {isHot && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '10px' }}>🔥</span>
                  )}
                  {isOverdue && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '10px' }}>❄️</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
