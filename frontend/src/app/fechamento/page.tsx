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
  const [maxQuadrantes, setMaxQuadrantes] = useState<number>(15);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({
      show: true,
      title,
      message,
      type
    });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);


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
          maxSelect: 70, // Fechamento avançado com Monte Carlo + Quadrantes para N > 55
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
    setMaxQuadrantes(15);
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
      showToast(
        "Dezenas Insuficientes",
        `Por favor, selecione pelo menos ${config.minSelect} dezenas no volante para prosseguir.`,
        'warning'
      );
      return;
    }
    
    setLoading(true);
    try {
      const res = await loteriaApi.gerarFechamento(
        modalidade,
        selectedNumbers,
        garantia,
        condicao,
        modalidade === 'lotomania' ? maxQuadrantes : undefined
      );
      setJogosGerados(res.jogos);
      setCustoTotal(res.custo_estimado);
      
      const count = res.jogos.length;
      showToast(
        "Fechamento Gerado!",
        `O fechamento matemático da ${config.label} foi gerado com sucesso com ${count} ${count === 1 ? 'cartão otimizado' : 'cartões otimizados'}.`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Erro desconhecido ao processar fechamento no servidor.";
      showToast(
        "Erro na Geração",
        detail,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const salvarJogosBackend = async () => {
    const token = localStorage.getItem('lottomath_token');
    if (!token) {
      showToast(
        "Acesso Restrito",
        "Apenas usuários cadastrados e logados podem salvar jogos no sistema.",
        'warning'
      );
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    setSaving(true);
    try {
      await loteriaApi.salvarJogo(modalidade, "fechamento", jogosGerados);
      showToast(
        "Jogos Salvos!",
        "As combinações geradas foram salvas com sucesso na sua conta.",
        'success'
      );
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || "Erro ao salvar jogos.";
      showToast(
        "Erro ao Salvar",
        detail,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  // Exportação limpa de arquivo TXT com números separados por espaços
  const exportarTxtLimpo = () => {
    if (jogosGerados.length === 0) return;
    const txt = jogosGerados
      .map(jogo => jogo.map(n => config.formatNumber(n)).join(' '))
      .join('\n');
    
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fechamento-${modalidade}-${selectedNumbers.length}-dezenas.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(
      "Arquivo Exportado!",
      `Arquivo TXT gerado com sucesso contendo apenas os números separados por espaços (${jogosGerados.length} cartões).`,
      'success'
    );
  };

  // Copiar todas as apostas no formato limpo para a área de transferência
  const copiarApostasFormatadas = () => {
    if (jogosGerados.length === 0) return;
    const txt = jogosGerados
      .map(jogo => jogo.map(n => config.formatNumber(n)).join(' '))
      .join('\n');

    navigator.clipboard.writeText(txt);
    showToast(
      "Copiado!",
      `${jogosGerados.length} apostas copiadas para a área de transferência em formato limpo!`,
      'success'
    );
  };

  // Copiar apenas 1 jogo específico
  const copiarUnicoJogo = (jogo: number[], index: number) => {
    const txt = jogo.map(n => config.formatNumber(n)).join(' ');
    navigator.clipboard.writeText(txt);
    showToast(
      "Jogo Copiado!",
      `Cartão #${index + 1} (${txt}) copiado!`,
      'success'
    );
  };

  // Gerador rápido de Surpresinha / Seleção Aleatória
  const selecionarAleatorios = (qtdTarget?: number) => {
    const target = qtdTarget || config.minSelect;
    const disponiveis = [...numbersArray];
    const selecionados: number[] = [];
    while (selecionados.length < target && disponiveis.length > 0) {
      const randIdx = Math.floor(Math.random() * disponiveis.length);
      selecionados.push(disponiveis[randIdx]);
      disponiveis.splice(randIdx, 1);
    }
    setSelectedNumbers(selecionados.sort((a, b) => a - b));
  };

  // Métricas do Volante
  const dezenasParesCount = useMemo(() => selectedNumbers.filter(n => n % 2 === 0).length, [selectedNumbers]);
  const dezenasImparesCount = useMemo(() => selectedNumbers.filter(n => n % 2 !== 0).length, [selectedNumbers]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800 }}>Gerador de Fechamentos (Matrizes)</h2>
            <span style={{ 
              fontSize: '12px', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              backgroundColor: 'rgba(99, 102, 241, 0.15)', 
              color: '#818cf8', 
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontWeight: 700
            }}>
              {config.label}
            </span>
          </div>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>
            Otimize seus jogos cercados por garantias matemáticas de acerto, reduzindo drasticamente o custo das apostas.
          </p>
        </div>

        {/* Seletor de Modalidade */}
        <select 
          value={modalidade} 
          onChange={(e) => setModalidade(e.target.value)}
          style={{ 
            padding: '10px 20px', 
            borderRadius: '10px', 
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
              style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', fontSize: '14px' }}
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
              style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', fontSize: '14px' }}
            >
              <option value={config.drawnCount}>
                Acertando {config.drawnCount} números do sorteio
              </option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#94a3b8' }}>Dezenas Selecionadas:</span>
              <strong style={{ color: selectedNumbers.length >= config.minSelect ? '#10b981' : '#f59e0b' }}>
                {selectedNumbers.length} / {config.maxSelect} (Mín: {config.minSelect})
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Quanto mais dezenas selecionar, maior será o cerco de combinação e a garantia matemática de prêmio.
            </p>
          </div>

          {/* Controle de Quadrantes — Visível apenas para Lotomania */}
          {modalidade === 'lotomania' && (() => {
            const quadrantesOcupados = new Set(selectedNumbers.map(d => Math.floor((d - 1) / 4))).size;
            const maxSlider = Math.max(quadrantesOcupados, 10);
            const minSlider = Math.max(Math.floor(quadrantesOcupados * 0.4), 5);

            return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <label style={{ fontSize: '14px', color: '#a5b4fc', fontWeight: 600 }}>
                🔲 Filtro de Quadrantes: {maxQuadrantes} de {quadrantesOcupados} ocupados
              </label>
              <input
                type="range"
                min={minSlider}
                max={maxSlider}
                value={Math.min(maxQuadrantes, maxSlider)}
                onChange={(e) => setMaxQuadrantes(Number(e.target.value))}
                style={{ accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                <span>{minSlider} (mais restritivo)</span>
                <span>{maxSlider} (sem filtro)</span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                O volante é dividido em 25 quadrantes de 4 dezenas. Limitar os quadrantes
                elimina bilhetes com dezenas muito espalhadas.
                {selectedNumbers.length > 55 && (
                  <span style={{ display: 'block', marginTop: '4px', color: '#fbbf24', fontWeight: 600 }}>
                    ⚡ Modo avançado ativo ({selectedNumbers.length} dezenas): usando algoritmo Monte Carlo + Quadrantes.
                  </span>
                )}
              </p>
            </div>
            );
          })()}

          <button 
            className="btn btn-primary"
            onClick={gerarFechamentoBackend}
            disabled={loading || selectedNumbers.length < config.minSelect}
            style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700 }}
          >
            {loading ? "Calculando Matriz..." : "Gerar Fechamento"}
          </button>
        </div>

        {/* Volante de Seleção */}
        <div className="glass-panel" style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Volante de Seleção ({config.label})</h3>
            
            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => selecionarAleatorios(config.minSelect)}
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
                title={`Seleciona ${config.minSelect} dezenas aleatórias`}
              >
                🎲 Surpresinha ({config.minSelect})
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

          {/* Quick Stats Bar */}
          {selectedNumbers.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span>Pares: <strong style={{ color: '#38bdf8' }}>{dezenasParesCount}</strong></span>
              <span>Ímpares: <strong style={{ color: '#818cf8' }}>{dezenasImparesCount}</strong></span>
              <span>Total Marcadas: <strong style={{ color: '#34d399' }}>{selectedNumbers.length}</strong></span>
            </div>
          )}
          
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
      </div>

      {/* Seção de Resultados dos Bilhetes Gerados */}
      {jogosGerados.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Fechamento Gerado ({jogosGerados.length} Cartões)</h3>
                <span style={{ fontSize: '11px', backgroundColor: '#10b981', color: '#042f2e', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  Garantia {garantia} acertos
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                Custo total das apostas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary"
                onClick={copiarApostasFormatadas}
                title="Copiar todas as apostas em formato texto limpo (apenas números separados por espaço)"
              >
                📋 Copiar Apostas
              </button>
              <button 
                className="btn btn-secondary"
                onClick={exportarTxtLimpo}
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
                title="Baixar arquivo TXT limpo contendo apenas números separados por espaços"
              >
                📄 Exportar TXT
              </button>
              <button 
                className="btn btn-secondary"
                onClick={salvarJogosBackend}
                disabled={saving}
              >
                {saving ? "Salvando..." : "💾 Salvar"}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  sessionStorage.setItem('lottomath_jogos_transfer', JSON.stringify(jogosGerados));
                  sessionStorage.setItem('lottomath_modalidade_transfer', modalidade);
                  window.location.href = '/filtros';
                }}
                style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}
              >
                ⚙️ Filtrar Resultados
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
            {jogosGerados.map((jogo, index) => (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '10px', 
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, minWidth: '26px' }}>#{String(index + 1).padStart(2, '0')}</span>
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
                          border: '1px solid rgba(56, 189, 248, 0.25)' 
                        }}
                      >
                        {config.formatNumber(num)}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => copiarUnicoJogo(jogo, index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  title="Copiar este cartão (números por espaços)"
                >
                  📋
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estilos e Notificações Toast Premium */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toastSlideIn {
          from {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes toastSlideOut {
          from {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          to {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
        }

        @keyframes toastProgressShrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .premium-toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .premium-toast-card {
          pointer-events: auto;
          min-width: 320px;
          max-width: 420px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
          padding: 16px 20px 18px 20px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.3s ease;
        }

        .premium-toast-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .premium-toast-title-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .premium-toast-icon-wrapper {
          border-radius: 50%;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .premium-toast-icon-wrapper.success {
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .premium-toast-icon-wrapper.error {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .premium-toast-icon-wrapper.warning {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .premium-toast-title {
          font-weight: 700;
          font-size: 15px;
          color: #f8fafc;
        }

        .premium-toast-message {
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
          padding-left: 34px;
        }

        .premium-toast-close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .premium-toast-close-btn:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.08);
        }

        .premium-toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          animation: toastProgressShrink 5s linear forwards;
        }

        .premium-toast-progress.success {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .premium-toast-progress.error {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }

        .premium-toast-progress.warning {
          background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
        }
      ` }} />

      {toast.show && (
        <div className="premium-toast-container">
          <div className="premium-toast-card">
            <div className="premium-toast-header">
              <div className="premium-toast-title-container">
                <span className={`premium-toast-icon-wrapper ${toast.type}`}>
                  {toast.type === 'success' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                  {toast.type === 'error' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  )}
                  {toast.type === 'warning' && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  )}
                </span>
                <span className="premium-toast-title">{toast.title}</span>
              </div>
              <button 
                className="premium-toast-close-btn" 
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                aria-label="Fechar notificação"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="premium-toast-message">{toast.message}</div>
            <div className={`premium-toast-progress ${toast.type}`}></div>
          </div>
        </div>
      )}
    </div>
  );
}
