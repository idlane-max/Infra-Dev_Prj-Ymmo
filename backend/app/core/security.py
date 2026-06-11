# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
import bcrypt # <-- On importe directement bcrypt maintenant !
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import core_models

SECRET_KEY = "une_cle_super_secrete_et_tres_longue_ymmo_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie le mot de passe avec bcrypt directement"""
    # bcrypt a besoin que les chaînes soient encodées en 'utf-8' (format binaire)
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Brouille le mot de passe avec bcrypt"""
    # On génère un "sel" (une donnée aléatoire pour renforcer la sécurité)
    salt = bcrypt.gensalt()
    # On crypte et on décode pour stocker une simple chaîne de caractères en BDD
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(core_models.User).filter(core_models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user