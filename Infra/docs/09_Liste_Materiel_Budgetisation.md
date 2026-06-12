# Liste du Matériel et Budgétisation — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## 1. Contexte

Ce document présente les ressources matérielles nécessaires au déploiement de l'infrastructure Ymmo, à la fois pour l'environnement de **maquette/test** (VMware Workstation, utilisé dans ce projet) et pour une **estimation en conditions réelles de production** (matériel physique + abonnements Cloud).

---

## 2. Ressources virtuelles — Environnement de maquette (VMware Workstation)

| VM | Rôle | CPU | RAM | Disque | Réseau |
|----|------|-----|-----|--------|--------|
| PFSENSE01 | Pare-feu / Routeur | 2 vCPU | 2 Go | 20 Go | WAN (VMnet8), VMnet2/3/4 |
| DC01 | Active Directory / DNS / GPO | 2 vCPU | 4 Go | 60 Go | VMnet2 |
| FILE01 | DHCP / Fichiers | 2 vCPU | 4 Go | 160 Go (60+100) | VMnet2 |
| DB01 | PostgreSQL | 2 vCPU | 4 Go | 60 Go | VMnet2 |
| BACKUP01 | Sauvegarde | 2 vCPU | 4 Go | 260 Go (60+200) | VMnet2 |
| MONITOR01 | Zabbix (Docker) | 2 vCPU | 4 Go | 40 Go | VMnet2 |
| WEB01 | Nginx + Docker | 2 vCPU | 4 Go | 40 Go | VMnet4 |
| REVERSE-PROXY | Reverse Proxy | 1 vCPU | 2 Go | 20 Go | VMnet4 |
| PFSENSE-AGENCE01 | Routeur agence (test) | 1 vCPU | 1 Go | 10 Go | WAN (VMnet8), VMnet5 |
| **TOTAL** | | **16 vCPU** | **29 Go** | **670 Go** | |

