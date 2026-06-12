# Ymmo Infrastructure Hybride

## Présentation du projet

Ce dépôt contient la documentation technique du projet Ymmo, réalisé dans le cadre du Bachelor 2 Informatique à Ynov.

L'objectif est de concevoir, déployer et documenter une infrastructure informatique hybride combinant un environnement On-Premise virtualisé sous VMware Workstation et une infrastructure Microsoft Azure.

L'infrastructure répond aux besoins d'une entreprise immobilière fictive, en mettant en œuvre les principaux services d'un système d'information d'entreprise :

- Active Directory
- DNS
- DHCP
- Serveur de fichiers
- Base de données PostgreSQL
- Supervision avec Zabbix
- Sauvegarde des serveurs
- Zone DMZ
- Reverse Proxy
- VPN IPsec Site-à-Site
- Infrastructure Cloud Microsoft Azure

L'ensemble de l'architecture est conçu selon des principes de segmentation réseau, de sécurité et de haute disponibilité afin de reproduire une infrastructure d'entreprise réaliste.

## Objectifs du projet

Les principaux objectifs sont :

- Concevoir une architecture réseau sécurisée.
- Déployer une infrastructure Windows et Linux.
- Administrer un domaine Active Directory.
- Héberger une application métier développée avec FastAPI.
- Mettre en œuvre une architecture hybride avec Microsoft Azure.
- Sécuriser les échanges via un VPN IPsec Site-à-Site.
- Centraliser la supervision de l'infrastructure.
- Mettre en place une stratégie de sauvegarde.
- Produire une documentation technique complète.

## Architecture générale

L'infrastructure est organisée autour des composants suivants :

### Site principal (Siège)

- pfSense (Pare-feu / Routeur)
- Active Directory
- DNS
- DHCP
- Serveur de fichiers
- PostgreSQL
- Zabbix
- Serveur de sauvegarde
- DMZ
- Reverse Proxy

### Agence distante

Une agence distante est simulée dans VMware afin de valider :

- le VPN IPsec Site-à-Site ;
- les communications inter-sites ;
- l'accès sécurisé aux ressources du siège.

### Cloud Microsoft Azure

L'infrastructure Azure complète l'environnement On-Premise avec :

- un réseau virtuel (VNet) ;
- plusieurs sous-réseaux dédiés ;
- des machines virtuelles ;
- une VPN Gateway ;
- des services de sauvegarde.

## Arborescence de la documentation

```
docs/
│
├── 01_Architecture_Reseau.md
├── 02_Plan_Adressage_IP.md
├── 03_Politique_Securite.md
├── 04_Gestion_Droits_Acces.md
├── 05_Guide_Configuration_Serveurs.md
├── 06_Sauvegarde_Supervision.md
├── 07_Solution_Cloud_Azure.md
├── 08_Guide_Deploiement.md
├── 09_Materiel_Budget.md
└── 10_Avancement_Projet.md
```

## Technologies utilisées

### Virtualisation
- VMware Workstation

### Réseau
- pfSense
- VLAN
- NAT
- VPN IPsec

### Serveurs Windows
- Windows Server 2022
- Active Directory Domain Services
- DNS
- DHCP
- Windows Server Backup

### Serveurs Linux
- Ubuntu Server 22.04 LTS
- PostgreSQL
- Docker
- Docker Compose
- Nginx
- Zabbix

### Développement Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT
- BCrypt
- Pydantic

### Reverse Proxy & Conteneurisation
- Nginx
- Docker
- Docker Compose

### Cloud
- Microsoft Azure
- Azure Virtual Network
- Azure VPN Gateway
- Azure Virtual Machines

## État d'avancement du projet

| Élément | État |
|--------|------|
| Infrastructure VMware | ✅ Terminé |
| pfSense | ✅ Terminé |
| Active Directory | ✅ Terminé |
| DNS | ✅ Terminé |
| DHCP | ✅ Terminé |
| Serveur de fichiers | ✅ Terminé |
| PostgreSQL | ✅ Terminé |
| Zabbix | ✅ Terminé |
| Sauvegarde | 🟡 En cours |
| Préparation WEB01 | ✅ Prérequis installés |
| Développement FastAPI | 🟡 En cours |
| Reverse Proxy | 🟡 À finaliser |
| VPN IPsec Site-à-Site | ✅ Fonctionnel |
| Infrastructure Azure | 🟡 En cours de déploiement |

## Travaux restant à réaliser

Les éléments suivants restent à finaliser avant la clôture du projet :

- Finalisation du développement de l'application FastAPI.
- Déploiement de l'application sur WEB01.
- Configuration définitive du Reverse Proxy Nginx.
- Mise en place du chiffrement HTTPS.
- Finalisation de la stratégie de sauvegarde.
- Déploiement complet de l'infrastructure Azure.
- Configuration de la connexion hybride Azure ↔ Site principal.
- Supervision des ressources Azure.
- Réalisation des tests de validation et de recette.

## Auteur

**Projet :** Infrastructure Hybride Ymmo

**Formation :** Bachelor 2 Informatique — Ynov

**Année universitaire :** 2025–2026

## Licence

Ce projet est réalisé dans un cadre pédagogique dans le cadre du Bachelor 2 Informatique de Ynov.