from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def verificar_senha(senha_pura: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_pura, senha_hash)

def obter_senha_hash(senha_pura: str) -> str:
    return pwd_context.hash(senha_pura)

def criar_token_acesso(dados: dict, expira_em: timedelta | None = None) -> str:
    copia_dados = dados.copy()
    if expira_em:
        expire = datetime.utcnow() + expira_em
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    copia_dados.update({"exp": expire})
    return jwt.encode(copia_dados, settings.SECRET_KEY, algorithm="HS256")

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def registrar_usuario(usuario_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == usuario_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O email informado já está cadastrado."
        )
    
    hash_senha = obter_senha_hash(usuario_in.senha)
    novo_usuario = User(
        nome=usuario_in.nome,
        email=usuario_in.email,
        senha_hash=hash_senha
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@router.post("/login", response_model=Token)
def login_usuario(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(User).filter(User.email == form_data.username).first()
    if not usuario or not verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_expira = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = criar_token_acesso(
        dados={"sub": usuario.email}, expira_em=token_expira
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais de acesso.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    usuario = db.query(User).filter(User.email == email).first()
    if usuario is None:
        raise credentials_exception
    return usuario
