## ADDED Requirements

### Requirement: Navbar SHALL be sticky with responsive menu
La Navbar MUST avoir une hauteur de 64px, un fond blanc (#FFFFFF), un border-bottom de 1px solid #E0E0E0, et etre sticky au scroll. Elle MUST contenir le logo KAZA, le menu de navigation, les boutons d'authentification, et un hamburger menu sur mobile.

#### Scenario: Navigation desktop
- **WHEN** la page est affichee sur desktop (> 1024px)
- **THEN** la Navbar affiche le logo, les liens de navigation (Accueil, Rechercher, Colocation, A propos), et les boutons Connexion/Inscription

#### Scenario: Navigation mobile
- **WHEN** la page est affichee sur mobile (< 768px)
- **THEN** la Navbar affiche le logo et un hamburger menu qui ouvre un drawer lateral avec les liens

#### Scenario: Navbar sticky
- **WHEN** l'utilisateur scrolle la page vers le bas
- **THEN** la Navbar reste fixee en haut de l'ecran

### Requirement: Footer SHALL display site information and links
Le Footer MUST contenir les sections : logo et description KAZA, liens rapides (Rechercher, Publier, A propos), liens legaux (CGU, Politique de confidentialite), et contacts.

#### Scenario: Affichage footer
- **WHEN** l'utilisateur atteint le bas de la page
- **THEN** le Footer est visible avec toutes les sections organisees en colonnes (4 colonnes desktop, 2 colonnes tablette, 1 colonne mobile)

### Requirement: PropertyCard SHALL display property summary
Le PropertyCard MUST afficher : image principale (200px hauteur), badge prix (bottom-right, fond #1976D2), bouton favori (coeur, top-right), titre, localisation, nombre de chambres/salles de bain, et surface. Le card MUST avoir une ombre (0 2px 8px rgba(0,0,0,0.1)), une largeur de 280px responsive, et un effet hover (scale 1.02, ombre augmentee).

#### Scenario: Affichage card propriete
- **WHEN** une propriete est affichee dans une grille
- **THEN** le PropertyCard montre l'image, le prix en XOF, le titre, la localisation, et les specs

#### Scenario: Interaction favori
- **WHEN** l'utilisateur clique sur le coeur
- **THEN** le coeur passe de vide a rempli (ou inversement) avec une animation

#### Scenario: Hover effect
- **WHEN** l'utilisateur survole le card sur desktop
- **THEN** le card se scale a 1.02 et l'ombre augmente

### Requirement: PropertyFilters SHALL provide search filtering
Le FilterSidebar MUST avoir une largeur de 280px sur desktop, etre sticky (top 80px), avec un fond #F5F5F5. Sur mobile, il MUST s'afficher comme un drawer avec backdrop. Les filtres MUST inclure : plage de prix (slider), type de propriete (select), nombre de chambres (select), localisation (input), et bouton Appliquer.

#### Scenario: Filtres desktop
- **WHEN** la page de recherche est affichee sur desktop
- **THEN** le sidebar des filtres est visible a gauche avec tous les champs de filtre

#### Scenario: Filtres mobile
- **WHEN** l'utilisateur clique sur "Filtres" sur mobile
- **THEN** un drawer s'ouvre depuis le bas avec les filtres et un bouton "Appliquer"

### Requirement: PropertySearchBar SHALL provide quick search
La barre de recherche MUST contenir : champ localisation, selecteur de prix, et bouton de recherche. Elle MUST etre utilisee dans le Hero de la landing page et dans la page de recherche.

#### Scenario: Recherche depuis le Hero
- **WHEN** l'utilisateur saisit "Cotonou" et clique "Rechercher"
- **THEN** il est redirige vers la page de recherche avec le filtre localisation pre-rempli

### Requirement: PropertyGallery SHALL display property images
La galerie MUST afficher une image principale en pleine largeur (600px hauteur max), un carrousel de thumbnails (4 images visibles), et des controles prev/next. Un clic sur un thumbnail MUST changer l'image principale.

#### Scenario: Navigation dans la galerie
- **WHEN** l'utilisateur clique sur un thumbnail
- **THEN** l'image principale change avec une transition fluide

#### Scenario: Galerie avec une seule image
- **WHEN** la propriete n'a qu'une seule image
- **THEN** le carrousel de thumbnails n'est pas affiche

### Requirement: RatingStars SHALL display star ratings
Le composant RatingStars MUST afficher des etoiles (1-5) avec support pour les demi-etoiles. Il MUST avoir un mode lecture (affichage) et un mode interactif (selection).

#### Scenario: Affichage note
- **WHEN** une note de 4.5 est passee au composant
- **THEN** 4 etoiles pleines et 1 demi-etoile sont affichees

#### Scenario: Selection interactive
- **WHEN** l'utilisateur survole la 3eme etoile en mode interactif
- **THEN** les 3 premieres etoiles sont mises en surbrillance

### Requirement: Sidebar dashboard SHALL provide role-based navigation
Le Sidebar MUST afficher les liens de navigation specifiques au role de l'utilisateur (Proprietaire, Locataire, ou Etudiant) comme defini dans le PRD (Ecrans 6, 7, 8). Le lien actif MUST etre visuellement distinct. Le Sidebar MUST avoir une largeur de 280px sur desktop et etre collapssable sur mobile.

#### Scenario: Sidebar proprietaire
- **WHEN** un proprietaire accede a son dashboard
- **THEN** le sidebar affiche : Mes Proprietes, Demandes de Visite, Locations en Cours, Paiements, Avis, Parametres

#### Scenario: Sidebar locataire
- **WHEN** un locataire accede a son dashboard
- **THEN** le sidebar affiche : Proprietes Sauvegardees, Mes Locations, Historique Paiements, Messages, Tickets Support

#### Scenario: Sidebar etudiant
- **WHEN** un etudiant accede a son dashboard
- **THEN** le sidebar affiche : Mes Colocations, Demandes Colocation, Chat Colocataires, Frais Partages, Mes Chambres

### Requirement: EmptyState SHALL display when no data is available
Le composant EmptyState MUST afficher une illustration, un titre, une description, et un bouton d'action optionnel quand une liste est vide.

#### Scenario: Aucun resultat de recherche
- **WHEN** la recherche ne retourne aucun resultat
- **THEN** un EmptyState s'affiche avec le message "Aucune propriete trouvee" et un bouton "Modifier les filtres"

### Requirement: ImageUpload SHALL handle photo uploads
Le composant ImageUpload MUST permettre le drag-and-drop et la selection de fichiers, afficher un apercu des images selectionnees, supporter jusqu'a 10 images, et afficher une barre de progression.

#### Scenario: Upload par drag-and-drop
- **WHEN** l'utilisateur glisse des images sur la zone de depot
- **THEN** les images sont ajoutees avec un apercu miniature et une barre de progression

#### Scenario: Limite d'images
- **WHEN** l'utilisateur tente d'ajouter plus de 10 images
- **THEN** un message d'erreur s'affiche indiquant la limite maximale

### Requirement: VerificationBadge SHALL indicate user verification status
Le composant VerificationBadge MUST afficher un badge vert avec coche pour les utilisateurs verifies, un badge orange "En attente" pour les verifications en cours, et aucun badge pour les non-verifies.

#### Scenario: Utilisateur verifie
- **WHEN** un profil utilisateur avec `verification_status = APPROVED` est affiche
- **THEN** un badge vert avec icone de coche et texte "Verifie" est visible
