from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any, Optional

class FiltroSalvoBase(BaseModel):
    nome: str
    configuracao: Dict[str, Any]

class FiltroSalvoCreate(FiltroSalvoBase):
    modalidade_slug: str

class FiltroSalvoResponse(FiltroSalvoBase):
    id: UUID
    usuario_id: UUID
    modalidade_id: UUID
    criado_em: datetime

    class Config:
        from_attributes = True

class JogoUsuarioCreate(BaseModel):
    modalidade_slug: str
    tipo_geracao: str
    jogos: List[List[int]]

class JogoUsuarioResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    modalidade_id: UUID
    modalidade_nome: Optional[str] = None
    tipo_geracao: str
    jogos: List[List[int]]
    criado_em: datetime

    class Config:
        from_attributes = True

class FechamentoRequest(BaseModel):
    modalidade_slug: str
    dezenas_escolhidas: List[int]
    garantia: int
    condicao: int

class FechamentoResponse(BaseModel):
    total_cartoes: int
    jogos: List[List[int]]
    custo_estimado: float

class FiltroOpcoes(BaseModel):
    primos: Optional[Dict[str, int]] = None       # {"min": 1, "max": 4}
    fibonacci: Optional[Dict[str, int]] = None   # {"min": 1, "max": 4}
    pares: Optional[Dict[str, int]] = None       # {"min": 1, "max": 5}
    impares: Optional[Dict[str, int]] = None     # {"min": 1, "max": 5}
    moldura: Optional[Dict[str, int]] = None     # {"min": 1, "max": 5}
    soma: Optional[Dict[str, int]] = None        # {"min": 100, "max": 250}
    consecutivos_limite: Optional[int] = 2       # limite de dezenas vizinhas

class AplicarFiltrosRequest(BaseModel):
    jogos: List[List[int]]
    filtros: FiltroOpcoes
    modalidade_slug: Optional[str] = None
