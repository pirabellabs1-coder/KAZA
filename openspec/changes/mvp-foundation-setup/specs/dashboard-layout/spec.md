## ADDED Requirements

### Requirement: Dashboard layout SHALL include sidebar and header
Le layout dashboard MUST inclure un sidebar de navigation (280px, gauche) et un header avec le nom de l'utilisateur, son avatar, et un bouton de deconnexion. Le contenu principal MUST occuper l'espace restant a droite du sidebar.

#### Scenario: Affichage dashboard desktop
- **WHEN** un utilisateur authentifie accede au dashboard sur desktop
- **THEN** le sidebar est visible a gauche (280px) et le contenu principal a droite

#### Scenario: Affichage dashboard mobile
- **WHEN** un utilisateur authentifie accede au dashboard sur mobile
- **THEN** le sidebar est masque et accessible via un bouton hamburger, le contenu principal occupe toute la largeur

### Requirement: Dashboard SHALL redirect based on user role
La page `/dashboard` MUST rediriger automatiquement vers l'espace correspondant au role de l'utilisateur : `/owner/properties` pour les proprietaires, `/tenant/saved` pour les locataires, `/student/colocations` pour les etudiants.

#### Scenario: Redirection proprietaire
- **WHEN** un utilisateur avec le role OWNER accede a `/dashboard`
- **THEN** il est redirige vers `/owner/properties`

#### Scenario: Redirection locataire
- **WHEN** un utilisateur avec le role TENANT accede a `/dashboard`
- **THEN** il est redirige vers `/tenant/saved`

#### Scenario: Redirection etudiant
- **WHEN** un utilisateur avec le role STUDENT accede a `/dashboard`
- **THEN** il est redirige vers `/student/colocations`

### Requirement: Dashboard pages SHALL display placeholder content
Les pages de dashboard (proprietaire, locataire, etudiant) MUST afficher un contenu placeholder structure avec les sections definies dans le PRD (Ecrans 6, 7, 8). Chaque section MUST avoir un titre, un EmptyState ou des donnees mockees, et une mise en page coherente.

#### Scenario: Dashboard proprietaire
- **WHEN** un proprietaire accede a son espace
- **THEN** les pages Mes Proprietes, Demandes de Visite, Locations, Paiements, et Analytics sont accessibles avec du contenu placeholder

#### Scenario: Dashboard locataire
- **WHEN** un locataire accede a son espace
- **THEN** les pages Proprietes Sauvegardees, Mes Locations, Historique Paiements, et Messages sont accessibles avec du contenu placeholder

#### Scenario: Dashboard etudiant
- **WHEN** un etudiant accede a son espace
- **THEN** les pages Mes Colocations, Demandes, Chat, Frais Partages, et Mes Chambres sont accessibles avec du contenu placeholder

### Requirement: Profile page SHALL display user information
La page de profil MUST afficher les informations de l'utilisateur (nom, photo, email, telephone, bio, role) avec possibilite de modification. Le badge de verification MUST etre affiche selon le statut.

#### Scenario: Affichage profil
- **WHEN** l'utilisateur accede a `/profile`
- **THEN** ses informations sont affichees avec le formulaire de modification et le badge de verification

### Requirement: Settings page SHALL allow account configuration
La page de parametres MUST permettre la modification du mot de passe, la gestion des notifications (email, SMS), et la suppression du compte.

#### Scenario: Modification mot de passe
- **WHEN** l'utilisateur change son mot de passe dans les parametres
- **THEN** le mot de passe est mis a jour via Supabase Auth et un message de confirmation s'affiche
