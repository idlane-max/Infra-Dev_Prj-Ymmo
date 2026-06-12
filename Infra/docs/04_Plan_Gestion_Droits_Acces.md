# Plan de Gestion des Droits d'Accès — Ymmo
**Projet UF B2 INFRA & DEV — Ynov Campus**

---

## 1. Principes généraux

La gestion des droits d'accès repose sur **Active Directory (DC01)** avec une approche basée sur les groupes de sécurité (RBAC — Role-Based Access Control). Chaque utilisateur est membre d'un groupe correspondant à son pôle métier, et les permissions sont attribuées aux groupes plutôt qu'individuellement.

**Principe du moindre privilège :** un utilisateur n'a accès qu'aux ressources nécessaires à sa fonction.

---

## 2. Structure des unités d'organisation (OU)

```
ymmo.local
└── OU=YMMO
    ├── OU=Siege
    │   ├── OU=Utilisateurs
    │   ├── OU=Ordinateurs
    │   └── OU=Serveurs
    └── OU=Agences
        ├── OU=Utilisateurs-Agences
        └── OU=Ordinateurs-Agences
```

---

## 3. Groupes de sécurité

| Groupe AD | Description | OU de rattachement | Pôle |
|-----------|--------------|---------------------|------|
| GRP_Direction | Direction générale | YMMO/Siege/Utilisateurs | Direction |
| GRP_Commercial | Commerciaux siège | YMMO/Siege/Utilisateurs | Commercial |
| GRP_Marketing | Communication & Marketing | YMMO/Siege/Utilisateurs | Communication & Marketing |
| GRP_RH_Juridique | Ressources Humaines & Juridique | YMMO/Siege/Utilisateurs | Administratif - RH - Juridique |
| GRP_IT | IT et Support | YMMO/Siege/Utilisateurs | IT et Support |
| GRP_Agences | Commerciaux des 12 agences | YMMO/Agences/Utilisateurs-Agences | Commercial (agences) |

---

## 4. Matrice des droits d'accès — Dossiers partagés (FILE01)

