# Spécifications Techniques - Projet Ymmo

## 1. Architecture Logicielle

Le projet adopte une **architecture orientée services (SOA)** de type Client-Serveur, garantissant une séparation stricte des responsabilités (separation of concerns).

- **Frontend (Client)** : 
  - Développé en React (TypeScript) avec Vite et Tailwind CSS.
  - Fournit deux expériences distinctes : Un espace public "Portail Immobilier" pour les clients, et un "Dashboard" sécurisé pour la gestion interne.
  - S'appuie sur Axios pour la communication HTTP avec l'API.

- **Backend (API Serveur)** :
  - Développé en Python avec le framework FastAPI pour des performances élevées et une documentation automatique (Swagger).
  - Assure le traitement de la logique métier, la sécurisation (JWT) et la liaison avec la base de données.

## 2. Modèle de Données (Dictionnaire)

La base de données relationnelle (PostgreSQL) garantit l'intégrité des données à travers la structure suivante :

| Table | Description | Clés / Relations |
| :--- | :--- | :--- |
| **`roles`** | Liste des profils (Direction, Commercial, Client). | `id` (PK) |
| **`agencies`** | Les 12 agences et le siège social. | `id` (PK) |
| **`users`** | Collaborateurs et Clients. | `id` (PK), `role_id` (FK), `agency_id` (FK) |
| **`properties`** | Le catalogue des biens immobiliers. | `id` (PK), `agent_id` (FK -> users.id) |
| **`transactions`** | Historique des ventes finalisées (Data Analysis). | `id` (PK), `property_id` (FK) |

## 3. Bonnes Pratiques et Principes de Développement

Le développement Backend respecte rigoureusement les standards de l'ingénierie logicielle :

- **Programmation Orientée Objet (POO)** : L'ensemble des entités du domaine métier (Utilisateur, Bien, Agence) sont modélisées via des classes SQLAlchemy, utilisant l'héritage (`declarative_base()`).
- **Principe de Responsabilité Unique (SOLID - SRP)** : Le code est segmenté en différents modules : 
  - `models/` (Structure de la base de données)
  - `schemas/` (Validation Pydantic)
  - `api/` (Contrôleurs et Routes)
  - `core/` (Configurations et Sécurité).
- **KISS & DRY** : L'injection de dépendance de FastAPI (ex: `Depends(get_db)`) permet de ne jamais répéter l'ouverture et la fermeture des sessions de base de données.
- **Sécurité** : Hachage des mots de passe (Bcrypt), authentification par token (JWT), et restriction d'accès via CORS.

## 4. Stratégie Data Analysis
Le dossier `data_analysis/` contiendra les scripts Python dédiés au traitement de données (`Pandas`, `NumPy`) et à la création de modèles prédictifs (`Scikit-Learn`), qui seront exposés via des endpoints FastAPI dédiés (ex: `/api/v1/analytics/`).