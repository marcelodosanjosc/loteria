from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
import httpx
from datetime import date, datetime
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models.lottery import Modalidade, Sorteio
from app.schemas.lottery import (
    ProbabilidadeRequest,
    ProbabilidadeResponse,
    EstatisticaResponse,
    EstatisticaAvancadaResponse,
    SorteioResponse,
    SmartGameRequest,
    SmartGameResponse,
    ExportarPromptRequest,
    ExportarPromptResponse,
    TesteCegoRequest,
    TesteCegoResponse
)
from app.services.combinatorics import calcular_probabilidade
from app.services.sync_draws import sincronizar_modalidade_historico, sincronizar_todas_modalidades
from app.services.advanced_analytics import processar_estatisticas_avancadas
from app.services.smart_generator import gerar_top_jogos_inteligentes
from app.services.ai_copilot import (
    PROMPT_TEMPLATES,
    construir_prompt_ia,
    exportar_concursos_csv_string,
    executar_teste_cego
)

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
    """Calcula estatísticas básicas de atrasos, frequências e paridades com base no histórico local."""
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
    
    frequencia = {i: 0 for i in range(1, total_dezenas + 1)}
    ultimo_concurso_numero = sorteios[0].numero_concurso
    ultimo_sorteio_dezena = {i: 0 for i in range(1, total_dezenas + 1)}
    
    total_pares = 0
    total_numeros_processados = 0
    somas_historico = []
    
    for s in sorteios:
        soma = sum(s.dezenas_sorteadas)
        if len(somas_historico) < 50:
            somas_historico.append(soma)
            
        for d in s.dezenas_sorteadas:
            if 1 <= d <= total_dezenas:
                frequencia[d] += 1
                if d % 2 == 0:
                    total_pares += 1
                total_numeros_processados += 1
                
                if ultimo_sorteio_dezena[d] == 0:
                    ultimo_sorteio_dezena[d] = s.numero_concurso
                    
    atraso = {}
    for i in range(1, total_dezenas + 1):
        concurso_ocorrido = ultimo_sorteio_dezena[i]
        if concurso_ocorrido == 0:
            atraso[i] = len(sorteios)
        else:
            atraso[i] = ultimo_concurso_numero - concurso_ocorrido
            
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
        "somas_historico": somas_historico[::-1]
    }

@router.get("/{slug}/estatisticas-avancadas", response_model=EstatisticaAvancadaResponse)
def obter_estatisticas_avancadas_endpoint(
    slug: str,
    limit: Optional[int] = Query(30, description="Janela de concursos (ex: 30, 50, 100, 500 ou vazio para todos)"),
    db: Session = Depends(get_db)
):
    """Calcula estatísticas espaciais, moldura/centro, linhas/colunas, sequências e recortes temporais."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade {slug} não cadastrada."
        )
        
    query = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id).order_by(Sorteio.numero_concurso.desc())
    if limit and limit > 0:
        query = query.limit(limit)
        
    sorteios = query.all()
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum sorteio cadastrado para calcular estatísticas."
        )
        
    return processar_estatisticas_avancadas(
        sorteios=sorteios,
        total_dezenas=modalidade.total_dezenas_globo or 25,
        colunas_volante=5 if slug == "lotofacil" else 10,
        slug=slug
    )

@router.post("/{slug}/gerar-jogos-ia", response_model=SmartGameResponse)
def gerar_jogos_ia_endpoint(
    slug: str,
    req: SmartGameRequest,
    db: Session = Depends(get_db)
):
    """Gera combinações equilibradas de jogos inteligentes ranqueadas por Score Estatístico."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade {slug} não cadastrada."
        )
        
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id)\
        .order_by(Sorteio.numero_concurso.desc())\
        .limit(req.amostragem_concursos or 30)\
        .all()
        
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum concurso encontrado para basear a geração estatística."
        )
        
    ultimo_sorteio = sorteios[0].dezenas_sorteadas if sorteios else None
    
    # Calcular quentes e atrasadas da amostra
    freq = {i: 0 for i in range(1, (modalidade.total_dezenas_globo or 25) + 1)}
    for s in sorteios:
        for d in s.dezenas_sorteadas:
            if d in freq:
                freq[d] += 1
                
    quentes = [num for num, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:8]]
    atrasadas = [num for num, _ in sorted(freq.items(), key=lambda x: x[1])[:6]]
    
    jogos_resultado = gerar_top_jogos_inteligentes(
        total_dezenas_globo=modalidade.total_dezenas_globo or 25,
        dezenas_por_jogo=modalidade.min_dezenas_aposta or 15,
        quantidade_jogos=req.quantidade_jogos or 5,
        ultimo_sorteio=ultimo_sorteio,
        dezenas_quentes=quentes,
        dezenas_atrasadas=atrasadas,
        dezenas_fixas=req.dezenas_fixas,
        dezenas_excluidas=req.dezenas_excluidas
    )
    
    return {
        "modalidade_slug": slug,
        "total_jogos_gerados": len(jogos_resultado),
        "jogos": jogos_resultado
    }

@router.get("/prompts/templates")
def listar_templates_prompts():
    """Lista todos os templates de prompts de IA disponíveis."""
    return PROMPT_TEMPLATES

@router.post("/{slug}/exportar-prompt-ia", response_model=ExportarPromptResponse)
def exportar_prompt_ia_endpoint(
    slug: str,
    req: ExportarPromptRequest,
    db: Session = Depends(get_db)
):
    """Constrói e retorna um prompt especializado preenchido com dados reais do banco."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade {slug} não cadastrada."
        )
        
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id)\
        .order_by(Sorteio.numero_concurso.desc())\
        .limit(req.amostragem_concursos or 30)\
        .all()
        
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum concurso disponível para gerar o prompt."
        )
        
    return construir_prompt_ia(
        template_id=req.template_id,
        sorteios=sorteios,
        ia_destino=req.ia_destino,
        incluir_concurso_resultado=req.incluir_concurso_resultado
    )

@router.get("/{slug}/exportar-csv")
def exportar_csv_concursos_endpoint(
    slug: str,
    limit: Optional[int] = Query(30, description="Quantidade de concursos a exportar"),
    db: Session = Depends(get_db)
):
    """Exporta os concursos em arquivo CSV formatado para uso com ChatGPT / Excel."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(status_code=404, detail="Modalidade não encontrada")
        
    query = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id).order_by(Sorteio.numero_concurso.desc())
    if limit and limit > 0:
        query = query.limit(limit)
    sorteios = query.all()
    
    csv_content = exportar_concursos_csv_string(sorteios)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=lottomath_{slug}_{len(sorteios)}_concursos.csv"}
    )

@router.post("/{slug}/teste-cego", response_model=TesteCegoResponse)
def executar_teste_cego_endpoint(
    slug: str,
    req: TesteCegoRequest,
    db: Session = Depends(get_db)
):
    """Executa o teste cego de backtesting contra o último concurso cadastrado."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(status_code=404, detail="Modalidade não encontrada")
        
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id)\
        .order_by(Sorteio.numero_concurso.desc())\
        .limit((req.amostragem_treino or 30) + 1)\
        .all()
        
    if len(sorteios) < 2:
        raise HTTPException(status_code=400, detail="Histórico insuficiente para teste cego.")
        
    return executar_teste_cego(
        sorteios=sorteios,
        jogos_custom=req.jogos_gerados,
        amostragem_treino=req.amostragem_treino or 30
    )

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

