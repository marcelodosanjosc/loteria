import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
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
