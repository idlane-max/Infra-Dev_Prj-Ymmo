# backend/app/middleware/rate_limiter.py
"""
Middleware de Rate Limiting pour l'API Ymmo.
Utilise slowapi (wrapper autour de limits) pour limiter les requêtes par IP.

Limites configurées :
  - /api/v1/auth/login    : 5 requêtes / minute  (anti-brute-force)
  - /api/v1/users/register: 10 requêtes / minute (anti-spam)
  - Global par défaut     : 100 requêtes / minute
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Le Limiter utilise l'adresse IP du client comme clé d'identification
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
