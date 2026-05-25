from sqlalchemy import Column, String, Integer, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class User(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    nivel_acesso = Column(String(20), default="user", nullable=False)
    limite_diario_geracao = Column(Integer, default=100, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    atualizado_em = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"), nullable=False)
