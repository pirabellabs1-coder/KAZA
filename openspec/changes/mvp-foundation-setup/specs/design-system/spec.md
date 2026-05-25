## ADDED Requirements

### Requirement: Color palette SHALL match PRD specification
Les variables CSS MUST definir la palette complete du PRD : primaires (Navy Blue #1A3A52, #2E5A7B, #0F2535), accents (#1976D2, #4CAF50, #20B2AA), neutres (#FFFFFF, #F5F5F5, #E0E0E0, #757575, #212121, #666666), statuts (#4CAF50, #FF9800, #F44336, #2196F3), et degradess. Ces variables MUST etre integrees dans la configuration shadcn/ui.

#### Scenario: Variables CSS disponibles
- **WHEN** un composant utilise `var(--color-primary)` ou les classes Tailwind correspondantes
- **THEN** la couleur affichee est #1A3A52

#### Scenario: Coherence visuelle
- **WHEN** l'interface est affichee
- **THEN** aucune couleur hardcodee n'apparait en dehors de la palette definie

### Requirement: Typography SHALL use Inter and Poppins fonts
La typographie MUST utiliser Inter comme police primaire et Poppins comme police d'accent. Les tailles MUST suivre l'echelle du PRD : H1 (48px), H2 (36px), H3 (28px), H4 (24px), body-large (18px), body (16px), body-small (14px), caption (12px).

#### Scenario: Chargement des polices
- **WHEN** la page se charge
- **THEN** les polices Inter et Poppins sont chargees via `next/font` (optimisation automatique)

#### Scenario: Tailles responsives
- **WHEN** la page est affichee sur mobile (< 768px)
- **THEN** les tailles de titre sont reduites proportionnellement (H1 passe a 32px, H2 a 28px)

### Requirement: Spacing system SHALL follow 4px base grid
Le systeme de spacing MUST utiliser les valeurs du PRD : xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px). Ces valeurs MUST etre configurees dans Tailwind.

#### Scenario: Utilisation du spacing
- **WHEN** un composant utilise la classe `p-md` ou `gap-lg`
- **THEN** le padding/gap applique correspond a 16px ou 24px respectivement

### Requirement: Responsive breakpoints SHALL support mobile-first design
Les breakpoints MUST etre : mobile (< 768px), tablet (768px-1024px), desktop (> 1024px). Le design MUST etre mobile-first (styles de base = mobile, media queries pour tablette et desktop).

#### Scenario: Affichage grille mobile
- **WHEN** la page est affichee sur un ecran < 768px
- **THEN** les grilles de cards s'affichent en 1 colonne

#### Scenario: Affichage grille desktop
- **WHEN** la page est affichee sur un ecran > 1024px
- **THEN** les grilles de cards s'affichent en 3-4 colonnes

### Requirement: Interface SHALL be light mode only
L'interface MUST utiliser uniquement le mode clair pour le MVP. Aucun toggle dark mode ne MUST etre present.

#### Scenario: Mode clair uniquement
- **WHEN** le systeme d'exploitation de l'utilisateur est en mode sombre
- **THEN** l'interface KAZA reste en mode clair
