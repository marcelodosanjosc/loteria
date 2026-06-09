from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.saved_game import FechamentoRequest, FechamentoResponse, AplicarFiltrosRequest
from app.services.combinatorics import gerar_fechamento_guloso, gerar_fechamento_lotomania_avancado
from app.services.filters import filtrar_jogos
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

PRECOS_LOTERIAS = {
    "mega-sena": 5.00,
    "lotofacil": 3.00,
    "quina": 2.50,
    "lotomania": 3.00,
    "dupla-sena": 2.50
}

@router.post("/gerar", response_model=FechamentoResponse)
def gerar_fechamento(req: FechamentoRequest):
    slug = req.modalidade_slug.lower()
    
    logger.info(
        f"API fechamento/gerar chamada. Modalidade: {slug}, "
        f"garantia: {req.garantia}, condicao: {req.condicao}, "
        f"dezenas selecionadas (total={len(req.dezenas_escolhidas)}): {req.dezenas_escolhidas}"
    )
    
    # Validações preventivas de tamanho
    n = len(req.dezenas_escolhidas)
    if slug == "mega-sena":
        tamanho_bilhete = 6
        if n > 15:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para evitar sobrecarga no servidor, o limite de dezenas para fechamento da Mega-Sena é 15."
            )
    elif slug == "lotofacil":
        tamanho_bilhete = 15
        if n > 21:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para evitar sobrecarga no servidor, o limite de dezenas para fechamento da Lotofácil é 21."
            )
    elif slug == "quina":
        tamanho_bilhete = 5
        if n > 18:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para evitar sobrecarga no servidor, o limite de dezenas para fechamento da Quina é 18."
            )
    elif slug == "dupla-sena":
        tamanho_bilhete = 6
        if n > 15:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para evitar sobrecarga no servidor, o limite de dezenas para fechamento da Dupla-Sena é 15."
            )
    elif slug == "lotomania":
        tamanho_bilhete = 50
        if n > 70 or n < 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Para a Lotomania, selecione entre 50 e 70 dezenas para o fechamento matemático."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fechamentos automáticos para a modalidade '{req.modalidade_slug}' não estão disponíveis no momento."
        )
        
    if req.garantia > tamanho_bilhete or req.condicao > tamanho_bilhete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A garantia e a condição de acertos não podem exceder o tamanho padrão do bilhete ({tamanho_bilhete} dezenas)."
        )
        
    try:
        # Lotomania com N > 55: usa o algoritmo avançado Monte Carlo + Quadrantes
        if slug == "lotomania" and n > 55:
            # Calcula o padrão inteligente de max_quadrantes baseado nas dezenas reais
            from app.services.filters import contar_quadrantes_ocupados
            quadrantes_ocupados_total = contar_quadrantes_ocupados(req.dezenas_escolhidas)
            # Padrão: quadrantes_ocupados - 1 (gera ~15-25% de taxa de aprovação no filtro,
            # suficiente para popular o pool de candidatos com diversidade)
            default_max_q = max(10, quadrantes_ocupados_total - 1)
            max_quadrantes = req.max_quadrantes if req.max_quadrantes is not None else default_max_q
            jogos = gerar_fechamento_lotomania_avancado(
                dezenas_escolhidas=req.dezenas_escolhidas,
                tamanho_bilhete=tamanho_bilhete,
                garantia_acerto=req.garantia,
                condicao_acerto=req.condicao,
                max_quadrantes=max_quadrantes
            )
        else:
            # Todas as outras modalidades e Lotomania com N <= 55: algoritmo clássico exato
            jogos = gerar_fechamento_guloso(
                dezenas_escolhidas=req.dezenas_escolhidas,
                tamanho_bilhete=tamanho_bilhete,
                garantia_acerto=req.garantia,
                condicao_acerto=req.condicao
            )
        
        preco_base = PRECOS_LOTERIAS.get(slug, 5.0)
        custo_estimado = len(jogos) * preco_base
        
        logger.info(
            f"Fechamento para '{slug}' gerado com sucesso. "
            f"Total de cartões gerados: {len(jogos)}, Custo estimado: R$ {custo_estimado:.2f}"
        )
        
        return {
            "total_cartoes": len(jogos),
            "jogos": jogos,
            "custo_estimado": custo_estimado
        }
    except ValueError as ve:
        logger.warning(f"Erro de validação ao gerar fechamento para '{slug}': {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Erro crítico no motor de fechamento para '{slug}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno no motor matemático de fechamentos: {str(e)}"
        )

@router.post("/filtrar", response_model=list[list[int]])
def filtrar_jogos_gerados(req: AplicarFiltrosRequest):
    """
    Filtra as combinações informadas com base nas diretrizes matemáticas fornecidas.
    """
    # Converter o objeto FiltroOpcoes para dict
    filtros_dict = req.filtros.model_dump(exclude_unset=True)
    
    modalidade_slug = req.modalidade_slug.lower() if req.modalidade_slug else None
    if not modalidade_slug:
        modalidade_slug = "mega-sena"
        if req.jogos and len(req.jogos[0]) >= 15 and len(req.jogos[0]) <= 20:
            modalidade_slug = "lotofacil"
        elif req.jogos and len(req.jogos[0]) == 50:
            modalidade_slug = "lotomania"
        elif req.jogos and len(req.jogos[0]) == 5:
            modalidade_slug = "quina"
        
    try:
        jogos_filtrados = filtrar_jogos(
            jogos=req.jogos,
            modalidade_slug=modalidade_slug,
            filtros=filtros_dict
        )
        return jogos_filtrados
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar filtros: {str(e)}"
        )
