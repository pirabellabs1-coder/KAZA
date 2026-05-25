## ADDED Requirements

### Requirement: Login page SHALL authenticate users
La page de connexion MUST afficher un formulaire avec email et mot de passe, un bouton "Se connecter", un lien "Mot de passe oublie ?", et un lien "Creer un compte". Le formulaire MUST etre valide par Zod (email valide, mot de passe non vide). Apres connexion reussie, l'utilisateur MUST etre redirige vers son dashboard selon son role.

#### Scenario: Connexion reussie
- **WHEN** l'utilisateur saisit un email et mot de passe valides et clique "Se connecter"
- **THEN** il est redirige vers `/dashboard` (qui redirige vers `/owner/properties`, `/tenant/saved`, ou `/student/colocations` selon son role)

#### Scenario: Erreur de connexion
- **WHEN** l'utilisateur saisit des identifiants invalides
- **THEN** un message d'erreur "Email ou mot de passe incorrect" s'affiche sans recharger la page

#### Scenario: Validation formulaire
- **WHEN** l'utilisateur soumet le formulaire avec un email invalide
- **THEN** un message d'erreur de validation s'affiche sous le champ email

### Requirement: Signup page SHALL register new users
La page d'inscription MUST afficher un formulaire avec : prenom, nom, email, telephone, mot de passe, confirmation mot de passe, et selection du role (Proprietaire / Locataire / Etudiant). Le formulaire MUST etre valide par Zod (email valide, telephone format international, mot de passe min 8 caracteres, confirmation identique). Apres inscription, l'utilisateur MUST recevoir un email de confirmation.

#### Scenario: Inscription reussie
- **WHEN** l'utilisateur remplit tous les champs correctement et clique "Creer mon compte"
- **THEN** le compte est cree, un email de confirmation est envoye, et un message "Verifiez votre email" s'affiche

#### Scenario: Email deja utilise
- **WHEN** l'utilisateur tente de s'inscrire avec un email existant
- **THEN** un message d'erreur "Cet email est deja utilise" s'affiche

#### Scenario: Validation mot de passe
- **WHEN** l'utilisateur saisit un mot de passe de moins de 8 caracteres
- **THEN** un message d'erreur "Le mot de passe doit contenir au moins 8 caracteres" s'affiche

#### Scenario: Selection du role
- **WHEN** l'utilisateur selectionne son role lors de l'inscription
- **THEN** le role est enregistre dans la table `users` et determine l'experience dashboard

### Requirement: Forgot password page SHALL allow password reset
La page "Mot de passe oublie" MUST afficher un champ email et un bouton "Envoyer le lien de reinitialisation". Apres soumission, un email de reinitialisation MUST etre envoye via Supabase Auth.

#### Scenario: Demande de reinitialisation
- **WHEN** l'utilisateur saisit son email et clique "Envoyer"
- **THEN** un message "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye" s'affiche (meme si l'email n'existe pas, pour des raisons de securite)

### Requirement: Auth pages SHALL have minimal centered layout
Les pages d'authentification MUST utiliser un layout centre avec le logo KAZA en haut, le formulaire au centre, et aucun Navbar/Footer (layout minimal distinct des pages publiques).

#### Scenario: Layout auth
- **WHEN** l'utilisateur accede a `/login`, `/signup`, ou `/forgot-password`
- **THEN** le formulaire est centre verticalement et horizontalement avec le logo KAZA au-dessus
