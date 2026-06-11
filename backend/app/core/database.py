# backend/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# L'URL de connexion à la base de données. 
# EAprès je dois mettre "user", "password" et "localhost" dans le fichier .env !
# Format : postgresql://utilisateur:mot_de_passe@serveur:port/nom_de_la_base
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:%40Postgresql-2026@localhost:5432/ymmo_db"

# L'Engine est le moteur qui gère le pool de connexions (les multiples connexions simultanées des 12 agences)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# SessionLocal est l'usine qui va créer une session (une transaction) à chaque fois qu'un utilisateur fait une requête
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# C'est la base dont héritent tous nos modèles (vu à l'étape précédente)
Base = declarative_base()

# Fonction utilitaire (Dependency Injection) pour fournir une session de BDD à nos routes API
# et surtout, s'assurer de bien la fermer (finally) une fois la requête terminée.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()