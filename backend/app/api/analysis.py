from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx
from datetime import date, datetime
from typing import List, Dict, Any
from app.database import get_db
from app.models.lottery import Modalidade, Sorteio
from app.schemas.lottery import (
    ProbabilidadeRequest,
    ProbabilidadeResponse,
    EstatisticaResponse,
    SorteioResponse
)
from app.services.combinatorics import calcular_probabilidade
from app.services.sync_draws import sincronizar_modalidade_historico, sincronizar_todas_modalidades

router = APIRouter()

PRECOS_LOTERIAS = {
    "mega-sena": 5.00,
    "lotofacil": 3.00,
    "quina": 2.50,
    "lotomania": 3.00,
    "dupla-sena": 2.50
}

REGRAS_LOTERIAS = {
    "mega-sena": {"total": 60, "sorteio": 6},
    "lotofacil": {"total": 25, "sorteio": 15},
    "quina": {"total": 80, "sorteio": 5},
    "lotomania": {"total": 100, "sorteio": 20},
    "dupla-sena": {"total": 50, "sorteio": 6}
}

@router.post("/probabilidade", response_model=ProbabilidadeResponse)
def obter_analise_probabilidade(req: ProbabilidadeRequest):
    slug = req.modalidade_slug.lower()
    if slug not in REGRAS_LOTERIAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Modalidade '{req.modalidade_slug}' não suportada para cálculo estatístico."
        )
        
    regras = REGRAS_LOTERIAS[slug]
    total_combinacoes, jogos_simples, prob_1_em = calcular_probabilidade(
        dezenas_jogadas=req.dezenas_jogadas,
        total_bolas=regras["total"],
        dezenas_sorteio=regras["sorteio"]
    )
    
    preco_base = PRECOS_LOTERIAS.get(slug, 5.0)
    custo_estimado = jogos_simples * preco_base
    
    return {
        "total_combinacoes": total_combinacoes,
        "jogos_simples": jogos_simples,
        "probabilidade_1_em": prob_1_em,
        "custo_estimado": custo_estimado
    }

@router.post("/sincronizar-todos")
async def sincronizar_todos_resultados(db: Session = Depends(get_db)):
    """Dispara a sincronização dos sorteios mais recentes de todas as modalidades."""
    return await sincronizar_todas_modalidades(db, limit=100)

@router.post("/{slug}/sincronizar")
async def sincronizar_modalidade_resultados(slug: str, limit: int = 100, db: Session = Depends(get_db)):
    """Sincroniza os sorteios recentes para uma modalidade específica."""
    try:
        novos = await sincronizar_modalidade_historico(slug, db, limit=limit)
        return {"status": "sucesso", "codigo_slug": slug, "novos_sorteios_inseridos": novos}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao sincronizar: {str(e)}"
        )

@router.get("/{slug}/estatisticas", response_model=EstatisticaResponse)
def obter_estatisticas_locais(slug: str, db: Session = Depends(get_db)):
    """Calcula estatísticas de atrasos, frequências e paridades com base no histórico local."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade {slug} não cadastrada."
        )
        
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id).order_by(Sorteio.numero_concurso.desc()).all()
    
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum sorteio cadastrado para calcular estatísticas. Execute a sincronização primeiro."
        )
        
    total_dezenas = modalidade.total_dezenas_globo
    
    # 1. Inicializar dicionários de estatísticas
    frequencia = {i: 0 for i in range(1, total_dezenas + 1)}
    ultimo_concurso_numero = sorteios[0].numero_concurso
    ultimo_sorteio_dezena = {i: 0 for i in range(1, total_dezenas + 1)}
    
    total_pares = 0
    total_numeros_processados = 0
    somas_historico = []
    
    # Processar sorteios
    for s in sorteios:
        soma = sum(s.dezenas_sorteadas)
        if len(somas_historico) < 50: # Guardamos apenas os 50 mais recentes para os gráficos de soma
            somas_historico.append(soma)
            
        for d in s.dezenas_sorteadas:
            if 1 <= d <= total_dezenas:
                frequencia[d] += 1
                if d % 2 == 0:
                    total_pares += 1
                total_numeros_processados += 1
                
                # Registra o maior concurso no qual a dezena apareceu
                if ultimo_sorteio_dezena[d] == 0:
                    ultimo_sorteio_dezena[d] = s.numero_concurso
                    
    # Calcular atrasos (Concurso Atual - Concurso da última ocorrência)
    atraso = {}
    for i in range(1, total_dezenas + 1):
        concurso_ocorrido = ultimo_sorteio_dezena[i]
        if concurso_ocorrido == 0:
            # Nunca ocorreu, atraso máximo é o número de concursos processados
            atraso[i] = len(sorteios)
        else:
            atraso[i] = ultimo_concurso_numero - concurso_ocorrido
            
    # Calcular proporção de pares e ímpares
    pares_pct = 0.0
    impares_pct = 0.0
    if total_numeros_processados > 0:
        pares_pct = (total_pares / total_numeros_processados) * 100
        impares_pct = 100.0 - pares_pct
        
    return {
        "frequencia": frequencia,
        "atraso": atraso,
        "pares_impares": {
            "pares": round(pares_pct, 2),
            "impares": round(impares_pct, 2)
        },
        "somas_historico": somas_historico[::-1] # Inverter para cronológico antigo -> recente
    }

@router.get("/{slug}/sorteios", response_model=List[SorteioResponse])
def listar_sorteios_concursos(slug: str, limit: int = 10, db: Session = Depends(get_db)):
    """Lista o histórico de sorteios local de forma paginada/limitada."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade {slug} não cadastrada."
        )
    return db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id).order_by(Sorteio.numero_concurso.desc()).limit(limit).all()
