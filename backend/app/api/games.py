from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.lottery import Modalidade
from app.models.saved_game import JogoUsuario
from app.schemas.saved_game import JogoUsuarioCreate, JogoUsuarioResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/salvar", response_model=JogoUsuarioResponse, status_code=status.HTTP_201_CREATED)
def salvar_jogo_usuario(
    req: JogoUsuarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == req.modalidade_slug.lower()).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade '{req.modalidade_slug}' não encontrada."
        )
        
    # Verificar cotas do usuário
    jogos_hoje_count = db.query(JogoUsuario).filter(
        JogoUsuario.usuario_id == current_user.id
    ).count()
    
    if jogos_hoje_count >= current_user.limite_diario_geracao:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Cota diária de geração atingida ({current_user.limite_diario_geracao} jogos)."
        )
        
    novo_jogo = JogoUsuario(
        usuario_id=current_user.id,
        modalidade_id=modalidade.id,
        tipo_geracao=req.tipo_geracao,
        jogos=req.jogos
    )
    db.add(novo_jogo)
    db.commit()
    db.refresh(novo_jogo)
    return novo_jogo

@router.get("/", response_model=List[JogoUsuarioResponse])
def listar_jogos_usuario(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(JogoUsuario).filter(
        JogoUsuario.usuario_id == current_user.id
    ).order_by(JogoUsuario.criado_em.desc()).all()
