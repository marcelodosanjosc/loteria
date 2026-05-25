import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.config import settings
from app.api.router import api_router
from app.database import engine, Base, SessionLocal
from app.models.lottery import Modalidade
from app.services.sync_draws import sincronizar_todas_modalidades

# Inicializa o banco de dados (Cria tabelas caso não existam)
Base.metadata.create_all(bind=engine)

# Script de carga inicial de modalidades
def seed_modalidades():
    db = SessionLocal()
    try:
        modalidades_iniciais = [
            {
                "nome": "Mega-Sena",
                "codigo_slug": "mega-sena",
                "tipo_prognostico": "numerico",
                "total_dezenas_globo": 60,
                "min_dezenas_aposta": 6,
                "max_dezenas_aposta": 20
            },
            {
                "nome": "Lotofácil",
                "codigo_slug": "lotofacil",
                "tipo_prognostico": "numerico",
                "total_dezenas_globo": 25,
                "min_dezenas_aposta": 15,
                "max_dezenas_aposta": 20
            },
            {
                "nome": "Quina",
                "codigo_slug": "quina",
                "tipo_prognostico": "numerico",
                "total_dezenas_globo": 80,
                "min_dezenas_aposta": 5,
                "max_dezenas_aposta": 15
            },
            {
                "nome": "Lotomania",
                "codigo_slug": "lotomania",
                "tipo_prognostico": "numerico",
                "total_dezenas_globo": 100,
                "min_dezenas_aposta": 50,
                "max_dezenas_aposta": 50
            },
            {
                "nome": "Dupla-Sena",
                "codigo_slug": "dupla-sena",
                "tipo_prognostico": "numerico",
                "total_dezenas_globo": 50,
                "min_dezenas_aposta": 6,
                "max_dezenas_aposta": 15
            }
        ]
        for m_data in modalidades_iniciais:
            existente = db.query(Modalidade).filter(Modalidade.codigo_slug == m_data["codigo_slug"]).first()
            if not existente:
                m_obj = Modalidade(**m_data)
                db.add(m_obj)
        db.commit()
    except Exception as e:
        print(f"Erro ao popular modalidades iniciais: {e}")
    finally:
        db.close()

seed_modalidades()

# Configuração do Agendador Diário (Cron)
scheduler = BackgroundScheduler()

def task_sincronizacao_diaria():
    db = SessionLocal()
    try:
        # Executa a co-rotina assíncrona sincronizar_todas_modalidades no loop
        asyncio.run(sincronizar_todas_modalidades(db, limit=5))
        print("Sincronização agendada diária finalizada com sucesso.")
    except Exception as e:
        print(f"Falha na sincronização diária agendada: {e}")
    finally:
        db.close()

# Adiciona tarefa para rodar todos os dias às 21:05 (Fuso horário de Brasília/SP)
scheduler.add_job(
    task_sincronizacao_diaria,
    'cron',
    hour=21,
    minute=5,
    timezone='America/Sao_Paulo',
    id='sync_loterias_diaria',
    replace_existing=True
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Motor matemático de análise combinatória, estatísticas, filtros e fechamento de loterias brasileiras.",
    version="1.0.0"
)

# Configuração do Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Altere em produção para o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de Inicialização e Parada do Servidor
@app.on_event("startup")
def startup_event():
    scheduler.start()
    print("Agendador diário de sincronização iniciado.")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
    print("Agendador diário finalizado.")

# Inclui as rotas centrais
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "projeto": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }
