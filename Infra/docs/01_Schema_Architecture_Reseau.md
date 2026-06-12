# Schéma d'Architecture Réseau — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## Vue d'ensemble

L'infrastructure Ymmo repose sur une architecture hybride combinant un réseau on-premise (siège social, simulé sur VMware Workstation), un réseau d'agences distantes connecté via VPN IPsec, et un environnement Cloud Microsoft Azure.

Le routeur/pare-feu central **pfSense (PFSENSE01)** segmente le réseau en plusieurs zones de sécurité (VLANs) : serveurs, utilisateurs, DMZ, et agences via VPN.

---

## Schéma global

```
                                    INTERNET (8.8.8.8)
                                          │
                                      [ WAN DHCP ]
                                          │
                                  ┌───────────────┐
                                  │   PFSENSE01   │
                                  │  Pare-feu /   │
                                  │   Routeur     │
                                  └───────┬───────┘
                  ┌───────────────────────┼────────────────────────┐
                  │                       │                        │
              VMnet2                  VMnet3                   VMnet4
           LAN-SERVERS              LAN-USERS                    DMZ
         192.168.10.254/24       192.168.20.254/24        192.168.60.254/24
                  │                       │                        │
   ┌──────────────┴──────────┐  ┌─────────┴───────────┐  ┌─────────┴──────────┐
   │   VLAN 10 — SERVEURS    │  │  VLAN 20 — UTILISAT. │  │   VLAN 60 — DMZ    │
   ├─────────────────────────┤  ├──────────────────────┤  ├────────────────────┤
   │ DC01       192.168.10.11│  │ PC-SIEGE-01..30      │  │ WEB01   .60.10     │
   │  (AD, DNS, GPO)         │  │  192.168.20.10-39    │  │  (Nginx+Docker)    │
   │ FILE01     192.168.10.12│  │ IMPRIMANTE-SIEGE     │  │ REVERSE-PROXY      │
   │  (DHCP, Fichiers)       │  │  192.168.20.50       │  │  192.168.60.11     │
   │ DB01       192.168.10.13│  └──────────────────────┘  │  (Nginx)           │
   │  (PostgreSQL)           │                            └────────────────────┘
   │ BACKUP01   192.168.10.14│
   │  (Windows Backup)       │
   │ MONITOR01  192.168.10.15│
   │  (Zabbix - Docker)      │
   └─────────────────────────┘
                  │
          [ VPN IPsec Site-à-Site ]
          [ Tunnel IKEv2 / AES-256 ]
                  │
   ┌──────────────┴───────────────┐
   │   AGENCES DISTANTES (x12)     │
   │   VLAN 30 — 192.168.30.0/24   │
   ├────────────────────────────────┤
   │ PFSENSE-AGENCE01 (routeur)     │
   │ PC-AGENCE-01..05  .30.10-.14   │
   │ IMPRIMANTE-AGENCE .30.50       │
   └────────────────────────────────┘


                          ┌──────────────────────────────┐
                          │       Microsoft Azure         │
                          │       VNET-YMMO 10.10.0.0/16  │
                          ├──────────────────────────────┤
   [ VPN IPsec ] ───────► │ VPN GATEWAY     10.10.255.1   │
                          │                                │
                          │ SUBNET-WEB      10.10.1.0/24  │
                          │  └─ VM-AZ-WEB   10.10.1.10    │
                          │                                │
                          │ SUBNET-DB       10.10.2.0/24  │
                          │  └─ VM-AZ-DB    10.10.2.10    │
                          │                                │
                          │ SUBNET-BACKUP   10.10.3.0/24  │
                          │  └─ AZ-BACKUP   10.10.3.10    │
                          │                                │
                          │ GatewaySubnet   10.10.255.0/27│
                          └──────────────────────────────┘
```

---

## Détail des interfaces pfSense (PFSENSE01)

| Interface | Nom physique | Réseau | IP | VMnet |
|-----------|--------------|--------|-----|-------|
| WAN | em0 | Internet (NAT) | DHCP | VMnet8 |
| LAN-SERVERS | em1 | VLAN 10 | 192.168.10.254/24 | VMnet2 |
| LAN-USERS | em2 | VLAN 20 | 192.168.20.254/24 | VMnet3 |
| DMZ | em3 | VLAN 60 | 192.168.60.254/24 | VMnet4 |
| IPsec (virtuel) | — | VLAN 30 (agences) | 192.168.30.0/24 | Tunnel VPN |

---

## Flux principaux

| Flux | Description |
|------|-------------|
| LAN-USERS → Internet | Navigation web (HTTP/HTTPS), résolution DNS |
| LAN-USERS → LAN-SERVERS | Authentification AD, accès partages fichiers, base de données |
| LAN-USERS → DMZ | Accès à l'application web Ymmo (ports 80/443) |
| DMZ → LAN-SERVERS | Interdit, sauf exception WEB01/REVERSE-PROXY → DB01:5432 |
| AGENCES → LAN-SERVERS | Via tunnel VPN IPsec uniquement |
| AGENCES → Internet | Navigation locale autorisée |
| Internet → DMZ | NAT entrant vers REVERSE-PROXY (ports 80/443) |
| On-premise ↔ Azure | Via VPN IPsec Site-à-Site (LAN-SERVERS ↔ VNET-YMMO) |

---

## Topologie VMware Workstation (environnement de test)

| VMnet | Type | Réseau | Rôle |
|-------|------|--------|------|
| VMnet2 | Host-only | 192.168.10.0/24 | LAN-SERVERS |
| VMnet3 | Host-only | 192.168.20.0/24 | LAN-USERS |
| VMnet4 | Host-only | 192.168.60.0/24 | DMZ |
| VMnet5 | Host-only | 192.168.30.0/24 | Agence (simulation) |
| VMnet8 | NAT | 192.168.1.0/24 | WAN des pfSense (Internet) |

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
