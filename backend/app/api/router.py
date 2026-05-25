from fastapi import APIRouter
from app.api import auth, analysis, wheeling, games

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
api_router.include_router(analysis.router, prefix="/analise", tags=["Análises e Estatísticas"])
api_router.include_router(wheeling.router, prefix="/fechamentos", tags=["Fechamentos e Filtros"])
api_router.include_router(games.router, prefix="/jogos", tags=["Jogos do Usuário"])