Cette matrice définit les permissions NTFS/partage appliquées sur les dossiers hébergés sur `\\FILE01\`.

| Dossier partagé \ Pôle | Direction | Commercial | Communication & Marketing | Administratif RH-Juridique | IT et Support |
|--------------------------|-----------|------------|------------------------------|-------------------------------|------------------|
| **Direction** | Lecture / Écriture | Lecture | Lecture | Lecture | Lecture |
| **Commercial** | Interdit | Lecture / Écriture | Lecture | Interdit | Interdit |
| **Communication & Marketing** | Interdit | Lecture | Lecture / Écriture | Interdit | Interdit |
| **Administratif - RH - Juridique** | Interdit | Lecture | Lecture | Lecture / Écriture | Interdit |
| **IT et Support** | Interdit | Lecture | Lecture | Interdit | Lecture / Écriture |

> Lecture seule pour les pôles autorisés à consulter sans modifier ; Lecture/Écriture réservé au pôle propriétaire du dossier ; Interdit pour les pôles n'ayant aucun besoin métier d'accès.

---

## 5. Détail des permissions par dossier partagé

### Partage_Direction
- **GRP_Direction** : Modify (Lecture/Écriture) — partage et NTFS
- **GRP_Commercial, GRP_Marketing, GRP_RH_Juridique, GRP_IT** : Read (Lecture)
- Tous les autres : aucun accès

### Partage_Commercial
- **GRP_Commercial** : Modify
- **GRP_Direction** : Read
- **GRP_Marketing, GRP_RH_Juridique, GRP_IT, GRP_Agences** : aucun accès

### Partage_Marketing
- **GRP_Marketing** : Modify
- **GRP_Direction, GRP_Commercial** : Read
- **GRP_RH_Juridique, GRP_IT** : aucun accès

### Partage_RH_Juridique
- **GRP_RH_Juridique** : Modify
- **GRP_Direction** : Read
- **GRP_Commercial, GRP_Marketing, GRP_IT** : aucun accès (données sensibles RH)

### Partage_IT
- **GRP_IT** : Modify
- Tous les autres pôles : aucun accès (documentation technique, scripts, accès admin)

### Partage_Commun
- Tous les groupes du domaine (`Domain Users`) : Read
- **GRP_IT** : Modify (administration du dossier commun)

---

## 6. Droits d'accès aux serveurs et services

| Ressource | Groupe avec accès | Niveau d'accès |
|-----------|----------------------|------------------|
| Connexion RDP aux serveurs (DC01, FILE01, BACKUP01) | GRP_IT | Administrateur |
| Connexion SSH aux serveurs Linux (DB01, MONITOR01, WEB01, REVERSE-PROXY) | GRP_IT (clé SSH nominative) | sudo |
| Console Zabbix (MONITOR01) | GRP_IT | Admin Zabbix |
| Base de données PostgreSQL (DB01) | Compte applicatif `ymmo_user` | Lecture/Écriture sur `ymmo_db` |
| Console pfSense (WebGUI) | GRP_IT uniquement (compte `admin`) | Configuration complète |
| Application web Ymmo (DMZ) | Tous les utilisateurs authentifiés + clients externes | Selon rôle applicatif (à définir par la partie DEV) |
| Coffre Azure Recovery Vault | GRP_IT (via Azure AD) | Lecture/Écriture sauvegardes |

---

## 7. Droits d'accès — Agences distantes (VLAN 30)

| Groupe | Accès | Restriction |
|--------|-------|--------------|
| GRP_Agences | Accès aux partages Commercial et Commun via VPN | Pas d'accès à Direction, RH-Juridique, IT |
| GRP_Agences | Authentification AD (ymmo.local) via le DC01 du siège | Connexion possible uniquement via tunnel VPN établi |
| GRP_Agences | Connexion à l'application web Ymmo (DMZ) | Identique aux utilisateurs du siège |

---

## 8. Gestion des comptes — cycle de vie

| Étape | Procédure |
|-------|-----------|
| Création d'un compte | Création dans l'OU correspondante, ajout au(x) groupe(s) de sécurité du pôle, application automatique des GPO et mappages réseau |
| Modification de poste (mobilité interne) | Retrait du groupe d'origine, ajout au nouveau groupe — les accès aux partages sont automatiquement mis à jour |
| Départ d'un collaborateur | Désactivation immédiate du compte AD, suppression des groupes, archivage ou suppression du profil après validation IT |
| Audit périodique | Revue trimestrielle des membres de chaque groupe de sécurité par GRP_IT |

---

## 9. GPO liées à la gestion des droits

| GPO | Portée | Effet |
|-----|--------|-------|
| Politique de mots de passe | Domaine ymmo.local | Renforce la sécurité des comptes (12 caractères min, complexité, expiration 90 jours) |
| Mappage de lecteurs réseau | Par groupe (ciblage Item-Level Targeting) | Chaque utilisateur voit uniquement les lecteurs réseau correspondant à son pôle |
| Fond d'écran Ymmo | OU=Siege | Uniformisation de l'environnement de travail |

---

## 10. Synthèse — Tableau croisé Pôle / Ressources

| Pôle | Partages fichiers | Application web | Base de données | Administration serveurs | VPN agences |
|------|---------------------|-------------------|--------------------|----------------------------|---------------|
| Direction | Lecture/Écriture (Direction) + Lecture (autres) | Selon rôle applicatif | Non | Non | Non |
| Commercial | Lecture/Écriture (Commercial) + Lecture (Marketing) | Oui | Non (accès via application) | Non | Selon localisation |
| Communication & Marketing | Lecture/Écriture (Marketing) + Lecture (Commercial) | Oui | Non | Non | Non |
| Administratif RH-Juridique | Lecture/Écriture (RH) + Lecture (Direction) | Selon rôle applicatif | Non | Non | Non |
| IT et Support | Lecture/Écriture (IT) + Lecture (tous) | Oui (admin) | Oui (admin) | Oui | Oui (configuration) |
| Agences (Commercial) | Lecture/Écriture (Commercial) + Lecture (Commun) | Oui | Non | Non | Oui (utilisateur) |

---

*Document — Projet UF B2 INFRA & DEV — Ynov Campus*
