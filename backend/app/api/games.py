from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from datetime import date
from uuid import UUID
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.lottery import Modalidade
from app.models.saved_game import JogoUsuario
from app.schemas.saved_game import JogoUsuarioCreate, JogoUsuarioUpdate, JogoUsuarioResponse
from app.api.auth import get_current_user
from app.services.saved_games import validar_e_normalizar_jogos, validar_tipo_geracao

router = APIRouter()


def _validar_ou_400(fn, *args):
    try:
        return fn(*args)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


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

    tipo_geracao = _validar_ou_400(validar_tipo_geracao, req.tipo_geracao)
    jogos_validados = _validar_ou_400(validar_e_normalizar_jogos, req.jogos, modalidade)

    # Verificar cotas diárias do usuário (apenas jogos salvos hoje)
    jogos_hoje_count = db.query(JogoUsuario).filter(
        JogoUsuario.usuario_id == current_user.id,
        func.date(JogoUsuario.criado_em) == date.today()
    ).count()

    if jogos_hoje_count >= current_user.limite_diario_geracao:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Cota diária de geração atingida ({current_user.limite_diario_geracao} jogos)."
        )

    novo_jogo = JogoUsuario(
        usuario_id=current_user.id,
        modalidade_id=modalidade.id,
        tipo_geracao=tipo_geracao,
        jogos=jogos_validados
    )
    novo_jogo.modalidade = modalidade
    db.add(novo_jogo)
    db.commit()
    db.refresh(novo_jogo)
    return novo_jogo


@router.get("/", response_model=List[JogoUsuarioResponse])
def listar_jogos_usuario(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(JogoUsuario)
        .options(joinedload(JogoUsuario.modalidade))
        .filter(JogoUsuario.usuario_id == current_user.id)
        .order_by(JogoUsuario.criado_em.desc())
        .all()
    )


@router.put("/{jogo_id}", response_model=JogoUsuarioResponse)
def atualizar_jogo_usuario(
    jogo_id: UUID,
    req: JogoUsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jogo_db = (
        db.query(JogoUsuario)
        .options(joinedload(JogoUsuario.modalidade))
        .filter(
            JogoUsuario.id == jogo_id,
            JogoUsuario.usuario_id == current_user.id
        )
        .first()
    )
    if not jogo_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo salvo não encontrado.")

    if req.tipo_geracao is not None:
        jogo_db.tipo_geracao = _validar_ou_400(validar_tipo_geracao, req.tipo_geracao)

    jogo_db.jogos = _validar_ou_400(validar_e_normalizar_jogos, req.jogos, jogo_db.modalidade)
    db.commit()
    db.refresh(jogo_db)
    return jogo_db


@router.delete("/{jogo_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_jogo_usuario(
    jogo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jogo_db = db.query(JogoUsuario).filter(
        JogoUsuario.id == jogo_id,
        JogoUsuario.usuario_id == current_user.id
    ).first()
    if not jogo_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jogo salvo não encontrado.")

    db.delete(jogo_db)
    db.commit()
    return None
