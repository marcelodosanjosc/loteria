from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional, Dict, Any

class ModalidadeBase(BaseModel):
    nome: str
    codigo_slug: str
    tipo_prognostico: str
    total_dezenas_globo: Optional[int] = None
    min_dezenas_aposta: Optional[int] = None
    max_dezenas_aposta: Optional[int] = None

class ModalidadeResponse(ModalidadeBase):
    id: UUID
    criado_em: datetime

    class Config:
        from_attributes = True

class SorteioBase(BaseModel):
    numero_concurso: int
    data_sorteio: date
    dezenas_sorteadas: List[int]
    detalhes_ganhadores: Optional[Any] = None
    acumulou: bool
    valor_acumulado: Optional[float] = None

class SorteioResponse(SorteioBase):
    id: UUID
    modalidade_id: UUID
    criado_em: datetime

    class Config:
        from_attributes = True

class ProbabilidadeRequest(BaseModel):
    modalidade_slug: str
    dezenas_jogadas: int

class ProbabilidadeResponse(BaseModel):
    total_combinacoes: int
    jogos_simples: int
    probabilidade_1_em: float
    custo_estimado: float

class EstatisticaResponse(BaseModel):
    frequencia: Dict[int, int]
    atraso: Dict[int, int]
    pares_impares: Dict[str, float]
    somas_historico: List[int]

class EstatisticaAvancadaResponse(BaseModel):
    total_concursos_analisados: int
    ultimo_concurso: Optional[int] = None
    frequencia: Dict[int, int]
    atraso: Dict[int, int]
    pares_impares: Dict[str, float]
    somas_historico: List[int]
    soma_media: float
    moldura_centro: Dict[str, Any]
    distribuicao_linhas: Dict[int, int]
    distribuicao_colunas: Dict[int, int]
    repeticao_concurso_anterior: Dict[str, Any]
    sequencias_consecutivas: Dict[str, Any]
    altas_baixas: Dict[str, float]
    dezenas_quentes: List[int]
    dezenas_frias: List[int]
    dezenas_atrasadas: List[int]

class SmartGameItem(BaseModel):
    jogo: List[int]
    score: float
    metricas: Dict[str, Any]
    justificativa: List[str]

class SmartGameRequest(BaseModel):
    modalidade_slug: str = "lotofacil"
    quantidade_jogos: int = 5
    amostragem_concursos: int = 30
    dezenas_fixas: Optional[List[int]] = None
    dezenas_excluidas: Optional[List[int]] = None

class SmartGameResponse(BaseModel):
    modalidade_slug: str
    total_jogos_gerados: int
    jogos: List[SmartGameItem]

class ExportarPromptRequest(BaseModel):
    template_id: int = 1
    ia_destino: str = "deepseek"  # "deepseek", "chatgpt", "gemini"
    amostragem_concursos: int = 30
    incluir_concurso_resultado: bool = True

class ExportarPromptResponse(BaseModel):
    template_id: int
    titulo: str
    ia_destino: str
    prompt_formatado: str
    dados_concursos_usados: int

class TesteCegoRequest(BaseModel):
    modalidade_slug: str = "lotofacil"
    amostragem_treino: int = 30
    jogos_gerados: Optional[List[List[int]]] = None

class TesteCegoResultadoItem(BaseModel):
    jogo: List[int]
    acertos: int
    dezenas_acertadas: List[int]
    premiado: bool
    faixa_premio: Optional[str] = None

class TesteCegoResponse(BaseModel):
    concurso_auditado: int
    data_sorteio: date
    dezenas_sorteadas: List[int]
    total_jogos_testados: int
    jogos_resultados: List[TesteCegoResultadoItem]
    resumo_acertos: Dict[int, int]

