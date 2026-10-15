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
    obter_catalogo_prompts_modalidade,
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


async def ensure_modalidade_sorteios(slug: str, modalidade_id: int, db: Session, limit: int = 50):
    """Garante que a modalidade tenha histórico no banco de dados, disparando auto-sync se necessário."""
    total = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade_id).count()
    if total == 0:
        try:
            await sincronizar_modalidade_historico(slug, db, limit=limit)
        except Exception as e:
            print(f"Auto-sync de contingência para {slug} falhou: {e}")


@router.post("/probabilidade", response_model=ProbabilidadeResponse)
def obter_probabilidade(req: ProbabilidadeRequest):
    slug = req.modalidade_slug.lower()
    if slug not in REGRAS_LOTERIAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Modalidade '{req.modalidade_slug}' não suportada."
        )
    
    regras = REGRAS_LOTERIAS[slug]
    total_globo = regras["total"]
    dezenas_sorteadas = regras["sorteio"]
    dezenas_jogadas = req.dezenas_jogadas

    if dezenas_jogadas < dezenas_sorteadas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Para {req.modalidade_slug}, o mínimo de dezenas selecionadas é {dezenas_sorteadas}."
        )
    
    preco_base = PRECOS_LOTERIAS.get(slug, 5.00)
    
    resultado = calcular_probabilidade(
        total_globo=total_globo,
        dezenas_sorteadas=dezenas_sorteadas,
        dezenas_jogadas=dezenas_jogadas,
        preco_aposta_simples=preco_base
    )
    
    return resultado

@router.post("/sincronizar-todos")
async def sincronizar_todos_resultados(db: Session = Depends(get_db)):
    """Sincroniza os últimos 100 sorteios de todas as modalidades cadastradas."""
    try:
        resultado = await sincronizar_todas_modalidades(db, limit=100)
        return {
            "status": "sucesso",
            "mensagem": "Sincronização global concluída.",
            "detalhes": resultado
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha na sincronização global: {str(e)}"
        )

@router.post("/{slug}/sincronizar")
async def sincronizar_modalidade_especifica(
    slug: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Sincroniza sorteios de uma modalidade específica via API da Caixa."""
    try:
        novos = await sincronizar_modalidade_historico(slug, db, limit=limit)
        return {"status": "sucesso", "codigo_slug": slug, "novos_sorteios_inseridos": novos}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha ao sincronizar: {str(e)}"
        )

@router.get("/{slug}/estatisticas", response_model=EstatisticaResponse)
async def obter_estatisticas_locais(slug: str, db: Session = Depends(get_db)):
    """Calcula estatísticas básicas de atrasos, frequências e paridades com base no histórico local."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade {slug} não cadastrada."
        )
    
    await ensure_modalidade_sorteios(slug, modalidade.id, db)
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id).order_by(Sorteio.numero_concurso.desc()).all()
    
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum sorteio cadastrado para a modalidade '{slug}'. Execute a sincronização."
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
async def obter_estatisticas_avancadas_endpoint(
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
        
    await ensure_modalidade_sorteios(slug, modalidade.id, db)
    query = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id).order_by(Sorteio.numero_concurso.desc())
    if limit and limit > 0:
        query = query.limit(limit)
        
    sorteios = query.all()
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum sorteio cadastrado para calcular estatísticas avançadas."
        )
        
    return processar_estatisticas_avancadas(
        sorteios=sorteios,
        total_dezenas=modalidade.total_dezenas_globo or 25,
        colunas_volante=5 if slug in ("lotofacil", "dupla-sena") else 10,
        slug=slug
    )

