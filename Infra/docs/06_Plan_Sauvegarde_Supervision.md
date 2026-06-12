# Plan de Sauvegarde et de Supervision — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

# PARTIE 1 — Plan de Sauvegarde

## 1. Objectifs

Garantir la disponibilité et l'intégrité des données critiques de l'infrastructure Ymmo en cas de panne matérielle, corruption de données, ou erreur humaine. Le plan applique la règle **3-2-1** dans la mesure du possible : 3 copies des données, sur 2 supports différents, dont 1 hors site (Azure).

---

## 2. Architecture de sauvegarde

```
   DC01 ──┐
   FILE01 ─┤── Windows Server Backup ──► BACKUP01 (E:\Sauvegardes\)
   DB01  ──┘   (System State / Volumes)        │
                                                │
   MONITOR01 ── Export config Zabbix ──────────┤
                                                │
                                          (réplication future)
                                                ▼
                                       AZ-BACKUP (Azure Recovery
                                       Services Vault — 10.10.3.10)
```

---

## 3. Plan de sauvegarde détaillé

| Source | Type de sauvegarde | Fréquence | Heure | Rétention | Destination | Statut |
|--------|----------------------|-----------|-------|-----------|-------------|--------|
| DC01 | System State (AD, SYSVOL, Registre) | Quotidien | 02h00 | 30 jours | `\\BACKUP01\DC01_Backup` | ✅ Déployé |
| FILE01 | Volume D:\ (partages) | Quotidien | 03h00 | 30 jours | `\\BACKUP01\FILE01_Backup` | ✅ Déployé |
| DB01 | Dump SQL (`pg_dump ymmo_db`) | Quotidien | 04h00 | 30 jours | `\\BACKUP01\DB01_Backup` | ✅ Déployé |
| MONITOR01 | Export configuration Zabbix (templates, hosts) | Hebdomadaire | Dimanche 05h00 | 4 semaines | `\\BACKUP01\MONITOR01_Backup` | ✅ Déployé |
| WEB01 | Volumes Docker (données applicatives) | Quotidien | 05h30 | 15 jours | `\\BACKUP01\WEB01_Backup` | 🔄 À planifier (en cours de déploiement) |
| BACKUP01 lui-même | Réplication vers Azure | Mensuel | 1er du mois, 06h00 | 3 mois | AZ-BACKUP (Azure) | ⏳ Proposé |
| VM-AZ-WEB / VM-AZ-DB | Snapshot Azure Backup | Quotidien | 02h00 (UTC) | 30 jours | Recovery Services Vault | ⏳ Proposé |

---

## 4. Détail technique des tâches

### 4.1 — DC01 : System State Backup

```powershell
# Tâche planifiée (Register-ScheduledTask) — exécution quotidienne 02h00
wbadmin start systemstatebackup -backupTarget:\\BACKUP01\DC01_Backup -quiet
```

### 4.2 — FILE01 : Sauvegarde du volume de données

```powershell
wbadmin start backup -backupTarget:\\BACKUP01\FILE01_Backup `
  -include:D: -quiet -vssFull
```

### 4.3 — DB01 : Dump PostgreSQL automatisé

```bash
#!/bin/bash
# /opt/backup_postgres.sh — exécuté via cron à 04h00
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/tmp/pg_backups
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump ymmo_db > $BACKUP_DIR/ymmo_db_$DATE.sql

smbclient //192.168.10.14/DB01_Backup -U YMMO\\backup_user \
  -c "put $BACKUP_DIR/ymmo_db_$DATE.sql ymmo_db_$DATE.sql"

# Nettoyage des fichiers temporaires de plus de 1 jour
find $BACKUP_DIR -type f -mtime +1 -delete
```

Crontab :
```
0 4 * * * /opt/backup_postgres.sh
```

### 4.4 — MONITOR01 : Export de la configuration Zabbix

```bash
# Export hebdomadaire des templates et configuration (API Zabbix)
# Exécuté le dimanche à 05h00 via cron
curl -s -X POST http://192.168.10.15/api_jsonrpc.php \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"configuration.export", ... }' \
  > /opt/zabbix_export_$(date +%Y%m%d).xml

smbclient //192.168.10.14/MONITOR01_Backup -U YMMO\\backup_user \
  -c "put /opt/zabbix_export_*.xml"
```

---

## 5. Procédure de restauration (tests)

| Composant | Procédure de restauration |
|-----------|------------------------------|
| DC01 (System State) | Démarrage en mode DSRM → `wbadmin start systemstaterecovery -version:<date> -backupTarget:\\BACKUP01\DC01_Backup` |
| FILE01 (fichiers) | Restauration via console "Backup and Restore (Windows Server Backup)" → sélection du volume et de la date |
| DB01 (base de données) | `psql -U ymmo_user -d ymmo_db < ymmo_db_<date>.sql` |
| Zabbix (config) | Import du fichier XML via Configuration → Templates/Hosts → Import |

> **Recommandation :** un test de restauration complet par trimestre doit être planifié pour valider l'intégrité des sauvegardes.

---

## 6. Évolutions proposées

- Réplication chiffrée des sauvegardes critiques (DC01, DB01) vers **AZ-BACKUP** (Azure Recovery Services Vault) pour disposer d'une copie hors site.
- Mise en place d'alertes Zabbix en cas d'échec d'une tâche de sauvegarde planifiée (surveillance de l'Event Log "Backup").
- Chiffrement des fichiers de sauvegarde au repos (BitLocker sur le volume E: de BACKUP01).

---

# PARTIE 2 — Plan de Supervision

## 7. Objectifs

La supervision permet de détecter proactivement les pannes, dégradations de performance et anomalies de sécurité sur l'ensemble de l'infrastructure, via la solution **Zabbix** déployée sur MONITOR01.

---

## 8. Architecture de supervision

```
                        ┌───────────────────────────┐
                        │       MONITOR01            │
                        │   192.168.10.15            │
                        │                             │
                        │  ┌──────────────────────┐  │
                        │  │ zabbix-web (port 80)  │  │
                        │  ├──────────────────────┤  │
                        │  │ zabbix-server (10051) │  │
                        │  ├──────────────────────┤  │
                        │  │ postgres (zabbix DB)  │  │
                        │  └──────────────────────┘  │
                        └──────────┬──────────────────┘
                                   │ Zabbix Agent (port 10050)
        ┌──────────────┬───────────┼───────────┬───────────────┐
        │              │           │           │                │
      DC01          FILE01       DB01      BACKUP01           WEB01
   (Windows)      (Windows)    (Linux)    (Windows)        (Linux)
   .10.11         .10.12       .10.13      .10.14           .60.10