**Prérequis machine hôte (recommandé) :** CPU 8 cœurs / 16 threads minimum, 32 Go RAM, 1 To SSD (les VMs étant en thin provisioning, l'espace réel utilisé est inférieur au total alloué).

---

## 3. Logiciels et licences (environnement de test)

| Logiciel | Édition / Version | Coût | Remarque |
|----------|----------------------|------|----------|
| VMware Workstation Pro | 17.x | Gratuit (usage perso depuis v17) ou licence Broadcom | Vérifier conditions de licence en contexte académique |
| pfSense CE | 2.7+ | Gratuit (open-source) | |
| Windows Server 2022 | Standard, Desktop Experience | Licence éducation Ynov (Microsoft Imagine / Azure Dev Tools for Teaching) | DC01, FILE01, BACKUP01 |
| Ubuntu Server | 22.04 LTS / 25.10 | Gratuit (open-source) | DB01, MONITOR01, WEB01, REVERSE-PROXY |
| PostgreSQL | 14 / 16 | Gratuit (open-source) | |
| Zabbix | 7.0 LTS (Docker) | Gratuit (open-source) | |
| Nginx | Stable | Gratuit (open-source) | |
| Docker / Docker Compose | Dernière version | Gratuit (open-source, usage non commercial) | |

---

## 4. Proposition matérielle — Déploiement en production (siège Aix-en-Provence)

### 4.1 — Serveurs physiques

| Référence | Quantité | Spécifications | Usage | Prix unitaire estimé | Sous-total |
|-----------|----------|--------------------|-------|--------------------------|------------|
| Serveur Rack 1U (ex. Dell PowerEdge R350 / HPE ProLiant DL360) | 2 | 2x Xeon Silver, 64 Go RAM, 2x SSD 480 Go RAID1 + 2x HDD 2 To RAID1 | Hyperviseur (VMware ESXi / Hyper-V) — héberge toutes les VMs (DC01, FILE01, DB01, BACKUP01, MONITOR01, WEB01, REVERSE-PROXY) | 3 500 € | 7 000 € |
| Pare-feu matériel (ex. Netgate appliance pfSense ou Fortinet FortiGate 40F) | 1 | 4 ports Gigabit minimum, support VPN IPsec | PFSENSE01 (pare-feu physique dédié) | 600 € | 600 € |
| Switch manageable L2/L3 (ex. Cisco/Netgear 24 ports avec VLAN) | 2 | 24 ports Gigabit, support VLAN 802.1Q | Cœur de réseau siège (LAN-SERVERS, LAN-USERS, DMZ) | 450 € | 900 € |
| Onduleur (UPS) | 2 | 1500 VA, autonomie ~15 min | Protection serveurs et switches | 350 € | 700 € |
| Baie de stockage NAS (sauvegarde locale) | 1 | 4 baies, RAID5, 4x4 To | Stockage BACKUP01 (alternative/complément à VM) | 1 200 € | 1 200 € |

**Sous-total matériel siège : 10 400 €**

---

### 4.2 — Postes utilisateurs et périphériques

| Référence | Quantité | Spécifications | Prix unitaire estimé | Sous-total |
|-----------|----------|--------------------|--------------------------|------------|
| Poste de travail bureau (ex. Dell OptiPlex / Lenovo ThinkCentre) | 30 | i5, 16 Go RAM, SSD 256 Go, Windows 11 Pro | 700 € | 21 000 € |
| Imprimante multifonction réseau (siège) | 1 | Laser, réseau Ethernet | 400 € | 400 € |
| Écrans 24" | 30 | Full HD | 130 € | 3 900 € |

**Sous-total postes siège : 25 300 €**

---

### 4.3 — Équipements par agence (x12)

| Référence | Quantité par agence | Spécifications | Prix unitaire | Sous-total / agence | Sous-total x12 |
|-----------|---------------------------|--------------------|------------------|------------------------|-------------------|
| Poste de travail | 5 | i5, 8 Go RAM, SSD 256 Go | 600 € | 3 000 € | 36 000 € |
| Écran 24" | 5 | Full HD | 130 € | 650 € | 7 800 € |
| Imprimante réseau | 1 | Laser, Ethernet | 350 € | 350 € | 4 200 € |
| Routeur/pare-feu agence (VPN IPsec) | 1 | ex. Netgate 1100 ou équivalent | 250 € | 250 € | 3 000 € |
| Switch 8 ports | 1 | Gigabit non manageable | 60 € | 60 € | 720 € |

**Sous-total équipements agences (x12) : 51 720 €**

---

## 5. Coûts récurrents — Cloud Azure (estimation mensuelle)

| Ressource | Configuration | Coût mensuel estimé |
|-----------|---------------|------------------------|
| VM-AZ-WEB | Standard_B1s (1 vCPU, 1 Go RAM) | ~8 € |
| VM-AZ-DB | Standard_B1s (1 vCPU, 1 Go RAM) | ~8 € |
| VPN Gateway | SKU VpnGw1 (facturation horaire continue) | ~110 € |
| Stockage (disques managés + Recovery Vault) | ~100 Go | ~10 € |
| Bande passante sortante | Estimation usage modéré | ~5 € |
| **Total Azure mensuel estimé** | | **~141 € / mois** soit **~1 692 € / an** |

> Le poste le plus coûteux est la VPN Gateway. Pour réduire les coûts en phase pilote, le **SKU "Basic"** peut être utilisé (~25 €/mois) mais avec des limitations (pas de SLA, débit réduit, pas de connexions multiples).

---

## 6. Coûts récurrents — Licences logicielles (production)

| Licence | Quantité | Coût annuel estimé |
|---------|----------|------------------------|
| Windows Server 2022 Standard (licences cœurs, x3 serveurs) | 3 | ~3 000 € (one-time, amorti) |
| Licences Windows 11 Pro (postes) | 42 (30 siège + 12 minimum agences si Windows requis) | Incluses dans le prix des postes (OEM) |
| Antivirus / EDR entreprise | 42 postes + 7 serveurs | ~2 000 € / an |
| Support FortiGate / Netgate (si applicable) | 1 | ~300 € / an |
| Abonnement Microsoft 365 (messagerie, bureautique) | 42 utilisateurs (siège + agences) | ~5 €/mois/utilisateur ≈ 2 520 € / an |

**Sous-total licences/an : ~7 820 €**

---

## 7. Synthèse budgétaire globale (estimation production — 1ère année)

| Poste de dépense | Montant |
|-------------------|---------|
| Matériel serveurs et réseau siège | 10 400 € |
| Postes et périphériques siège | 25 300 € |
| Équipements agences (x12) | 51 720 € |
| Cloud Azure (1 an) | 1 692 € |
| Licences logicielles (1 an) | 7 820 € |
| **TOTAL ESTIMÉ 1ère ANNÉE** | **≈ 96 932 €** |

| Coûts récurrents annuels (années suivantes) | Montant |
|------------------------------------------------|---------|
| Cloud Azure | 1 692 € |
| Licences (antivirus, M365, support) | 7 820 € |
| Maintenance matérielle (estimée 5% valeur matériel) | ~4 370 € |
| **TOTAL récurrent annuel estimé** | **≈ 13 882 € / an** |

---

## 8. Hypothèses et limites de l'estimation

- Les prix sont des **estimations indicatives** basées sur des tarifs publics moyens (2025-2026), hors négociation fournisseur et hors TVA.
- Le matériel réseau (switches, onduleurs) est mutualisé pour l'ensemble du siège ; un dimensionnement plus fin nécessiterait une étude de charge réelle.
- Les agences sont supposées disposer d'une connexion Internet existante (fibre/ADSL professionnelle) — le coût de l'abonnement Internet n'est pas inclus.
- Le coût de la main d'œuvre (installation, configuration, formation) n'est pas inclus dans cette estimation matérielle/logicielle.
- Pour la phase pilote/maquette (ce projet académique), seul l'environnement virtualisé (section 2) a un coût réel : **0 €** (logiciels open-source + licences éducation).

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
