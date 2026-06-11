# Infrastructure Ymmo — Documentation d'Architecture
**Projet UF B2 INFRA & DEV — Ynov Campus Bachelor 2 — 2025/2026**

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture réseau](#2-architecture-réseau)
3. [Plan d'adressage IP](#3-plan-dadressage-ip)
4. [Composants déployés](#4-composants-déployés)
5. [Ce qui a été implémenté](#5-ce-qui-a-été-implémenté)
6. [Ce qui ne peut pas être implémenté faute de temps](#6-ce-qui-ne-peut-pas-être-implémenté-faute-de-temps)
7. [Politique de sécurité](#7-politique-de-sécurité)
8. [Matrice des droits d'accès](#8-matrice-des-droits-daccès)
9. [Plan de sauvegarde](#9-plan-de-sauvegarde)
10. [Supervision](#10-supervision)

---

## 1. Vue d'ensemble

**Ymmo** est un groupe immobilier fictif basé à Aix-en-Provence, composé d'un siège social et de 12 agences réparties sur le territoire national. Ce projet déploie une infrastructure hybride combinant :

- Un environnement **on-premise** sur VMware Workstation Pro (simulation du siège)
- Un environnement **cloud Azure** (VNET-YMMO)
- Une interconnexion **VPN IPsec Site-à-Site** entre les agences distantes et le siège
- Une **DMZ** exposant les services web publics

L'infrastructure est entièrement virtualisée dans VMware Workstation Pro avec pfSense comme routeur/pare-feu central.

---

## 2. Architecture réseau

```
                          INTERNET (8.8.8.8)
                               │
                           [WAN DHCP]
                               │
                        ┌──────────────┐
                        │  PFSENSE01   │  ← Routeur / Pare-feu central
                        │  pfSense 2.7 │
                        └──────┬───────┘
               ┌───────────────┼────────────────┐
               │               │                │
           VMnet2           VMnet3           VMnet4
       LAN-SERVERS         LAN-USERS            DMZ
     192.168.10.254      192.168.20.254      192.168.60.254
           │                   │                │
   ┌───────┴────────┐    ┌─────┴──────┐   ┌────┴────────┐
   │  VLAN 10       │    │  VLAN 20   │   │  VLAN 60    │
   │  Serveurs      │    │  Utilisat. │   │  DMZ        │
   ├────────────────┤    ├────────────┤   ├─────────────┤
   │ DC01  .10.11   │    │ PC-SIEGE   │   │ WEB01 .60.10│
   │ FILE01 .10.12  │    │ 20.10→20.39│   │ REV-PROXY   │
   │ DB01  .10.13   │    │ Imprimante │   │      .60.11 │
   │ BACKUP01 .10.14│    │ 20.50      │   └─────────────┘
   │ MONITOR01 .10.15    └────────────┘
   └────────────────┘
               │
        [VPN IPsec Site-à-Site]
               │
   ┌───────────┴──────────┐         ┌─────────────────────┐
   │  AGENCES DISTANTES   │         │   Microsoft Azure    │
   │  VLAN 30             │         │   VNET-YMMO          │
   │  192.168.30.0/24     │         │   10.10.0.0/16       │
   │  (x12 agences)       │         ├─────────────────────┤
   │  PC-AGENCE 30.10→.14 │         │ SUBNET-WEB 10.10.1.x│
   │  Imprimante 30.50    │         │ VM-AZ-WEB  10.10.1.10│
   └──────────────────────┘         │ SUBNET-DB  10.10.2.x│
                                    │ VM-AZ-DB   10.10.2.10│
                                    │ SUBNET-BCK 10.10.3.x│
                                    │ AZ-BACKUP  10.10.3.10│
                                    │ VPN GW    10.10.255.1│
                                    └─────────────────────┘
```

---

## 3. Plan d'adressage IP

| Réseau | VLAN | Sous-réseau | Passerelle | Interface pfSense | Description |
|--------|------|-------------|------------|-------------------|-------------|
| LAN-SERVERS | 10 | 192.168.10.0/24 | 192.168.10.254 | em1 — VMnet2 | Réseau des serveurs |
| LAN-USERS | 20 | 192.168.20.0/24 | 192.168.20.254 | em2 — VMnet3 | Postes utilisateurs siège |
| AGENCES | 30 | 192.168.30.0/24 | 192.168.30.254 | Via VPN IPsec | Réseau des agences |
| DMZ | 60 | 192.168.60.0/24 | 192.168.60.254 | em3 — VMnet4 | Zone démilitarisée |
| AZURE-VNET | — | 10.10.0.0/16 | 10.10.255.1 | VPN Gateway Azure | Cloud Azure |

### Équipements et VMs

| Équipement | Rôle | OS | IP | VMnet |
|------------|------|----|----|-------|
| PFSENSE01 | Pare-feu / Routeur | pfSense 2.7+ | WAN DHCP | NAT + VMnet2/3/4 |
| DC01 | Active Directory, DNS, GPO | Windows Server 2022 | 192.168.10.11 | VMnet2 |
| FILE01 | Fichiers, DHCP, DNS secondaire | Windows Server 2022 | 192.168.10.12 | VMnet2 |
| DB01 | Base de données PostgreSQL | Ubuntu Server 22.04 | 192.168.10.13 | VMnet2 |
| BACKUP01 | Sauvegarde centralisée | Windows Server 2022 | 192.168.10.14 | VMnet2 |
| MONITOR01 | Supervision Zabbix (Docker) | Ubuntu 25.10 | 192.168.10.15 | VMnet2 |
| WEB01 | Nginx + Docker | Ubuntu Server 22.04 | 192.168.60.10 | VMnet4 |
| REVERSE-PROXY | Reverse Proxy Nginx | Ubuntu Server 22.04 | 192.168.60.11 | VMnet4 |
| PFSENSE-AGENCE01 | Routeur agence (simulation) | pfSense 2.7+ | WAN DHCP | NAT + VMnet5 |
| VM-AZ-WEB | Serveur web cloud | Ubuntu 22.04 (Azure) | 10.10.1.10 | SUBNET-WEB |
| VM-AZ-DB | Base de données cloud | Ubuntu 22.04 (Azure) | 10.10.2.10 | SUBNET-DB |
| AZ-BACKUP | Sauvegarde cloud | Azure Backup | 10.10.3.10 | SUBNET-BACKUP |

---

## 4. Composants déployés

### VMnets VMware Workstation

| VMnet | Type | Sous-réseau | Usage |
|-------|------|-------------|-------|
| VMnet2 | Host-only | 192.168.10.0/24 | LAN-SERVERS |
| VMnet3 | Host-only | 192.168.20.0/24 | LAN-USERS |
| VMnet4 | Host-only | 192.168.60.0/24 | DMZ |
| VMnet5 | Host-only | 192.168.30.0/24 | Simulation agence distante |
| VMnet8 | NAT | 192.168.1.0/24 | WAN des pfSense (accès Internet) |

---

## 5. Ce qui a été implémenté

### ✅ ÉTAPE 1 — VMnets VMware
- VMnet2 (LAN-SERVERS), VMnet3 (LAN-USERS), VMnet4 (DMZ), VMnet5 (Agence) créés en mode Host-only
- DHCP VMware désactivé sur tous les VMnets (géré par FILE01)
- VMnet8 (NAT) conservé pour le WAN des pfSense

---

### ✅ ÉTAPE 2 — pfSense (PFSENSE01)
- Installation pfSense CE 2.7 sur VM dédiée (2 vCPU, 2 Go RAM, 20 Go)
- 4 interfaces configurées : WAN (em0), LAN-SERVERS (em1), LAN-USERS (em2), DMZ (em3)
- Configuration WebGUI accessible sur `https://192.168.10.254`
- Règles de pare-feu appliquées :
  - LAN-USERS → Internet : autorisé (HTTP/HTTPS/DNS)
  - LAN-USERS → LAN-SERVERS : autorisé
  - LAN-USERS → DMZ : autorisé ports 80/443 uniquement
  - DMZ → LAN-SERVERS : interdit (sauf exception DB01:5432)
- NAT Outbound configuré pour tous les réseaux internes
- DHCP Relay activé sur LAN-USERS vers FILE01 (192.168.10.12)
- Option "Block private networks" désactivée sur WAN (nécessaire pour VPN en labo)

---

### ✅ ÉTAPE 3 — DC01 (Active Directory & DNS)
- Windows Server 2022 installé (2 vCPU, 4 Go RAM, 60 Go)
- Rôle AD DS installé et promu en contrôleur de domaine
- Forêt Active Directory créée : **ymmo.local**
- Zones DNS configurées :
  - Zone directe `ymmo.local` avec enregistrements A pour tous les serveurs
  - Zone inverse `10.168.192.in-addr.arpa`
- Structure d'OUs créée : YMMO > Siege / Agences > Utilisateurs / Ordinateurs / Serveurs
- Groupes de sécurité créés : GRP_Direction, GRP_Commercial, GRP_Marketing, GRP_RH_Juridique, GRP_IT, GRP_Agences
- GPO déployées :
  - Politique de mots de passe (12 caractères min, complexité, 90 jours)
  - Fond d'écran Ymmo
  - Mappage de lecteurs réseau par groupe

---

### ✅ ÉTAPE 4 — FILE01 (DHCP & Partages de fichiers)
- Windows Server 2022 installé (2 vCPU, 4 Go RAM, 60 Go système + 100 Go données)
- Joint au domaine ymmo.local
- Rôles installés : DHCP Server, DNS Server, File Server
- Serveur DHCP autorisé dans Active Directory avec le compte **YMMO\Administrateur**
- Étendue DHCP créée pour VLAN 20 :
  - Plage : 192.168.20.10 → 192.168.20.39
  - Exclusion : 192.168.20.50 (imprimante IP fixe)
  - Options : passerelle 192.168.20.254, DNS 192.168.10.11, suffixe ymmo.local
- DNS secondaire configuré avec réplication depuis DC01
- Partages de fichiers créés avec permissions NTFS par groupe :
  - `\\FILE01\Partage_Direction`, `\\FILE01\Partage_Commercial`, etc.

> **Note :** L'erreur d'autorisation DHCP initiale (0x8009030e — Kerberos) était due à l'utilisation d'un compte local au lieu du compte domaine YMMO\Administrateur. Résolu en utilisant `Add-DhcpServerInDC` depuis DC01.

---

### ✅ ÉTAPE 5 — DB01 (PostgreSQL)
- Ubuntu Server 22.04 LTS installé (2 vCPU, 4 Go RAM, 60 Go)
- IP statique configurée via Netplan (192.168.10.13/24)
- PostgreSQL installé et configuré
- Base de données `ymmo_db` créée avec utilisateur `ymmo_user`
- Accès distant autorisé depuis LAN-SERVERS (192.168.10.0/24) et DMZ (192.168.60.0/24)
- Pare-feu UFW configuré : port 5432 ouvert uniquement pour les réseaux autorisés

---

### ✅ ÉTAPE 6 — MONITOR01 (Zabbix via Docker)
- Ubuntu **25.10 (Questing)** installé (2 vCPU, 4 Go RAM, 40 Go)
- Installation native Zabbix abandonnée suite aux conflits de dépendances (libldap-2.5-0 non disponible sur Ubuntu 25.10)
- **Solution retenue : déploiement Docker Compose** avec Zabbix 7.0 LTS
- Stack déployée dans `/opt/zabbix/docker-compose.yml` :
  - `postgres:16` — base de données Zabbix
  - `zabbix/zabbix-server-pgsql:alpine-7.0-latest` — serveur Zabbix
  - `zabbix/zabbix-web-nginx-pgsql:alpine-7.0-latest` — interface web (port 80)
- Interface accessible sur `http://192.168.10.15`
- Agent Zabbix installé sur MONITOR01 lui-même
- Agents configurés sur les autres serveurs pour remonter les métriques

---

### ✅ ÉTAPE 10 — VPN IPsec Site-à-Site (simulation agence)
- VMnet5 créé pour simuler le réseau d'une agence (192.168.30.0/24)
- pfSense agence (PFSENSE-AGENCE01) déployé sur VMnet8 (WAN) + VMnet5 (LAN)
- Tunnel IPsec IKEv2 configuré des deux côtés :
  - Phase 1 : AES-256, SHA-256, DH Group 14, PSK partagé
  - Phase 2 : Tunnel 192.168.10.0/24 ↔ 192.168.30.0/24
- Règles firewall IPsec ajoutées sur les deux pfSense
- **Problèmes rencontrés et résolus :**
  - Tunnel établi mais ping bloqué → "Block private networks" activé sur WAN (normal en prod, à désactiver en labo VMware)
  - Trafic retour bloqué sur pfSense SIÈGE → même correction + règle WAN ajoutée
- **Résultat :** ping 192.168.30.10 → 192.168.10.11 fonctionnel dans les deux sens

---

## 6. Ce qui ne peut pas être implémenté faute de temps

### ✅ ÉTAPE 7 — BACKUP01
- Windows Server 2022 installé (2 vCPU, 4 Go RAM, 60 Go système + 200 Go sauvegarde)
- Joint au domaine ymmo.local
- Rôle Windows Server Backup installé
- Partages réseau créés par serveur source
- Tâches planifiées configurées : System State DC01 (02h00), partages FILE01 (03h00), dump PostgreSQL DB01 (04h00)
- Script de dump PostgreSQL déployé sur DB01 avec transfert SMB vers BACKUP01

---

### 🔄 ÉTAPE 8 — WEB01 (Nginx + Docker)
**En cours** — Code de l'application DEV reçu, déploiement en cours.

**Ce qui est fait / en cours :**
- Ubuntu 22.04 sur VMnet4 (DMZ), IP 192.168.60.10
- Docker et Docker Compose installés
- Containerisation de l'application Ymmo en cours
- Nginx configuré en proxy local vers le conteneur applicatif

---

### 🔄 ÉTAPE 9 — REVERSE-PROXY
**En cours** — Déploiement en cours en parallèle de WEB01.

**Ce qui est fait / en cours :**
- Ubuntu 22.04 sur VMnet4 (DMZ), IP 192.168.60.11
- Nginx configuré en upstream vers WEB01 (192.168.60.10)
- Headers de sécurité en place (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Terminaison SSL avec certificat auto-signé
- Règle NAT pfSense pour exposer les ports 80/443 depuis le WAN

---

### ⏳ ÉTAPE 11 — Azure (VNET, VMs, VPN Gateway)
**Raison :** La VPN Gateway Azure prend 30 à 45 minutes à se déployer et nécessite une IP publique fixe côté pfSense. En environnement VMware avec NAT, l'IP WAN est celle de la box FAI (dynamique), ce qui complique la configuration du Local Network Gateway Azure sans DynDNS ou IP fixe.

**Ce qui aurait été fait :**
- Groupe de ressources `RG-YMMO` en région France Central
- VNET-YMMO (10.10.0.0/16) avec 4 subnets (WEB, DB, BACKUP, GatewaySubnet)
- VM-AZ-WEB (10.10.1.10) et VM-AZ-DB (10.10.2.10) sur Ubuntu 22.04
- VPN Gateway `VPN-GW-YMMO` (SKU VpnGw1)
- Local Network Gateway pointant vers l'IP WAN pfSense
- Connexion IPsec Azure ↔ pfSense SIÈGE
- Azure Backup configuré pour VM-AZ-WEB et VM-AZ-DB

---

### ⏳ VPN IPsec pour les 12 agences
**Raison :** Seule **1 agence simulée** a été configurée (PFSENSE-AGENCE01 sur VMnet5). Reproduire 12 tunnels IPsec distincts avec 12 pfSense, 12 VMnets et 12 plages IP différentes dépasse les ressources disponibles sur une seule machine hôte VMware.

**Ce qui aurait été fait :**
- 12 VMnets (VMnet5 à VMnet16), un par agence
- 12 pfSense agences avec des IP LAN distinctes (192.168.31.0/24 à 192.168.42.0/24)
- 12 tunnels IPsec configurés sur pfSense SIÈGE en Phase 2 supplémentaires

---

## 7. Politique de sécurité

| Source | Destination | Ports | Action | Justification |
|--------|-------------|-------|--------|---------------|
| LAN-USERS | Internet | 80, 443, 53 | ✅ Autorisé | Navigation et DNS |
| LAN-USERS | LAN-SERVERS | Selon service | ✅ Autorisé | Accès ressources internes |
| LAN-USERS | DMZ | 80, 443 | ✅ Autorisé | Accès application web |
| LAN-SERVERS | Internet | 80, 443, 53 | ✅ Autorisé | Mises à jour serveurs |
| DMZ | LAN-SERVERS | Tous | ❌ Interdit | Isolation DMZ |
| DMZ | DB01:5432 | 5432 | ✅ Exception | Accès base de données |
| AGENCES | LAN-SERVERS | Via VPN | ✅ Autorisé | VPN uniquement |
| AGENCES | Internet | Tous | ✅ Autorisé | Navigation locale |
| WAN | DMZ 80/443 | 80, 443 | ✅ NAT | Accès public application |
| WAN | LAN-SERVERS | Tous | ❌ Interdit | Réseau interne non exposé |

---

## 8. Matrice des droits d'accès

| Dossier partagé | Direction | Commercial | Marketing | RH-Juridique | IT |
|-----------------|-----------|------------|-----------|--------------|-----|
| Direction | ✏️ Lecture/Écriture | ❌ Interdit | ❌ Interdit | 👁️ Lecture | ❌ Interdit |
| Commercial | 👁️ Lecture | ✏️ Lecture/Écriture | 👁️ Lecture | ❌ Interdit | ❌ Interdit |
| Marketing | 👁️ Lecture | ❌ Interdit | ✏️ Lecture/Écriture | ❌ Interdit | ❌ Interdit |
| RH-Juridique | 👁️ Lecture | ❌ Interdit | ❌ Interdit | ✏️ Lecture/Écriture | ❌ Interdit |
| IT | ❌ Interdit | ❌ Interdit | ❌ Interdit | ❌ Interdit | ✏️ Lecture/Écriture |
| Commun | 👁️ Lecture | 👁️ Lecture | 👁️ Lecture | 👁️ Lecture | ✏️ Lecture/Écriture |

---

## 9. Plan de sauvegarde

| Quoi | Fréquence | Rétention | Destination | Statut |
|------|-----------|-----------|-------------|--------|
| DC01 — System State | Quotidien 02h00 | 30 jours | `\\BACKUP01\DC01_Backup` | ✅ Déployé |
| FILE01 — Volume D: | Quotidien 03h00 | 30 jours | `\\BACKUP01\FILE01_Backup` | ✅ Déployé |
| DB01 — Dump PostgreSQL | Quotidien 04h00 | 30 jours | `\\BACKUP01\DB01_Backup` | ✅ Déployé |
| MONITOR01 — Config Zabbix | Hebdomadaire | 4 semaines | `\\BACKUP01\MONITOR01_Backup` | ✅ Déployé |
| VMs Azure | Quotidien 02h00 | 30 jours | Azure Recovery Services Vault | ⏳ Non déployé |

---

## 10. Supervision

### Stack Zabbix déployée sur MONITOR01

| Conteneur | Image | Port | Rôle |
|-----------|-------|------|------|
| zabbix-postgres | postgres:16 | — | Base de données Zabbix |
| zabbix-server | zabbix-server-pgsql:alpine-7.0 | 10051 | Serveur de collecte |
| zabbix-web | zabbix-web-nginx-pgsql:alpine-7.0 | 80 | Interface web |

### Hôtes supervisés

| Hôte | IP | Template Zabbix | Agent | Statut |
|------|----|-----------------|-------|--------|
| DC01 | 192.168.10.11 | Windows by Zabbix agent | zabbix-agent2 | ✅ |
| FILE01 | 192.168.10.12 | Windows by Zabbix agent | zabbix-agent2 | ✅ |
| DB01 | 192.168.10.13 | Linux + PostgreSQL by Zabbix agent | zabbix-agent2 | ✅ |
| BACKUP01 | 192.168.10.14 | Windows by Zabbix agent | zabbix-agent2 | ⏳ |
| MONITOR01 | 192.168.10.15 | Linux by Zabbix agent | zabbix-agent2 | ✅ |
| PFSENSE01 | 192.168.10.254 | pfSense by SNMP | SNMP | ⏳ |
| WEB01 | 192.168.60.10 | Linux + Nginx by Zabbix agent | zabbix-agent2 | ⏳ |

---

## Récapitulatif d'avancement

| Étape | Description | Statut |
|-------|-------------|--------|
| 1 | VMnets VMware (VMnet2/3/4/5) | ✅ Terminé |
| 2 | pfSense — Pare-feu, routage, NAT, firewall | ✅ Terminé |
| 3 | DC01 — Active Directory, DNS, GPO | ✅ Terminé |
| 4 | FILE01 — DHCP, partages de fichiers | ✅ Terminé |
| 5 | DB01 — PostgreSQL | ✅ Terminé |
| 6 | MONITOR01 — Zabbix (Docker Compose) | ✅ Terminé |
| 7 | BACKUP01 — Windows Server Backup | ✅ Terminé |
| 8 | WEB01 — Nginx + Docker | 🔄 En cours |
| 9 | REVERSE-PROXY — Nginx | 🔄 En cours |
| 10 | VPN IPsec Site-à-Site (1 agence simulée) | ✅ Terminé |
| 11 | Azure — VNET, VMs, VPN Gateway | ⏳ Non déployé (contrainte IP publique) |

**Taux d'implémentation : 7/11 étapes complètes, 2 en cours (82%)**
L'étape Azure est documentée, architecturée et prête à déployer.

---

*Document généré dans le cadre du Projet UF B2 INFRA & DEV — Ynov Campus — 2025/2026*