```

---

## 9. Hôtes supervisés

| Hôte | IP | Template Zabbix | Agent | Statut |
|------|----|--------------------|---------|--------|
| DC01 | 192.168.10.11 | Windows by Zabbix agent | zabbix-agent2 | ✅ Actif |
| FILE01 | 192.168.10.12 | Windows by Zabbix agent | zabbix-agent2 | ✅ Actif |
| DB01 | 192.168.10.13 | Linux by Zabbix agent + PostgreSQL by Zabbix agent | zabbix-agent2 | ✅ Actif |
| BACKUP01 | 192.168.10.14 | Windows by Zabbix agent | zabbix-agent2 | ✅ Actif |
| MONITOR01 | 192.168.10.15 | Linux by Zabbix agent | zabbix-agent2 (local) | ✅ Actif |
| WEB01 | 192.168.60.10 | Linux by Zabbix agent + Nginx by Zabbix agent | zabbix-agent2 | 🔄 En cours |
| REVERSE-PROXY | 192.168.60.11 | Linux by Zabbix agent + Nginx by Zabbix agent | zabbix-agent2 | 🔄 En cours |
| PFSENSE01 | 192.168.10.254 | pfSense by SNMP | SNMP | ⏳ Proposé |

---

## 10. Configuration de l'agent Zabbix

### Sur les serveurs Windows (DC01, FILE01, BACKUP01)
```
# Installation : zabbix_agent2-7.0.x-windows-amd64-openssl.msi
Server=192.168.10.15
ServerActive=192.168.10.15
Hostname=<NOM_SERVEUR>   # ex: DC01, FILE01, BACKUP01
```

### Sur les serveurs Linux (DB01, WEB01, REVERSE-PROXY)
```bash
sudo apt install zabbix-agent2 -y
sudo nano /etc/zabbix/zabbix_agent2.conf
# Server=192.168.10.15
# ServerActive=192.168.10.15
# Hostname=<nom_serveur>
sudo systemctl enable zabbix-agent2 && sudo systemctl restart zabbix-agent2
```

---

## 11. Indicateurs surveillés (par type de serveur)

| Type de serveur | Métriques principales |
|--------------------|---------------------------|
| Windows Server (DC01, FILE01, BACKUP01) | CPU, RAM, espace disque, état des services (AD DS, DHCP, DNS), Event Log erreurs critiques |
| Linux (DB01) | CPU, RAM, espace disque, état du service `postgresql`, nombre de connexions actives, taille de la base |
| Linux (MONITOR01) | CPU, RAM, espace disque, état des conteneurs Docker (zabbix-server, zabbix-web, postgres) |
| Linux (WEB01 / REVERSE-PROXY) | CPU, RAM, espace disque, état du service `nginx`, code de réponse HTTP, état des conteneurs Docker |
| pfSense | CPU, RAM, état des interfaces, débit WAN/LAN, état du tunnel VPN IPsec |

---

## 12. Alertes et seuils recommandés

| Indicateur | Seuil d'alerte | Sévérité |
|------------|------------------|------------|
| Utilisation CPU | > 85% pendant 5 min | Avertissement |
| Utilisation RAM | > 90% | Avertissement |
| Espace disque libre | < 10% | Critique |
| Service arrêté (AD DS, DHCP, PostgreSQL, Nginx, Docker) | Service down | Critique |
| Tunnel VPN IPsec | Down | Critique |
| Échec de sauvegarde planifiée | Tâche en erreur | Critique |
| Hôte injoignable (ping) | 3 échecs consécutifs | Critique |

---

## 13. Notifications

| Canal | Configuration |
|-------|----------------|
| Email | Action Zabbix → Send message → groupe "IT et Support" (GRP_IT) |
| Dashboard | Tableau de bord Zabbix consulté quotidiennement par l'équipe IT |

> **Évolution proposée :** intégration d'un webhook Zabbix vers un canal Microsoft Teams ou Slack pour notification en temps réel de l'équipe IT.

---

## 14. Tableau de bord Zabbix — vue recommandée

- Vue "Infrastructure Ymmo" regroupant :
  - Disponibilité globale (uptime de chaque hôte)
  - Graphiques CPU/RAM des 5 serveurs LAN-SERVERS
  - État des tunnels VPN (siège ↔ agence, siège ↔ Azure)
  - Statut des sauvegardes (dernière exécution réussie)
  - Trafic réseau par interface pfSense

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
