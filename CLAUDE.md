# CLAUDE.md - KAZA

## Apercu du Projet

KAZA est la plus grande plateforme d'immobilier en Afrique, transformant le marche du logement africain par la numerisation complete du processus de location. La plateforme connecte directement proprietaires, locataires et etudiants (colocation) en commencant par le Benin puis en s'etendant a toute l'Afrique de l'Ouest.

Trois espaces utilisateurs :
- **Proprietaires** : publication d'annonces, gestion des visites, paiements, contrats
- **Locataires** : recherche de proprietes, messagerie, paiements, favoris
- **Etudiants** : colocations, recherche de colocataires, frais partages

## Architecture Globale

- **Frontend** : Next.js 15+ (App Router, React Server Components, Server Actions)
- **Styling** : Tailwind CSS v4 + shadcn/ui
- **Backend/BaaS** : Supabase (PostgreSQL + PostGIS, Auth, Storage, Realtime, Edge Functions)
- **Paiements** : FedaPay (principal) + Kkiapay (fallback) - Mobile Money Benin
- **Deploiement** : Vercel (frontend) + Supabase Cloud (backend)
- **Cartes** : Mapbox GL JS
- **SMS/OTP** : Twilio
- **Emails** : Resend
- **Push Notifications** : Firebase Cloud Messaging

Pas de serveur backend separe. Toute la logique serveur vit dans :
- Next.js Server Actions (mutations)
- Next.js Route Handlers (webhooks)
- Supabase Edge Functions (taches asynchrones)
- Supabase RLS (autorisation au niveau de la base de donnees)

## Style Visuel

- Interface claire et minimaliste
- Pas de mode sombre pour le MVP
- Palette principale : Navy Blue (#1A3A52), Accent Blue (#1976D2), Accent Green (#4CAF50)
- Typographie : Inter (primaire), Poppins (accent)
- Mobile-first responsive design

## Contraintes et Politiques

- NE JAMAIS exposer les cles API au client (SUPABASE_SERVICE_ROLE_KEY, FEDAPAY_SECRET_KEY, etc. sont cote serveur uniquement)
- Toutes les variables sensibles doivent etre dans `.env.local` (jamais commit)
- Les variables prefixees `NEXT_PUBLIC_` sont les seules accessibles cote client
- Utiliser Supabase RLS pour la securite au niveau de la base de donnees
- Verifier la signature HMAC sur tous les webhooks (FedaPay, Twilio)

## Dependances

- Preferer les composants existants de shadcn/ui plutot que d'ajouter de nouvelles bibliotheques UI
- Utiliser React Hook Form + Zod pour la validation des formulaires
- Utiliser Zustand pour le state management client (leger)
- Utiliser next-intl pour l'internationalisation
- Utiliser @react-pdf/renderer pour la generation de contrats PDF

## Tests Interface Graphique

A la fin de chaque developpement qui implique l'interface graphique :
- Tester avec playwright-skill
- L'interface doit etre responsive (mobile, tablette, desktop)
- L'interface doit etre fonctionnelle (navigation, interactions, formulaires)
- L'interface doit repondre au besoin developpe (conformite avec les specs)

## Documentation

- [PRD - Product Requirements Document](./PRD.md) : specifications completes du produit, ecrans, flux de paiement, roadmap MVP/V1/V2
- [Architecture Technique](./ARCHITECTURE.md) : decisions techniques, stack complet, structure du projet, schemas de base de donnees, deploiement

## Context7

Utiliser toujours Context7 (outils MCP) pour :
- La generation de code
- Les etapes de configuration ou d'installation
- La documentation de bibliotheque/API

Cela signifie utiliser automatiquement les outils MCP Context7 pour resoudre l'identifiant de bibliotheque et obtenir la documentation de bibliotheque sans demande explicite de l'utilisateur.

## Langue

Toutes les specifications doivent etre redigees en francais, y compris les specs OpenSpec (sections Purpose et Scenarios). Seuls les titres de Requirements doivent rester en anglais avec les mots-cles SHALL/MUST pour la validation OpenSpec.
