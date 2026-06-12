# Guide de Déploiement — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## Introduction

Ce guide décrit l'ordre de déploiement de l'infrastructure Ymmo sur VMware Workstation Pro. Pour chaque étape : spécifications VM, configuration clé, et vérifications. Pour le détail exhaustif des commandes, se référer au document de configuration complet remis en complément (Word).

---

## Ordre de déploiement

1. VMnets VMware (VMnet2, VMnet3, VMnet4, VMnet5)
2. PFSENSE01 — Pare-feu et routeur central
3. DC01 — Active Directory, DNS, GPO
4. FILE01 — DHCP, partages de fichiers
5. DB01 — PostgreSQL
6. MONITOR01 — Zabbix (Docker)
7. BACKUP01 — Windows Server Backup
8. WEB01 — Nginx + Docker
9. REVERSE-PROXY — Nginx
10. VPN IPsec Site-à-Site (agence simulée)
11. Azure — VNET, VMs, VPN Gateway

---

## Étape 1 — VMnets VMware Workstation

**Édit → Virtual Network Editor → Change Settings**

| VMnet | Type | Sous-réseau | DHCP VMware | Adaptateur hôte |
|-------|------|-------------|--------------|--------------------|
| VMnet2 | Host-only | 192.168.10.0/24 | Désactivé | Non |
| VMnet3 | Host-only | 192.168.20.0/24 | Désactivé | Non |
| VMnet4 | Host-only | 192.168.60.0/24 | Désactivé | Non |
| VMnet5 | Host-only | 192.168.30.0/24 | Désactivé | Non |
| VMnet8 (existant) | NAT | 192.168.1.0/24 | Activé | — |

**Vérification :** les 4 VMnets apparaissent dans le Virtual Network Editor avec DHCP désactivé ; VMnet8 reste fonctionnel.

---

## Étape 2 — PFSENSE01

**VM :** 2 vCPU / 2 Go RAM / 20 Go disque / 4 cartes réseau (WAN→VMnet8, LAN-SERVERS→VMnet2, LAN-USERS→VMnet3, DMZ→VMnet4)

1. Installer pfSense CE 2.7+ depuis l'ISO
2. Assignation interfaces console : WAN=em0, LAN=em1, OPT1=em2, OPT2=em3
3. IP : em1=192.168.10.254/24, em2=192.168.20.254/24, em3=192.168.60.254/24
4. WebGUI `https://192.168.10.254` → assistant initial (hostname, domaine ymmo.local, DNS 192.168.10.11)
5. Renommer interfaces : LAN-SERVERS, LAN-USERS, DMZ
6. Créer les règles de pare-feu (cf. Politique de Sécurité)
7. NAT Outbound automatique
8. DHCP Relay sur LAN-USERS → 192.168.10.12

**Vérification :** WebGUI accessible, ping LAN-SERVERS→Internet OK, ping LAN-SERVERS→LAN-USERS OK, DMZ→LAN-SERVERS bloqué.

---

## Étape 3 — DC01 (Active Directory)

**VM :** 2 vCPU / 4 Go RAM / 60 Go — VMnet2 — IP 192.168.10.11/24, DNS 127.0.0.1

1. Installer Windows Server 2022 (Desktop Experience)
2. Configurer IP statique, renommer en DC01
3. Ajouter rôle **AD DS** → Promouvoir en contrôleur de domaine → nouvelle forêt `ymmo.local`
4. Configurer DNS : enregistrements A pour tous les serveurs + zone inverse
5. Créer structure d'OU (Siege/Agences) et groupes de sécurité (GRP_*)
6. Créer GPO : politique de mot de passe, fond d'écran, mappages réseau

**Vérification :** `nslookup dc01.ymmo.local` → 192.168.10.11 ; `gpresult /r` sur poste joint affiche les GPO.

---

## Étape 4 — FILE01 (DHCP + Fichiers)

**VM :** 2 vCPU / 4 Go RAM / 60 Go + 100 Go données — VMnet2 — IP 192.168.10.12/24, DNS 192.168.10.11

1. Installer Windows Server 2022, joindre le domaine ymmo.local
2. Ajouter rôles : DHCP Server, DNS Server, File Server
3. **Autoriser le DHCP dans AD avec un compte de domaine** (YMMO\Administrateur) — sinon erreur Kerberos 0x8009030e
4. Créer l'étendue DHCP VLAN20-LAN-USERS (192.168.20.10–.39, exclusion .50, GW .254, DNS .10.11)
5. Configurer DNS secondaire (réplication depuis DC01)
6. Créer les partages D:\Partages\ (Direction, Commercial, Marketing, RH_Juridique, IT, Commun) avec droits NTFS selon la matrice

