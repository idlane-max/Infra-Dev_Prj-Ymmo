# backend/app/schemas/core_schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional

# --- SCHÉMAS UTILISATEUR ---

class UserCreate(BaseModel):
    """Ce qu'on attend du frontend pour créer un compte"""
    email: EmailStr # Valide automatiquement que c'est un format email correct
    password: str
    role_id: int
    agency_id: int

class ClientCreate(BaseModel):
    """Ce qu'on attend du frontend pour créer un compte client (sans rôle ni agence)"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Ce qu'on renvoie au frontend (SANS le mot de passe !)"""
    id: int
    email: EmailStr
    role_id: int
    agency_id: int
    is_active: bool

    class Config:
        from_attributes = True # Permet à Pydantic de lire les modèles SQLAlchemy

# --- SCHÉMAS BIENS IMMOBILIERS ---

class PropertyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    area: float
    city: str
    type: str                   # 'HOUSE', 'APARTMENT', 'COMMERCIAL'
    transaction_mode: str = "SALE"  # 'SALE' (vente) ou 'RENT' (location)

class PropertyResponse(PropertyCreate):
    id: int
    status: str
    agent_id: int

    class Config:
        from_attributes = True

# --- SCHÉMAS TRANSACTIONS ---

class TransactionCreate(BaseModel):
    property_id: int
    buyer_id: Optional[int] = None
    agent_id: int
    price_sold: float

class TransactionResponse(TransactionCreate):
    id: int
    
    class Config:
        from_attributes = True