# backend/app/api/v1/properties.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models import core_models
from app.schemas import core_schemas
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[core_schemas.PropertyResponse])
def get_properties(
    db: Session = Depends(get_db), 
    limit: int = 100,
    city: Optional[str] = None,
    type: Optional[str] = None,
    transaction_mode: Optional[str] = None,
    keyword: Optional[str] = None,
    max_price: Optional[float] = None,
    include_sold: bool = False   # Par défaut, on masque les biens vendus du catalogue public
):
    """Récupère la liste des biens immobiliers (Catalogue public avec filtres)"""
    query = db.query(core_models.Property)
    
    # Masquer les biens vendus par défaut dans le catalogue public
    if not include_sold:
        query = query.filter(
            core_models.Property.status != core_models.PropertyStatus.SOLD
        )
    
    # Application des filtres
    if city:
        query = query.filter(core_models.Property.city.ilike(f"%{city}%"))
    if type:
        query = query.filter(core_models.Property.type == type)
    if transaction_mode:
        query = query.filter(core_models.Property.transaction_mode == transaction_mode)
    if keyword:
        query = query.filter(
            core_models.Property.title.ilike(f"%{keyword}%") |
            core_models.Property.city.ilike(f"%{keyword}%")
        )
    if max_price:
        query = query.filter(core_models.Property.price <= max_price)
        
    properties = query.limit(limit).all()
    return properties

@router.get("/agency", response_model=List[core_schemas.PropertyResponse])
def get_agency_properties(
    db: Session = Depends(get_db),
    current_user: core_models.User = Depends(get_current_user),
    limit: int = 100
):
    """Récupère les biens de l'agence du commercial connecté (ou tous les biens pour la Direction)"""
    if current_user.role.name == "Direction":
        # La Direction voit tout
        properties = db.query(core_models.Property).limit(limit).all()
    elif current_user.role.name == "Commercial":
        # Le Commercial ne voit que les biens gérés par des agents de SON agence
        properties = db.query(core_models.Property).join(core_models.User).filter(
            core_models.User.agency_id == current_user.agency_id
        ).limit(limit).all()
    else:
        raise HTTPException(status_code=403, detail="Accès refusé.")
        
    return properties

@router.get("/{property_id}", response_model=core_schemas.PropertyResponse)
def get_property(
    property_id: int,
    db: Session = Depends(get_db)
):
    """Récupère un bien immobilier par son ID"""
    db_property = db.query(core_models.Property).filter(core_models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Bien immobilier non trouvé")
    return db_property

@router.post("/", response_model=core_schemas.PropertyResponse)
def create_property(
    property_data: core_schemas.PropertyCreate, 
    db: Session = Depends(get_db),
    current_user: core_models.User = Depends(get_current_user)
):
    """Ajoute un nouveau bien (réservé aux commerciaux/direction)"""
    roles_autorises = ["Direction", "Commercial"]
    if current_user.role.name not in roles_autorises:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Accès refusé. Seule la Direction et les Commerciaux peuvent créer un bien."
        )
        
    new_property = core_models.Property(
        **property_data.model_dump(), 
        agent_id=current_user.id
    )
    
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    
    return new_property

@router.put("/{property_id}", response_model=core_schemas.PropertyResponse)
def update_property(
    property_id: int, 
    property_data: core_schemas.PropertyCreate, 
    db: Session = Depends(get_db),
    current_user: core_models.User = Depends(get_current_user)
):
    """Modifier un bien existant"""
    db_property = db.query(core_models.Property).filter(core_models.Property.id == property_id).first()
    
    if not db_property:
        raise HTTPException(status_code=404, detail="Bien immobilier non trouvé")
        
    # Vérification stricte : Un commercial ne peut modifier qu'un bien de son agence
    if current_user.role.name == "Commercial":
        agent_du_bien = db.query(core_models.User).filter(core_models.User.id == db_property.agent_id).first()
        if not agent_du_bien or agent_du_bien.agency_id != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que les biens de votre agence.")
    
    # Mise à jour des champs
    for key, value in property_data.model_dump().items():
        setattr(db_property, key, value)
        
    db.commit()
    db.refresh(db_property)
    return db_property

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int, 
    db: Session = Depends(get_db),
    current_user: core_models.User = Depends(get_current_user)
):
    """Supprimer un bien"""
    if current_user.role.name not in ["Direction", "Commercial"]:
         raise HTTPException(status_code=403, detail="Droits insuffisants pour supprimer un bien.")

    db_property = db.query(core_models.Property).filter(core_models.Property.id == property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Bien immobilier non trouvé")
        
    # Vérification stricte : Un commercial ne peut supprimer qu'un bien de son agence
    if current_user.role.name == "Commercial":
        agent_du_bien = db.query(core_models.User).filter(core_models.User.id == db_property.agent_id).first()
        if not agent_du_bien or agent_du_bien.agency_id != current_user.agency_id:
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que les biens de votre agence.")
        
    db.delete(db_property)
    db.commit()
    return None