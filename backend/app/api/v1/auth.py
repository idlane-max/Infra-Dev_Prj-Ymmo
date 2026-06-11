# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import core_models
from app.core.security import verify_password, create_access_token
from app.middleware.rate_limiter import limiter

router = APIRouter()


@router.post("/login")
@limiter.limit("5/minute")  # Anti brute-force : max 5 tentatives par minute par IP
def login(
    request: Request,  # Requis par slowapi pour lire l'IP du client
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Route pour s'authentifier et récupérer un token JWT"""

    # 1. On cherche l'utilisateur dans la base de données (form_data.username contient l'email)
    user = db.query(core_models.User).filter(core_models.User.email == form_data.username).first()

    # 2. Si l'utilisateur n'existe pas ou si le mot de passe est faux -> Erreur 401
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Si tout est bon, on fabrique le badge.
    # TRÈS IMPORTANT : On intègre le rôle de l'utilisateur dans le badge !
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.name}
    )

    # 4. On renvoie le badge au Frontend (React)
    return {"access_token": access_token, "token_type": "bearer", "role": user.role.name}