"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  loteriaApi,
  SmartGameItem,
  PromptTemplateItem,
  TesteCegoResponse
} from '../../services/api';
import ResponsibleGaming from '../../components/ResponsibleGaming';

interface ModalidadeConfig {
  slug: string;
  label: string;
  cor: string;
  total: number;
  padrao: number;
  maxSorteio: number;
  formatNumber: (n: number) => string;
}

const MODALIDADES: ModalidadeConfig[] = [
  {
    slug: 'lotofacil',
    label: 'Lotofácil',
    cor: '#9333ea',
    total: 25,
    padrao: 15,
    maxSorteio: 15,
    formatNumber: (n: number) => String(n).padStart(2, '0')
  },
  {
    slug: 'mega-sena',
    label: 'Mega-Sena',
    cor: '#10b981',
    total: 60,
    padrao: 6,
    maxSorteio: 6,
    formatNumber: (n: number) => String(n).padStart(2, '0')
  },
  {
    slug: 'quina',
    label: 'Quina',
    cor: '#4f46e5',
    total: 80,
    padrao: 5,
    maxSorteio: 5,
    formatNumber: (n: number) => String(n).padStart(2, '0')
  },
  {
    slug: 'lotomania',
    label: 'Lotomania',
    cor: '#ea580c',
    total: 100,
    padrao: 50,
    maxSorteio: 20,
    formatNumber: (n: number) => (n === 100 || n === 0 ? '00' : String(n).padStart(2, '0'))
  },
  {
    slug: 'dupla-sena',
    label: 'Dupla-Sena',
    cor: '#e11d48',
    total: 50,
    padrao: 6,
    maxSorteio: 6,
    formatNumber: (n: number) => String(n).padStart(2, '0')
  }
];

