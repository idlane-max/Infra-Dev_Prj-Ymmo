# Proposition d'une Solution Cloud — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## 1. Contexte et objectifs

Dans le cadre de la modernisation de son infrastructure, Ymmo souhaite étendre son réseau on-premise vers le **Cloud Microsoft Azure**, afin de :

- Héberger une partie de l'application web (haute disponibilité, scalabilité)
- Externaliser une réplique de la base de données pour la résilience
- Disposer d'une solution de sauvegarde hors site (Azure Recovery Services Vault)
- Préparer une éventuelle migration progressive vers le Cloud (approche hybride)

La solution proposée connecte le réseau Azure au siège via un **VPN IPsec Site-à-Site**, offrant une extension transparente du réseau local 192.168.10.0/24 vers le Cloud.

---

## 2. Choix du fournisseur Cloud — justification

| Critère | Microsoft Azure | Justification du choix |
|---------|--------------------|---------------------------|
| Intégration Active Directory | Azure AD Connect natif | Synchronisation simplifiée avec ymmo.local (DC01) |
| VPN Site-à-Site | VPN Gateway natif, compatible pfSense (IKEv2) | Continuité avec l'infrastructure existante |
| Coût | Offre Azure for Students / Pay-as-you-go avec calculateur précis | Maîtrise budgétaire pour une PME |
| Région disponible | France Central (Paris) | Conformité RGPD — données hébergées en France |
| Écosystème | Azure Backup, Azure Monitor, Azure VMs | Cohérent avec les outils déjà utilisés (Windows Server, PostgreSQL) |

---

## 3. Architecture Cloud proposée

```
                  ┌─────────────────────────────────────────┐
                  │         Microsoft Azure — France Central │
                  │         VNET-YMMO  10.10.0.0/16          │
                  ├─────────────────────────────────────────┤
                  │                                           │
   [VPN IPsec] ──►│  GatewaySubnet      10.10.255.0/27       │
   (vers          │   └─ VPN Gateway     10.10.255.1         │
   PFSENSE01)     │                                           │
                  │  SUBNET-WEB         10.10.1.0/24         │
                  │   └─ VM-AZ-WEB       10.10.1.10          │
                  │       (Ubuntu 22.04, réplique app web)   │
                  │                                           │
                  │  SUBNET-DB          10.10.2.0/24         │
                  │   └─ VM-AZ-DB        10.10.2.10          │
                  │       (Ubuntu 22.04, réplique PostgreSQL)│
                  │                                           │
                  │  SUBNET-BACKUP      10.10.3.0/24         │
                  │   └─ AZ-BACKUP       10.10.3.10          │
                  │       (Recovery Services Vault)          │
                  └─────────────────────────────────────────┘
```

---

## 4. Composants Azure détaillés

### 4.1 — Groupe de ressources
| Paramètre | Valeur |
|-----------|--------|
| Nom | RG-YMMO |
| Région | France Central |

### 4.2 — Réseau virtuel (VNET-YMMO)
| Sous-réseau | Plage | Usage |
|-------------|-------|-------|
| SUBNET-WEB | 10.10.1.0/24 | VM-AZ-WEB |
| SUBNET-DB | 10.10.2.0/24 | VM-AZ-DB |
| SUBNET-BACKUP | 10.10.3.0/24 | Recovery Services Vault |
| GatewaySubnet | 10.10.255.0/27 | VPN Gateway (nom réservé Azure) |

### 4.3 — Machines virtuelles
| VM | Taille | OS | Rôle |
|----|--------|-----|------|
| VM-AZ-WEB | Standard_B1s (1 vCPU, 1 Go RAM) | Ubuntu Server 22.04 LTS | Réplique / extension de l'application web Ymmo |
| VM-AZ-DB | Standard_B1s (1 vCPU, 1 Go RAM) | Ubuntu Server 22.04 LTS | Réplique PostgreSQL (lecture, DR) |

