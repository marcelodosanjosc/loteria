from sqlalchemy import Column, String, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class FiltroSalvo(Base):
    __tablename__ = "filtros_salvos"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    modalidade_id = Column(UUID(as_uuid=True), ForeignKey("modalidades.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String(100), nullable=False)
    configuracao = Column(JSONB, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)


class JogoUsuario(Base):
    __tablename__ = "jogos_usuario"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    modalidade_id = Column(UUID(as_uuid=True), ForeignKey("modalidades.id", ondelete="CASCADE"), nullable=False)
    tipo_geracao = Column(String(30), nullable=False) # 'aleatorio', 'fechamento', 'filtrado'
    jogos = Column(JSONB, nullable=False) # Lista de bilhetes gerados
    criado_em = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    modalidade = relationship("Modalidade", back_populates="jogos")

    @property
    def modalidade_nome(self) -> str:
        return self.modalidade.nome if self.modalidade else "Loteria"
