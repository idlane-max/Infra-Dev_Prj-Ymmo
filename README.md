# Projet Ymmo : Plateforme Immobilière Full-Stack

Plateforme web complète de gestion immobilière avec interface utilisateur et administration. Ce projet combine un backend FastAPI moderne, une base de données PostgreSQL, et un frontend React.

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+ et **npm**
- **Python** 3.10+
- **Docker Desktop** (pour PostgreSQL)

### 1. Base de Données (PostgreSQL via Docker)

Lancer la base de données avec Docker Compose :
```bash
docker-compose up -d
```

### 2. Backend (FastAPI)

```bash
# Accéder au container backend
docker exec -it infra-dev-backend-1 bash

# Installer les dépendances
pip install -r requirements.txt

# Générer les données de test
python generate_data.py

# Démarrer le serveur
uvicorn app.main:app --reload
```

### 3. Frontend (React)

Ouvrir un autre terminal :

```bash
cd frontend
npm install
npm run dev
```

### Accès
- **Frontend** : http://localhost:5173
- **API Docs** : http://localhost:8000/docs
- **Database**: `postgres://postgres:postgres@localhost:5432/ymmo`

## 📁 Structure du Projet

```
backend/                # API FastAPI + PostgreSQL
├── app/
│   ├── api/            # Endpoints API
│   ├── models/         # Modèles SQLAlchemy
│   ├── schemas/        # Schémas Pydantic (DTO)
│   └── services/       # Logique métier
├── docker-compose.yml  # Configuration Docker
└── generate_data.py    # Script de seeding

frontend/               # Application React
├── src/
│   ├── components/     # Composants UI
│   ├── pages/          # Vues de l'application
│   └── context/        # AuthContext
└── package.json        # Dépendances NPM
```

## 👥 Rôles Utilisateurs

### Client
- Accès à la liste des biens
- Affichage des détails des biens
- Navigation simple

### Agent (Commercial)
- Accès au dashboard
- Gestion des annonces (CRUD)
- Vue des statistiques

### Admin
- Tous les droits des agents
- Gestion des utilisateurs
- Vue globale de l'entreprise

## 🔌 API Endpoints

### Authentification
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription (Client)
- `GET /auth/me` - Obtenir infos utilisateur connecté

### Biens Immobiliers
- `GET /properties` - Lister les biens (avec filtres)
- `GET /properties/:id` - Obtenir un bien
- `POST /properties` - Créer un bien (Agent/Admin)
- `PUT /properties/:id` - Modifier un bien (Agent/Admin)
- `DELETE /properties/:id` - Supprimer un bien (Agent/Admin)

### Utilisateurs
- `GET /users/me` - Profil connecté
- `GET /users/me/properties` - Ses biens (Agent)

### Statistiques (Dashboard)
- `GET /stats` - Statistiques globales (Admin)
- `GET /stats/agents` - Stats par agent (Admin)
- `GET /stats/agents/:id/stats` - Stats d'un agent (Admin)

### Monitoring
- `GET /health/status` - Santé de l'application
- `GET /health/metrics` - Métriques Prometheus

## 🛠️ Stack Technique

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Base de données**: PostgreSQL
- **Authentification**: JWT + BCrypt
- **Validation**: Pydantic
- **Sécurité**: CORS, rate limiting
- **Monitoring**: Prometheus + Grafana (optionnel)

### Frontend
- **Framework**: React 18
- **Routage**: React Router v6
- **UI**: Tailwind CSS + Shadcn UI
- **Requêtes**: Axios
- **Outil de build**: Vite

## 📦 Options de Déploiement

### 1. Développement (Local)
```bash
# Lancer avec Docker
docker-compose up

# Sans Docker
./scripts/start.sh local
```

### 2. Production (VM / Cloud)
```bash
# Déploiement automatisé
./scripts/start.sh production
```

## 🔐 Sécurité

- Mot de passe hashés avec bcrypt
- JWT avec expiration
- CORS configuré
- Rate limiting (à activer)
- Permissions basées sur les rôles

## 📈 Fonctionnalités Avancées

- Dashboard analytique complet
- Filtres de recherche avancés
- Gestion des agents et agences
- Gestion des transactions
- Monitoring temps réel



## 🔒 Gestion des Rôles et Permissions

Le système implémente un contrôle d'accès basé sur les rôles (RBAC) pour garantir que chaque utilisateur dispose uniquement des privilèges nécessaires à ses fonctions.

### Table des Rôles

| Rôle | ID | Description | Privilèges |
|------|----|-------------|--------------|
| **Direction** | 1 | Membres de la direction | Vue complète du système, gestion des utilisateurs, accès aux données financières |
| **Agent Commercial** | 2 | Commerciaux et agents immobiliers | Gestion de leurs propres annonces, accès au dashboard, gestion des transactions |
| **Client** | 3 | Clients de l'agence | Navigation dans les annonces, création de favoris |

### Permissions par Rôle

#### 👤 Client (role_id = 3)
- **Lecture** : Consulter toutes les annonces
- **Écriture** : Aucune
- **Modification** : Aucune
- **Suppression** : Aucune

#### 👨‍💼 Agent Commercial (role_id = 2)
- **Lecture** : Toutes les annonces, statistiques personnelles
- **Écriture** : Création de nouvelles annonces, ajout de favoris
- **Modification** : Modification de ses propres annonces
- **Suppression** : Suppression de ses propres annonces

#### 👑 Direction (role_id = 1)
- **Lecture** : Toutes les données du système
- **Écriture** : Création de nouvelles annonces, gestion des utilisateurs
- **Modification** : Modification de toutes les annonces, gestion des utilisateurs
- **Suppression** : Suppression de toutes les annonces, gestion des utilisateurs