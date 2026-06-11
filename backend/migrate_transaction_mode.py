"""
Migration corrigee : Recree le type enum transactionmode avec valeurs MAJUSCULES
pour compatibilite avec SQLAlchemy Python Enum (SALE, RENT)
"""
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # 1. Supprimer la colonne existante (avec la mauvaise casse)
    conn.execute(text("ALTER TABLE properties DROP COLUMN IF EXISTS transaction_mode;"))
    # 2. Supprimer le type enum errone
    conn.execute(text("DROP TYPE IF EXISTS transactionmode CASCADE;"))
    # 3. Recreer le type avec valeurs en majuscules (compatibles SQLAlchemy)
    conn.execute(text("CREATE TYPE transactionmode AS ENUM ('SALE', 'RENT');"))
    # 4. Rajouter la colonne avec la bonne definition
    conn.execute(text(
        "ALTER TABLE properties "
        "ADD COLUMN IF NOT EXISTS transaction_mode transactionmode NOT NULL DEFAULT 'SALE';"
    ))
    conn.commit()
    print("Migration OK : transactionmode recree avec SALE/RENT (majuscules)")
    print("Tous les biens existants ont ete mis a SALE par defaut.")