@router.post("/{slug}/gerar-jogos-ia", response_model=SmartGameResponse)
async def gerar_jogos_ia_endpoint(
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
        
    await ensure_modalidade_sorteios(slug, modalidade.id, db)
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id)\
        .order_by(Sorteio.numero_concurso.desc())\
        .limit(req.amostragem_concursos or 30)\
        .all()
        
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum concurso encontrado para basear a geração estatística da modalidade {slug}."
        )
        
    ultimo_sorteio = sorteios[0].dezenas_sorteadas if sorteios else None
    
    freq = {i: 0 for i in range(1, (modalidade.total_dezenas_globo or 25) + 1)}
    for s in sorteios:
        for d in s.dezenas_sorteadas:
            if d in freq:
                freq[d] += 1
                
    quentes = [num for num, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:8]]
    atrasadas = [num for num, _ in sorted(freq.items(), key=lambda x: x[1])[:6]]
    
    jogos_resultado = gerar_top_jogos_inteligentes(
        modalidade_slug=slug,
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
def listar_templates_prompts(modalidade: Optional[str] = Query("lotofacil")):
    """Lista todos os templates de prompts de IA disponíveis para a modalidade especificada."""
    return obter_catalogo_prompts_modalidade(modalidade or "lotofacil")

@router.get("/{slug}/prompts/templates")
def listar_templates_prompts_por_slug(slug: str):
    """Lista templates de prompts de IA contextualizados para a modalidade da rota."""
    return obter_catalogo_prompts_modalidade(slug)

@router.post("/{slug}/exportar-prompt-ia", response_model=ExportarPromptResponse)
async def exportar_prompt_ia_endpoint(
    slug: str,
    req: ExportarPromptRequest,
    db: Session = Depends(get_db)
):
    """Constrói e retorna um prompt especializado preenchido com dados reais do banco para a modalidade."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modalidade {slug} não cadastrada."
        )
        
    await ensure_modalidade_sorteios(slug, modalidade.id, db)
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id)\
        .order_by(Sorteio.numero_concurso.desc())\
        .limit(req.amostragem_concursos or 30)\
        .all()
        
    if not sorteios:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum concurso disponível para gerar o prompt da modalidade {slug}."
        )
        
    return construir_prompt_ia(
        template_id=req.template_id,
        sorteios=sorteios,
        modalidade_slug=slug,
        ia_destino=req.ia_destino,
        incluir_concurso_resultado=req.incluir_concurso_resultado
    )

@router.get("/{slug}/exportar-csv")
async def exportar_csv_concursos_endpoint(
    slug: str,
    limit: Optional[int] = Query(30, description="Quantidade de concursos a exportar"),
    db: Session = Depends(get_db)
):
    """Exporta os concursos em arquivo CSV formatado para uso com ChatGPT / Excel."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(status_code=404, detail="Modalidade não encontrada")
        
    await ensure_modalidade_sorteios(slug, modalidade.id, db)
    query = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id).order_by(Sorteio.numero_concurso.desc())
    if limit and limit > 0:
        query = query.limit(limit)
    sorteios = query.all()
    
    csv_content = exportar_concursos_csv_string(sorteios, modalidade_slug=slug)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=lottomath_{slug}_{len(sorteios)}_concursos.csv"}
    )

@router.post("/{slug}/teste-cego", response_model=TesteCegoResponse)
async def executar_teste_cego_endpoint(
    slug: str,
    req: TesteCegoRequest,
    db: Session = Depends(get_db)
):
    """Executa o teste cego de backtesting contra o último concurso cadastrado para qualquer modalidade."""
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise HTTPException(status_code=404, detail=f"Modalidade '{slug}' não encontrada")
        
    await ensure_modalidade_sorteios(slug, modalidade.id, db)
    sorteios = db.query(Sorteio).filter(Sorteio.modalidade_id == modalidade.id)\
        .order_by(Sorteio.numero_concurso.desc())\
        .limit((req.amostragem_treino or 30) + 1)\
        .all()
        
    if len(sorteios) < 2:
        raise HTTPException(
            status_code=400,
            detail=f"São necessários pelo menos 2 concursos cadastrados da {slug} para realizar o teste cego."
        )
        
    return executar_teste_cego(
        sorteios=sorteios,
        modalidade_slug=slug,
        total_dezenas_globo=modalidade.total_dezenas_globo or 25,
        dezenas_por_jogo=modalidade.min_dezenas_aposta or 15,
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