export default function AnaliseIAPage() {
  const [modalidade, setModalidade] = useState<string>('lotofacil');
  const [abaAtiva, setAbaAtiva] = useState<'gerador' | 'prompts' | 'teste_cego'>('gerador');

  // Estados do Gerador Inteligente
  const [amostragem, setAmostragem] = useState<number>(30);
  const [qtdJogos, setQtdJogos] = useState<number>(5);
  const [jogosGerados, setJogosGerados] = useState<SmartGameItem[]>([]);
  const [gerandoJogos, setGerandoJogos] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Estados dos Prompts
  const [templates, setTemplates] = useState<PromptTemplateItem[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState<number>(1);
  const [iaDestino, setIaDestino] = useState<string>('deepseek');
  const [promptTexto, setPromptTexto] = useState<string>('');
  const [carregandoPrompt, setCarregandoPrompt] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);

  // Estados do Teste Cego
  const [resultadoTesteCego, setResultadoTesteCego] = useState<TesteCegoResponse | null>(null);
  const [executandoTesteCego, setExecutandoTesteCego] = useState<boolean>(false);

  // Configuração ativa
  const modalidadeAtiva = useMemo(() => {
    return MODALIDADES.find((m) => m.slug === modalidade) || MODALIDADES[0];
  }, [modalidade]);

  // Carregar templates de prompts quando modalidade mudar
  useEffect(() => {
    loteriaApi
      .getPromptTemplates(modalidade)
      .then((res) => {
        setTemplates(res);
        if (res.length > 0) {
          setTemplateSelecionado(res[0].id);
        }
      })
      .catch(console.error);

    // Limpar estados específicos ao trocar de loteria
    setJogosGerados([]);
    setPromptTexto('');
    setResultadoTesteCego(null);
  }, [modalidade]);

  // Gerar jogos inteligentes
  const handleGerarJogosIA = async () => {
    setGerandoJogos(true);
    setMensagemSucesso(null);
    try {
      const res = await loteriaApi.gerarJogosIA(modalidade, {
        quantidade_jogos: qtdJogos,
        amostragem_concursos: amostragem,
      });
      setJogosGerados(res.jogos);
    } catch (err) {
      console.error("Erro ao gerar jogos:", err);
      alert("Falha ao gerar jogos inteligentes. Verifique a conexão com o servidor ou sincronize os concursos.");
    } finally {
      setGerandoJogos(false);
    }
  };

  // Gerar prompt formatado
  const handleGerarPrompt = async () => {
    setCarregandoPrompt(true);
    setCopiado(false);
    try {
      const res = await loteriaApi.exportarPromptIA(modalidade, {
        template_id: templateSelecionado,
        ia_destino: iaDestino,
        amostragem_concursos: amostragem,
        incluir_concurso_resultado: true,
      });
      setPromptTexto(res.prompt_formatado);
    } catch (err) {
      console.error("Erro ao construir prompt:", err);
      alert("Não foi possível montar o prompt. Verifique se há concursos sincronizados.");
    } finally {
      setCarregandoPrompt(false);
    }
  };

  // Copiar prompt para clipboard
  const handleCopiarPrompt = () => {
    navigator.clipboard.writeText(promptTexto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Executar teste cego
  const handleExecutarTesteCego = async () => {
    setExecutandoTesteCego(true);
    try {
      const customJogos = jogosGerados.length > 0 ? jogosGerados.map((j) => j.jogo) : undefined;
      const res = await loteriaApi.executarTesteCego(modalidade, {
        amostragem_treino: amostragem,
        jogos_gerados: customJogos,
      });
      setResultadoTesteCego(res);
    } catch (err) {
      console.error("Erro no teste cego:", err);
      alert("Falha ao executar teste cego. Certifique-se de que há pelo menos 2 concursos sincronizados.");
    } finally {
      setExecutandoTesteCego(false);
    }
  };

  // Inverter para Espelho (Lotomania)
  const handleInverterParaEspelho = (index: number) => {
    if (modalidade !== 'lotomania' || !jogosGerados[index]) return;
    const jogoAtual = new Set(jogosGerados[index].jogo);
    const espelho = [];
    for (let i = 1; i <= 100; i++) {
      if (!jogoAtual.has(i)) {
        espelho.push(i);
      }
    }
    const novosJogos = [...jogosGerados];
    novosJogos[index] = {
      ...novosJogos[index],
      jogo: espelho,
      justificativa: [
        `Cartão Espelho gerado (50 dezenas complementares às marcadas no jogo original)`,
        ...novosJogos[index].justificativa
      ]
    };
    setJogosGerados(novosJogos);
  };

  // Exportar jogos gerados para TXT
  const handleExportarTxt = () => {
    if (!jogosGerados.length) return;
    const conteudo = jogosGerados
      .map((item, idx) => {
        const nums = item.jogo.map((d) => modalidadeAtiva.formatNumber(d)).join(' ');
        return `Jogo ${idx + 1} (${modalidadeAtiva.label} - Score: ${item.score}%): ${nums}`;
      })
      .join('\n');

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lottomath_jogos_ia_${modalidade}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Salvar jogos na conta do usuário
  const handleSalvarJogos = async () => {
    if (!jogosGerados.length) return;
    try {
      const matriz = jogosGerados.map((item) => item.jogo);
      await loteriaApi.salvarJogo(modalidade, 'ia_smart', matriz);
      setMensagemSucesso(`Jogos de ${modalidadeAtiva.label} salvos com sucesso na sua conta!`);
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (err) {
      alert("Para salvar os jogos, você precisa estar autenticado no sistema.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <ResponsibleGaming />

      {/* Header Principal com Título e Seletor de Modalidade */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
            🤖 Motor de Inteligência Artificial & Estatística
          </h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Geração de Jogos Fortes com Score de Equilíbrio, Prompts Especializados (DeepSeek / ChatGPT / Gemini) e Teste Cego para todas as 5 modalidades.
          </p>
        </div>

        {/* Seletor Visual de Modalidade */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {MODALIDADES.map((m) => {
            const isAtiva = modalidade === m.slug;
            return (
              <button
                key={m.slug}
                onClick={() => setModalidade(m.slug)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: isAtiva ? `2px solid ${m.cor}` : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: isAtiva ? m.cor : '#1e293b',
                  color: isAtiva ? '#ffffff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isAtiva ? `0 4px 14px ${m.cor}40` : 'none',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Abas de Navegação das Ferramentas de IA */}
      <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '6px', borderRadius: '12px', width: 'fit-content', flexWrap: 'wrap' }}>
        <button
          onClick={() => setAbaAtiva('gerador')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: abaAtiva === 'gerador' ? '#6366f1' : 'transparent',
            color: 'white',
            transition: 'all 0.2s',
          }}
        >
          ⭐ Top Jogos Otimizados ({modalidadeAtiva.label})
        </button>
        <button
          onClick={() => setAbaAtiva('prompts')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: abaAtiva === 'prompts' ? '#10b981' : 'transparent',
            color: abaAtiva === 'prompts' ? '#0f172a' : 'white',
            transition: 'all 0.2s',
          }}
        >
          📋 Prompts Especializados ({modalidadeAtiva.label})
        </button>
        <button
          onClick={() => setAbaAtiva('teste_cego')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: abaAtiva === 'teste_cego' ? '#f59e0b' : 'transparent',
            color: abaAtiva === 'teste_cego' ? '#0f172a' : 'white',
            transition: 'all 0.2s',
          }}
        >
          🎯 Teste Cego / Auditoria ({modalidadeAtiva.label})
        </button>
      </div>

      {/* ABA 1: GERADOR INTELIGENTE DE TOP JOGOS */}
      {abaAtiva === 'gerador' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Painel de Configuração */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: modalidadeAtiva.cor, margin: 0 }}>
                ⚡ Parâmetros de Otimização Multicritério ({modalidadeAtiva.label})
              </h3>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Aposta padrão: <strong>{modalidadeAtiva.padrao} dezenas</strong> em {modalidadeAtiva.total} números
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Amostragem Temporal:
                </label>
                <select
                  value={amostragem}
                  onChange={(e) => setAmostragem(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value={30}>Últimos 30 Concursos (Recomendado)</option>
                  <option value={50}>Últimos 50 Concursos</option>
                  <option value={100}>Últimos 100 Concursos</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Quantidade de Jogos Fortes:
                </label>
                <select
                  value={qtdJogos}
                  onChange={(e) => setQtdJogos(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value={5}>5 Jogos Otimizados</option>
                  <option value={10}>10 Jogos Otimizados</option>
                  <option value={15}>15 Jogos Otimizados</option>
                  <option value={20}>20 Jogos Otimizados</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleGerarJogosIA}
                disabled={gerandoJogos}
                className="btn btn-primary"
                style={{
                  backgroundColor: modalidadeAtiva.cor,
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: gerandoJogos ? 'not-allowed' : 'pointer',
                }}
              >
                {gerandoJogos ? `Sintetizando Jogos de ${modalidadeAtiva.label}...` : `🚀 Gerar Top Jogos (${modalidadeAtiva.label})`}
              </button>

              {jogosGerados.length > 0 && (
                <>
                  <button
                    onClick={handleExportarTxt}
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', fontSize: '14px' }}
                  >
                    📄 Baixar .TXT
                  </button>
                  <button
                    onClick={handleSalvarJogos}
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', fontSize: '14px', backgroundColor: '#065f46', color: '#34d399' }}
                  >
                    💾 Salvar no Perfil
                  </button>
                </>
              )}
            </div>

            {mensagemSucesso && (
              <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '13px' }}>
                ✓ {mensagemSucesso}
              </div>
            )}
          </div>

          {/* Lista de Jogos Gerados com Cards e Justificativas */}
          {jogosGerados.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>
                🏆 Combinações Selecionadas com Maior Score de Equilíbrio ({modalidadeAtiva.label})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {jogosGerados.map((item, idx) => (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      borderLeft: `5px solid ${item.score >= 90 ? '#10b981' : item.score >= 80 ? '#38bdf8' : '#f59e0b'}`,
                    }}
                  >
                    {/* Header do Jogo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800 }}>Jogo #{idx + 1}</span>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 800,
                            backgroundColor: item.score >= 90 ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)',
                            color: item.score >= 90 ? '#34d399' : '#38bdf8',
                          }}
                        >
                          Score Estatístico: {item.score}%
                        </span>

                        {modalidade === 'lotomania' && (
                          <button
                            onClick={() => handleInverterParaEspelho(idx)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(234, 88, 12, 0.2)',
                              color: '#fb923c',
                              border: '1px solid rgba(234, 88, 12, 0.4)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            🔄 Inverter para Espelho
                          </button>
                        )}
                      </div>

                      {/* Métricas Rápidas Dinâmicas */}
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                        {item.metricas.moldura !== undefined && (
                          <span>Moldura: <strong>{item.metricas.moldura}</strong></span>
                        )}
                        {item.metricas.quadrantes !== undefined && (
                          <span>Quadrantes: <strong>{item.metricas.quadrantes}</strong></span>
                        )}
                        {item.metricas.linhas !== undefined && (
                          <span>Linhas/Cols: <strong>{item.metricas.linhas}L/{item.metricas.colunas}C</strong></span>
                        )}
                        <span>Pares/Ímpares: <strong>{item.metricas.pares}P/{item.metricas.impares}I</strong></span>
                        <span>Soma: <strong>{item.metricas.soma}</strong></span>
                        <span>Repetidas: <strong>{item.metricas.repetidas_anterior}</strong></span>
                      </div>
                    </div>

                    {/* Bolas do Jogo (Adaptativas por modalidade) */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: modalidade === 'lotomania' ? '4px' : '8px' }}>
                      {item.jogo.map((d) => (
                        <span
                          key={d}
                          className="lottery-ball active"
                          style={{
                            width: modalidade === 'lotomania' ? '28px' : '38px',
                            height: modalidade === 'lotomania' ? '28px' : '38px',
                            fontSize: modalidade === 'lotomania' ? '11px' : '14px',
                            backgroundColor: modalidadeAtiva.cor,
                          }}
                        >
                          {modalidadeAtiva.formatNumber(d)}
                        </span>
                      ))}
                    </div>

                    {/* Justificativa Analítica */}
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                        🧠 Por que esta combinação foi escolhida?
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                        {item.justificativa.map((just, jIdx) => (
                          <li key={jIdx}>{just}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: CONSTRUTOR DE PROMPTS ESPECIALIZADOS */}
      {abaAtiva === 'prompts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
              📋 Prompts Especializados com Dados Reais da {modalidadeAtiva.label}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Selecione o arquétipo analítico e a IA de destino (DeepSeek, ChatGPT ou Gemini). Os sorteios oficiais e as métricas da {modalidadeAtiva.label} são injetados automaticamente no prompt!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Template */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Template Analítico:
                </label>
                <select
                  value={templateSelecionado}
                  onChange={(e) => setTemplateSelecionado(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    fontSize: '13px',
                  }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} - {t.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* IA Destino */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  IA de Destino:
                </label>
                <select
                  value={iaDestino}
                  onChange={(e) => setIaDestino(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    fontSize: '13px',
                  }}
                >
                  <option value="deepseek">DeepSeek (V3 / R1)</option>
                  <option value="chatgpt">ChatGPT (GPT-4o / o1)</option>
                  <option value="gemini">Google Gemini (1.5 / 2.0)</option>
                </select>
              </div>

              {/* Amostragem */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Amostragem no Prompt:
                </label>
                <select
                  value={amostragem}
                  onChange={(e) => setAmostragem(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: 'white',
                    fontSize: '13px',
                  }}
                >
                  <option value={30}>30 Concursos Recentes</option>
                  <option value={50}>50 Concursos Recentes</option>
                  <option value={100}>100 Concursos Recentes</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleGerarPrompt}
                disabled={carregandoPrompt}
                className="btn btn-primary"
                style={{ backgroundColor: '#10b981', color: '#0f172a', fontWeight: 700 }}
              >
                {carregandoPrompt ? 'Construindo Prompt...' : '✨ Gerar Prompt Formatado'}
              </button>

              <a
                href={loteriaApi.getExportarCsvUrl(modalidade, amostragem)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                📥 Baixar CSV de Dados ({modalidadeAtiva.label})
              </a>
            </div>
          </div>

          {/* Área de Visualização do Prompt */}
          {promptTexto && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Prompt Especializado da {modalidadeAtiva.label} Pronto para Copiar:
                </h4>
                <button
                  onClick={handleCopiarPrompt}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: copiado ? '#10b981' : '#6366f1',
                    fontSize: '13px',
                    padding: '6px 16px',
                  }}
                >
                  {copiado ? '✓ Copiado com Sucesso!' : '📋 Copiar Prompt'}
                </button>
              </div>

              <textarea
                readOnly
                value={promptTexto}
                rows={16}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ABA 3: SIMULADOR DE TESTE CEGO */}
      {abaAtiva === 'teste_cego' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
              🎯 Auditoria por Teste Cego: {modalidadeAtiva.label}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              O sistema oculta o concurso mais recente da {modalidadeAtiva.label} e treina o gerador com os {amostragem} concursos anteriores. Em seguida, os jogos são conferidos automaticamente contra as faixas oficiais de premiação da Caixa!
            </p>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleExecutarTesteCego}
                disabled={executandoTesteCego}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#0f172a',
                  fontWeight: 700,
                  padding: '12px 24px',
                }}
              >
                {executandoTesteCego ? 'Auditando Resultados...' : `▶️ Executar Teste Cego (${modalidadeAtiva.label})`}
              </button>
            </div>
          </div>

          {/* Resultado do Teste Cego */}
          {resultadoTesteCego && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Card do Concurso Auditado */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderColor: '#f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    {modalidadeAtiva.label}: Concurso #{resultadoTesteCego.concurso_auditado} ({resultadoTesteCego.data_sorteio})
                  </h4>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {resultadoTesteCego.total_jogos_testados} cartões auditados
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: modalidade === 'lotomania' ? '4px' : '8px' }}>
                  {resultadoTesteCego.dezenas_sorteadas.map((d) => (
                    <span
                      key={d}
                      className="lottery-ball drawn"
                      style={{
                        width: modalidade === 'lotomania' ? '28px' : '36px',
                        height: modalidade === 'lotomania' ? '28px' : '36px',
                        fontSize: modalidade === 'lotomania' ? '11px' : '13px',
                      }}
                    >
                      {modalidadeAtiva.formatNumber(d)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cartões e Desempenho Auditado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resultadoTesteCego.jogos_resultados.map((item, idx) => (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      borderLeft: `5px solid ${item.premiado ? '#10b981' : '#64748b'}`,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700 }}>Cartão #{idx + 1}</span>
                        {item.premiado ? (
                          <span style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '12px', fontWeight: 800 }}>
                            🎉 Premiado: {item.faixa_premio}
                          </span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(100,116,139,0.2)', color: '#94a3b8', fontSize: '12px' }}>
                            {item.acertos} Acertos
                          </span>
                        )}

                        {/* Detalhe do Espelho na Lotomania */}
                        {item.espelho_acertos !== undefined && (
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              backgroundColor: item.espelho_premiado ? 'rgba(234,88,12,0.25)' : 'rgba(100,116,139,0.2)',
                              color: item.espelho_premiado ? '#fb923c' : '#94a3b8',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            🔄 Espelho: {item.espelho_acertos} acertos {item.espelho_premiado ? `(🎉 ${item.espelho_faixa})` : ''}
                          </span>
                        )}
                      </div>

                      {/* Dezenas com Destaque de Acerto */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: modalidade === 'lotomania' ? '4px' : '6px' }}>
                        {item.jogo.map((d) => {
                          const acertou = item.dezenas_acertadas.includes(d);
                          return (
                            <span
                              key={d}
                              style={{
                                width: modalidade === 'lotomania' ? '26px' : '32px',
                                height: modalidade === 'lotomania' ? '26px' : '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: modalidade === 'lotomania' ? '10px' : '12px',
                                fontWeight: 700,
                                backgroundColor: acertou ? '#10b981' : '#1e293b',
                                color: acertou ? '#0f172a' : '#64748b',
                                border: acertou ? 'none' : '1px solid rgba(255,255,255,0.1)',
                              }}
                            >
                              {modalidadeAtiva.formatNumber(d)}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: item.premiado ? '#10b981' : '#cbd5e1' }}>
                        {item.acertos} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {modalidadeAtiva.maxSorteio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
