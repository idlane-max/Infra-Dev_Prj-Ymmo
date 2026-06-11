from app.core.database import SessionLocal
from app.models.core_models import User, Role, Agency
from app.core.security import get_password_hash

db = SessionLocal()

try:
    # Ensure Role Direction exists
    role = db.query(Role).filter(Role.name == "Direction").first()
    if not role:
        role = Role(name="Direction")
        db.add(role)
        db.commit()
        db.refresh(role)

    # Ensure Headquarters Agency exists
    agency = db.query(Agency).filter(Agency.name == "Siège Social").first()
    if not agency:
        agency = Agency(name="Siège Social", city="Aix-en-Provence", is_headquarters=True)
        db.add(agency)
        db.commit()
        db.refresh(agency)

    # Create or update admin user
    admin = db.query(User).filter(User.email == "admin@ymmo.fr").first()
    if not admin:
        admin = User(email="admin@ymmo.fr", hashed_password=get_password_hash("admin123"), role_id=role.id, agency_id=agency.id)
        db.add(admin)
        print("Utilisateur admin@ymmo.fr créé avec succès.")
    else:
        admin.hashed_password = get_password_hash("admin123")
        admin.role_id = role.id
        admin.agency_id = agency.id
        print("Le mot de passe de admin@ymmo.fr a été réinitialisé à 'admin123'.")
    db.commit()

finally:
    db.close()
