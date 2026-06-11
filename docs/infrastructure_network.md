# Architecture d'Infrastructure Réseau - Projet Ymmo

## 1. Contexte et Exigences
Pour répondre aux besoins de communication sécurisée entre le Siège Social et les 12 agences réparties sur le territoire national, une infrastructure centralisée et résiliente a été pensée.

- **Siège Social (Aix-en-Provence)** : Centralise l'hébergement web, la base de données, l'AD (Active Directory) et le stockage de fichiers. Comprend 30 postes.
- **Agences distantes (x12)** : Comportent environ 5 postes chacune, devant accéder de manière sécurisée aux ressources du siège.

## 2. Schéma d'Infrastructure (Topologie)

L'architecture repose sur un réseau privé virtuel (VPN IPSec) en étoile, où le siège social agit comme le cœur du réseau (Hub).

```mermaid
graph TD
    %% Internet Cloud
    Internet((Internet))

    %% Siège Social
    subgraph Siège Social (Aix-en-Provence)
        FW_HQ[Pare-feu / Routeur VPN]
        Switch_HQ[Switch Principal]
        
        %% Serveurs
        subgraph Data Center (DMZ / Interne)
            Srv_WebDB[(Serveur Web & DB<br/>FastAPI + PostgreSQL)]
            Srv_AD[Serveur Fichiers & AD<br/>Contrôle de domaine]
        end
        
        %% Postes
        PC_HQ[30 Postes Utilisateurs]
        Print_HQ[1 Imprimante Centrale]

        FW_HQ --- Switch_HQ
        Switch_HQ --- Srv_WebDB
        Switch_HQ --- Srv_AD
        Switch_HQ --- PC_HQ
        Switch_HQ --- Print_HQ
    end

    %% Agence 1
    subgraph Agence 1 (ex: Bordeaux)
        Router_A1[Routeur VPN IPSec]
        Switch_A1[Switch Agence]
        PC_A1[5 Postes Commerciaux]
        Print_A1[1 Imprimante]

        Router_A1 --- Switch_A1
        Switch_A1 --- PC_A1
        Switch_A1 --- Print_A1
    end

    %% Agence N
    subgraph Agences 2 à 12
        Router_AN[Routeurs VPN IPSec]
        PC_AN[Postes Commerciaux]
        
        Router_AN --- PC_AN
    end

    %% Connexions VPN
    FW_HQ <-->|Tunnel VPN IPSec Sécurisé| Internet
    Internet <-->|Tunnel VPN IPSec Sécurisé| Router_A1
    Internet <-->|Tunnel VPN IPSec Sécurisé| Router_AN
```

## 3. Sécurité et Flux Réseau
- **VPN / IPSec** : Les communications entre le siège et les agences transitent exclusivement par des tunnels IPSec chiffrés. Les agences ne communiquent pas directement entre elles (modèle Hub-and-Spoke).
- **Pare-feu (Firewall)** : Situé au siège, il filtre les accès entrants et sortants. Seuls les ports nécessaires (ex: 443 pour HTTPS) sont ouverts sur l'IP publique. Le port de la base de données (5432) n'est accessible que depuis le réseau local du siège et via le VPN.
- **Serveur Fichiers & Sauvegardes** : Un serveur dédié assure le stockage des rapports Data et les sauvegardes régulières (Backup) de la base de données PostgreSQL.
- **Contrôle de Domaine** : Gère l'authentification réseau des 90 utilisateurs (30 au siège + 60 en agences), garantissant que seuls les postes reconnus accèdent au réseau d'entreprise.
