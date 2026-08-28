"use client";

import React, { useState } from 'react';
import ResponsibleGaming from '../components/ResponsibleGaming';

interface LoteriaSummary {
  nome: string;
  slug: string;
  concurso: number;
  data: string;
  dezenas: number[];
  acumulado: string;
}

export default function Dashboard() {
  const [loterias] = useState<LoteriaSummary[]>([
    {
      nome: 'Mega-Sena',
      slug: 'mega-sena',
      concurso: 2750,
      data: '22/05/2026',
      dezenas: [4, 15, 22, 34, 53, 58],
      acumulado: 'R$ 38.000.000,00'
    },
    {
      nome: 'Lotofácil',
      slug: 'lotofacil',
      concurso: 3110,
      data: '22/05/2026',
      dezenas: [1, 3, 4, 6, 8, 9, 10, 12, 13, 17, 18, 19, 21, 23, 24],
      acumulado: 'R$ 1.700.000,00'
    },
    {
      nome: 'Quina',
      slug: 'quina',
      concurso: 6440,
      data: '22/05/2026',
      dezenas: [12, 28, 43, 67, 79],
      acumulado: 'R$ 7.200.000,00'
    }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Alerta de Jogo Responsável no topo */}
      <ResponsibleGaming />

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '20px 0' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>
          Simulador de Probabilidades & Fechamento Matemático
          <span style={{ display: 'block', fontSize: '18px', color: '#94a3b8', fontWeight: 400, marginTop: '8px' }}>
            Estude e otimize seus jogos com análises combinatórias reais e rigor estatístico.
          </span>
        </h2>
      </section>

      {/* Resultados Recentes */}
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Últimos Concursos Oficiais</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {loterias.map((lot) => (
            <div key={lot.slug} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{lot.nome}</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Concurso {lot.concurso} • {lot.data}</span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
                {lot.dezenas.map((dez, idx) => (
                  <span key={idx} className="lottery-ball drawn">
                    {String(dez).padStart(2, '0')}
                  </span>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#94a3b8' }}>Estimativa Próximo Prêmio:</span>
                <strong style={{ color: '#10b981' }}>{lot.acumulado}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Ferramentas Disponíveis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>Simulador de Probabilidades</h4>
            <p style={{ fontSize: '14px', color: '#94a3b8', flexGrow: 1 }}>
              Marque dezenas no volante interativo e veja a chance real de acerto matemático, quantidade de apostas simples equivalentes e o custo em tempo real.
            </p>
            <a href="/simulador" className="btn btn-primary" style={{ marginTop: '12px' }}>Acessar Simulador</a>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#6366f1' }}>Gerador de Fechamentos</h4>
            <p style={{ fontSize: '14px', color: '#94a3b8', flexGrow: 1 }}>
              Crie matrizes matemáticas para cercar faixas de premiação (ex: garantir quadra acertando as 6 dezenas no grupo de 12 selecionadas) gastando menos.
            </p>
            <a href="/fechamento" className="btn btn-primary" style={{ marginTop: '12px', backgroundColor: '#6366f1' }}>Criar Fechamento</a>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>Filtros Condicionais</h4>
            <p style={{ fontSize: '14px', color: '#94a3b8', flexGrow: 1 }}>
              Remova jogos indesejáveis ou estatisticamente improváveis do seu conjunto gerado aplicando regras de números primos, Fibonacci, limites de soma e consecutivos.
            </p>
            <a href="/filtros" className="btn btn-primary" style={{ marginTop: '12px', backgroundColor: '#f59e0b' }}>Filtrar Jogos</a>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#818cf8' }}>🤖 Inteligência Artificial & Prompts</h4>
            <p style={{ fontSize: '14px', color: '#94a3b8', flexGrow: 1 }}>
              Gere os Top 5 Jogos Fortes com score de equilíbrio estatístico, copie prompts prontos para DeepSeek/ChatGPT com dados reais e faça backtesting com teste cego.
            </p>
            <a href="/analise-ia" className="btn btn-primary" style={{ marginTop: '12px', backgroundColor: '#6366f1' }}>Explorar com IA</a>
          </div>
        </div>
      </div>
    </div>
  );
}