### 4.4 — VPN Gateway
| Paramètre | Valeur |
|-----------|--------|
| Nom | VPN-GW-YMMO |
| Type | Route-based (basé sur des itinéraires) |
| SKU | VpnGw1 (production) / Basic (tests) |
| Connexion | IPsec IKEv2 vers PFSENSE01 (Local Network Gateway = IP WAN pfSense) |

### 4.5 — Sauvegarde
| Paramètre | Valeur |
|-----------|--------|
| Service | Recovery Services Vault (AZ-BACKUP) |
| Politique | Sauvegarde quotidienne à 02h00, rétention 30 jours |
| Ressources protégées | VM-AZ-WEB, VM-AZ-DB |

---

## 5. Connectivité — VPN IPsec Site-à-Site

| Élément | Côté Azure | Côté On-Premise |
|---------|--------------|---------------------|
| Passerelle | VPN-GW-YMMO (10.10.255.1) | PFSENSE01 (interface WAN) |
| Réseau local | VNET-YMMO 10.10.0.0/16 | 192.168.10.0/24, 192.168.20.0/24, 192.168.30.0/24 |
| Protocole | IKEv2 | IKEv2 |
| Authentification | Clé pré-partagée (PSK) | Clé pré-partagée (PSK), identique des deux côtés |
| Chiffrement | AES-256 / SHA-256 | AES-256 / SHA-256 / DH Group 2 |

> **Contrainte identifiée :** Azure nécessite une adresse IP publique fixe côté on-premise pour le **Local Network Gateway**. En environnement de test VMware (NAT), l'IP WAN du pfSense correspond à l'IP de la box FAI, généralement dynamique. En production, Ymmo devra souscrire une **IP fixe** auprès de son FAI, ou utiliser un service **DynDNS** combiné à une reconfiguration automatique du Local Network Gateway (via script Azure CLI).

---

## 6. Avantages de la solution proposée

| Avantage | Description |
|----------|-------------|
| Haute disponibilité | Réplique applicative et base de données disponible même en cas de panne du siège |
| Scalabilité | Possibilité d'augmenter la taille des VMs Azure (Standard_B2s, B4ms...) selon la charge |
| Sauvegarde hors site | Conformité au principe 3-2-1, protection contre sinistre physique au siège |
| Conformité RGPD | Hébergement en France (région France Central) |
| Évolutivité | Possibilité d'ajouter Azure AD Connect pour synchroniser ymmo.local avec Azure AD, ou migrer progressivement des services vers le Cloud |
| Coût maîtrisé | VMs de taille B1s suffisantes pour la phase pilote, dimensionnement à la hausse possible sans refonte de l'architecture |

---

## 7. Limites et points de vigilance

| Point de vigilance | Recommandation |
|------------------------|------------------|
| IP publique fixe requise côté on-premise | Souscrire une offre FAI avec IP fixe ou DynDNS |
| Coût de la VPN Gateway (facturation horaire continue) | Prévoir ce coût fixe dans le budget mensuel (~25-140€/mois selon SKU) |
| Latence réseau via VPN | Pour les applications sensibles à la latence, privilégier le traitement on-premise et ne répliquer que les données non critiques en temps réel |
| Gestion des identités multi-environnements | Étudier Azure AD Connect pour éviter la double gestion des comptes utilisateurs |

---

## 8. Roadmap de migration progressive (proposition)

| Phase | Description | Statut dans ce projet |
|-------|-------------|---------------------------|
| Phase 1 | Mise en place du VNET, des subnets et du VPN IPsec | Architecturé — déploiement non finalisé (IP publique requise) |
| Phase 2 | Déploiement de VM-AZ-WEB en réplique de lecture | Proposé |
| Phase 3 | Déploiement de VM-AZ-DB en réplique PostgreSQL (streaming replication) | Proposé |
| Phase 4 | Bascule des sauvegardes vers Azure Recovery Services Vault | Proposé |
| Phase 5 | Étude de la synchronisation Azure AD Connect | Proposé (hors périmètre actuel) |

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
