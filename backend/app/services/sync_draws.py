import httpx
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.lottery import Modalidade, Sorteio

API_BASE_URL = "https://loteriascaixa-api.herokuapp.com/api"

def parse_date(date_str: str) -> date:
    """Converte string no formato DD/MM/YYYY para objeto date."""
    try:
        return datetime.strptime(date_str, "%d/%m/%Y").date()
    except Exception:
        return date.today()

def normalizar_slug_api(slug: str) -> str:
    """Normaliza o slug local para o esperado pela API de loterias."""
    # Ex: 'mega-sena' -> 'megasena'
    # Ex: 'lotofacil' -> 'lotofacil'
    # Ex: 'quina' -> 'quina'
    return slug.replace("-", "").lower()

async def sincronizar_modalidade_historico(slug: str, db: Session, limit: int = 100) -> int:
    """
    Consome a API de loterias externa, obtém a lista de sorteios históricos
    e insere no banco local os que ainda não foram importados.
    """
    modalidade = db.query(Modalidade).filter(Modalidade.codigo_slug == slug).first()
    if not modalidade:
        raise ValueError(f"Modalidade '{slug}' não cadastrada no sistema.")
        
    api_slug = normalizar_slug_api(slug)
    url = f"{API_BASE_URL}/{api_slug}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=20.0)
            if response.status_code != 200:
                raise RuntimeError(f"Erro ao acessar API externa. Status: {response.status_code}")
                
            sorteios_dados = response.json()
            
            # Garante que tratamos uma lista (a API retorna lista para o slug principal)
            if not isinstance(sorteios_dados, list):
                sorteios_dados = [sorteios_dados]
                
            # Limita a quantidade a processar (para evitar travar em grandes cargas iniciais)
            sorteios_dados = sorteios_dados[:limit]
            
            novos_inseridos = 0
            for dados in sorteios_dados:
                concurso = dados.get("concurso")
                if not concurso:
                    continue
                    
                # Verificar se já existe no banco de dados local
                existente = db.query(Sorteio).filter(
                    Sorteio.modalidade_id == modalidade.id,
                    Sorteio.numero_concurso == concurso
                ).first()
                
                if existente:
                    # Como a lista vem do mais recente para o mais antigo,
                    # se achamos um que já existe, podemos parar (se limit for grande)
                    # Mas para garantir importação de buracos, podemos apenas pular
                    continue
                    
                dezenas_str = dados.get("dezenas", [])
                dezenas = [int(x) for x in dezenas_str]
                
                sorteio_obj = Sorteio(
                    modalidade_id=modalidade.id,
                    numero_concurso=concurso,
                    data_sorteio=parse_date(dados.get("data", "")),
                    dezenas_sorteadas=dezenas,
                    detalhes_ganhadores=dados.get("premiacoes", []),
                    acumulou=dados.get("acumulou", False),
                    valor_acumulado=dados.get("valorAcumuladoProximoConcurso", 0.0)
                )
                db.add(sorteio_obj)
                novos_inseridos += 1
                
            db.commit()
            return novos_inseridos
            
        except Exception as e:
            db.rollback()
            raise RuntimeError(f"Erro na sincronização de {slug}: {str(e)}")

async def sincronizar_todas_modalidades(db: Session, limit: int = 50) -> dict:
    """Sincroniza os últimos concursos de todas as modalidades numéricas cadastradas."""
    modalidades = db.query(Modalidade).filter(Modalidade.tipo_prognostico == "numerico").all()
    resultado = {}
    
    for mod in modalidades:
        try:
            inseridos = await sincronizar_modalidade_historico(mod.codigo_slug, db, limit=limit)
            resultado[mod.codigo_slug] = {"status": "sucesso", "novos_sorteios": inseridos}
        except Exception as e:
            resultado[mod.codigo_slug] = {"status": "erro", "detalhe": str(e)}
            
    return resultado
