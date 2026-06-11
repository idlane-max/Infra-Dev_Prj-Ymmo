# backend/app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import core_models
from app.schemas import core_schemas
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/register", response_model=core_schemas.UserResponse)
def create_user(user: core_schemas.UserCreate, db: Session = Depends(get_db)):
    """Route pour créer un nouveau collaborateur Ymmo"""
    
    # 1. On vérifie si l'email existe déjà
    db_user = db.query(core_models.User).filter(core_models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    
    # 2. On brouille le mot de passe avant de l'enregistrer !
    hashed_pwd = get_password_hash(user.password)
    
    # 3. On prépare l'objet pour la base de données
    new_user = core_models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        role_id=user.role_id,
        agency_id=user.agency_id
    )
    
    # 4. On sauvegarde en base
    db.add(new_user)
    db.commit()
    db.refresh(new_user) # Pour récupérer l'ID auto-généré par PostgreSQL
    
    return new_user

@router.post("/register-client", response_model=core_schemas.UserResponse)
def create_client(user: core_schemas.ClientCreate, db: Session = Depends(get_db)):
    """Route pour créer un nouveau compte client"""
    
    # 1. Vérifier si l'email existe déjà
    db_user = db.query(core_models.User).filter(core_models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")
    
    # 2. Chercher ou créer le rôle "Client"
    client_role = db.query(core_models.Role).filter(core_models.Role.name == "Client").first()
    if not client_role:
        client_role = core_models.Role(name="Client")
        db.add(client_role)
        db.commit()
        db.refresh(client_role)
        
    # 3. Chercher ou créer l'agence virtuelle "Clients Web"
    web_agency = db.query(core_models.Agency).filter(core_models.Agency.name == "Clients Web").first()
    if not web_agency:
        web_agency = core_models.Agency(name="Clients Web", city="Internet", is_headquarters=False)
        db.add(web_agency)
        db.commit()
        db.refresh(web_agency)
    
    # 4. Brouiller le mot de passe
    hashed_pwd = get_password_hash(user.password)
    
    # 5. Créer l'utilisateur avec rôle et agence automatiques
    new_user = core_models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        role_id=client_role.id,
        agency_id=web_agency.id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user