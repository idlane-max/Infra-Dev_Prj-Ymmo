# Politique de Sécurité — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## 1. Objectifs

Cette politique de sécurité réseau définit les règles de filtrage appliquées sur le pare-feu central **PFSENSE01**, ainsi que les principes généraux de sécurisation des systèmes de l'infrastructure Ymmo. Elle s'appuie sur le principe du **moindre privilège** : tout flux non explicitement autorisé est bloqué par défaut.

---

## 2. Architecture de sécurité — segmentation

L'infrastructure est segmentée en 4 zones de sécurité distinctes, isolées par VLAN et reliées par le pare-feu PFSENSE01 :

| Zone | Niveau de confiance | Description |
|------|----------------------|-------------|
| LAN-SERVERS (VLAN 10) | Élevé | Serveurs internes (AD, fichiers, BDD, sauvegarde, supervision) |
| LAN-USERS (VLAN 20) | Moyen | Postes de travail des employés du siège |
| DMZ (VLAN 60) | Faible | Services exposés (serveur web, reverse proxy) |
| AGENCES (VLAN 30) | Moyen (via VPN) | Réseaux des agences distantes connectés en VPN |
| AZURE-VNET | Élevé (via VPN) | Ressources Cloud Azure |

**Principe général :** plus une zone est exposée (DMZ), moins elle a de droits vers les zones internes (LAN-SERVERS).

---

## 3. Règles de pare-feu — Matrice de flux

| # | Source | Destination | Ports / Protocole | Action | Justification |
|---|--------|-------------|---------------------|--------|----------------|
| 1 | LAN-USERS | Internet | TCP 80, 443 / UDP 53 | ✅ Autorisé | Navigation web et résolution DNS |
| 2 | LAN-USERS | LAN-SERVERS | Selon service (AD 389/445, SQL 5432, etc.) | ✅ Autorisé | Authentification, partages, applications internes |
| 3 | LAN-USERS | DMZ | TCP 80, 443 | ✅ Autorisé | Accès à l'application web Ymmo |
| 4 | LAN-SERVERS | Internet | TCP 80, 443 / UDP 53 | ✅ Autorisé | Mises à jour systèmes et sécurité |
| 5 | DMZ | LAN-SERVERS | Tous ports | ❌ Interdit | Isolation de la DMZ — un serveur exposé compromis ne doit pas atteindre le LAN interne |
| 6 | DMZ (WEB01/REVERSE-PROXY) | DB01 | TCP 5432 | ✅ Exception explicite | Connexion applicative à la base de données |
| 7 | AGENCES | LAN-SERVERS | Selon besoin métier | ✅ Autorisé **uniquement via VPN IPsec** | Accès aux ressources du siège pour les commerciaux |
| 8 | AGENCES | Internet | Tous | ✅ Autorisé | Navigation locale, ne transite pas par le siège |
| 9 | WAN (Internet) | DMZ (REVERSE-PROXY) | TCP 80, 443 (NAT) | ✅ Autorisé | Accès public à l'application Ymmo |
| 10 | WAN (Internet) | LAN-SERVERS / LAN-USERS | Tous | ❌ Interdit | Aucun service interne exposé directement |
| 11 | On-premise (LAN-SERVERS) | AZURE-VNET | Selon besoin (PostgreSQL, SSH, HTTP) | ✅ Autorisé via VPN IPsec | Réplication / accès aux ressources cloud |
| 12 | Tout flux non listé | Tout | Tout | ❌ Bloqué par défaut | Politique "deny all" implicite de pfSense |

---

## 4. Règles détaillées par interface pfSense

### Interface LAN-USERS

| Action | Source | Destination | Port | Description |
|--------|--------|-------------|------|-------------|
| Pass | LAN-USERS net | any | 53, 80, 443 | Internet HTTP/HTTPS/DNS |
| Pass | LAN-USERS net | LAN-SERVERS net | any | Accès aux services internes |
| Pass | LAN-USERS net | DMZ net | 80, 443 | Accès application web |
| Block | LAN-USERS net | any | any | Règle finale — bloquer le reste |

### Interface DMZ

| Action | Source | Destination | Port | Description |
|--------|--------|-------------|------|-------------|
| Block | DMZ net | LAN-SERVERS net | any | Isolation DMZ → LAN-SERVERS |
| Pass | DMZ net | 192.168.10.13 (DB01) | 5432 | Exception base de données |
| Pass | DMZ net | any | 53, 80, 443 | Accès Internet (mises à jour) |

### Interface WAN

