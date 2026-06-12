# Guide de Configuration des Serveurs — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## Introduction

Ce document décrit la configuration de chaque serveur de l'infrastructure Ymmo : rôle, spécifications matérielles, paramètres réseau et configuration logicielle appliquée. Il complète le Guide de Déploiement (pas-à-pas) en donnant une vue de référence "état final" de chaque machine.

---

## 1. PFSENSE01 — Pare-feu / Routeur

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Pare-feu, routeur central, NAT, VPN IPsec, DHCP Relay |
| OS | pfSense CE 2.7+ |
| CPU | 2 vCPU |
| RAM | 2 Go |
| Disque | 20 Go |
| Interfaces | WAN (DHCP), LAN-SERVERS (192.168.10.254/24), LAN-USERS (192.168.20.254/24), DMZ (192.168.60.254/24) |

**Configuration appliquée :**
- Hostname : PFSENSE01 / Domaine : ymmo.local
- DNS : 192.168.10.11 (primaire), 8.8.8.8 (secondaire)
- Timezone : Europe/Paris
- Règles de pare-feu par interface (voir Politique de Sécurité)
- NAT Outbound automatique
- DHCP Relay LAN-USERS → 192.168.10.12 (FILE01)
- VPN IPsec (Phase 1/2) configuré pour agence et Azure
- Option "Block private networks and bogon networks" désactivée sur WAN (contrainte VMware NAT)

---

## 2. DC01 — Active Directory, DNS, GPO

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Contrôleur de domaine, DNS primaire, GPO |
| OS | Windows Server 2022 Standard (Desktop Experience) |
| CPU | 2 vCPU |
| RAM | 4 Go |
| Disque | 60 Go |
| IP | 192.168.10.11/24 — Passerelle 192.168.10.254 — DNS 127.0.0.1 |

**Configuration appliquée :**
- Rôle AD DS installé — Forêt **ymmo.local** (niveau fonctionnel Windows Server 2016)
- Rôle DNS Server avec zone directe `ymmo.local` et zone inverse `10.168.192.in-addr.arpa`
- Enregistrements A pour tous les serveurs (dc01, file01, db01, backup01, monitor01, web01, proxy)
- Structure d'OU : YMMO/Siege (Utilisateurs, Ordinateurs, Serveurs), YMMO/Agences (Utilisateurs-Agences, Ordinateurs-Agences)
- Groupes de sécurité créés : GRP_Direction, GRP_Commercial, GRP_Marketing, GRP_RH_Juridique, GRP_IT, GRP_Agences
- GPO appliquées :
  - Politique de mot de passe (12 caractères min, complexité activée, expiration 90 jours)
  - Fond d'écran Ymmo (OU=Siege)
  - Mappage de lecteurs réseau par groupe (ciblage par groupe de sécurité)

---

## 3. FILE01 — DHCP, Fichiers, DNS secondaire

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Serveur DHCP, serveur de fichiers, DNS secondaire |
| OS | Windows Server 2022 Standard (Desktop Experience) |
| CPU | 2 vCPU |
| RAM | 4 Go |
| Disque | 60 Go (système) + 100 Go (données, lecteur D:) |
| IP | 192.168.10.12/24 — Passerelle 192.168.10.254 — DNS 192.168.10.11 |

**Configuration appliquée :**
- Joint au domaine ymmo.local
- Rôles installés : DHCP Server, DNS Server, File Server (+ File Server Resource Manager)
- Serveur DHCP autorisé dans Active Directory (compte YMMO\Administrateur)
- Étendue DHCP **VLAN20-LAN-USERS** :
  - Plage : 192.168.20.10 – 192.168.20.39
  - Exclusion : 192.168.20.50 (imprimante)
  - Bail : 8h — Option 3 : 192.168.20.254 — Option 6 : 192.168.10.11 — Option 15 : ymmo.local
