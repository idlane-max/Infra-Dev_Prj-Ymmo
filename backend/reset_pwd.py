from app.core.database import SessionLocal
from app.models.core_models import User
from app.core.security import get_password_hash

db = SessionLocal()

try:
    user = db.query(User).filter(User.email == "user@example.com").first()
    if user:
        user.hashed_password = get_password_hash("admin123")
        db.commit()
        print("Le mot de passe de user@example.com a été changé pour 'admin123'")
    else:
        print("Utilisateur user@example.com non trouvé")
finally:
    db.close()
