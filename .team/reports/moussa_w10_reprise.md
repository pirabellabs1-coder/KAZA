# Vague 10 — Reprise post rate-limit — Moussa Keïta

## Livrables

1. **`src/actions/newsletter.ts`** — Server Action `subscribeNewsletter` validée Zod
   (email + consent + source). Envoie un email de bienvenue au nouvel abonné via
   Resend (template HTML brandé navy/vert KAZA + lien désinscription) puis notifie
   `NOTIFICATIONS_CONTACT_EMAIL` (best-effort). Retourne `{ success, message?, error? }`.

2. **`src/components/marketing/newsletter-form.tsx`** — Composant client réutilisable.
   - Props : `{ variant?: 'inline'|'block'; source?: string; className?: string }`
   - `inline` : input email + bouton "S'abonner" côte à côte (footer, CTA compacts)
   - `block` : carte verticale avec label, checkbox RGPD (lien `/legal/confidentialite`),
     bouton large
   - Validation Zod côté client, toast.success "Inscription confirmée. Vous recevrez
     nos meilleures annonces.", anti-doublon via `localStorage kaza-newsletter-{email}`
   - États : `submitting` (spinner), `done` (label "Inscrit ✓"), erreurs en aria-alert

3. **`src/app/(main)/neighborhoods/compare/page.tsx`** — Page client comparateur.
   - Hero "Comparateur de quartiers" + sous-titre + compteur slots
   - Sélecteur Select groupé par ville (NEIGHBORHOODS de `@/lib/demo-neighborhoods`),
     persistance `localStorage kaza-neighborhoods-compare`, max 3 quartiers
   - Cartes colonnes : photo Next/Image, badge ville, prix `/m²`, population,
     bouton "Voir les annonces" → `/search?location={city}`, bouton "Retirer"
   - Tableau comparatif découpé en 5 sections : Marché & démographie, 7 scores
     en barres horizontales colorées (vert ≥7 / orange 5-7 / rouge <5),
     Points forts (badges verts), Points faibles (badges orange), Équipements
     (4 stats : écoles, hôpitaux, marchés, restos)
   - EmptyState avec sélecteur d'amorçage ; skeleton durant hydratation

## Vérifications

- `npx tsc --noEmit` : 0 erreur sur les 3 nouveaux fichiers (la seule erreur
  résiduelle du projet est dans `src/lib/auth/demo-session.ts:46`, sans rapport)
- Réutilise `formatPrice`, `cn`, `toast` (helper sonner), composants shadcn
  existants (Button, Badge, Input, Label, Select)
- Zod v4 OK (`z.literal(true, { message })`)
- Mobile-first : grilles 1 → 2 → 3 colonnes (sm/lg breakpoints)
- A11y : `aria-label`, `role="progressbar"` sur barres scores, `role="alert"` erreurs

## Non livré (priorisé selon consigne)

- Export PDF + 4 biens max sur `/properties/compare` : non touché (le périmètre
  obligatoire des 3 fichiers a été privilégié comme demandé).
