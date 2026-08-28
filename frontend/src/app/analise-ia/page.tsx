"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  loteriaApi,
  SmartGameItem,
  PromptTemplateItem,
  TesteCegoResponse
} from '../../services/api';
import ResponsibleGaming from '../../components/ResponsibleGaming';

export default function AnaliseIAPage() {
  const [modalidade, setModalidade] = useState<string>("lotofacil");
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
  const [copiadoPrompt, setCopiadoPrompt] = useState<boolean>(false);

  // Estados do Teste Cego
  const [resultadoTesteCego, setResultadoTesteCego] = useState<TesteCegoResponse | null>(null);
  const [executandoTesteCego, setExecutandoTesteCego] = useState<boolean>(false);

  // Configuração por modalidade
  const modalidadeConfig = useMemo(() => {
    switch (modalidade) {
      case 'mega-sena':
        return { label: 'Mega-Sena', ticketSize: 6, total: 60 };
      case 'quina':
        return { label: 'Quina', ticketSize: 5, total: 80 };
      case 'lotomania':
        return { label: 'Lotomania', ticketSize: 50, total: 100 };
      case 'dupla-sena':
        return { label: 'Dupla-Sena', ticketSize: 6, total: 50 };
      case 'lotofacil':
      default:
        return { label: 'Lotofácil', ticketSize: 15, total: 25 };
    }
  }, [modalidade]);

  // Formatação de dezena padronizada
  const formatarNumeroDezena = (n: number, mod: string) => {
    if (mod === 'lotomania' && n === 100) return '00';
    return String(n).padStart(2, '0');
  };

  // Construtor de texto limpo (apenas dezenas separadas por espaço, uma aposta por linha)
  const formatarJogosTextoLimpo = (jogos: SmartGameItem[], mod: string) => {
    return jogos
      .map((item) => {
        const ordenadas = [...item.jogo].sort((a, b) => a - b);
        return ordenadas.map((d) => formatarNumeroDezena(d, mod)).join(' ');
      })
      .join('\n');
  };

  // Carregar templates de prompts ao montar
  useEffect(() => {
    loteriaApi.getPromptTemplates().then((res) => {
      setTemplates(res);
    }).catch(console.error);
  }, []);

  // Reseta estados transitórios ao trocar modalidade
  const handleTrocarModalidade = (novaModalidade: string) => {
    setModalidade(novaModalidade);
    setJogosGerados([]);
    setResultadoTesteCego(null);
    setPromptTexto('');
    setMensagemSucesso(null);
  };

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
      alert("Falha ao gerar jogos inteligentes. Verifique a conexão com o servidor.");
    } finally {
      setGerandoJogos(false);
    }
  };

  // Exportar jogos gerados para TXT (Formato Limpo)
  const handleExportarTxt = () => {
    if (!jogosGerados.length) return;
    const txt = formatarJogosTextoLimpo(jogosGerados, modalidade);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lottomath_jogos_ia_${modalidade}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setMensagemSucesso(`Arquivo TXT exportado com sucesso (${jogosGerados.length} apostas no formato limpo)!`);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  // Copiar apostas formatadas para o Clipboard
  const handleCopiarApostas = () => {
    if (!jogosGerados.length) return;
    const txt = formatarJogosTextoLimpo(jogosGerados, modalidade);
    navigator.clipboard.writeText(txt);
    setMensagemSucesso(`✓ ${jogosGerados.length} apostas copiadas para a área de transferência em formato limpo!`);
    setTimeout(() => setMensagemSucesso(null), 3500);
  };

  // Salvar jogos na conta do usuário
  const handleSalvarJogos = async () => {
    if (!jogosGerados.length) return;
    try {
      const matriz = jogosGerados.map((item) => item.jogo);
      await loteriaApi.salvarJogo(modalidade, 'ia_smart', matriz);
      setMensagemSucesso("Jogos salvos com sucesso na sua conta!");
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (err) {
      alert("Para salvar os jogos, você precisa estar autenticado.");
    }
  };

  // Gerar prompt formatado
  const handleGerarPrompt = async () => {
    setCarregandoPrompt(true);
    setCopiadoPrompt(false);
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
    } finally {
      setCarregandoPrompt(false);
    }
  };

  // Copiar prompt para clipboard
  const handleCopiarPrompt = () => {
    navigator.clipboard.writeText(promptTexto);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 2500);
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
      alert("Falha ao executar teste cego.");
    } finally {
      setExecutandoTesteCego(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <ResponsibleGaming />

      {/* Header Principal com Seletor de Modalidade */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
              🤖 Motor de Inteligência Artificial & Estatística
            </h2>
            <span style={{ 
              fontSize: '12px', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              backgroundColor: 'rgba(99, 102, 241, 0.15)', 
              color: '#818cf8', 
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontWeight: 700
            }}>
              {modalidadeConfig.label}
            </span>
          </div>
          <p style={{ color: '#94a3b8', marginTop: '6px' }}>
            Geração de Jogos Fortes com Score de Equilíbrio, Prompts Especializados (DeepSeek / ChatGPT / Gemini) e Simulador de Teste Cego.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Seletor de Modalidade */}
          <select 
            value={modalidade} 
            onChange={(e) => handleTrocarModalidade(e.target.value)}
            style={{ 
              padding: '10px 18px', 
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

          {/* Abas de Navegação */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#1e293b', padding: '6px', borderRadius: '10px' }}>
            <button
              onClick={() => setAbaAtiva('gerador')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: abaAtiva === 'gerador' ? '#6366f1' : 'transparent',
                color: 'white',
                transition: 'all 0.2s',
              }}
            >
              ⭐ Top Jogos Otimizados
            </button>
            <button
              onClick={() => setAbaAtiva('prompts')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: abaAtiva === 'prompts' ? '#10b981' : 'transparent',
                color: abaAtiva === 'prompts' ? '#0f172a' : 'white',
                transition: 'all 0.2s',
              }}
            >
              📋 Copiador de Prompts IA
            </button>
            <button
              onClick={() => setAbaAtiva('teste_cego')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: abaAtiva === 'teste_cego' ? '#f59e0b' : 'transparent',
                color: abaAtiva === 'teste_cego' ? '#0f172a' : 'white',
                transition: 'all 0.2s',
              }}
            >
              🎯 Teste Cego (Backtesting)
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: GERADOR INTELIGENTE DE TOP JOGOS */}
      {abaAtiva === 'gerador' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Painel de Configuração */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#6366f1' }}>
              ⚡ Parâmetros de Otimização Multicritério ({modalidadeConfig.label})
            </h3>

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
                  <option value={500}>Últimos 500 Concursos</option>
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
                  <option value={5}>5 Jogos Equilibrados</option>
                  <option value={10}>10 Jogos Equilibrados</option>
                  <option value={15}>15 Jogos Equilibrados</option>
                  <option value={20}>20 Jogos Equilibrados</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleGerarJogosIA}
                disabled={gerandoJogos}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#6366f1',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: gerandoJogos ? 'not-allowed' : 'pointer',
                }}
              >
                {gerandoJogos ? `Sintetizando Jogos de ${modalidadeConfig.label}...` : `🚀 Gerar Top Jogos (${modalidadeConfig.label})`}
              </button>

              {jogosGerados.length > 0 && (
                <>
                  <button
                    onClick={handleCopiarApostas}
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', fontSize: '14px' }}
                  >
                    📋 Copiar Apostas
                  </button>
                  <button
                    onClick={handleExportarTxt}
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', fontSize: '14px', backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
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
              <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '13px', fontWeight: 600 }}>
                {mensagemSucesso}
              </div>
            )}
          </div>

          {/* Lista de Jogos Gerados com Cards e Justificativas */}
          {jogosGerados.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>
                🏆 Combinações Selecionadas com Maior Score ({modalidadeConfig.label})
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
                      borderLeft: `4px solid ${item.score >= 90 ? '#10b981' : item.score >= 80 ? '#38bdf8' : '#f59e0b'}`,
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
                          Score: {item.score}%
                        </span>
                      </div>

                      {/* Métricas Rápidas */}
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
                        {item.metricas.moldura > 0 && (
                          <span>Moldura: <strong>{item.metricas.moldura}</strong></span>
                        )}
                        <span>Pares: <strong>{item.metricas.pares}P/{item.metricas.impares}I</strong></span>
                        <span>Soma: <strong>{item.metricas.soma}</strong></span>
                        <span>Repetidas: <strong>{item.metricas.repetidas_anterior}</strong></span>
                        {item.metricas.primos !== undefined && (
                          <span>Primos: <strong>{item.metricas.primos}</strong></span>
                        )}
                      </div>
                    </div>

                    {/* Bolas Sorteadas */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {[...item.jogo].sort((a, b) => a - b).map((d) => (
                        <span
                          key={d}
                          className="lottery-ball active"
                          style={{ width: '38px', height: '38px', fontSize: '14px' }}
                        >
                          {formatarNumeroDezena(d, modalidade)}
                        </span>
                      ))}
                    </div>

                    {/* Justificativa Analítica */}
                    {item.justificativa && item.justificativa.length > 0 && (
                      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                          🧠 Por que esta combinação é estatisticamente forte?
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                          {item.justificativa.map((just, jIdx) => (
                            <li key={jIdx}>{just}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: COPIADOR DE PROMPTS PARA IA */}
      {abaAtiva === 'prompts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
              📋 Construtor de Prompts Estruturados ({modalidadeConfig.label})
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              Selecione o modelo analítico e a IA de destino (DeepSeek, ChatGPT ou Gemini). O sistema injeta automaticamente a tabela dos concursos recentes da {modalidadeConfig.label} no prompt para você colar e rodar!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Template */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Template da Apostila:
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
                {carregandoPrompt ? 'Montando Prompt...' : '✨ Gerar Prompt Formatado'}
              </button>

              <a
                href={loteriaApi.getExportarCsvUrl(modalidade, amostragem)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                📥 Baixar CSV de Dados ({modalidadeConfig.label})
              </a>
            </div>
          </div>

          {/* Área de Visualização do Prompt */}
          {promptTexto && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Prompt Pronto para Copiar:</h4>
                <button
                  onClick={handleCopiarPrompt}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: copiadoPrompt ? '#10b981' : '#6366f1',
                    fontSize: '13px',
                    padding: '6px 16px',
                  }}
                >
                  {copiadoPrompt ? '✓ Copiado com Sucesso!' : '📋 Copiar Prompt'}
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
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>
              🎯 Auditoria por Teste Cego ({modalidadeConfig.label})
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              O teste cego remove o concurso mais recente da base de análise da {modalidadeConfig.label} e utiliza os {amostragem} concursos anteriores para gerar os jogos. Em seguida, confere automaticamente quantos pontos os cartões teriam alcançado no resultado oficial!
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
                {executandoTesteCego ? 'Auditando...' : `▶️ Executar Teste Cego (${modalidadeConfig.label})`}
              </button>
            </div>
          </div>

          {/* Resultado do Teste Cego */}
          {resultadoTesteCego && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Card do Concurso Auditado */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderColor: '#f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 700 }}>
                    Resultado Auditado: Concurso #{resultadoTesteCego.concurso_auditado} ({resultadoTesteCego.data_sorteio})
                  </h4>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {resultadoTesteCego.total_jogos_testados} cartões auditados
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[...resultadoTesteCego.dezenas_sorteadas].sort((a, b) => a - b).map((d) => (
                    <span key={d} className="lottery-ball drawn" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                      {formatarNumeroDezena(d, modalidade)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cartões e Desempenho */}
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
                      borderLeft: `4px solid ${item.premiado ? '#10b981' : '#64748b'}`,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700 }}>Cartão #{idx + 1}</span>
                        {item.premiado ? (
                          <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '12px', fontWeight: 700 }}>
                            🎉 Premiado: {item.faixa_premio}
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(100,116,139,0.2)', color: '#94a3b8', fontSize: '12px' }}>
                            {item.acertos} Acertos
                          </span>
                        )}
                      </div>

                      {/* Dezenas com Destaque de Acerto */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {[...item.jogo].sort((a, b) => a - b).map((d) => {
                          const acertou = item.dezenas_acertadas.includes(d);
                          return (
                            <span
                              key={d}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor: acertou ? '#10b981' : '#1e293b',
                                color: acertou ? '#0f172a' : '#64748b',
                                border: acertou ? 'none' : '1px solid rgba(255,255,255,0.1)',
                              }}
                            >
                              {formatarNumeroDezena(d, modalidade)}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: item.premiado ? '#10b981' : '#cbd5e1' }}>
                        {item.acertos} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {modalidadeConfig.ticketSize}</span>
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
