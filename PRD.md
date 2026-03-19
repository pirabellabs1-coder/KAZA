# KAZA - Product Requirements Document (PRD)
## Plateforme Immobilière Pan-Africaine | Spécifications Complètes

**Date**: 19 Mars 2026  
**Version**: 1.0  
**Statut**: 🟢 Prêt pour Développement Agent IA  
**Format**: Prêt à copier/coller dans Agent IA de Codage

---

## 📋 TABLE DES MATIÈRES

1. [Executive Summary](#executive-summary)
2. [Vision et Objectifs](#vision-et-objectifs)
3. [Description Générale du Produit](#description-générale-du-produit)
4. [Les Trois Espaces Utilisateurs](#les-trois-espaces-utilisateurs)
5. [Fonctionnalités Principales](#fonctionnalités-principales)
6. [Architecture Technique](#architecture-technique)
7. [Design System & Maquettes](#design-system--maquettes)
8. [Composants Réutilisables](#composants-réutilisables)
9. [Écrans Détaillés](#écrans-détaillés)
10. [Flux de Paiement](#flux-de-paiement)
11. [Sécurité et Authentification](#sécurité-et-authentification)
12. [Roadmap: MVP / V1 / V2 / Hors-Périmètre](#roadmap-mvp--v1--v2--hors-périmètre)
13. [Matrice de Priorité](#matrice-de-priorité)
14. [Base de Données - Schema](#base-de-données---schema)
15. [Checklist d'Implémentation](#checklist-dimplémentation)

---

## Executive Summary

### 🎯 Objectif Principal
Créer **la plus grande plateforme d'immobilier en Afrique**, transformant le marché du logement africain par la numérisation complète du processus de location. En commençant par le Bénin, puis expansion vers toute l'Afrique de l'Ouest.

### 📊 Marché Cible
- **Propriétaires** d'immeubles, maisons, appartements
- **Locataires** cherchant à louer une propriété complète
- **Étudiants** cherchant des colocations universitaires
- **Expansion**: Bénin → Togo → Côte d'Ivoire → Senegal → Continent africain

### 💡 Proposition de Valeur
- ✅ Éliminer les intermédiaires et protocoles inefficaces
- ✅ Réduire les coûts de location (pas de frais de visite)
- ✅ Transparence complète (photos, vidéos, avis vérifiés)
- ✅ Paiements sécurisés intégrés (Mobile Money, escrow)
- ✅ Contrats numériques et signature électronique
- ✅ Vérification d'identité obligatoire (sécurité)
- ✅ Marketplace de confiance pour propriétaires et locataires

### 📈 Métriques de Succès
- **MVP**: 100-500 utilisateurs en bêta fermée (4 semaines)
- **V1**: 1k-5k utilisateurs en bêta ouverte (8 semaines)
- **V2**: 10k-50k utilisateurs au lancement public (12 semaines)
- **Y1**: 100k+ utilisateurs actifs en Afrique de l'Ouest

---

## Vision et Objectifs

### Objectifs Spécifiques
1. ✅ Devenir le leader incontesté du marché immobilier numérique en Afrique
2. ✅ Réduire les frictions dans le processus de location (déplacements, coûts)
3. ✅ Fournir une plateforme 100% numérique avec paiements intégrés
4. ✅ Servir trois segments distincts : Étudiants, Propriétaires, Locataires généraux
5. ✅ Offrir transparence, sécurité et confiance par vérification d'identité obligatoire
6. ✅ Créer un écosystème de confiance avec système de notation et avis

### Problème Résolu
**Situation actuelle au Bénin et en Afrique:**
- ❌ Processus de location inefficace avec nombreux protocoles et intermédiaires
- ❌ Locataires doivent faire plusieurs déplacements pour visiter une propriété
- ❌ Coûts élevés de visite (ex: 2000 francs par visite au Bénin)
- ❌ Propriétaires et locataires n'ont pas accès à des informations détaillées et vérifiées
- ❌ Pas de registre centralisé des propriétés
- ❌ Rendez-vous confus et non confirmés
- ❌ Paiements mal organisés, impayés fréquents
- ❌ Contrats informels, manque de sécurité et de confiance

### Solution: KAZA
KAZA est une **plateforme web et mobile** qui connecte directement:
- 🏠 **Propriétaires** d'immeubles, maisons et appartements
- 👥 **Locataires** cherchant à louer une propriété complète
- 👨‍🎓 **Étudiants** cherchant des colocations

**Avantages principaux:**
- 📍 Plateforme centralisée avec annonces détaillées (photos, vidéos, descriptions)
- 🎥 Visites virtuelles et tours numériques pour réduire les déplacements
- 💳 Paiements intégrés et sécurisés (Mobile Money, virements, escrow)
- 📝 Contrats digitaux signés électroniquement
- 🆔 Vérification d'identité obligatoire pour tous
- 📊 Tableaux de bord personnalisés pour chaque type d'utilisateur
- ⭐ Système de notation et avis pour construire la confiance

---

## Description Générale du Produit

### Plateforme
- **Web**: Application web responsive (accès via navigateur sur desktop/mobile)
- **Mobile**: Application mobile native (iOS et Android) - Phase V3+
- **Progressive Web App (PWA)**: Web responsive utilisable comme app native - Phase V2

### Stack Technologique (Recommandé)

#### Option 1: Low-Code (Recommandée pour MVP rapide)
- **Frontend**: Bubble, FlutterFlow, ou WeWeb (avec Clerke Code)
- **Avantage**: Développement rapide sans code complexe
- **Backend**: Intégrations API natives (Mobile Money, SMS, Email)
- **Base de Données**: Cloud database intégrée (Firebase, Supabase)
- **Scalabilité**: Peut supporter des centaines de milliers d'utilisateurs
- **RECOMMANDÉ pour MVP**

#### Option 2: Custom Full-Stack (Meilleure scalabilité long-terme)
- **Frontend Web**: React.js + Tailwind CSS ou Vue.js
- **Frontend Mobile**: React Native ou Flutter
- **Backend**: Node.js + Express.js OU Python + FastAPI
- **Base de Données**: PostgreSQL + Redis (cache)
- **Paiements**: Stripe SDK, Paypal SDK, API Mobile Money personnalisée
- **Infrastructure**: AWS, Google Cloud, Heroku, ou DigitalOcean
- **Notifications**: Firebase Cloud Messaging, Twilio (SMS)
- **Websockets**: Socket.io (messaging temps réel)
- **POUR V2+**

---

## Les Trois Espaces Utilisateurs

### ESPACE 1: Étudiants et Colocation

**Cible**: Étudiants qui cherchent à louer une chambre en colocation, ou qui ont une chambre à partager.

**Cas d'usage:**
- Un étudiant a une chambre dans une résidence universitaire et cherche 1-2 colocataires
- Un étudiant cherche une chambre à partager avec d'autres étudiants
- Plusieurs étudiants partagent un appartement et cherchent à louer des chambres

**Fonctionnalités Spécifiques:**
- 📋 Publication d'une chambre en colocation (nombre de lits, description, images)
- 👥 Spécification du nombre de personnes souhaitées
- 📸 Photos détaillées (chambre, salle de bain, cuisine commune, balcon)
- 👤 Profil du colocataire recherché (anonyme: âge, sexe, discipline d'études)
- 🔍 Recherche de chambres en colocation avec filtres
- 🤝 Demande de rejoindre une colocation
- ✅ Approbation par le propriétaire/principal locataire
- 💬 Chat entre colocataires
- 💰 Partage des frais (électricité, eau, internet)
- 📄 Contrat numérique de colocation
- ⭐ Système de notations et commentaires

**Sécurité Colocation:**
- ✅ Tous les colocataires doivent vérifier leur identité
- ✅ Infos personnelles partagées seulement après approbation mutuelle
- ✅ Chaque colocataire a son propre profil avec historique et notations
- ✅ Plateforme mémorise les colocataires pour futures locations

---

### ESPACE 2: Propriétaires et Gestionnaires

**Cible**: Propriétaires d'immeubles, maisons et appartements cherchant à louer. Ouvert à TOUS (pas seulement universitaires).

**Fonctionnalités Spécifiques:**
- 📝 Création de compte propriétaire (vérification d'identité gouvernementale)
- 📢 Publication d'annonces illimitées
- 🏠 Détails complets: localisation, nombre de pièces, équipements, services
- 📷 Upload de photos professionnelles et vidéos
- 💵 Gestion des tarifs et dates de disponibilité
- 📅 Calendrier des réservations/locations
- 🚪 Gestion des demandes de visite
- ✋ Sélection du locataire
- 📋 Génération et signature numérique de contrats
- 💰 Gestion des paiements de loyer
- 🏦 Système d'escrow pour loyers (paiements progressifs)
- 🔔 Notifications de paiement
- 📊 Historique des locations
- ⭐ Évaluation des locataires
- 📈 Analytics et statistiques (vues, demandes, taux conversion)

---

### ESPACE 3: Locataires (Marché Général)

**Cible**: Tous les locataires cherchant à louer une propriété complète (apartement, maison, studio).

**Fonctionnalités Spécifiques:**
- 🔍 Recherche avancée des propriétés
- 🎚️ Filtres personnalisés (prix, localisation, type, équipements)
- 🚪 Demande de visite
- 💬 Messagerie directe avec propriétaire
- 📨 Application à une propriété
- ✍️ Signature numérique du contrat
- 💳 Effectuation des paiements de loyer
- 💰 Paiement progressif via escrow
- 📜 Historique des locations
- ⭐ Évaluation du propriétaire
- 🚨 Signaler des problèmes/paiements tardifs
- 🆘 Support client pour litiges
- ❤️ Favoris/sauvegarde d'annonces
- 📱 Partage d'annonces sur réseaux sociaux

---

## Fonctionnalités Principales

### Pour TOUS les Utilisateurs
- ✅ Inscription et connexion (email/SMS/OTP)
- ✅ Vérification d'identité obligatoire (ID gouvernement, selfie, documents)
- ✅ Profil utilisateur personnalisé (nom, photo, bio)
- ✅ Historique de transactions et locations
- ✅ Système de notations (1-5 étoiles) et commentaires
- ✅ Support client intégré (formulaire contact, FAQ)
- ✅ Notifications en temps réel (email + SMS)
- ✅ Page de profil public (partiel, sauf infos sensibles)

### Annonces et Recherche
- 🔍 Moteur de recherche avancé (localisation, prix, nb pièces, équipements)
- 🎚️ Filtres: loyer min/max, type (maison/apt/chambre), date dispo
- ❤️ Favoris et sauvegarde d'annonces
- 📱 Partage d'annonces sur réseaux sociaux
- 📸 Photos et vidéos de haute qualité
- 🖼️ Galerie complète

### Communication
- 💬 Messagerie intégrée entre propriétaire et locataire
- 🗓️ Système de demande de visite
- ✅ Confirmation de visite
- 🔔 Notifications de messages non lus

---

## Architecture Technique

### Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                    USERS / BROWSERS                         │
└────────────────┬──────────────────────────────┬─────────────┘
                 │                              │
        ┌────────▼─────────┐         ┌─────────▼────────┐
        │   Web Frontend    │         │  Mobile App      │
        │   (React/Vue)     │         │  (RN/Flutter)    │
        │   PWA (V2)        │         │  (V3+)           │
        └────────┬─────────┘         └─────────┬────────┘
                 │                              │
                 └──────────────┬───────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   API REST Gateway   │
                    │  (Node/Python/etc)   │
                    └───────────┬──────────┘
                                │
        ┌───────────────────────┼──────────────────────┐
        │                       │                      │
   ┌────▼────┐         ┌────────▼──────┐      ┌──────▼────┐
   │   DB    │         │  File Storage │      │  External │
   │PostgreSQL│        │  (S3/GCS)     │      │   APIs    │
   │  +Redis  │        │               │      │           │
   └─────────┘        └───────────────┘      └───────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
          ┌────▼────┐     ┌────▼────┐    ┌──▼─────┐
          │  Photos │     │  Mobile │    │ Stripe/│
          │ Annonces│     │  Money  │    │PayPal  │
          └─────────┘     │   API   │    └────────┘
                          └─────────┘
```

### Structure du Projet

```
kaza/
├── public/
│   ├── images/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Modal.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Container.jsx
│   │   ├── property/
│   │   │   ├── PropertyCard.jsx
│   │   │   ├── PropertyDetail.jsx
│   │   │   ├── PropertySearch.jsx
│   │   │   ├── MapView.jsx
│   │   │   └── GalleryCarousel.jsx
│   │   ├── student/
│   │   │   ├── RoommateCard.jsx
│   │   │   ├── RoommateSearch.jsx
│   │   │   └── RoommateProfile.jsx
│   │   └── dashboard/
│   │       ├── OwnerDashboard.jsx
│   │       ├── TenantDashboard.jsx
│   │       └── StudentDashboard.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── SearchResults.jsx
│   │   ├── PropertyDetail.jsx
│   │   ├── StudentLiving.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── About.jsx
│   │   └── 404.jsx
│   ├── styles/
│   │   ├── variables.css
│   │   ├── responsive.css
│   │   ├── animations.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   └── index.css
│   ├── hooks/
│   ├── utils/
│   ├── services/
│   ├── App.jsx
│   └── index.jsx
├── server/
│   ├── models/ (User, Property, Rental, Payment)
│   ├── routes/ (auth, properties, rentals, payments)
│   ├── controllers/
│   ├── middleware/
│   └── server.js
├── tests/
├── .env.example
├── package.json
└── README.md
```

---

## Design System & Maquettes

### 🎨 Palette de Couleurs

#### Couleurs Primaires
```css
--color-primary: #1A3A52;              /* Navy Blue Principal */
--color-primary-light: #2E5A7B;        /* Navy Light */
--color-primary-dark: #0F2535;         /* Navy Dark */
```

#### Accents
```css
--color-accent-blue: #1976D2;          /* Boutons, liens actifs */
--color-accent-green: #4CAF50;         /* Success, actions positives */
--color-accent-teal: #20B2AA;          /* Secondary accent */
```

#### Neutres
```css
--color-white: #FFFFFF;
--color-light-gray: #F5F5F5;
--color-gray: #E0E0E0;
--color-dark-gray: #757575;
--color-text: #212121;
--color-text-secondary: #666666;
```

#### Statut
```css
--color-success: #4CAF50;              /* Confirmations */
--color-warning: #FF9800;              /* Avertissements */
--color-error: #F44336;                /* Erreurs */
--color-info: #2196F3;                 /* Informations */
```

#### Dégradés
```css
/* Hero Overlay */
gradient-hero: linear-gradient(135deg, rgba(26, 58, 82, 0.7) 0%, rgba(47, 90, 123, 0.5) 100%);

/* Photo Overlay */
gradient-overlay: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
```

### 🔤 Typography

#### Font Family
```css
--font-family-primary: "Inter", "Segoe UI", sans-serif;
--font-family-accent: "Poppins", "Inter", sans-serif;
```

#### Font Sizes
```css
--font-size-h1: 48px;
--font-size-h2: 36px;
--font-size-h3: 28px;
--font-size-h4: 24px;
--font-size-body-large: 18px;
--font-size-body: 16px;
--font-size-body-small: 14px;
--font-size-caption: 12px;
```

#### Font Weights
```css
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Line Heights
```css
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.8;
```

### 📏 Spacing System

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

---

## Composants Réutilisables

### Button Component
```jsx
<Button label="Search" variant="primary" size="md" onClick={handleClick} disabled={false} />
```
**Styles:**
- Primary: bg #1976D2, text white, padding 12px 32px
- Secondary: border 2px #1976D2, text #1976D2, transparent bg
- States: hover (opacity 0.9), active (scale 0.98), disabled (opacity 0.5)

### Property Card
```jsx
<PropertyCard 
  property={propertyData} 
  onFavorite={handleFavorite} 
  onViewDetails={handleViewDetails} 
/>
```
**Specs:**
- Width: 280px responsive
- Image height: 200px
- Card shadow: 0 2px 8px rgba(0,0,0,0.1)
- Price badge: bottom-right avec bg #1976D2
- Favorite button: top-right, z-index 10
- Hover: scale 1.02, shadow increase

### Search Filters
```jsx
<FilterSidebar 
  priceRange={priceRange}
  propertyType={type}
  bedrooms={bedrooms}
  onApply={applyFilters}
/>
```
**Specs:**
- Width: 280px desktop / full drawer mobile
- Sticky position: top 80px
- Background: #F5F5F5
- Mobile: Drawer avec backdrop

### Input Component
```jsx
<Input 
  type="text" 
  placeholder="Location..." 
  value={value}
  onChange={handleChange}
  error={errorMessage}
/>
```
**Specs:**
- Border: 1px solid #E0E0E0
- Focus: 2px solid #1976D2
- Padding: 12px 16px
- Radius: 8px

### Navigation Bar
```jsx
<Navbar>
  <Logo />
  <NavMenu />
  <AuthButtons />
  <MobileMenuToggle />
</Navbar>
```
**Specs:**
- Height: 64px
- Background: #FFFFFF
- Border-bottom: 1px solid #E0E0E0
- Sticky on scroll
- Mobile: Hamburger menu collapsible

---

## Écrans Détaillés

### ÉCRAN 1: Landing Page (Homepage)

**Layout:**
```
Navbar (64px, sticky)
↓
Hero Section (500px)
  - Background image avec overlay
  - H1: "Find Your Premium Home"
  - Search bar: Location + Price + Button
↓
Featured Listings Section (400px)
  - Grid 4 colonnes: PropertyCard x 4
  - "Discover Premium Properties"
↓
Student Section (400px)
  - "Elite Student Living Across the Continent"
  - Images étudiant + Description
↓
How Kaza Works (300px)
  - 2 colonnes: For Owners | For Renters
↓
Footer (200px)
```

**Composants Utilisés:**
- Navbar
- Hero avec search form
- Property cards grid
- Student section
- How it works accordion
- Footer

**Responsive:**
- Desktop: 4 colonnes
- Tablet: 2 colonnes
- Mobile: 1 colonne, hamburger menu

### ÉCRAN 2: Search Results Page

**Layout:**
```
Navbar
↓
Search Results Header
  - "X results found"
  - View toggle (Grid/List/Map)
↓
Two Column Layout:
  Left Column (280px):
    - FilterSidebar (sticky)
    - Price Range
    - Property Type
    - Bedrooms
    - Location
    - Apply Button

  Right Column (responsive):
    - Property Cards Grid
    - Pagination en bas
    - Map View (optional toggle)
```

**Features:**
- Dynamic result count
- Sticky filter sidebar
- View toggle
- Pagination
- Map integration

### ÉCRAN 3: Property Detail Page

**Layout:**
```
Navbar
↓
Image Gallery (600px)
  - Main image (full width)
  - Thumbnail carousel (4 images)
  - Gallery controls (prev/next)
↓
Two Column Content:
  Left (60%):
    - Title + Price
    - Description
    - Amenities
    - Location details
    - Property specs (rooms, baths, size)

  Right (40%):
    - Map
    - Owner info card
    - Contact owner button
    - Price summary
↓
Similar Properties (400px)
  - 3 cards horizontales
  - Carousel
↓
Reviews Section (600px)
  - Overall rating display
  - Review list (4.83 stars, 108 reviews)
  - Individual reviews avec avatars
↓
Footer
```

**Key Elements:**
- Full-width image gallery
- Contact button (sticky or floating)
- Favorite heart button
- Share button
- Reviews with moderation
- Similar properties recommendation

### ÉCRAN 4: Student Living / Colocation Page

**Layout:**
```
Navbar
↓
Hero Section - Student Edition (500px)
  - Background image (students, rooms)
  - "Elite Student Living Across the Continent"
  - "Experience perfect student living"
  - Browse button
↓
Student Filters (similar à search)
↓
Roommate Cards Grid (3-4 colonnes)
  - Room image
  - Price
  - Location
  - Roommates count
  - About room
  - Amenities
  - Request button
↓
Footer
```

**Spécificités:**
- Emphasis sur shared amenities
- Roommate profile hints
- Request to join button
- Smaller price points
- Shared facilities highlights

### ÉCRAN 5: Property Detail - Colocation Edition

**Layout:**
```
Same as regular property detail but:

Added Sections:
  - Current Roommates display (anonyme initially)
  - Room sharing info
  - Shared facilities
  - House rules
  - Request to Join (big button)
  - Vote/approval status for joining
```

### ÉCRAN 6: Dashboard - Propriétaire

**Layout:**
```
Navbar
↓
Sidebar (280px, sticky):
  - My Properties
  - Visit Requests
  - Current Rentals
  - Payments
  - Reviews
  - Settings

Main Content:
  - Property Cards summary
  - Recent visit requests
  - Upcoming payments
  - Activity feed
  - Analytics dashboard
    - Views this month
    - Conversion rate
    - Top performing properties
```

**Features:**
- Quick stats (total properties, active rentals)
- Notifications panel
- Analytics charts
- Recent activities
- Upcoming actions

### ÉCRAN 7: Dashboard - Locataire

**Layout:**
```
Navbar
↓
Sidebar:
  - Saved Properties
  - My Rentals
  - Payment History
  - Messages
  - Support Tickets

Main Content:
  - Active rentals card
  - Saved properties list
  - Upcoming payments
  - Recent messages
  - Rental history
```

### ÉCRAN 8: Dashboard - Étudiant

**Layout:**
```
Navbar
↓
Sidebar:
  - My Colocations
  - Colocation Requests
  - Roommate Chats
  - Shared Expenses
  - My Rooms (if owner)

Main Content:
  - Current colocation info
  - Roommates list
  - Shared expenses breakdown
  - Pending requests
  - Colocation chat
  - Room listings (if applicable)
```

---

## Flux de Paiement

### Méthodes de Paiement Intégrées

1. **Mobile Money** (Benin, Togo, Côte d'Ivoire, etc.)
   - API locale intégrée
   - OTP verification
   - Instant confirmation

2. **Virements Bancaires** (nationaux)
   - Compte bancaire localisé
   - Référence de paiement unique
   - 24-48h processing

3. **Cartes Bancaires** (Stripe ou PayPal - optionnel)
   - Pour utilisateurs internationaux
   - Sécurisé PCI-DSS
   - V2+

### Système d'Escrow (V2)

**Fonction**: Locataire paie progressivement. Après période (7/14/30 jours), versement automatique au propriétaire.

**Avantages:**
- ✅ Évite impayés
- ✅ Paiement petit à petit
- ✅ Commission plateforme (5-10%)
- ✅ Protection des deux parties

**Flux Escrow:**
1. Locataire accepte propriété
2. Crée escrow payment plan
3. Paie progressivement (ex: 500 francs/jour)
4. Argent protégé sur escrow account
5. Après 30 jours: versement auto au propriétaire
6. Confirmation et archivage

### Flux de Paiement Standard

1. Locataire sélectionne propriété
2. Signe contrat numérique
3. Effectue paiement (dépôt garantie + 1er mois)
4. Propriétaire confirme réception
5. Accès accordé au locataire
6. Paiements mensuels (direct ou escrow)
7. À fin location: remboursement garantie (moins frais)

### Dashboard Paiements

**Pour Propriétaire:**
- Liste paiements reçus
- Solde escrow en attente
- Historique transactions
- Factures générées
- Remboursement garanties

**Pour Locataire:**
- Historique paiements effectués
- Escrow tracking
- Reçus/factures
- Paiements à venir
- Dépôt de garantie status

---

## Sécurité et Authentification

### Vérification d'Identité Obligatoire

**Tous les utilisateurs** doivent vérifier avant de:
- Publier une annonce (propriétaires)
- Postuler à une propriété (locataires)
- Rejoindre une colocation (étudiants)

**Documents Requis:**
- 🆔 ID gouvernemental (passeport, permis, carte nationale)
- 📱 Selfie de vérification (reconnaissance faciale)
- ☎️ Numéro téléphone vérifié (SMS OTP)
- ✉️ Email vérifié (confirmation link)
- 📍 Adresse résidentielle (propriétaires)

**Processus:**
1. Upload document gouvernemental
2. Prise selfie de vérification
3. Système vérifie correspondance
4. Status pendante pendant 24-48h
5. Approbation ou rejet
6. Accès fonction débloqué après approbation

### Authentification

**MVP:**
- Email/Password basic
- SMS OTP pour confirmation
- Session tokens
- Password reset via email

**V2:**
- 2FA optionnel (SMS + authenticator app)
- Biometric (fingerprint/face) sur mobile
- OAuth (Google, Facebook - optionnel)

### Confidentialité des Données

**Principe**: Données personnelles ne sont JAMAIS affichées publiquement.

**Exemple Colocation:**
- Si 3 personnes en colocation
- Leurs noms/numéros ne sont visibles qu'APRÈS approbation mutuelle
- Avant: profil anonyme avec critères seulement

**Mesures de Sécurité:**
- ✅ Chiffrement bout-à-bout pour messages (V2)
- ✅ Données stockées sécurisée (HTTPS, encryption at rest)
- ✅ Accès infos personnelles après accord explicite
- ✅ Vérification anti-fraude (détection anomalies)
- ✅ Audit sécurité régulier
- ✅ Authentification 2FA optionnel (V2)
- ✅ RGPD compliant

### Sécurité Colocations

**Processus Sécurisé:**
1. Annonce montre: chambre, équipements, loyer, profil type (anonyme)
2. Noms/numéros colocataires actuels masqués
3. Demande → Approbation → Échange infos → Signature → Accès complet

**Vérifications:**
- ✅ ID verification obligatoire
- ✅ Antécédents vérifiés (si applicable)
- ✅ Historique colocataires consultable
- ✅ System de rating entre colocataires
- ✅ Support pour disputes

---

## Roadmap: MVP / V1 / V2 / Hors-Périmètre

### 🎯 MVP - Les Fondations (Semaines 1-4)

**Objectif**: Plateforme simple validant le concept.

#### Authentification et Inscription
- ✅ Inscription email ou SMS
- ✅ Connexion avec password ou OTP SMS
- ✅ Récupération password
- ✅ Sélection rôle (Propriétaire / Locataire)
- ✅ Vérification email/SMS

#### Gestion du Profil
- ✅ Profil basique (nom, prénom, photo)
- ✅ Vérification identité basique (upload document)
- ✅ Selfie vérification
- ✅ Téléphone vérifié
- ✅ Adresse pour propriétaires

#### Espace Propriétaire
- ✅ Création annonce (titre, description, prix)
- ✅ Upload photos (max 10 images)
- ✅ Localisation (map interactive)
- ✅ Détails propriété (chambres, salle bain, équipements)
- ✅ Statut annonce (publiée, archivée, louée)
- ✅ URL unique annonce
- ❌ Pas de vidéos/tours virtuels

#### Espace Locataire
- ✅ Recherche simple (localisation + prix)
- ✅ Affichage liste et carte
- ✅ Filtres basiques (prix, nb pièces)
- ✅ Détails complets annonce
- ✅ Favoris/sauvegarde
- ✅ Partage annonce

#### Communication
- ✅ Messagerie propriétaire ↔ locataire
- ✅ Demande de visite
- ✅ Confirmation visite
- ✅ Notifications (email + SMS)
- ❌ Pas de chat groupé

#### Paiements
- ✅ Intégration Mobile Money Bénin
- ✅ Paiement unique (dépôt + 1er mois)
- ✅ Confirmations paiement
- ✅ Historique transactions
- ❌ Pas d'escrow
- ❌ Pas d'autres méthodes

#### Contrats
- ✅ Template PDF généré
- ✅ Signature numérique basique
- ✅ Téléchargement contrat
- ✅ Archivage

#### Dashboards
- ✅ Dashboard propriétaire (annonces, visites, locations)
- ✅ Dashboard locataire (favoris, demandes, locations)
- ✅ Stats basiques (vues, demandes)

#### Support
- ✅ Formulaire contact simple
- ✅ FAQ statique
- ✅ Panel admin basique

#### 🏁 MVP Summary
| Métrique | Valeur |
|----------|--------|
| Durée | 4 semaines |
| Utilisateurs | 100-500 (bêta fermée) |
| Plateformes | Web seulement |
| Focus | Propriétaires ↔ Locataires |

---

### 🎯 V1 - Espace Étudiants (Semaines 5-8)

**Objectif**: Ajouter module complet colocation. Tous MVP features + nouvel espace.

#### Espace Étudiant - Publication
- ✅ Création offre colocation (chambre)
- ✅ Description chambre
- ✅ Photos spécifiques (chambre, salle bain, cuisine)
- ✅ Nombre personnes recherchées (1, 2, 3)
- ✅ Profil recherché (anonyme: âge, sexe, discipline)
- ✅ Loyer chambre
- ✅ Dates disponibles
- ✅ Statut (ouverte, fermée, complète)

#### Espace Étudiant - Recherche
- ✅ Moteur recherche colocations
- ✅ Filtres étudiants (université, discipline, nb personnes)
- ✅ Affichage annonces colocation
- ✅ Profil colocataires (anonyme jusqu'approbation)
- ✅ Demande rejoindre colocation

#### Processus Approbation
- ✅ Demande envoyée
- ✅ Colocataires votent/approuvent
- ✅ Notification approbation/rejet
- ✅ Approuvé → Échange infos
- ✅ Contrat colocation groupé
- ✅ Tous signent

#### Groupe Colocation
- ✅ Groupe visible (tous colocataires)
- ✅ Partage infos contact
- ✅ Chat groupe
- ✅ Gestion frais communs
- ✅ Calculatrice frais
- ✅ Liste colocataires

#### Contrats Colocation
- ✅ Template spécifique
- ✅ Signature tous colocataires
- ✅ Archivage groupé

#### Dashboard Étudiant
- ✅ Onglet "Mes colocations"
- ✅ Onglet "Mes demandes"
- ✅ Chat colocataires
- ✅ Frais partagés dashboard
- ✅ Contrats groupés

#### Paiements Colocation
- ✅ Paiement groupé
- ✅ Paiement individuel avec ventilation
- ✅ Historique groupe
- ✅ Mobile Money toujours

#### Enhancements V1
- ✅ Vidéo courte présentation
- ✅ Recherche avancée
- ✅ Notations 1-5 étoiles
- ✅ Avis/commentaires
- ✅ Notifications améliorées
- ✅ Page profil public améliorée
- ✅ Recommandations basiques
- ✅ Analytics propriétaire

#### 🏁 V1 Summary
| Métrique | Valeur |
|----------|--------|
| Durée | 4 semaines |
| Utilisateurs | 1k-5k (bêta ouverte) |
| Nouveautés | Module colocation complet |

---

### 🎯 V2 - Fonctionnalités Avancées (Semaines 9-12)

**Objectif**: Version stable prête lancement public.

#### Système d'Escrow
- ✅ Paiements progressifs
- ✅ Durée configurable (7, 14, 30 jours)
- ✅ Versement automatique propriétaire
- ✅ Protection argent escrow
- ✅ Commission plateforme (5-10%)
- ✅ Dashboard suivi escrow
- ✅ Transactions archivées

#### Paiements Avancés
- ✅ Virement bancaire national
- ✅ PayPal / Stripe optionnel
- ✅ Remboursement garantie
- ✅ Loyers récurrents
- ✅ Rappels paiement automatiques
- ✅ Factures/reçus générés
- ✅ Historique financier détaillé

#### Système Notations/Avis
- ✅ Notes 1-5 étoiles
- ✅ Commentaires texte
- ✅ Modération avis
- ✅ Affichage profil public
- ✅ Anti-fraude détection
- ✅ Score réputation utilisateur

#### Système Réclamations
- ✅ Formulaire réclamation
- ✅ Suivi ticket
- ✅ Chat support temps réel
- ✅ Escalade arbitrage
- ✅ Historique tickets
- ✅ FAQ expandable

#### Multimédias Avancés
- ✅ Tours virtuels 360° optionnel
- ✅ Vidéos courtes (15-60s)
- ✅ Galerie plein écran
- ✅ Compression automatique
- ✅ Upload sécurisé
- ✅ Watermarks optionnel

#### Mobile Web Responsive
- ✅ Web responsive 100% (mobile first)
- ✅ Optimisation performances mobile
- ✅ PWA installation
- ✅ Offline support base
- ✅ Push notifications optionnel
- ❌ App native pas encore

#### Analytics & Insights
- ✅ Dashboard analytics propriétaire
- ✅ Stats (vues, demandes, conversion)
- ✅ Graphiques temps réel
- ✅ Tendances prix
- ✅ Rapports téléchargeables
- ✅ Benchmarking

#### Système Recommandations
- ✅ Reco basées recherches antérieures
- ✅ Suggestions similaires
- ✅ Alertes nouvelles annonces
- ✅ Email digest hebdomadaire
- ✅ ML basique

#### Sécurité Renforcée
- ✅ Vérification identité avancée (facial recognition)
- ✅ Détection fraude algorithme
- ✅ 2FA optionnel
- ✅ Chiffrement bout-à-bout messages
- ✅ Audit sécurité pro
- ✅ RGPD complet

#### Modération & Conformité
- ✅ Modération annonces
- ✅ Détection spam/arnaque
- ✅ Suppression comptes suspects
- ✅ Signalement utilisateurs
- ✅ Système bannissement
- ✅ Politique appliquée

#### 🏁 V2 Summary
| Métrique | Valeur |
|----------|--------|
| Durée | 4 semaines |
| Utilisateurs | 10k-50k (public) |
| Plateforme | Web + PWA mobile |
| Statut | **PRÊT LANCEMENT PUBLIC** |

---

### 🎯 Hors-Périmètre (V3+ - Futures)

Ces features ne seront PAS développées MVP/V1/V2:

#### 5.1 Expansions Géographiques
- 🌍 Déploiement: Togo, Côte d'Ivoire, Senegal, Burkina
- 💱 Adaptation paiements (Mobile Money locaux)
- 🌐 Support multilingue
- ⚖️ Localisation prix et lois
- 📣 Marketing local

#### 5.2 Apps Natives Mobiles
- 📱 App iOS native (Swift)
- 🤖 App Android native (Kotlin)
- 🔄 Sync push vers app
- 📴 Offline sync complet
- 🗂️ Intégration système
- 🏪 App Store & Play Store

#### 5.3 API Publique
- 🔌 API REST publique
- 📖 Documentation OpenAPI
- 🪝 Webhooks événements
- 💼 Intégration CRM/Compta
- 🧩 Marketplace plugins

#### 5.4 Blockchain (Optionnel)
- ⛓️ Smart contracts loyers
- 🔐 Signature blockchain
- 📜 Historique immuable
- 💰 Paiements crypto

#### 5.5 Assurance Intégrée
- 🤝 Partenaires assureurs
- 🛡️ Assurance propriétaire
- 🏠 Assurance locataire
- 💵 Devis gratuit

#### 5.6 Marketplace Services
- 🧹 Nettoyage
- 🔧 Maintenance
- 🚰 Plombiers/Électriciens
- 📏 Évaluations

#### 5.7 IA/ML Avancé
- 🤖 Chatbot IA support
- 🧠 Recommandations IA
- 🚨 Détection fraude ML
- 💡 Pricing automatique

#### 5.8 Bureau Immobilier Virtuel
- 🏢 Portail agents
- 📊 Portfolio multi-propriétés
- 👥 Outils CRM agents
- 💰 Commission agents

#### 5.9 Prêts & Financement
- 🏦 Partenaires banques
- 💸 Financement garanties
- 📋 Demandes prêt online

#### 5.10 Autres
- 🥽 Tours VR/AR
- 🚁 Drone photography
- 🎨 Staging virtuel
- 🎯 Auctions
- ⭐ Loyalty program

---

## Matrice de Priorité

### 🔴 DOIT AVOIR (Must-Have) - MVP Critical

Ces features sont **ESSENTIELLES**:
- ✅ Inscription et authentification
- ✅ Vérification identité
- ✅ Création et affichage annonces
- ✅ Moteur recherche basique
- ✅ Messaging entre users
- ✅ Paiements Mobile Money
- ✅ Contrats PDF générés
- ✅ Dashboard propriétaire et locataire

**Impact**: Sans ces, produit non-fonctionnel.

### 🟡 DEVRAIT AVOIR (Should-Have)

Ces features **améliorent significativement**:
- ✅ Favoris/sauvegarde annonces
- ✅ Filtres avancés
- ✅ Notifications (email + SMS)
- ✅ Notations 1-5
- ✅ Module colocation complet (V1)
- ✅ Escrow paiements (V2)

**Impact**: Amélioration 30-50% expérience.

### 🟢 POURRAIT AVOIR (Nice-to-Have)

Ces features sont des **bonus**:
- ✅ Tours virtuels 360°
- ✅ Vidéos propriétés
- ✅ Recommandations IA
- ✅ App native
- ✅ Intégrations tiers
- ✅ Modération auto

**Impact**: Différenciation, non-critique.

### ⚪ N'A PAS BESOIN (Won't Have)

**PAS développées MVP/V1/V2**:
- ❌ Blockchain
- ❌ Assurance intégrée
- ❌ Financement banques
- ❌ Marketplace services
- ❌ Expansion internationale
- ❌ Chaîne YouTube

**Raison**: Complexité, impact limité court-terme.

---

## Base de Données - Schema

### SQL Schema

```sql
-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  profile_photo_url VARCHAR(500),
  role ENUM('OWNER', 'TENANT', 'STUDENT', 'ADMIN') NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_document_url VARCHAR(500),
  verification_selfie_url VARCHAR(500),
  verification_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  address VARCHAR(255),
  bio TEXT,
  rating_average DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTIES TABLE (Annonces Location)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  bedrooms INT,
  bathrooms INT,
  square_meters INT,
  amenities TEXT[], -- JSON array: WiFi, Parking, Kitchen, etc.
  location_latitude DECIMAL(10,8),
  location_longitude DECIMAL(11,8),
  address VARCHAR(255) NOT NULL,
  status ENUM('AVAILABLE', 'RENTED', 'ARCHIVED') DEFAULT 'AVAILABLE',
  property_type ENUM('APARTMENT', 'HOUSE', 'ROOM', 'STUDIO') NOT NULL,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTY PHOTOS
CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  photo_url VARCHAR(500) NOT NULL,
  display_order INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROOMMATE LISTINGS (Colocations)
CREATE TABLE roommate_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  room_size VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  bedrooms_available INT,
  people_looking_for INT,
  preferred_profile TEXT, -- JSON: age range, gender, discipline
  location_latitude DECIMAL(10,8),
  location_longitude DECIMAL(11,8),
  address VARCHAR(255) NOT NULL,
  status ENUM('OPEN', 'FULL', 'CLOSED') DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROOMMATE GROUPS
CREATE TABLE roommate_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES roommate_listings(id) ON DELETE CASCADE,
  group_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROOMMATE MEMBERS
CREATE TABLE roommate_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES roommate_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'LEFT') DEFAULT 'PENDING',
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- RENTALS
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2),
  status ENUM('PENDING', 'ACTIVE', 'ENDED', 'CANCELLED') DEFAULT 'PENDING',
  contract_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  roommate_listing_id UUID REFERENCES roommate_listings(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES rentals(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('MOBILE_MONEY', 'BANK_TRANSFER', 'CARD') NOT NULL,
  transaction_id VARCHAR(255) UNIQUE,
  status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ESCROW PAYMENTS (V2)
CREATE TABLE escrow_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES rentals(id),
  tenant_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  duration_days INT DEFAULT 30,
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  release_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RATINGS/REVIEWS
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES users(id),
  rated_user_id UUID REFERENCES users(id),
  rental_id UUID REFERENCES rentals(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CONTRACTS
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES rentals(id),
  roommate_group_id UUID REFERENCES roommate_groups(id),
  contract_type ENUM('RENTAL', 'ROOMMATE') NOT NULL,
  contract_pdf_url VARCHAR(500) NOT NULL,
  signed_by_owner BOOLEAN DEFAULT FALSE,
  signed_by_tenant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  signed_at TIMESTAMP
);

-- VISIT REQUESTS
CREATE TABLE visit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES users(id),
  requested_date DATE NOT NULL,
  requested_time TIME,
  status ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAVORITES/SAVED PROPERTIES
CREATE TABLE saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, property_id)
);

-- Indexes pour performance
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(location_latitude, location_longitude);
CREATE INDEX idx_rentals_tenant_id ON rentals(tenant_id);
CREATE INDEX idx_rentals_property_id ON rentals(property_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX idx_roommate_members_group_id ON roommate_members(group_id);
```

---

## Checklist d'Implémentation

### ✅ Phase 1: Setup & Design System (Semaine 1)
- [ ] Configuration du projet
- [ ] CSS variables design system
- [ ] Responsive breakpoints
- [ ] Composants de base (Button, Card, Input)
- [ ] Navbar et Footer

### ✅ Phase 2: Pages MVP (Semaines 2-3)
- [ ] Landing page (Hero + Featured)
- [ ] Search results (Filters + Grid)
- [ ] Property detail
- [ ] Authentification (Login/Signup)
- [ ] Dashboards basiques

### ✅ Phase 3: Backend & API (Semaines 1-4)
- [ ] Setup database
- [ ] User authentication (JWT)
- [ ] Property CRUD endpoints
- [ ] Search API avec filtres
- [ ] Payment integration (Mobile Money)

### ✅ Phase 4: Interactions & État (Semaines 3-4)
- [ ] State management
- [ ] Form validation
- [ ] Loading states
- [ ] Error handling

### ✅ Phase 5: Polish & Responsive (Semaine 4)
- [ ] Mobile navigation
- [ ] Media queries
- [ ] Performance optimization
- [ ] Bug fixes

### ✅ Phase 6: V1 - Colocation (Semaines 5-8)
- [ ] Espace étudiant complet
- [ ] Processus approbation
- [ ] Chat groupé
- [ ] Contrats colocation
- [ ] Nouvelles notifications

### ✅ Phase 7: V2 - Advanced (Semaines 9-12)
- [ ] Système escrow
- [ ] Paiements avancés
- [ ] Support chat en temps réel
- [ ] PWA mobile
- [ ] Analytics dashboard

---

## Instructions pour Agent IA

### ÉTAPE 1: SETUP COMPLET
```
Tu es expert développeur full-stack.
Crée structure complète du projet KAZA avec:
- Dossiers organisés (src/, server/, tests/)
- package.json avec dépendances
- Configuration build tool (Vite/Webpack)
- .env.example avec variables
- README.md avec setup instructions
```

### ÉTAPE 2: DESIGN SYSTEM
```
Crée CSS complet:
- styles/variables.css avec toutes les couleurs, spacing, typography
- styles/responsive.css avec breakpoints media queries
- styles/animations.css avec transitions
- styles/components.css avec Button, Card, Input styles
```

### ÉTAPE 3: COMPOSANTS DE BASE
```
Crée composants réutilisables:
- Button (primary, secondary, disabled states)
- Card (propertyCard, roommateCard)
- Input (text, email, password, select, avec validation)
- Navbar (header avec menu et auth buttons)
- Footer
- Modal/Dialog
- Loading skeleton
```

### ÉTAPE 4: PAGES MVP
```
Crée pages prioritaires:
- HomePage (Hero + Featured Listings)
- SearchResults (Filters + Grid + Map)
- PropertyDetail (Gallery + Reviews + Contact)
- Login/Signup
- Dashboard (Owner/Tenant)
```

### ÉTAPE 5: BACKEND API
```
Crée API REST endpoints:
POST /api/auth/register - Inscription
POST /api/auth/login - Connexion
GET/POST /api/properties - CRUD annonces
GET /api/properties/search - Recherche
POST /api/payments - Intégration paiements
POST /api/messages - Messagerie
Incluez JWT authentication
```

### ÉTAPE 6: DATABASE
```
Crée schema SQL complet:
- Users table
- Properties table
- Rentals table
- Payments table
- Messages table
- Ratings table
- Indexes pour performance
```

### CONDITIONS CRITIQUES:
✅ Respecter maquettes Figma exactement  
✅ Utiliser Design System (variables CSS)  
✅ Code propre, maintenable, commenté  
✅ Mobile-first responsive design  
✅ Pas de hardcoding  
✅ Composants réutilisables  
✅ Error handling et loading states  

### OUTPUT SOUHAITÉ:
- Code React/Vue complet et fonctionnel
- Tous composants structurés
- Toutes pages créées
- CSS organisé
- Database schema défini
- API structure ready
- Ready pour MVP launch

---

## Conclusion

**KAZA** est une plateforme ambitieuse transformant le marché immobilier africain. Cette PRD fourni toutes les specifications nécessaires pour un développement rapide avec un Agent IA.

**Timeline totale:**
- **MVP (4 semaines)**: Fondations (Prop ↔ Tenant)
- **V1 (4 semaines)**: Module colocation étudiant
- **V2 (4 semaines)**: Version stable lancement public
- **V3+ (Continu)**: Expansions et innovations

**Document prêt à copier/coller directement dans Agent IA.**

Bonne chance avec KAZA ! 🚀

---

**Document**: KAZA_PRD_Complete.md  
**Version**: 1.0  
**Date**: 19 Mars 2026  
**Statut**: 🟢 Prêt pour Développement