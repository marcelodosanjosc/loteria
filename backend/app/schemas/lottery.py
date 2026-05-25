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
    detalhes_ganhadores: Optional[Dict[str, Any]] = None
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
