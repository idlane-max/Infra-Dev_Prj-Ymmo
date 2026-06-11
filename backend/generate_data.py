import sys
import os
import random
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from faker import Faker
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.core_models import Role, Agency, User, Property, PropertyType, PropertyStatus, Transaction
from app.core.security import get_password_hash

# Initialiser Faker en français
fake = Faker('fr_FR')

from sqlalchemy import text

def init_db():
    print("Ensure all tables exist...")
    Base.metadata.create_all(bind=engine)

def seed_data(db: Session):
    print("Clearing existing data...")
    db.query(Transaction).delete()
    db.query(Property).delete()
    db.query(User).delete()
    db.query(Agency).delete()
    db.query(Role).delete()
    db.commit()

    print("Generating Roles...")
    roles = {
        "Direction": Role(name="Direction"),
        "Commercial": Role(name="Commercial"),
        "Client": Role(name="Client")
    }
    for r in roles.values():
        db.add(r)
    db.commit()

    print("Generating Agencies...")
    headquarters = Agency(name="Ymmo Siège National", city="Aix-en-Provence", is_headquarters=True)
    db.add(headquarters)
    
    agencies_list = [
        Agency(name="Ymmo Paris Centre", city="Paris", is_headquarters=False),
        Agency(name="Ymmo Lyon Presqu'île", city="Lyon", is_headquarters=False),
        Agency(name="Ymmo Marseille Vieux-Port", city="Marseille", is_headquarters=False),
        Agency(name="Ymmo Bordeaux Chartrons", city="Bordeaux", is_headquarters=False),
        Agency(name="Ymmo Toulouse Capitole", city="Toulouse", is_headquarters=False),
        Agency(name="Ymmo Nice Promenade", city="Nice", is_headquarters=False),
        Agency(name="Ymmo Nantes Hyper-centre", city="Nantes", is_headquarters=False),
        Agency(name="Ymmo Strasbourg Cathédrale", city="Strasbourg", is_headquarters=False),
        Agency(name="Ymmo Lille Grand'Place", city="Lille", is_headquarters=False),
        Agency(name="Ymmo Rennes Bretagne", city="Rennes", is_headquarters=False),
        Agency(name="Ymmo Montpellier Comédie", city="Montpellier", is_headquarters=False),
        Agency(name="Clients Web", city="Internet", is_headquarters=False) # Agence virtuelle pour les clients
    ]
    db.add_all(agencies_list)
    db.commit()

    print("Generating Users (Direction & Commercials)...")
    admin = User(
        email="admin@ymmo.fr",
        hashed_password=get_password_hash("admin123"),
        role_id=roles["Direction"].id,
        agency_id=headquarters.id
    )
    db.add(admin)

    commercials = []
    # 5 commerciaux pour chacune des 11 agences physiques
    for agency in agencies_list[:-1]:
        for _ in range(5):
            c = User(
                email=f"com_{fake.unique.user_name()}@ymmo.fr",
                hashed_password=get_password_hash("password123"),
                role_id=roles["Commercial"].id,
                agency_id=agency.id
            )
            commercials.append(c)
    db.add_all(commercials)

    # Création de clients
    clients = []
    client_agency = agencies_list[-1]
    for _ in range(20):
        c = User(
            email=fake.unique.email(),
            hashed_password=get_password_hash("client123"),
            role_id=roles["Client"].id,
            agency_id=client_agency.id
        )
        clients.append(c)
    db.add_all(clients)
    db.commit()

    print("Generating Properties and Transactions...")
    property_types = [PropertyType.HOUSE, PropertyType.APARTMENT, PropertyType.COMMERCIAL]
    statuses = [PropertyStatus.AVAILABLE, PropertyStatus.UNDER_OFFER, PropertyStatus.SOLD]
    
    properties = []
    transactions = []
    
    # 500 biens immobiliers
    for i in range(500):
        prop_type = random.choices(property_types, weights=[40, 50, 10])[0]
        
        status = random.choices(statuses, weights=[50, 10, 40])[0]
        
        area = random.uniform(20.0, 300.0)
        price_per_m2 = random.uniform(2000, 10000)
        price = area * price_per_m2
        
        city = random.choice(agencies_list[:-1]).city

        agent = random.choice([c for c in commercials if c.agency.city == city])

        prop = Property(
            title=fake.catch_phrase().capitalize(),
            description=fake.text(max_nb_chars=200),
            price=round(price, -3),
            area=round(area, 1),
            city=city,
            type=prop_type,
            status=status,
            agent_id=agent.id,
            created_at=fake.date_time_between(start_date='-3y', end_date='now')
        )
        properties.append(prop)
        db.add(prop)
        db.flush()
        
        if status == PropertyStatus.SOLD:
            t_date = fake.date_time_between(start_date=prop.created_at, end_date='now')
            price_sold = prop.price * random.uniform(0.90, 1.0)
            buyer = random.choice(clients) if random.random() > 0.5 else None
            
            t = Transaction(
                property_id=prop.id,
                buyer_id=buyer.id if buyer else None,
                agent_id=prop.agent_id,
                price_sold=round(price_sold, -3),
                transaction_date=t_date
            )
            transactions.append(t)
            db.add(t)

    db.commit()
    print("Database seeding completed successfully!")
    print(f"Stats: 12 Agencies, 60 Commercials, {len(properties)} Properties, {len(transactions)} Transactions.")

def main():
    init_db()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
