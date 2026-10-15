import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Injetar token JWT automaticamente em todas as requisições se disponível
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lottomath_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ProbabilidadeResponse {
  total_combinacoes: number;
  jogos_simples: number;
  probabilidade_1_em: number;
  custo_estimado: number;
}

export interface JogoUsuarioResponse {
  id: string;
  usuario_id: string;
  modalidade_id: string;
  modalidade_nome?: string;
  tipo_geracao: string;
  jogos: number[][];
  criado_em: string;
}

export interface FechamentoResponse {
  total_cartoes: number;
  jogos: number[][];
  custo_estimado: number;
}

export interface EstatisticasResponse {
  frequencia: Record<number, number>;
  atraso: Record<number, number>;
  pares_impares: {
    pares: number;
    impares: number;
  };
  somas_historico: number[];
}

export interface EstatisticaAvancadaResponse {
  total_concursos_analisados: number;
  ultimo_concurso?: number;
  frequencia: Record<number, number>;
  atraso: Record<number, number>;
  pares_impares: {
    pares: number;
    impares: number;
  };
  somas_historico: number[];
  soma_media: number;
  moldura_centro: {
    moldura_media: number;
    centro_medio: number;
    distribuicao: Record<number, number>;
  };
  distribuicao_linhas: Record<number, number>;
  distribuicao_colunas: Record<number, number>;
  repeticao_concurso_anterior: {
    media_repetidas: number;
    distribuicao: Record<number, number>;
  };
  sequencias_consecutivas: {
    maior_sequencia_media: number;
    distribuicao: Record<number, number>;
  };
  altas_baixas: {
    baixas_pct: number;
    altas_pct: number;
  };
  dezenas_quentes: number[];
  dezenas_frias: number[];
  dezenas_atrasadas: number[];
}

export interface SmartGameItem {
  jogo: number[];
  score: number;
  metricas: {
    moldura?: number;
    centro?: number;
    pares?: number;
    impares?: number;
    repetidas_anterior?: number;
    soma?: number;
    primos?: number;
    fibonacci?: number;
    maior_sequencia?: number;
    quadrantes?: string | number;
    linhas?: number;
    colunas?: number;
    [key: string]: any;
  };
  justificativa: string[];
}

export interface SmartGameResponse {
  modalidade_slug: string;
  total_jogos_gerados: number;
  jogos: SmartGameItem[];
}

export interface SmartGameRequest {
  modalidade_slug?: string;
  quantidade_jogos?: number;
  amostragem_concursos?: number;
  dezenas_fixas?: number[];
  dezenas_excluidas?: number[];
}

export interface PromptTemplateItem {
  id: number;
  titulo: string;
  descricao: string;
  template: string;
}

export interface ExportarPromptRequest {
  template_id: number;
  ia_destino?: string;
  amostragem_concursos?: number;
  incluir_concurso_resultado?: boolean;
}

export interface ExportarPromptResponse {
  template_id: number;
  titulo: string;
  ia_destino: string;
  prompt_formatado: string;
  dados_concursos_usados: number;
}

export interface TesteCegoRequest {
  modalidade_slug?: string;
  amostragem_treino?: number;
  jogos_gerados?: number[][];
}

export interface TesteCegoResultadoItem {
  jogo: number[];
  acertos: number;
  dezenas_acertadas: number[];
  premiado: boolean;
  faixa_premio?: string;
  espelho_acertos?: number;
  espelho_premiado?: boolean;
  espelho_faixa?: string;
}

export interface TesteCegoResponse {
  modalidade_slug?: string;
  concurso_auditado: number;
  data_sorteio: string;
  dezenas_sorteadas: number[];
  total_jogos_testados: number;
  jogos_resultados: TesteCegoResultadoItem[];
  resumo_acertos: Record<number, number>;
}

export const loteriaApi = {
  registrar: async (nome: string, email: string, senha: string): Promise<any> => {
    const response = await api.post('/auth/register', { nome, email, senha });
    return response.data;
  },

  login: async (email: string, senha: string): Promise<{ access_token: string; token_type: string }> => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', senha);
    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getProbabilidade: async (modalidadeSlug: string, dezenasJogadas: number): Promise<ProbabilidadeResponse> => {
    const response = await api.post('/analise/probabilidade', {
      modalidade_slug: modalidadeSlug,
      dezenas_jogadas: dezenasJogadas,
    });
    return response.data;
  },

  getEstatisticas: async (modalidadeSlug: string): Promise<EstatisticasResponse> => {
    const response = await api.get(`/analise/${modalidadeSlug}/estatisticas`);
    return response.data;
  },

  getEstatisticasAvancadas: async (modalidadeSlug: string, limit: number = 30): Promise<EstatisticaAvancadaResponse> => {
    const response = await api.get(`/analise/${modalidadeSlug}/estatisticas-avancadas?limit=${limit}`);
    return response.data;
  },

  gerarJogosIA: async (modalidadeSlug: string, req: SmartGameRequest): Promise<SmartGameResponse> => {
    const response = await api.post(`/analise/${modalidadeSlug}/gerar-jogos-ia`, {
      modalidade_slug: modalidadeSlug,
      ...req,
    });
    return response.data;
  },

  getPromptTemplates: async (modalidadeSlug?: string): Promise<PromptTemplateItem[]> => {
    const url = modalidadeSlug ? `/analise/prompts/templates?modalidade=${modalidadeSlug}` : '/analise/prompts/templates';
    const response = await api.get(url);
    return response.data;
  },

  exportarPromptIA: async (modalidadeSlug: string, req: ExportarPromptRequest): Promise<ExportarPromptResponse> => {
    const response = await api.post(`/analise/${modalidadeSlug}/exportar-prompt-ia`, req);
    return response.data;
  },

  executarTesteCego: async (modalidadeSlug: string, req: TesteCegoRequest): Promise<TesteCegoResponse> => {
    const response = await api.post(`/analise/${modalidadeSlug}/teste-cego`, {
      modalidade_slug: modalidadeSlug,
      ...req,
    });
    return response.data;
  },

  getExportarCsvUrl: (modalidadeSlug: string, limit: number = 30): string => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';
    return `${base}/analise/${modalidadeSlug}/exportar-csv?limit=${limit}`;
  },

  gerarFechamento: async (
    modalidadeSlug: string,
    dezenasEscolhidas: number[],
    garantia: number,
    condicao: number,
    maxQuadrantes?: number
  ): Promise<FechamentoResponse> => {
    const body: Record<string, unknown> = {
      modalidade_slug: modalidadeSlug,
      dezenas_escolhidas: dezenasEscolhidas,
      garantia,
      condicao,
    };
    if (maxQuadrantes !== undefined && maxQuadrantes !== null) {
      body.max_quadrantes = maxQuadrantes;
    }
    const response = await api.post('/fechamentos/gerar', body);
    return response.data;
  },

  filtrarJogos: async (jogos: number[][], filtros: any, modalidadeSlug?: string): Promise<number[][]> => {
    const response = await api.post('/fechamentos/filtrar', {
      jogos,
      filtros,
      modalidade_slug: modalidadeSlug,
    });
    return response.data;
  },

  salvarJogo: async (modalidadeSlug: string, tipoGeracao: string, jogos: number[][]): Promise<JogoUsuarioResponse> => {
    const response = await api.post('/jogos/salvar', {
      modalidade_slug: modalidadeSlug,
      tipo_geracao: tipoGeracao,
      jogos,
    });
    return response.data;
  },

  listarJogos: async (): Promise<JogoUsuarioResponse[]> => {
    const response = await api.get('/jogos/');
    return response.data;
  },
};

export default api;
