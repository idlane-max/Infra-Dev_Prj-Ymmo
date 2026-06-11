from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

# --- ÉNUMÉRATIONS ---
# Utiliser des Enums sécurise la donnée : on ne peut insérer que ces valeurs précises.
class PropertyStatus(enum.Enum):
    AVAILABLE = "available"
    UNDER_OFFER = "under_offer"
    SOLD = "sold"

class PropertyType(enum.Enum):
    HOUSE = "house"
    APARTMENT = "apartment"
    COMMERCIAL = "commercial"

class TransactionMode(enum.Enum):
    SALE = "sale"       # Bien à vendre
    RENT = "rent"       # Bien à louer

# --- TABLES ---

class Role(Base):
    """Table stockant les rôles de l'entreprise (Direction, Commercial, etc.)"""
    __tablename__ = "roles" # Convention de nommage : snake_case et pluriel

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    # Relation inverse : permet de récupérer tous les utilisateurs ayant ce rôle
    users = relationship("User", back_populates="role")

class Agency(Base):
    """Table stockant le siège et les 12 agences"""
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    is_headquarters = Column(Boolean, default=False) # Permet d'identifier le siège d'Aix-en-Provence
    
    users = relationship("User", back_populates="agency")

class User(Base):
    """Table des collaborateurs Ymmo"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False) # On ne stocke JAMAIS de mot de passe en clair !
    is_active = Column(Boolean, default=True)
    
    # Clés étrangères (Foreign Keys) pour lier l'utilisateur à son rôle et son agence
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False)

    # Relations SQLAlchemy pour naviguer facilement d'un objet à l'autre en Python
    role = relationship("Role", back_populates="users")
    agency = relationship("Agency", back_populates="users")
    properties = relationship("Property", back_populates="agent")

class Property(Base):
    """Table des biens immobiliers"""
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False) # Float pour les montants financiers (ou Numeric pour plus de précision)
    area = Column(Float, nullable=False) # Surface en m2
    city = Column(String, index=True, nullable=False) # Indexé car on fera souvent des recherches par ville
    
    type = Column(Enum(PropertyType), nullable=False)
    transaction_mode = Column(Enum(TransactionMode), nullable=False, default=TransactionMode.SALE)  # Vente ou Location
    status = Column(Enum(PropertyStatus), default=PropertyStatus.AVAILABLE)
    
    created_at = Column(DateTime, default=datetime.utcnow) # Pratique pour analyser la durée de mise en vente
    
    # Le commercial en charge du bien
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent = relationship("User", back_populates="properties")

class Transaction(Base):
    """Table des ventes finalisées pour l'analyse de données"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), unique=True, nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optionnel (client externe)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Le commercial
    
    price_sold = Column(Float, nullable=False) # Le prix d'achat final (peut différer du prix initial)
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relations
    property = relationship("Property")
    buyer = relationship("User", foreign_keys=[buyer_id])
    agent = relationship("User", foreign_keys=[agent_id])