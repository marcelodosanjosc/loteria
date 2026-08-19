"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { loteriaApi, ProbabilidadeResponse } from '../../services/api';

export default function SimuladorPage() {
  const [modalidade, setModalidade] = useState<string>("mega-sena");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiStats, setApiStats] = useState<ProbabilidadeResponse | null>(null);

  // Configurações de regras físicas de cada loteria
  const config = useMemo(() => {
    switch (modalidade) {
      case 'lotofacil':
        return { 
          total: 25, 
          label: 'Lotofácil', 
          min: 15, 
          max: 20, 
          columns: 5, 
          formatNumber: (n: number) => String(n).padStart(2, '0') 
        };
      case 'quina':
        return { 
          total: 80, 
          label: 'Quina', 
          min: 5, 
          max: 15, 
          columns: 10, 
          formatNumber: (n: number) => String(n).padStart(2, '0') 
        };
      case 'lotomania':
        return { 
          total: 100, 
          label: 'Lotomania', 
          min: 50, 
          max: 50, 
          columns: 10, 
          formatNumber: (n: number) => n === 100 ? '00' : String(n).padStart(2, '0') 
        };
      case 'dupla-sena':
        return { 
          total: 50, 
          label: 'Dupla-Sena', 
          min: 6, 
          max: 15, 
          columns: 10, 
          formatNumber: (n: number) => String(n).padStart(2, '0') 
        };
      case 'mega-sena':
      default:
        return { 
          total: 60, 
          label: 'Mega-Sena', 
          min: 6, 
          max: 15, 
          columns: 10, 
          formatNumber: (n: number) => String(n).padStart(2, '0') 
        };
    }
  }, [modalidade]);
  
  const numbersArray = useMemo(() => {
    return Array.from({ length: config.total }, (_, i) => i + 1);
  }, [config.total]);

  // Reseta seleção ao alternar modalidade
  useEffect(() => {
    setSelectedNumbers([]);
    setApiStats(null);
  }, [modalidade]);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= config.max) {
        alert(`O limite máximo de dezenas selecionadas para a ${config.label} é ${config.max}.`);
        return;
      }
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  // Chama a API quando a seleção de números mudar
  useEffect(() => {
    if (selectedNumbers.length < config.min) {
      setApiStats(null);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await loteriaApi.getProbabilidade(modalidade, selectedNumbers.length);
        setApiStats(res);
      } catch (err) {
        console.error("Erro ao chamar API de probabilidade:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedNumbers, modalidade, config.min]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(val));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Simulador de Probabilidades</h2>
          <p style={{ color: '#94a3b8' }}>Selecione dezenas no volante interativo e analise custos e probabilidades reais.</p>
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
        {/* Volante Virtual */}
        <div className="glass-panel" style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
              Dezenas Selecionadas: {selectedNumbers.length} / {config.max} (Mínimo: {config.min})
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const disponiveis = [...numbersArray];
                  const selecionados: number[] = [];
                  while (selecionados.length < config.min && disponiveis.length > 0) {
                    const randIdx = Math.floor(Math.random() * disponiveis.length);
                    selecionados.push(disponiveis[randIdx]);
                    disponiveis.splice(randIdx, 1);
                  }
                  setSelectedNumbers(selecionados.sort((a, b) => a - b));
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🎲 Surpresinha ({config.min})
              </button>
              {selectedNumbers.length > 0 && (
                <button 
                  onClick={() => setSelectedNumbers([])} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                >
                  🧹 Limpar
                </button>
              )}
            </div>
          </div>

          <div 
            className="volante-grid"
            style={{
              gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
              maxWidth: config.columns === 5 ? '280px' : '520px'
            }}
          >
            {numbersArray.map((num) => {
              const isSelected = selectedNumbers.includes(num);
              return (
                <button
                  key={num}
                  className={`lottery-ball ${modalidade} ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleNumber(num)}
                  style={{
                    width: config.total > 60 ? '36px' : '44px',
                    height: config.total > 60 ? '36px' : '44px',
                    fontSize: config.total > 60 ? '13px' : '16px'
                  }}
                >
                  {config.formatNumber(num)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel Estatístico */}
        <div className="glass-panel" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            Análise Matemática ({config.label})
          </h3>

          {selectedNumbers.length < config.min ? (
            <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              Selecione pelo menos {config.min} números para ver o cálculo de probabilidade e custo.
            </div>
          ) : loading ? (
            <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              Carregando dados matemáticos do servidor...
            </div>
          ) : apiStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Jogos Simples Gerados
                </span>
                <strong style={{ fontSize: '24px', fontWeight: 800 }}>
                  {formatNumber(apiStats.jogos_simples)}
                </strong>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Equivale a criar {formatNumber(apiStats.jogos_simples)} bilhetes normais.
                </p>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Probabilidade de Ganhar (Faixa Principal)
                </span>
                <strong style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
                  1 em {formatNumber(apiStats.probabilidade_1_em)}
                </strong>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Sua chance foi multiplicada por {formatNumber(apiStats.jogos_simples)}x!
                </p>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Custo Estimado da Aposta
                </span>
                <strong style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1' }}>
                  {formatCurrency(apiStats.custo_estimado)}
                </strong>
              </div>

              {selectedNumbers.length > 0 && (
                <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '6px', border: '1px dashed rgba(99, 102, 241, 0.2)' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Dezenas Escolhidas:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedNumbers.map((num) => (
                      <span key={num} style={{ fontSize: '12px', background: '#1e293b', padding: '2px 8px', borderRadius: '4px', border: '1px solid #334155' }}>
                        {config.formatNumber(num)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              Erro ao recuperar dados da API.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
