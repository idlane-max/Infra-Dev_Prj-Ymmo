# backend/app/api/v1/agencies.py
"""
Routes de gestion des agences Ymmo.
Accès complet : Direction. Vue restreinte : Commercial (sa propre agence).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.models import core_models
from app.core.security import get_current_user

router = APIRouter()


@router.get("/", response_model=List[Dict[str, Any]])
def list_agencies(
    db: Session = Depends(get_db),
    current_user: core_models.User = Depends(get_current_user),
):
    """Liste toutes les agences avec leurs statistiques."""
    if current_user.role.name not in ["Direction", "Commercial"]:
        raise HTTPException(status_code=403, detail="Accès refusé.")

    if current_user.role.name == "Commercial":
        # Un commercial ne voit que son agence
        agencies = db.query(core_models.Agency).filter(
            core_models.Agency.id == current_user.agency_id
        ).all()
    else:
        agencies = db.query(core_models.Agency).all()

    result = []
    for agency in agencies:
        # Nombre d'agents dans l'agence (hors clients)
        agents_count = db.query(core_models.User).join(core_models.Role).filter(
            core_models.User.agency_id == agency.id,
            core_models.Role.name.in_(["Direction", "Commercial"])
        ).count()

        # Nombre de biens gérés par cette agence
        properties_count = db.query(core_models.Property).join(
            core_models.User, core_models.Property.agent_id == core_models.User.id
        ).filter(core_models.User.agency_id == agency.id).count()

        # CA de l'agence (transactions)
        from sqlalchemy import func
        ca = db.query(func.sum(core_models.Transaction.price_sold)).join(
            core_models.Property, core_models.Transaction.property_id == core_models.Property.id
        ).join(
            core_models.User, core_models.Property.agent_id == core_models.User.id
        ).filter(core_models.User.agency_id == agency.id).scalar() or 0.0

        result.append({
            "id": agency.id,
            "name": agency.name,
            "city": agency.city,
            "is_headquarters": agency.is_headquarters,
            "agents_count": agents_count,
            "properties_count": properties_count,
            "ca_total": round(ca, 2),
        })

    # Trier : siège en premier, puis par CA décroissant
    result.sort(key=lambda x: (not x["is_headquarters"], -x["ca_total"]))
    return result


@router.get("/{agency_id}", response_model=Dict[str, Any])
def get_agency(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: core_models.User = Depends(get_current_user),
):
    """Détail d'une agence avec la liste de ses agents."""
    if current_user.role.name not in ["Direction", "Commercial"]:
        raise HTTPException(status_code=403, detail="Accès refusé.")

    # Un commercial ne peut voir que son agence
    if current_user.role.name == "Commercial" and current_user.agency_id != agency_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez consulter que votre agence.")

    agency = db.query(core_models.Agency).filter(core_models.Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agence non trouvée.")

    agents = db.query(core_models.User).join(core_models.Role).filter(
        core_models.User.agency_id == agency_id,
        core_models.Role.name.in_(["Direction", "Commercial"])
    ).all()

    agents_data = [{
        "id": a.id,
        "email": a.email,
        "role": a.role.name,
        "is_active": a.is_active,
        "properties_count": db.query(core_models.Property).filter(
            core_models.Property.agent_id == a.id
        ).count(),
    } for a in agents]

    return {
        "id": agency.id,
        "name": agency.name,
        "city": agency.city,
        "is_headquarters": agency.is_headquarters,
        "agents": agents_data,
    }