- Zone DNS secondaire `ymmo.local` répliquée depuis DC01
- Partages créés sur D:\Partages\ : Direction, Commercial, Marketing, RH_Juridique, IT, Commun
- Permissions NTFS et partage appliquées selon la matrice de droits (voir Plan de Gestion des Droits d'Accès)

> **Point de vigilance résolu :** l'autorisation DHCP dans AD nécessite une connexion avec un compte de domaine (YMMO\Administrateur), pas un compte local — sinon erreur Kerberos 0x8009030e.

---

## 4. DB01 — PostgreSQL

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Base de données applicative |
| OS | Ubuntu Server 22.04 LTS |
| CPU | 2 vCPU |
| RAM | 4 Go |
| Disque | 60 Go |
| IP | 192.168.10.13/24 (netplan, statique) |

**Configuration appliquée :**
- PostgreSQL 14 installé et activé au démarrage
- Base de données `ymmo_db` créée, propriétaire `ymmo_user`
- `postgresql.conf` : `listen_addresses` étendu pour écoute réseau
- `pg_hba.conf` : accès autorisé depuis :
  - 192.168.10.0/24 (LAN-SERVERS)
  - 192.168.60.0/24 (DMZ — WEB01/REVERSE-PROXY)
  - 10.10.0.0/16 (Azure, via VPN)
- UFW : port 5432 ouvert uniquement pour les plages ci-dessus, port 22 (SSH) ouvert
- Hostname : db01 — résolution DNS validée vers dc01.ymmo.local

---

## 5. MONITOR01 — Supervision Zabbix (Docker)

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Supervision de l'infrastructure |
| OS | Ubuntu 25.10 (Questing) |
| CPU | 2 vCPU |
| RAM | 4 Go |
| Disque | 40 Go |
| IP | 192.168.10.15/24 |

**Configuration appliquée :**
- Installation native Zabbix abandonnée (conflit de dépendances `libldap-2.5-0` sur Ubuntu 25.10)
- **Stack Docker Compose** déployée dans `/opt/zabbix/` :

```yaml
services:
  postgres:
    image: postgres:16
    container_name: zabbix-postgres
    environment:
      POSTGRES_DB: zabbix
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: Zabbix@2025!
    volumes:
      - postgres_data:/var/lib/postgresql/data

  zabbix-server:
    image: zabbix/zabbix-server-pgsql:alpine-7.0-latest
    depends_on: [postgres]
    environment:
      DB_SERVER_HOST: postgres
      POSTGRES_DB: zabbix
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: Zabbix@2025!
    ports: ["10051:10051"]

  zabbix-web:
    image: zabbix/zabbix-web-nginx-pgsql:alpine-7.0-latest
    depends_on: [zabbix-server, postgres]
    environment:
      DB_SERVER_HOST: postgres
      POSTGRES_DB: zabbix
      POSTGRES_USER: zabbix
      POSTGRES_PASSWORD: Zabbix@2025!
      ZBX_SERVER_HOST: zabbix-server
      PHP_TZ: Europe/Paris
    ports: ["80:8080"]

volumes:
  postgres_data:
```

- Interface web : `http://192.168.10.15` (login `Admin` / mot de passe modifié après 1ère connexion)
- Agent Zabbix (`zabbix-agent2`) installé en natif sur MONITOR01 (Server=192.168.10.15, Hostname=MONITOR01)
- Agents Zabbix déployés sur DC01, FILE01, DB01 (voir Plan de Supervision)

---

## 6. BACKUP01 — Sauvegarde centralisée

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Sauvegarde des serveurs critiques |
| OS | Windows Server 2022 Standard |
| CPU | 2 vCPU |
| RAM | 4 Go |
| Disque | 60 Go (système) + 200 Go (sauvegardes, lecteur E:) |
| IP | 192.168.10.14/24 |

**Configuration appliquée :**
- Joint au domaine ymmo.local
- Rôle Windows Server Backup installé
- Partages dédiés par serveur source : `\\BACKUP01\DC01_Backup`, `FILE01_Backup`, `DB01_Backup`, `MONITOR01_Backup`
- Tâches planifiées (voir Plan de Sauvegarde pour le détail des plannings)
- Réception des dumps PostgreSQL depuis DB01 via SMB

---

## 7. WEB01 — Application Web (Nginx + Docker)

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Hébergement de l'application web Ymmo |
| OS | Ubuntu Server 22.04 LTS |
| CPU | 2 vCPU |
| RAM | 4 Go |
| Disque | 40 Go |
| IP | 192.168.60.10/24 — Passerelle 192.168.60.254 |

**Configuration appliquée / en cours :**
- Nginx installé (paquet système)
- Docker + Docker Compose installés (dépôt officiel Docker)
- Conteneurisation de l'application Ymmo (code DEV reçu — déploiement en cours)
- Nginx configuré en proxy local vers le conteneur applicatif (port 8080 → 80)
- UFW : `Nginx Full` + SSH autorisés

---

## 8. REVERSE-PROXY — Reverse Proxy Nginx

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Point d'entrée public, reverse proxy vers WEB01 |
| OS | Ubuntu Server 22.04 LTS |
| CPU | 1 vCPU |
| RAM | 2 Go |
| Disque | 20 Go |
| IP | 192.168.60.11/24 — Passerelle 192.168.60.254 |

**Configuration appliquée / en cours :**
- Nginx installé, configuration `upstream` vers `192.168.60.10:80` (WEB01)
- Headers de sécurité : `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`
- Certificat SSL auto-signé généré (`/etc/ssl/certs/ymmo.crt`)
- Règle NAT Port Forward configurée sur PFSENSE01 (WAN:80/443 → 192.168.60.11)

---

## 9. PFSENSE-AGENCE01 — Routeur agence (simulation)

| Paramètre | Valeur |
|-----------|--------|
| Rôle | Simulation du routeur d'une agence distante |
| OS | pfSense CE 2.7+ |
| CPU | 1 vCPU |
| RAM | 1 Go |
| Disque | 10 Go |
| Interfaces | WAN (VMnet8/NAT), LAN (VMnet5 — 192.168.30.254/24) |

**Configuration appliquée :**
- VPN IPsec Site-à-Site vers PFSENSE01 (IKEv2, AES-256/SHA-256/DH14, PSK)
- Phase 2 : Local 192.168.30.0/24 ↔ Remote 192.168.10.0/24
- Règles firewall IPsec autorisant le trafic bidirectionnel siège ↔ agence
- "Block private networks" désactivé sur WAN (contrainte VMware NAT)

---

## 10. Environnement Azure (proposition — voir Proposition Cloud)

Le détail de la configuration Azure (VNET, VMs, VPN Gateway) est présenté dans le document **07_Proposition_Solution_Cloud.md**.

---

## 11. Récapitulatif des accès d'administration

| Serveur | Méthode d'accès | Compte |
|---------|-------------------|--------|
| PFSENSE01 / PFSENSE-AGENCE01 | WebGUI HTTPS | admin |
| DC01, FILE01, BACKUP01 | RDP | YMMO\Administrateur |
| DB01, MONITOR01, WEB01, REVERSE-PROXY | SSH | ymmoadmin (sudo) |

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
