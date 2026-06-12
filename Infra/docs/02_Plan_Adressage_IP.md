# Plan d'Adressage IP — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## 1. Plan d'adressage par réseau

| Réseau | VLAN | Sous-réseau | Masque | Passerelle | Plage d'adresses utilisables | Description |
|--------|------|-------------|--------|------------|-------------------------------|-------------|
| LAN-SERVERS | 10 | 192.168.10.0/24 | 255.255.255.0 | 192.168.10.254 | 192.168.10.1 – 192.168.10.253 | Réseau des serveurs |
| LAN-USERS | 20 | 192.168.20.0/24 | 255.255.255.0 | 192.168.20.254 | 192.168.20.1 – 192.168.20.253 | Postes utilisateurs siège |
| AGENCES | 30 | 192.168.30.0/24 | 255.255.255.0 | 192.168.30.254 | 192.168.30.1 – 192.168.30.253 | Réseau agences (via VPN) |
| DMZ | 60 | 192.168.60.0/24 | 255.255.255.0 | 192.168.60.254 | 192.168.60.1 – 192.168.60.253 | Zone démilitarisée |
| AZURE-VNET | — | 10.10.0.0/16 | 255.255.0.0 | 10.10.255.1 | 10.10.0.1 – 10.10.255.254 | Réseau Cloud Azure |

---

## 2. VLAN 10 — LAN-SERVERS (192.168.10.0/24)

| Équipement | Rôle | OS | Adresse IP |
|------------|------|-----|------------|
| PFSENSE01 (LAN-SERVERS) | Passerelle / Pare-feu | pfSense | 192.168.10.254 |
| DC01 | Active Directory, DNS, GPO | Windows Server 2022 | 192.168.10.11 |
| FILE01 | Fichiers, DHCP, DNS secondaire | Windows Server 2022 | 192.168.10.12 |
| DB01 | Base de données PostgreSQL | Ubuntu Server 22.04 | 192.168.10.13 |
| BACKUP01 | Sauvegarde centralisée | Windows Server 2022 | 192.168.10.14 |
| MONITOR01 | Supervision Zabbix (Docker) | Ubuntu 25.10 | 192.168.10.15 |

**Réservé / disponible :** 192.168.10.16 – 192.168.10.253 (extension future)

---

## 3. VLAN 20 — LAN-USERS (192.168.20.0/24)

| Plage | Attribution | Mode |
|-------|-------------|------|
| 192.168.20.1 – 192.168.20.9 | Réservé (infrastructure future) | Statique |
| 192.168.20.10 – 192.168.20.39 | PC-SIEGE-01 à PC-SIEGE-30 (30 postes) | DHCP (FILE01) |
| 192.168.20.50 | IMPRIMANTE-SIEGE | Statique (exclusion DHCP) |
| 192.168.20.51 – 192.168.20.253 | Réservé (extension) | — |
| 192.168.20.254 | Passerelle (PFSENSE01) | Statique |

**Étendue DHCP (FILE01) :**
- Plage : 192.168.20.10 → 192.168.20.39
- Exclusion : 192.168.20.50
- Durée du bail : 8 heures
- Option 3 (passerelle) : 192.168.20.254
- Option 6 (DNS) : 192.168.10.11
- Option 15 (suffixe DNS) : ymmo.local

---

## 4. VLAN 30 — AGENCES (192.168.30.0/24) — par agence

> Chaque agence dispose en théorie de son propre sous-réseau /24. Dans le cadre de la maquette, une seule agence est simulée avec le plan ci-dessous. Pour les 11 autres, le même schéma s'appliquerait avec un VLAN/sous-réseau dédié (ex. 192.168.31.0/24, 192.168.32.0/24, etc.).

| Équipement | Rôle | Adresse IP |
|------------|------|------------|
| PFSENSE-AGENCE01 (LAN) | Passerelle agence | 192.168.30.254 |
| PC-AGENCE-01 à 05 | Postes commerciaux (5 postes) | 192.168.30.10 – 192.168.30.14 |
| IMPRIMANTE-AGENCE | Imprimante agence | 192.168.30.50 |

---

## 5. VLAN 60 — DMZ (192.168.60.0/24)

| Équipement | Rôle | OS | Adresse IP |
|------------|------|-----|------------|
| PFSENSE01 (DMZ) | Passerelle DMZ | pfSense | 192.168.60.254 |
| WEB01 | Serveur Web (Nginx + Docker) | Ubuntu Server 22.04 | 192.168.60.10 |
| REVERSE-PROXY | Reverse Proxy (Nginx) | Ubuntu Server 22.04 | 192.168.60.11 |

**Réservé / disponible :** 192.168.60.12 – 192.168.60.253 (extension future)

---

## 6. AZURE-VNET (10.10.0.0/16)

| Sous-réseau | Plage | Ressource | Adresse IP |
|-------------|-------|-----------|------------|
| SUBNET-WEB | 10.10.1.0/24 | VM-AZ-WEB | 10.10.1.10 |
| SUBNET-DB | 10.10.2.0/24 | VM-AZ-DB | 10.10.2.10 |
| SUBNET-BACKUP | 10.10.3.0/24 | AZ-BACKUP (Recovery Vault) | 10.10.3.10 |
| GatewaySubnet | 10.10.255.0/27 | VPN Gateway Azure | 10.10.255.1 |

---

## 7. Réseau VMware Workstation (environnement de test)

| VMnet | Type | Sous-réseau | DHCP VMware | Usage |
|-------|------|-------------|-------------|-------|
| VMnet2 | Host-only | 192.168.10.0/24 | Désactivé | LAN-SERVERS |
| VMnet3 | Host-only | 192.168.20.0/24 | Désactivé | LAN-USERS |
| VMnet4 | Host-only | 192.168.60.0/24 | Désactivé | DMZ |
| VMnet5 | Host-only | 192.168.30.0/24 | Désactivé | AGENCES (simulation) |
| VMnet8 | NAT | 192.168.1.0/24 | Activé | WAN pfSense |

---

## 8. Récapitulatif des passerelles

| Réseau | Passerelle | DNS primaire | DNS secondaire |
|--------|------------|---------------|------------------|
| LAN-SERVERS | 192.168.10.254 | 192.168.10.11 (DC01) | 8.8.8.8 |
| LAN-USERS | 192.168.20.254 | 192.168.10.11 (DC01) | 192.168.10.12 (FILE01) |
| AGENCES | 192.168.30.254 | 192.168.10.11 (via VPN) | 8.8.8.8 |
| DMZ | 192.168.60.254 | 192.168.10.11 | 8.8.8.8 |
| AZURE-VNET | 10.10.255.1 | 192.168.10.11 (via VPN) | 168.63.129.16 (Azure DNS) |

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
