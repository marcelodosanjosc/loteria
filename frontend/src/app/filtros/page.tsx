"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { loteriaApi } from '../../services/api';

export default function FiltrosPage() {
  const [modalidade, setModalidade] = useState<string>("mega-sena");
  const [jogosOriginais, setJogosOriginais] = useState<number[][]>([]);
  const [jogosFiltrados, setJogosFiltrados] = useState<number[][]>([]);
  const [hasFiltered, setHasFiltered] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Configuração dos filtros
  const [filtroPrimosMin, setFiltroPrimosMin] = useState<number>(1);
  const [filtroPrimosMax, setFiltroPrimosMax] = useState<number>(3);
  const [filtroFibMin, setFiltroFibMin] = useState<number>(0);
  const [filtroFibMax, setFiltroFibMax] = useState<number>(3);
  const [filtroParesMin, setFiltroParesMin] = useState<number>(2);
  const [filtroParesMax, setFiltroParesMax] = useState<number>(4);
  const [somaMin, setSomaMin] = useState<number>(100);
  const [somaMax, setSomaMax] = useState<number>(250);
  const [limiteConsecutivos, setLimiteConsecutivos] = useState<number>(2);

  // Configurações por modalidade
  const config = useMemo(() => {
    switch (modalidade) {
      case 'lotofacil':
        return {
          label: 'Lotofácil',
          ticketSize: 15,
          defaultPrimosMin: 4,
          defaultPrimosMax: 7,
          defaultFibMin: 3,
          defaultFibMax: 6,
          defaultParesMin: 6,
          defaultParesMax: 9,
          somaMinVal: 120,
          somaMaxVal: 270,
          defaultSomaMin: 150,
          defaultSomaMax: 240,
          defaultConsecutivos: 2,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          sampleGames: [
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 2, 4],
            [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 1, 3, 5]
          ]
        };
      case 'quina':
        return {
          label: 'Quina',
          ticketSize: 5,
          defaultPrimosMin: 1,
          defaultPrimosMax: 3,
          defaultFibMin: 0,
          defaultFibMax: 2,
          defaultParesMin: 2,
          defaultParesMax: 3,
          somaMinVal: 15,
          somaMaxVal: 390,
          defaultSomaMin: 150,
          defaultSomaMax: 250,
          defaultConsecutivos: 2,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          sampleGames: [
            [1, 2, 3, 4, 5],
            [10, 20, 30, 40, 50],
            [5, 15, 25, 35, 45],
            [12, 24, 36, 48, 60]
          ]
        };
      case 'lotomania':
        return {
          label: 'Lotomania',
          ticketSize: 50,
          defaultPrimosMin: 8,
          defaultPrimosMax: 15,
          defaultFibMin: 3,
          defaultFibMax: 8,
          defaultParesMin: 22,
          defaultParesMax: 28,
          somaMinVal: 1275,
          somaMaxVal: 3775,
          defaultSomaMin: 2200,
          defaultSomaMax: 2800,
          defaultConsecutivos: 3,
          formatNumber: (n: number) => n === 100 ? '00' : String(n).padStart(2, '0'),
          sampleGames: [
            Array.from({ length: 50 }, (_, i) => i + 1),
            Array.from({ length: 50 }, (_, i) => i * 2 + 2)
          ]
        };
      case 'dupla-sena':
        return {
          label: 'Dupla-Sena',
          ticketSize: 6,
          defaultPrimosMin: 1,
          defaultPrimosMax: 3,
          defaultFibMin: 0,
          defaultFibMax: 3,
          defaultParesMin: 2,
          defaultParesMax: 4,
          somaMinVal: 21,
          somaMaxVal: 285,
          defaultSomaMin: 100,
          defaultSomaMax: 220,
          defaultConsecutivos: 2,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          sampleGames: [
            [1, 2, 3, 4, 5, 6],
            [10, 20, 30, 40, 41, 42],
            [5, 15, 25, 35, 45, 46]
          ]
        };
      case 'mega-sena':
      default:
        return {
          label: 'Mega-Sena',
          ticketSize: 6,
          defaultPrimosMin: 1,
          defaultPrimosMax: 3,
          defaultFibMin: 0,
          defaultFibMax: 3,
          defaultParesMin: 2,
          defaultParesMax: 4,
          somaMinVal: 21,
          somaMaxVal: 345,
          defaultSomaMin: 100,
          defaultSomaMax: 250,
          defaultConsecutivos: 2,
          formatNumber: (n: number) => String(n).padStart(2, '0'),
          sampleGames: [
            [1, 2, 3, 4, 5, 6],
            [5, 10, 15, 20, 25, 30],
            [2, 3, 5, 7, 11, 13],
            [8, 14, 22, 35, 42, 57]
          ]
        };
    }
  }, [modalidade]);

  // Sincroniza estados dos filtros ao mudar a modalidade
  useEffect(() => {
    setFiltroPrimosMin(config.defaultPrimosMin);
    setFiltroPrimosMax(config.defaultPrimosMax);
    setFiltroFibMin(config.defaultFibMin);
    setFiltroFibMax(config.defaultFibMax);
    setFiltroParesMin(config.defaultParesMin);
    setFiltroParesMax(config.defaultParesMax);
    setSomaMin(config.defaultSomaMin);
    setSomaMax(config.defaultSomaMax);
    setLimiteConsecutivos(config.defaultConsecutivos);

    // Se houver jogos no sessionStorage para essa modalidade específica, usa-os
    const transfer = sessionStorage.getItem('lottomath_jogos_transfer');
    const modTransfer = sessionStorage.getItem('lottomath_modalidade_transfer');
    if (transfer && modTransfer === modalidade) {
      try {
        const parsed = JSON.parse(transfer);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJogosOriginais(parsed);
          // Limpa do sessionStorage após carregar
          sessionStorage.removeItem('lottomath_jogos_transfer');
          sessionStorage.removeItem('lottomath_modalidade_transfer');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setJogosOriginais(config.sampleGames);
    }
    setJogosFiltrados([]);
    setHasFiltered(false);
  }, [modalidade, config]);

  // Carregamento de jogos via sessionStorage em primeiro render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const transfer = sessionStorage.getItem('lottomath_jogos_transfer');
      const modTransfer = sessionStorage.getItem('lottomath_modalidade_transfer');
      if (transfer && modTransfer) {
        try {
          const parsed = JSON.parse(transfer);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setModalidade(modTransfer);
            setJogosOriginais(parsed);
            alert(`Sucesso: ${parsed.length} jogos carregados do Fechamento da ${modTransfer}!`);
          }
        } catch (err) {
          console.error("Erro ao analisar jogos transferidos:", err);
        }
      }
    }
  }, []);

  const aplicarFiltrosBackend = async () => {
    setLoading(true);
    try {
      const payloadFiltros = {
        primos: { min: filtroPrimosMin, max: filtroPrimosMax },
        fibonacci: { min: filtroFibMin, max: filtroFibMax },
        pares: { min: filtroParesMin, max: filtroParesMax },
        soma: { min: somaMin, max: somaMax },
        consecutivos_limite: limiteConsecutivos === 99 ? null : limiteConsecutivos
      };

      const res = await loteriaApi.filtrarJogos(jogosOriginais, payloadFiltros, modalidade);
      setJogosFiltrados(res);
      setHasFiltered(true);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao aplicar filtros no backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Filtros Condicionais Avançados</h2>
          <p style={{ color: '#94a3b8' }}>Exclua jogos com padrões estatísticos indesejáveis enviando-os para o processamento matemático.</p>
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
        {/* Painel de Configurações de Filtros */}
        <div className="glass-panel" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Parâmetros dos Filtros</h3>

          {/* Slider de Soma Dinâmico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>Intervalo de Somas:</span>
              <strong style={{ color: 'white' }}>{somaMin} - {somaMax}</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="range" 
                min={config.somaMinVal} 
                max={Math.floor((config.somaMinVal + config.somaMaxVal) / 2)} 
                value={somaMin} 
                onChange={(e) => setSomaMin(Number(e.target.value))} 
                style={{ flexGrow: 1 }}
              />
              <input 
                type="range" 
                min={Math.floor((config.somaMinVal + config.somaMaxVal) / 2) + 1} 
                max={config.somaMaxVal} 
                value={somaMax} 
                onChange={(e) => setSomaMax(Number(e.target.value))} 
                style={{ flexGrow: 1 }}
              />
            </div>
          </div>

          {/* Primos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>Quantidade de Primos:</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input 
                type="number" min="0" max={config.ticketSize} value={filtroPrimosMin} 
                onChange={(e) => setFiltroPrimosMin(Number(e.target.value))} 
                style={{ width: '50px', padding: '4px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
              />
              <span style={{ color: '#64748b' }}>a</span>
              <input 
                type="number" min="0" max={config.ticketSize} value={filtroPrimosMax} 
                onChange={(e) => setFiltroPrimosMax(Number(e.target.value))} 
                style={{ width: '50px', padding: '4px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Fibonacci */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>Números de Fibonacci:</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input 
                type="number" min="0" max={config.ticketSize} value={filtroFibMin} 
                onChange={(e) => setFiltroFibMin(Number(e.target.value))} 
                style={{ width: '50px', padding: '4px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
              />
              <span style={{ color: '#64748b' }}>a</span>
              <input 
                type="number" min="0" max={config.ticketSize} value={filtroFibMax} 
                onChange={(e) => setFiltroFibMax(Number(e.target.value))} 
                style={{ width: '50px', padding: '4px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Pares */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>Dezenas Pares:</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input 
                type="number" min="0" max={config.ticketSize} value={filtroParesMin} 
                onChange={(e) => setFiltroParesMin(Number(e.target.value))} 
                style={{ width: '50px', padding: '4px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
              />
              <span style={{ color: '#64748b' }}>a</span>
              <input 
                type="number" min="0" max={config.ticketSize} value={filtroParesMax} 
                onChange={(e) => setFiltroParesMax(Number(e.target.value))} 
                style={{ width: '50px', padding: '4px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
              />
            </div>
          </div>

          {/* Limite de vizinhos consecutivos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#94a3b8' }}>Limite de Dezenas Vizinhas (Consecutivos):</label>
            <select 
              value={limiteConsecutivos} 
              onChange={(e) => setLimiteConsecutivos(Number(e.target.value))}
              style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white' }}
            >
              <option value={1}>Máximo 1 (Sem consecutivos: ex: 12, 14)</option>
              <option value={2}>Máximo 2 (ex: 12, 13 é permitido)</option>
              <option value={3}>Máximo 3 (ex: 12, 13, 14 é permitido)</option>
              <option value={5}>Máximo 5</option>
              <option value={99}>Sem restrição de vizinhos consecutivos</option>
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={aplicarFiltrosBackend} 
            disabled={loading || jogosOriginais.length === 0}
            style={{ width: '100%' }}
          >
            {loading ? "Processando..." : "Filtrar Apostas"}
          </button>
        </div>

        {/* Painel de Visualização das Apostas */}
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Jogos Originais */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Jogos de Entrada ({jogosOriginais.length})</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {jogosOriginais.map((jogo, index) => (
                <div key={index} style={{ padding: '6px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', fontSize: '13px' }}>
                  {jogo.map(n => config.formatNumber(n)).join(' - ')}
                </div>
              ))}
            </div>
          </div>

          {/* Jogos Pós Filtro */}
          {hasFiltered && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderColor: '#10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                  Jogos Filtrados e Aceitos ({jogosFiltrados.length})
                </h3>
                {jogosFiltrados.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const txt = jogosFiltrados.map(j => [...j].sort((a, b) => a - b).map(n => config.formatNumber(n)).join(' ')).join('\n');
                        navigator.clipboard.writeText(txt);
                        alert(`${jogosFiltrados.length} jogos copiados em formato limpo!`);
                      }}
                      style={{ fontSize: '13px', padding: '6px 14px' }}
                    >
                      📋 Copiar Apostas
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const txt = jogosFiltrados.map(j => [...j].sort((a, b) => a - b).map(n => config.formatNumber(n)).join(' ')).join('\n');
                        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `filtrados-${modalidade}-${jogosFiltrados.length}-jogos.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white', fontSize: '13px', padding: '6px 14px' }}
                    >
                      📄 Exportar TXT
                    </button>
                  </div>
                )}
              </div>
              {jogosFiltrados.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
                  Nenhum jogo atendeu a todas as restrições selecionadas. Tente afrouxar os filtros.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {jogosFiltrados.map((jogo, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        padding: '6px 12px', 
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)', 
                        border: '1px solid rgba(16, 185, 129, 0.3)', 
                        borderRadius: '6px', 
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#34d399'
                      }}
                    >
                      {jogo.map(n => config.formatNumber(n)).join(' - ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
