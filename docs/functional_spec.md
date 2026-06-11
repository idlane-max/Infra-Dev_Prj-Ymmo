# Spécifications Fonctionnelles - Projet Ymmo

## 1. Présentation du Projet
Ymmo est un groupe immobilier composé d'un siège social situé à Aix-en-Provence et de 12 agences réparties sur le territoire national.
L'objectif est de développer une plateforme web centralisée permettant la gestion des opérations de vente et d'achat de biens immobiliers (résidentiels et professionnels). La plateforme inclura également des outils d'Intelligence Artificielle pour analyser les tendances du marché.

## 2. Acteurs et Rôles

Le système identifie plusieurs profils d'utilisateurs ayant des niveaux d'accès distincts :

1. **Direction (Siège Social)**
   - Possède une vue globale sur l'activité de l'ensemble du réseau (les 12 agences).
   - Accès aux tableaux de bord analytiques (Data Analysis).
   - Capacité à générer des rapports de vente et des prédictions.

2. **Commercial (Agence)**
   - Rattaché à l'une des 12 agences du réseau.
   - Gère le portefeuille de biens de son agence (ajout, modification, suppression).
   - Met à jour le statut des biens (Disponible, Sous offre, Vendu).

3. **Client (Public)**
   - Visiteur externe ou acheteur/vendeur potentiel.
   - Possibilité de créer un compte via le portail public.
   - Accès au catalogue complet des biens immobiliers avec des filtres avancés (localisation, budget, type).
   - Accès à un simulateur d'estimation de bien basé sur l'analyse de données.

## 3. Cas d'Utilisation (Use Cases)

### Gestion du Catalogue Immobilier
- **Ajout d'un bien** : Un commercial renseigne les caractéristiques (titre, prix, surface, pièces, adresse, type).
- **Mise à jour d'un bien** : Modification du prix ou du statut d'un bien existant.
- **Consultation** : Recherche de biens par critères (Client).

### Analyse de Données et IA
- **Rapports de Performance** : Visualisation du nombre de ventes par agence.
- **Tendances du Marché** : Identification des zones géographiques les plus attractives.
- **Prédiction de Vente** : Utilisation de modèles de Machine Learning (Python) pour estimer la valeur future d'un bien ou son délai de vente.

## 4. Règles de Gestion
- **RG01** : Un utilisateur commercial ne peut être rattaché qu'à une seule agence physique.
- **RG02** : Seul le siège social (Direction) peut avoir accès aux données consolidées de l'ensemble des 12 agences.
- **RG03** : Les mots de passe des utilisateurs doivent être systématiquement hachés (Bcrypt) avant stockage.