**Vérification :** un poste sur VMnet3 reçoit une IP via DHCP avec GW/DNS corrects ; mappage `net use Z: \\FILE01\Partage_Direction` fonctionne.

---

## Étape 5 — DB01 (PostgreSQL)

**VM :** 2 vCPU / 4 Go RAM / 60 Go — Ubuntu Server 22.04 LTS — VMnet2 — IP 192.168.10.13/24

```bash
# Réseau (netplan) : 192.168.10.13/24, GW 192.168.10.254, DNS 192.168.10.11
sudo netplan apply

sudo apt update && sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable --now postgresql

sudo -u postgres psql -c "CREATE USER ymmo_user WITH PASSWORD 'MotDePasseStrong123!';"
sudo -u postgres psql -c "CREATE DATABASE ymmo_db OWNER ymmo_user;"

# postgresql.conf : listen_addresses = '192.168.10.13'
# pg_hba.conf : autoriser 192.168.10.0/24, 192.168.60.0/24, 10.10.0.0/16

sudo ufw allow from 192.168.10.0/24 to any port 5432
sudo ufw allow from 192.168.60.0/24 to any port 5432
sudo ufw enable
sudo systemctl restart postgresql
```

**Vérification :** `psql -h 192.168.10.13 -U ymmo_user -d ymmo_db` → connexion réussie depuis LAN-SERVERS et DMZ.

---

## Étape 6 — MONITOR01 (Zabbix via Docker)

**VM :** 2 vCPU / 4 Go RAM / 40 Go — Ubuntu 25.10 — VMnet2 — IP 192.168.10.15/24

> Sur Ubuntu 25.10, l'installation native Zabbix échoue (conflit `libldap-2.5-0`). Solution retenue : **Docker Compose**.

```bash
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
mkdir -p /opt/zabbix && cd /opt/zabbix
# Créer docker-compose.yml (postgres:16 + zabbix-server-pgsql:7.0 + zabbix-web-nginx-pgsql:7.0)
docker compose up -d
```

Installer l'agent local :
```bash
sudo apt install -y zabbix-agent2
# Server=192.168.10.15 / ServerActive=192.168.10.15 / Hostname=MONITOR01
sudo systemctl enable --now zabbix-agent2
```

**Vérification :** `http://192.168.10.15` accessible, login Admin/zabbix, `docker ps` → 3 conteneurs Up.

---

## Étape 7 — BACKUP01 (Windows Server Backup)

**VM :** 2 vCPU / 4 Go RAM / 60 Go + 200 Go sauvegarde — VMnet2 — IP 192.168.10.14/24

1. Installer Windows Server 2022, joindre le domaine, initialiser disque E: (200 Go)
2. Ajouter la fonctionnalité **Windows Server Backup**
3. Créer les partages : `E:\Sauvegardes\DC01`, `FILE01`, `DB01`, `MONITOR01`
4. Sur DC01 : tâche planifiée `wbadmin start systemstatebackup` (02h00) vers `\\BACKUP01\DC01_Backup`
5. Sur FILE01 : tâche `wbadmin start backup -include:D:` (03h00)
6. Sur DB01 : script `pg_dump` + `smbclient` planifié via cron (04h00)
7. Sur MONITOR01 : export config Zabbix planifié (hebdomadaire)

**Vérification :** `wbadmin get versions` sur DC01 affiche les sauvegardes ; fichiers `.sql` présents dans `E:\Sauvegardes\DB01`.

---

## Étape 8 — WEB01 (Nginx + Docker)

**VM :** 2 vCPU / 4 Go RAM / 40 Go — Ubuntu Server 22.04 LTS — VMnet4 — IP 192.168.60.10/24, GW 192.168.60.254

```bash
sudo apt install -y nginx
sudo ufw allow 'Nginx Full' && sudo ufw allow 22/tcp && sudo ufw enable

# Installer Docker (dépôt officiel docker-ce)
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

mkdir -p /opt/ymmo && cd /opt/ymmo
# docker-compose.yml : conteneurise l'application Ymmo (code DEV)
sudo docker compose up -d

# Nginx : proxy_pass http://localhost:8080 → conteneur applicatif
sudo nginx -t && sudo systemctl reload nginx
```

**Vérification :** `curl http://192.168.60.10` retourne l'application ; `docker ps` → conteneur Up ; accessible depuis LAN-USERS (port 80).

---