| Action | Source | Destination | Port | Description |
|--------|--------|-------------|------|-------------|
| Pass | any | This Firewall | UDP 500, 4500 | VPN IPsec entrant |
| Block | RFC1918 (par défaut, ajusté en labo) | This Firewall | any | Anti-spoofing réseaux privés (désactivé en environnement VMware NAT) |
| NAT (Port Forward) | any | REVERSE-PROXY (192.168.60.11) | 80, 443 | Exposition de l'application web |
| Block | any | any | any | Règle finale (deny all) |

### Interface IPsec (VPN agences / Azure)

| Action | Source | Destination | Port | Description |
|--------|--------|-------------|------|-------------|
| Pass | 192.168.30.0/24 | 192.168.10.0/24 | any | Agences → Siège |
| Pass | 192.168.10.0/24 | 192.168.30.0/24 | any | Siège → Agences |
| Pass | 10.10.0.0/16 | 192.168.10.0/24 | any | Azure → Siège |
| Pass | 192.168.10.0/24 | 10.10.0.0/16 | any | Siège → Azure |

---

## 5. NAT (Network Address Translation)

| Type | Configuration |
|------|----------------|
| NAT Outbound | Mode automatique — tous les réseaux internes (LAN-SERVERS, LAN-USERS, DMZ) traduits via l'interface WAN |
| NAT Port Forward | WAN:80 → 192.168.60.11:80 (REVERSE-PROXY) |
| NAT Port Forward | WAN:443 → 192.168.60.11:443 (REVERSE-PROXY) |

---

## 6. VPN IPsec Site-à-Site

| Paramètre | Valeur |
|-----------|--------|
| Protocole | IKEv2 |
| Authentification | PSK (clé pré-partagée) — à terme, certificats recommandés en production |
| Chiffrement Phase 1 | AES-256, SHA-256, DH Group 14 |
| Chiffrement Phase 2 | AES-256, SHA-256, PFS Group 14 |
| Durée de vie Phase 1 | 28 800 secondes |
| Durée de vie Phase 2 | 3 600 secondes |

**Recommandation production :** remplacer les clés pré-partagées par une authentification par certificats X.509 pour chaque agence et pour la connexion Azure, avec rotation périodique.

---

## 7. Politique de mots de passe (Active Directory)

| Paramètre | Valeur |
|-----------|--------|
| Longueur minimale | 12 caractères |
| Complexité | Activée (majuscules, minuscules, chiffres, caractères spéciaux) |
| Durée de vie maximale | 90 jours |
| Historique des mots de passe | 5 derniers mots de passe mémorisés |
| Verrouillage de compte | 5 tentatives échouées → verrouillage 30 minutes |

---

## 8. Sécurisation des serveurs

| Mesure | Application |
|--------|-------------|
| Mises à jour automatiques | Windows Update / apt unattended-upgrades activés sur tous les serveurs |
| Pare-feu local | UFW activé sur les serveurs Ubuntu (DB01, MONITOR01, WEB01, REVERSE-PROXY) |
| Accès SSH | Authentification par clé recommandée, mot de passe désactivé en production |
| Comptes administrateurs | Comptes nominatifs (YMMO\Administrateur réservé aux tâches d'administration AD) |
| Antivirus / EDR | Windows Defender activé sur les serveurs Windows Server 2022 |
| Logs centralisés | Remontée vers MONITOR01 (Zabbix) pour analyse des anomalies |

---

## 9. Surveillance et détection

- **Zabbix (MONITOR01)** supervise la disponibilité, les performances et les services critiques de chaque serveur.
- **Logs pare-feu pfSense** consultables via Status → System Logs → Firewall, permettant d'identifier les tentatives de connexion bloquées.
- Les règles de pare-feu loggent les blocages sur les interfaces sensibles (WAN, DMZ) pour analyse a posteriori.

---

## 10. Évolutions de sécurité recommandées (non implémentées dans la maquette)

| Recommandation | Bénéfice |
|------------------|----------|
| Authentification multi-facteurs (MFA) pour les accès administrateurs | Réduction du risque de compromission de comptes privilégiés |
| IDS/IPS (ex. Suricata sur pfSense) | Détection d'intrusions sur le trafic WAN/DMZ |
| Segmentation VLAN supplémentaire par pôle métier | Limite la propagation latérale en cas de compromission |
| Chiffrement des sauvegardes | Protection des données de sauvegarde en cas de vol du support |
| Certificats SSL signés par une autorité reconnue | Remplacer les certificats auto-signés pour la production |
| Politique de filtrage web (proxy/Squid) | Contrôle du contenu accessible depuis LAN-USERS |

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
