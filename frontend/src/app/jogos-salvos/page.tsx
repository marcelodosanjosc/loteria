"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loteriaApi, JogoUsuarioResponse } from "../../services/api";
import {
  MODALIDADES_CONFIG,
  parseJogosExternos,
  formatarDezenaModalidade,
  inferirSlugPorNome,
} from "../../utils/externalGamesParser";

const TIPO_LABEL: Record<string, { texto: string; bg: string; color: string }> = {
  fechamento: { texto: "Fechamento", bg: "rgba(99, 102, 241, 0.16)", color: "#818cf8" },
  ia_smart: { texto: "IA Smart", bg: "rgba(168, 85, 247, 0.16)", color: "#c084fc" },
  externo: { texto: "Externo / IA", bg: "rgba(56, 189, 248, 0.16)", color: "#38bdf8" },
  manual: { texto: "Manual", bg: "rgba(245, 158, 11, 0.16)", color: "#fbbf24" },
  filtrado: { texto: "Filtrado", bg: "rgba(16, 185, 129, 0.16)", color: "#34d399" },
  aleatorio: { texto: "Aleatório", bg: "rgba(148, 163, 184, 0.16)", color: "#cbd5e1" },
};

export default function JogosSalvosPage() {
  const router = useRouter();

  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [jogos, setJogos] = useState<JogoUsuarioResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  // Estado do Modal (Criar / Editar Lote)
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [editandoLoteId, setEditandoLoteId] = useState<string | null>(null);
  const [modalidadeSlug, setModalidadeSlug] = useState<string>("mega-sena");
  const [tipoGeracao, setTipoGeracao] = useState<"externo" | "manual">("externo");
  const [abaAtiva, setAbaAtiva] = useState<"colar" | "volante">("colar");
  const [textoColado, setTextoColado] = useState<string>("");
  const [dezenasVolante, setDezenasVolante] = useState<number[]>([]);
  const [loteEmMontagem, setLoteEmMontagem] = useState<number[][]>([]);
  const [salvandoModal, setSalvandoModal] = useState<boolean>(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const configAtual = MODALIDADES_CONFIG[modalidadeSlug] || MODALIDADES_CONFIG["mega-sena"];
  const resultadoParse = useMemo(
    () => parseJogosExternos(textoColado, modalidadeSlug),
    [textoColado, modalidadeSlug]
  );

  const abrirModalNovo = (
    slugInicial = "mega-sena",
    origemInicial: "externo" | "manual" = "externo",
    abaInicial: "colar" | "volante" = "colar"
  ) => {
    setEditandoLoteId(null);
    setModalidadeSlug(slugInicial);
    setTipoGeracao(origemInicial);
    setAbaAtiva(abaInicial);
    setTextoColado("");
    setDezenasVolante([]);
    setLoteEmMontagem([]);
    setErroModal(null);
    setModalAberto(true);
  };

  useEffect(() => {
    const token = localStorage.getItem("lottomath_token");
    if (!token) {
      setAutenticado(false);
      setError("Apenas usuários autenticados podem visualizar seus jogos salvos. Por favor, faça login.");
      setLoading(false);
      return;
    }

    setAutenticado(true);

    const params = new URLSearchParams(window.location.search);
    if (params.get("novo") === "1") {
      const modParam = params.get("modalidade") || "mega-sena";
      const slugValido = MODALIDADES_CONFIG[modParam] ? modParam : "mega-sena";
      abrirModalNovo(slugValido, "externo", "colar");
    }

    const fetchJogos = async () => {
      try {
        const res = await loteriaApi.listarJogos();
        setJogos(res);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.detail || "Erro ao carregar seus jogos do servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchJogos();
  }, []);

  useEffect(() => {
    if (!modalAberto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalAberto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalAberto]);

  const abrirModalEdicao = (item: JogoUsuarioResponse) => {
    const slug = item.modalidade_slug || inferirSlugPorNome(item.modalidade_nome);
    setEditandoLoteId(item.id);
    setModalidadeSlug(slug);
    setTipoGeracao(item.tipo_geracao === "manual" ? "manual" : "externo");
    setAbaAtiva("volante");
    setTextoColado("");
    setDezenasVolante([]);
    setLoteEmMontagem(item.jogos.map((c) => [...c]));
    setErroModal(null);
    setModalAberto(true);
  };

  const handleTrocarModalidadeModal = (novoSlug: string) => {
    if (editandoLoteId) return;
    setModalidadeSlug(novoSlug);
    setDezenasVolante([]);
    setLoteEmMontagem([]);
    setErroModal(null);
  };

  const toggleDezenaVolante = (num: number) => {
    setErroModal(null);
    if (dezenasVolante.includes(num)) {
      setDezenasVolante(dezenasVolante.filter((d) => d !== num));
      return;
    }
    if (dezenasVolante.length >= configAtual.maxDezenas) {
      setErroModal(`Máximo de ${configAtual.maxDezenas} dezenas atingido para ${configAtual.nome}.`);
      return;
    }
    setDezenasVolante([...dezenasVolante, num].sort((a, b) => a - b));
  };

  const completarVolanteAleatorio = () => {
    setErroModal(null);
    const alvo = Math.max(configAtual.minDezenas, dezenasVolante.length);
    const conjunto = new Set<number>(dezenasVolante);
    while (conjunto.size < alvo) {
      conjunto.add(Math.floor(Math.random() * configAtual.totalDezenasGlobo) + 1);
    }
    setDezenasVolante(Array.from(conjunto).sort((a, b) => a - b));
  };

  const adicionarCartaoDoVolante = () => {
    if (dezenasVolante.length < configAtual.minDezenas || dezenasVolante.length > configAtual.maxDezenas) {
      setErroModal(`Selecione pelo menos ${configAtual.minDezenas} dezenas antes de adicionar o cartão.`);
      return;
    }
    setLoteEmMontagem((prev) => [...prev, [...dezenasVolante].sort((a, b) => a - b)]);
    setDezenasVolante([]);
    setErroModal(null);
  };

  const adicionarValidosDoTextoAoLote = () => {
    if (resultadoParse.validos.length === 0) {
      setErroModal("Nenhum cartão válido encontrado no texto colado.");
      return;
    }
    setLoteEmMontagem((prev) => [...prev, ...resultadoParse.validos]);
    setTextoColado("");
    setErroModal(null);
  };

  const handleSalvarLoteModal = async () => {
    // Se colou texto válido e clicou direto em Salvar, inclui os cartões válidos automaticamente
    const cartoesFinais =
      loteEmMontagem.length > 0
        ? loteEmMontagem
        : abaAtiva === "colar" && resultadoParse.validos.length > 0
        ? resultadoParse.validos
        : [];

    if (cartoesFinais.length === 0) {
      setErroModal("Adicione pelo menos 1 cartão válido ao lote antes de salvar.");
      return;
    }

    try {
      setSalvandoModal(true);
      setErroModal(null);
      if (editandoLoteId) {
        const atualizado = await loteriaApi.atualizarJogo(editandoLoteId, cartoesFinais, tipoGeracao);
        setJogos((prev) => prev.map((j) => (j.id === editandoLoteId ? atualizado : j)));
      } else {
        const criado = await loteriaApi.salvarJogo(modalidadeSlug, tipoGeracao, cartoesFinais);
        setJogos((prev) => [criado, ...prev]);
      }
      setModalAberto(false);
    } catch (err: any) {
      setErroModal(err.response?.data?.detail || "Erro ao salvar os jogos. Verifique os dados informados.");
    } finally {
      setSalvandoModal(false);
    }
  };

  const handleDeletarLote = async (item: JogoUsuarioResponse) => {
    const nomeLoteria = item.modalidade_nome || "Loteria";
    if (!window.confirm(`Deseja realmente excluir este lote de ${item.jogos.length} jogo(s) de ${nomeLoteria}?`)) {
      return;
    }
    try {
      await loteriaApi.deletarJogo(item.id);
      setJogos((prev) => prev.filter((j) => j.id !== item.id));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erro ao excluir o lote.");
    }
  };

  const handleEnviarParaFiltros = (item: JogoUsuarioResponse) => {
    const slug = item.modalidade_slug || inferirSlugPorNome(item.modalidade_nome);
    sessionStorage.setItem("lottomath_jogos_transfer", JSON.stringify(item.jogos));
    sessionStorage.setItem("lottomath_modalidade_transfer", slug);
    router.push("/filtros");
  };

  const resolverSlugItem = (item: JogoUsuarioResponse) => {
    if (item.modalidade_slug) return item.modalidade_slug;
    if (item.modalidade_nome) return inferirSlugPorNome(item.modalidade_nome);
    if (item.jogos.length > 0) {
      const n = item.jogos[0].length;
      if (n === 15) return "lotofacil";
      if (n === 5) return "quina";
      if (n === 50) return "lotomania";
    }
    return "mega-sena";
  };

  const exportarParaTxt = (jogo: JogoUsuarioResponse) => {
    const slug = resolverSlugItem(jogo);
    const txt = jogo.jogos
      .map((j) => j.map((n) => formatarDezenaModalidade(n, slug)).join(" "))
      .join("\n");
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jogos-${jogo.tipo_geracao}-${jogo.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiarApostas = (jogo: JogoUsuarioResponse) => {
    const slug = resolverSlugItem(jogo);
    const txt = jogo.jogos
      .map((j) => j.map((n) => formatarDezenaModalidade(n, slug)).join(" "))
      .join("\n");
    navigator.clipboard.writeText(txt);
    setCopiadoId(jogo.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const formatarData = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
        Carregando seus jogos salvos...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <div
          className="glass-panel"
          style={{ maxWidth: "420px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <p style={{ color: "#f87171", fontSize: "15px" }}>{error}</p>
          {autenticado === false && (
            <a href="/login" className="btn btn-primary">
              Fazer Login
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Meus Jogos Salvos</h2>
          <p style={{ color: "#94a3b8" }}>
            Gerencie fechamentos, salve palpites gerados fora do sistema (ChatGPT, DeepSeek, bolões) ou preencha no volante.
          </p>
        </div>

        <button
          type="button"
          onClick={() => abrirModalNovo("mega-sena", "externo", "colar")}
          className="btn btn-primary"
          style={{ padding: "12px 20px", fontWeight: 700 }}
        >
          + Adicionar / Preencher Jogos
        </button>
      </div>

      {jogos.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "56px 20px", color: "#94a3b8" }}>
          <p style={{ marginBottom: "20px", fontSize: "15px" }}>
            Você ainda não salvou nenhum jogo. Cole números gerados por fora, preencha manualmente no volante ou gere em Fechamentos / IA.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => abrirModalNovo("mega-sena", "externo", "colar")}
              className="btn btn-primary"
            >
              + Adicionar / Preencher Jogos
            </button>
            <a href="/fechamento" className="btn btn-secondary">
              Ir para Fechamentos
            </a>
            <a href="/analise-ia" className="btn btn-secondary">
              Ir para IA &amp; Prompts
            </a>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {jogos.map((jogo) => {
            const slug = resolverSlugItem(jogo);
            const badge = TIPO_LABEL[jogo.tipo_geracao] || {
              texto: jogo.tipo_geracao,
              bg: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
            };
            const estaExpandido = !!expandidos[jogo.id];
            const cartoesVisiveis = estaExpandido ? jogo.jogos : jogo.jogos.slice(0, 3);

            return (
              <div key={jogo.id} className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                        {jogo.modalidade_nome || MODALIDADES_CONFIG[slug]?.nome || "Loteria"}
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          backgroundColor: badge.bg,
                          color: badge.color,
                          padding: "3px 9px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                          fontWeight: 700,
                        }}
                      >
                        {badge.texto}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                      Salvo em: {formatarData(jogo.criado_em)} • <strong>{jogo.jogos.length} cartão(ões)</strong>
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => copiarApostas(jogo)}
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    >
                      {copiadoId === jogo.id ? "✓ Copiado!" : "📋 Copiar"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => exportarParaTxt(jogo)}
                      style={{ padding: "8px 12px", fontSize: "13px", backgroundColor: "#059669", borderColor: "#10b981", color: "white" }}
                    >
                      📄 TXT
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleEnviarParaFiltros(jogo)}
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    >
                      🔬 Filtrar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => abrirModalEdicao(jogo)}
                      style={{ padding: "8px 12px", fontSize: "13px" }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDeletarLote(jogo)}
                      style={{ padding: "8px 12px", fontSize: "13px", color: "#f87171", borderColor: "rgba(248, 113, 113, 0.35)" }}
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {cartoesVisiveis.map((cartao, cIdx) => (
                    <div key={cIdx} style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", minWidth: "34px" }}>#{cIdx + 1}</span>
                      {cartao.map((n, nIdx) => (
                        <span
                          key={nIdx}
                          style={{
                            fontSize: "12px",
                            background: "#1e293b",
                            border: "1px solid #334155",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            color: "#f8fafc",
                            fontWeight: 600,
                          }}
                        >
                          {formatarDezenaModalidade(n, slug)}
                        </span>
                      ))}
                    </div>
                  ))}

                  {jogo.jogos.length > 3 && (
                    <div style={{ marginTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => setExpandidos((prev) => ({ ...prev, [jogo.id]: !prev[jogo.id] }))}
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {estaExpandido
                          ? "▲ Recolher cartões"
                          : `▼ Ver todos os ${jogo.jogos.length} cartões (+${jogo.jogos.length - 3})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      {modalAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-jogos-titulo"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 8, 17, 0.84)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "820px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "24px",
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px" }}>
              <h3 id="modal-jogos-titulo" style={{ fontSize: "20px", fontWeight: 800 }}>
                {editandoLoteId ? "✏️ Editar Lote de Jogos" : "➕ Adicionar / Preencher Jogos"}
              </h3>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: "13px" }}
              >
                ✕ Fechar
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label
                  htmlFor="select-modalidade-jogo"
                  style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}
                >
                  Modalidade
                </label>
                <select
                  id="select-modalidade-jogo"
                  value={modalidadeSlug}
                  disabled={!!editandoLoteId}
                  onChange={(e) => handleTrocarModalidadeModal(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                  }}
                >
                  {Object.values(MODALIDADES_CONFIG).map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.nome} (
                      {m.minDezenas === m.maxDezenas
                        ? `${m.minDezenas} dezenas`
                        : `${m.minDezenas} a ${m.maxDezenas} dezenas`}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="select-origem-jogo"
                  style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}
                >
                  Origem dos Jogos
                </label>
                <select
                  id="select-origem-jogo"
                  value={tipoGeracao}
                  onChange={(e) => setTipoGeracao(e.target.value as "externo" | "manual")}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                  }}
                >
                  <option value="externo">🤖 Gerado fora / IA Externa</option>
                  <option value="manual">✍️ Preenchimento Manual</option>
                </select>
              </div>
            </div>

            {/* Abas de Entrada */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setAbaAtiva("colar")}
                className={`btn ${abaAtiva === "colar" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
              >
                📋 Colar Texto / IA
              </button>
              <button
                type="button"
                onClick={() => setAbaAtiva("volante")}
                className={`btn ${abaAtiva === "volante" ? "btn-primary" : "btn-secondary"}`}
                style={{ flex: 1 }}
              >
                🎯 Volante Visual ({dezenasVolante.length}/{configAtual.minDezenas})
              </button>
            </div>

            {abaAtiva === "colar" ? (
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="textarea-colar-jogos"
                  style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "8px" }}
                >
                  Cole abaixo os jogos (1 cartão por linha). Prefixos como <code>Jogo 1:</code> são removidos automaticamente.
                  {configAtual.slug === "lotomania" && " Na Lotomania, '00' é convertido para 100."}
                </label>
                <textarea
                  id="textarea-colar-jogos"
                  rows={6}
                  value={textoColado}
                  onChange={(e) => setTextoColado(e.target.value)}
                  placeholder={`Exemplo para ${configAtual.nome}:\nJogo 1: 04 - 12 - 23 - 34 - 45 - 58\n02, 11, 19, 27, 41, 60`}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    background: "#0b1329",
                    color: "#f8fafc",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    resize: "vertical",
                  }}
                />

                {textoColado.trim() && (
                  <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ fontSize: "13px" }}>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>
                        ✓ {resultadoParse.validos.length} cartão(ões) válido(s)
                      </span>
                      {resultadoParse.erros.length > 0 && (
                        <span style={{ color: "#f87171", marginLeft: "12px", fontWeight: 600 }}>
                          ⚠️ {resultadoParse.erros.length} linha(s) com erro
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={adicionarValidosDoTextoAoLote}
                      disabled={resultadoParse.validos.length === 0}
                      className="btn btn-secondary"
                      style={{ padding: "8px 14px", fontSize: "13px" }}
                    >
                      + Incluir {resultadoParse.validos.length} Cartão(ões) no Lote
                    </button>
                  </div>
                )}

                {resultadoParse.erros.length > 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      fontSize: "12px",
                      color: "#fca5a5",
                    }}
                  >
                    {resultadoParse.erros.slice(0, 4).map((er) => (
                      <div key={er.linhaNumero}>
                        • Linha {er.linhaNumero}: {er.motivo}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Selecionadas: <strong style={{ color: "#10b981" }}>{dezenasVolante.length}</strong> (mín: {configAtual.minDezenas}, máx: {configAtual.maxDezenas})
                  </span>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={completarVolanteAleatorio}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      🎲 Completar Aleatório
                    </button>
                    <button
                      type="button"
                      onClick={() => setDezenasVolante([])}
                      className="btn btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      Limpar Volante
                    </button>
                    <button
                      type="button"
                      onClick={adicionarCartaoDoVolante}
                      className="btn btn-primary"
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                    >
                      + Adicionar Cartão ao Lote
                    </button>
                  </div>
                </div>

                <div
                  className="volante-grid"
                  style={{
                    gridTemplateColumns: configAtual.slug === "lotofacil" ? "repeat(5, 1fr)" : "repeat(10, 1fr)",
                    maxWidth: configAtual.slug === "lotofacil" ? "320px" : "100%",
                  }}
                >
                  {Array.from({ length: configAtual.totalDezenasGlobo }, (_, i) => i + 1).map((num) => {
                    const ativo = dezenasVolante.includes(num);
                    const rotulo = formatarDezenaModalidade(num, configAtual.slug);
                    return (
                      <button
                        key={num}
                        type="button"
                        aria-pressed={ativo}
                        aria-label={`Dezena ${rotulo}`}
                        onClick={() => toggleDezenaVolante(num)}
                        className={`lottery-ball ${ativo ? `active ${configAtual.slug}` : ""}`}
                      >
                        {rotulo}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista do Lote em Montagem */}
            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                background: "rgba(11, 19, 41, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "14px" }}>📦 Cartões no Lote ({loteEmMontagem.length})</strong>
                {loteEmMontagem.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLoteEmMontagem([])}
                    style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}
                  >
                    Limpar Todos
                  </button>
                )}
              </div>

              {loteEmMontagem.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                  Nenhum cartão adicionado ao lote ainda. Cole o texto acima ou monte pelo volante visual.
                </p>
              ) : (
                <div style={{ maxHeight: "190px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {loteEmMontagem.map((cartao, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.04)",
                        fontSize: "13px",
                        fontFamily: "monospace",
                        gap: "8px",
                      }}
                    >
                      <span style={{ overflowWrap: "anywhere" }}>
                        <strong>#{idx + 1}:</strong>{" "}
                        {cartao.map((n) => formatarDezenaModalidade(n, configAtual.slug)).join(" - ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setLoteEmMontagem((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label={`Remover cartão ${idx + 1}`}
                        style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {erroModal && (
              <div
                role="alert"
                style={{
                  marginBottom: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.14)",
                  border: "1px solid rgba(248, 113, 113, 0.5)",
                  color: "#fca5a5",
                  fontSize: "13px",
                }}
              >
                ⚠️ {erroModal}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setModalAberto(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvandoModal}
                onClick={handleSalvarLoteModal}
                className="btn btn-primary"
              >
                {salvandoModal
                  ? "Salvando..."
                  : editandoLoteId
                  ? "💾 Salvar Alterações"
                  : "💾 Salvar em Meus Jogos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
