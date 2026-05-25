from sqlalchemy import Column, String, Integer, DateTime, Boolean, Date, Numeric, ForeignKey, text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class Modalidade(Base):
    __tablename__ = "modalidades"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    nome = Column(String(50), unique=True, nullable=False)
    codigo_slug = Column(String(30), unique=True, nullable=False, index=True)
    tipo_prognostico = Column(String(20), nullable=False) # 'numerico' ou 'esportivo'
    total_dezenas_globo = Column(Integer, nullable=True) # Ex: 60 para Mega-Sena, NULL para Loteca
    min_dezenas_aposta = Column(Integer, nullable=True) # Ex: 6
    max_dezenas_aposta = Column(Integer, nullable=True) # Ex: 20
    criado_em = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    sorteios = relationship("Sorteio", back_populates="modalidade", cascade="all, delete-orphan")
    matrizes = relationship("MatrizFechamento", back_populates="modalidade", cascade="all, delete-orphan")
    jogos = relationship("JogoUsuario", back_populates="modalidade", cascade="all, delete-orphan")


class Sorteio(Base):
    __tablename__ = "sorteios"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    modalidade_id = Column(UUID(as_uuid=True), ForeignKey("modalidades.id", ondelete="CASCADE"), nullable=False)
    numero_concurso = Column(Integer, nullable=False)
    data_sorteio = Column(Date, nullable=False)
    dezenas_sorteadas = Column(ARRAY(Integer), nullable=False)
    detalhes_ganhadores = Column(JSONB, nullable=True)
    acumulou = Column(Boolean, default=False, nullable=False)
    valor_acumulado = Column(Numeric(15, 2), nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    modalidade = relationship("Modalidade", back_populates="sorteios")

    __table_args__ = (
        UniqueConstraint("modalidade_id", "numero_concurso", name="uq_modalidade_concurso"),
    )


class MatrizFechamento(Base):
    __tablename__ = "matrizes_fechamento"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    modalidade_id = Column(UUID(as_uuid=True), ForeignKey("modalidades.id", ondelete="CASCADE"), nullable=False)
    dezenas_totais_selecionadas = Column(Integer, nullable=False) # N
    garantia_acerto = Column(Integer, nullable=False) # K
    dezenas_sorteadas_condicao = Column(Integer, nullable=False) # T
    total_cartoes = Column(Integer, nullable=False)
    matriz_dados = Column(JSONB, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    modalidade = relationship("Modalidade", back_populates="matrizes")
