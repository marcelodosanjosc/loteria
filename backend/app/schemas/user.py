from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    nome: str
    email: EmailStr

class UserCreate(UserBase):
    senha: str

class UserResponse(UserBase):
    id: UUID
    nivel_acesso: str
    limite_diario_geracao: int
    criado_em: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
