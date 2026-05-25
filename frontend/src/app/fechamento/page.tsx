"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { loteriaApi } from '../../services/api';

export default function FechamentoPage() {
  const [modalidade, setModalidade] = useState<string>("mega-sena");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [garantia, setGarantia] = useState<number>(4); // K
  const [condicao, setCondicao] = useState<number>(6); // T
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [jogosGerados, setJogosGerados] = useState<number[][]>([]);
  const [custoTotal, setCustoTotal] = useState<number>(0);

  // Configurações de fechamento e limites por modalidade
  const config = useMemo(() => {
    switch (modalidade) {
      case 'lotofacil':
        return {
          total: 25,
          label: 'Lotofácil',
          minSelect: 15,
          maxSelect: 21,
          columns: 5,
          ticketSize: 15,
          drawnCount: 15,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          opcoesGarantia: [
            { value: 11, label: 'Garantir 11 pontos (Mínimo)' },
            { value: 12, label: 'Garantir 12 pontos' },
            { value: 13, label: 'Garantir 13 pontos' },
            { value: 14, label: 'Garantir 14 pontos (Ideal)' },
            { value: 15, label: 'Garantir 15 pontos (Total)' }
          ],
          defaultGarantia: 13,
          precoAposta: 3.00
        };
      case 'quina':
        return {
          total: 80,
          label: 'Quina',
          minSelect: 5,
          maxSelect: 18,
          columns: 10,
          ticketSize: 5,
          drawnCount: 5,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          opcoesGarantia: [
            { value: 3, label: 'Garantir Terno (3 pontos)' },
            { value: 4, label: 'Garantir Quadra (4 pontos)' },
            { value: 5, label: 'Garantir Quina (5 pontos)' }
          ],
          defaultGarantia: 4,
          precoAposta: 2.50
        };
      case 'lotomania':
        return {
          total: 100,
          label: 'Lotomania',
          minSelect: 50,
          maxSelect: 53, // Restringido para manter processamento rápido (local)
          columns: 10,
          ticketSize: 50,
          drawnCount: 20, // 20 números sorteados na Lotomania
          formatNumber: (n: number) => n === 100 ? '00' : String(n).padStart(2, '0'),
          opcoesGarantia: [
            { value: 16, label: 'Garantir 16 pontos' },
            { value: 17, label: 'Garantir 17 pontos' },
            { value: 18, label: 'Garantir 18 pontos' }
          ],
          defaultGarantia: 17,
          precoAposta: 3.00
        };
      case 'dupla-sena':
        return {
          total: 50,
          label: 'Dupla-Sena',
          minSelect: 6,
          maxSelect: 15,
          columns: 10,
          ticketSize: 6,
          drawnCount: 6,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          opcoesGarantia: [
            { value: 4, label: 'Garantir Quadra (4 pontos)' },
            { value: 5, label: 'Garantir Quina (5 pontos)' },
            { value: 6, label: 'Garantir Sena (6 pontos)' }
          ],
          defaultGarantia: 4,
          precoAposta: 2.50
        };
      case 'mega-sena':
      default:
        return {
          total: 60,
          label: 'Mega-Sena',
          minSelect: 6,
          maxSelect: 15,
          columns: 10,
          ticketSize: 6,
          drawnCount: 6,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          opcoesGarantia: [
            { value: 4, label: 'Garantir Quadra (4 pontos)' },
            { value: 5, label: 'Garantir Quina (5 pontos)' },
            { value: 6, label: 'Garantir Sena (6 pontos)' }
          ],
          defaultGarantia: 4,
          precoAposta: 5.00
        };
    }
  }, [modalidade]);

  const numbersArray = useMemo(() => {
    return Array.from({ length: config.total }, (_, i) => i + 1);
  }, [config.total]);

  // Reseta seleção ao alternar modalidade
  useEffect(() => {
    setSelectedNumbers([]);
    setJogosGerados([]);
    setGarantia(config.defaultGarantia);
    setCondicao(config.drawnCount);
  }, [modalidade, config]);

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= config.maxSelect) {
        alert(`O limite máximo de dezenas selecionadas para fechamento da ${config.label} é ${config.maxSelect}.`);
        return;
      }
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  // Dispara a geração matemática de fechamento no backend FastAPI
  const gerarFechamentoBackend = async () => {
    if (selectedNumbers.length < config.minSelect) {
      alert(`Selecione pelo menos ${config.minSelect} dezenas no volante.`);
      return;
    }
    
    setLoading(true);
    try {
      const res = await loteriaApi.gerarFechamento(
        modalidade,
        selectedNumbers,
        garantia,
        condicao
      );
      setJogosGerados(res.jogos);
      setCustoTotal(res.custo_estimado);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Erro desconhecido ao processar fechamento no servidor.";
      alert(`Erro: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const salvarJogosBackend = async () => {
    const token = localStorage.getItem('lottomath_token');
    if (!token) {
      alert("Apenas usuários cadastrados e logados podem salvar jogos no sistema.");
      window.location.href = '/login';
      return;
    }

    setSaving(true);
    try {
      await loteriaApi.salvarJogo(modalidade, "fechamento", jogosGerados);
      alert("Jogos salvos com sucesso na sua conta!");
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Erro ao salvar jogos.";
      alert(`Erro: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Gerador de Fechamentos (Matrizes)</h2>
          <p style={{ color: '#94a3b8' }}>
            Otimize seus jogos cercados por garantias matemáticas de acerto, gerando menos apostas.
          </p>
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
        {/* Painel de Configuração de Parâmetros */}
        <div className="glass-panel" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Parâmetros da Matriz</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#94a3b8' }}>Garantia de Acerto (K):</label>
            <select 
              value={garantia} 
              onChange={(e) => setGarantia(Number(e.target.value))}
              style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white' }}
            >
              {config.opcoesGarantia.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#94a3b8' }}>Se acertarmos (T):</label>
            <select 
              value={condicao} 
              onChange={(e) => setCondicao(Number(e.target.value))}
              style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white' }}
            >
              <option value={config.drawnCount}>
                Acertando {config.drawnCount} números do sorteio
              </option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>
              Dezenas Selecionadas: {selectedNumbers.length} / {config.maxSelect} (Mínimo: {config.minSelect})
            </span>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Quanto mais dezenas selecionar, maior será a quantidade de cartões necessários para manter a garantia matemática.
            </p>
          </div>

          <button 
            className="btn btn-primary"
            onClick={gerarFechamentoBackend}
            disabled={loading || selectedNumbers.length < config.minSelect}
            style={{ width: '100%' }}
          >
            {loading ? "Calculando no Servidor..." : "Gerar Fechamento"}
          </button>
        </div>

        {/* Volante de Seleção */}
        <div className="glass-panel" style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Selecione as Dezenas ({config.label})</h3>
            {selectedNumbers.length > 0 && (
              <button 
                onClick={() => setSelectedNumbers([])} 
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                Limpar
              </button>
            )}
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
                  className={`lottery-ball ${isSelected ? 'active' : ''}`}
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
      </div>

      {/* Seção de Resultados dos Bilhetes Gerados */}
      {jogosGerados.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Jogos Otimizados Gerados ({jogosGerados.length} Cartões)</h3>
              <p style={{ fontSize: '13px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
                Custo total estimado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary"
                onClick={salvarJogosBackend}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar no Sistema"}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  sessionStorage.setItem('lottomath_jogos_transfer', JSON.stringify(jogosGerados));
                  sessionStorage.setItem('lottomath_modalidade_transfer', modalidade);
                  window.location.href = '/filtros';
                }}
                style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)', color: 'white' }}
              >
                Filtrar Resultados
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  const txt = jogosGerados.map(j => j.join(',')).join('\n');
                  const blob = new Blob([txt], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `fechamento-${modalidade}-${selectedNumbers.length}-dezenas.txt`;
                  a.click();
                }}
                style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)', color: 'white' }}
              >
                Exportar TXT
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {jogosGerados.map((jogo, index) => (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.4)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>#{String(index + 1).padStart(2, '0')}</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {jogo.map((num, nIdx) => (
                    <span 
                      key={nIdx} 
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                        color: '#38bdf8', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.2)' 
                      }}
                    >
                      {config.formatNumber(num)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