## Étape 9 — REVERSE-PROXY (Nginx)

**VM :** 1 vCPU / 2 Go RAM / 20 Go — Ubuntu Server 22.04 LTS — VMnet4 — IP 192.168.60.11/24, GW 192.168.60.254

```bash
sudo apt install -y nginx

# /etc/nginx/sites-available/reverse-proxy
# upstream ymmo_backend { server 192.168.60.10:80; }
# server { listen 80; proxy_pass http://ymmo_backend; ... headers sécurité }

sudo ln -s /etc/nginx/sites-available/reverse-proxy /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Certificat auto-signé
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ymmo.key -out /etc/ssl/certs/ymmo.crt \
  -subj '/C=FR/ST=PACA/L=Aix-en-Provence/O=Ymmo/CN=ymmo.local'
```

Sur PFSENSE01 : **NAT → Port Forward** WAN:80/443 → 192.168.60.11:80/443

**Vérification :** `curl -I http://192.168.60.11` → HTTP 200 + headers de sécurité ; accessible depuis LAN-USERS.

---

## Étape 10 — VPN IPsec Site-à-Site (agence simulée)

**VM PFSENSE-AGENCE01 :** 1 vCPU / 1 Go RAM / 10 Go — WAN→VMnet8, LAN→VMnet5 (192.168.30.254/24)

1. **PFSENSE01** : VPN → IPsec → Phase 1 (IKEv2, AES-256/SHA-256/DH14, PSK) avec Remote Gateway = IP WAN agence
2. Phase 2 : Local 192.168.10.0/24 ↔ Remote 192.168.30.0/24
3. **PFSENSE-AGENCE01** : configuration symétrique (Local 192.168.30.0/24 ↔ Remote 192.168.10.0/24)
4. Règles Firewall → IPsec sur les deux pfSense (Pass bidirectionnel)
5. **Désactiver "Block private networks / bogon networks" sur WAN** des deux pfSense (requis en environnement VMware NAT)
6. VM test sur VMnet5 : IP 192.168.30.10/24, GW 192.168.30.254

**Vérification :** Status → IPsec → tunnel ESTABLISHED ; `ping 192.168.10.11` depuis 192.168.30.10 → OK ; `ping 192.168.30.10` depuis DC01 → OK.

---

## Étape 11 — Azure (VNET, VMs, VPN Gateway)

**Prérequis :** compte Azure actif, groupe de ressources `RG-YMMO`, région France Central.

1. Créer **VNET-YMMO** (10.10.0.0/16) avec subnets : SUBNET-WEB (10.10.1.0/24), SUBNET-DB (10.10.2.0/24), SUBNET-BACKUP (10.10.3.0/24), **GatewaySubnet** (10.10.255.0/27)
2. Créer **VM-AZ-WEB** (10.10.1.10) et **VM-AZ-DB** (10.10.2.10) — Ubuntu 22.04, Standard_B1s
3. Créer **VPN Gateway** `VPN-GW-YMMO` (Route-based, SKU VpnGw1) — déploiement 30-45 min
4. Créer **Local Network Gateway** `LNG-YMMO-ONPREM` avec l'IP publique du pfSense et les réseaux on-premise
5. Créer la connexion **IPsec Site-à-Site** entre VPN-GW-YMMO et LNG-YMMO-ONPREM
6. Sur PFSENSE01 : configurer Phase 1/2 vers l'IP publique de VPN-GW-YMMO, Remote Network = 10.10.0.0/16
7. Configurer **Azure Backup** pour VM-AZ-WEB et VM-AZ-DB

> **Statut :** architecture documentée, déploiement non finalisé — nécessite une IP publique fixe côté pfSense (voir Proposition Solution Cloud).

**Vérification (une fois déployé) :** connexion VPN "Connecté" dans le portail Azure ; `ping 10.10.1.10` depuis DC01 → OK.

---

## Récapitulatif d'avancement

| Étape | Statut |
|-------|--------|
| 1 — VMnets | ✅ Terminé |
| 2 — pfSense | ✅ Terminé |
| 3 — DC01 | ✅ Terminé |
| 4 — FILE01 | ✅ Terminé |
| 5 — DB01 | ✅ Terminé |
| 6 — MONITOR01 | ✅ Terminé |
| 7 — BACKUP01 | ✅ Terminé |
| 8 — WEB01 | 🔄 En cours |
| 9 — REVERSE-PROXY | 🔄 En cours |
| 10 — VPN IPsec | ✅ Terminé |
| 11 — Azure | ⏳ Documenté, non déployé |

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
