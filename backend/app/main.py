# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.database import engine
from app.models import core_models
from app.middleware.rate_limiter import limiter

# Routeurs
from app.api.v1 import auth, users, properties, analytics, agencies

# Génération des tables
core_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ymmo API",
    version="1.0.0",
    description="API de la plateforme immobilière Ymmo — gestion des biens, transactions et analytics.",
)

# --- RATE LIMITER ---
# On attache le limiter à l'app et on configure la réponse 429
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS ---
# Autoriser React (Vite) à communiquer avec l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES API ---
app.include_router(auth.router,       prefix="/api/v1/auth",       tags=["Authentification"])
app.include_router(users.router,      prefix="/api/v1/users",      tags=["Utilisateurs"])
app.include_router(properties.router, prefix="/api/v1/properties", tags=["Biens Immobiliers"])
app.include_router(analytics.router,  prefix="/api/v1/analytics",  tags=["Analytics"])
app.include_router(agencies.router,   prefix="/api/v1/agencies",   tags=["Agences"])


@app.get("/", tags=["Santé"])
def read_root():
    return {"message": "L'API Ymmo est en ligne et 100% fonctionnelle !", "version": "1.0.0"}


@app.get("/health", tags=["Santé"])
def health_check():
    """Endpoint de monitoring — peut être appelé par un outil de surveillance."""
    return {"status": "ok", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}