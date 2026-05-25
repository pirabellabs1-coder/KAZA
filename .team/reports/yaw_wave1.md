# Wave 1 — Yaw Boateng (Tech Lead Frontend)

## Mission
Transformer le formulaire mono-page de creation d'annonce proprietaire en
**wizard 4 etapes** avec stepper, validation Zod par etape et persistance
brouillon en localStorage.

## Fichiers crees / modifies

### Crees
- `src/hooks/use-property-draft.ts` — hook React de persistance du brouillon
  (save debounce 250ms, load, clear, restoration flag). Exclut `photos`
  (non serialisable). Cle localStorage : `kaza:property-draft`.
- `src/app/(dashboard)/owner/properties/new/stepper.tsx` — indicateur visuel
  sticky 4 etapes. Bleu KAZA (#1976D2) pour active, coche verte pour
  completee, gris pour future. Vue mobile compacte avec barre de progression.
- `src/app/(dashboard)/owner/properties/new/steps/step-1-general.tsx` —
  titre, description, type (HOUSE/APARTMENT/STUDIO/ROOM/VILLA/OFFICE),
  chambres, sdb, superficie. Schema Zod exporte (`step1Schema`).
- `src/app/(dashboard)/owner/properties/new/steps/step-2-location.tsx` —
  adresse, ville (select), quartier, pays. Bloc info sur la moderation
  carto. Schema `step2Schema`.
- `src/app/(dashboard)/owner/properties/new/steps/step-3-amenities-photos.tsx`
  — checkbox grid 16 amenites + integration `ImageUpload` (min 3, max 10).
  Schema `step3Schema`.
- `src/app/(dashboard)/owner/properties/new/steps/step-4-pricing-availability.tsx`
  — prix FCFA (min 5000), periode, caution (mois), date dispo, duree min.
  + Card recap final avant publication. Schema `step4Schema`.

### Modifies
- `src/app/(dashboard)/owner/properties/new/new-property-form.tsx` —
  reecrit en container wizard avec `FormProvider` (react-hook-form),
  validation par etape via `form.trigger(fields)`, navigation Precedent/
  Suivant/Publier, restauration brouillon, toast inline, bouton
  "Effacer brouillon".
- `src/app/(dashboard)/owner/properties/new/page.tsx` — ajustement
  `max-w-[720px]` conforme au brief (au lieu de `max-w-3xl`).

## Decisions UX non couvertes par le brief

1. **Toast** : aucune lib de toast (`sonner`, `react-hot-toast`) n'est
   installee dans le projet, et aucun composant shadcn `toast`/`sonner`
   n'existe. J'ai implemente un toast inline minimal (composant
   `ToastBanner` interne, position fixed top, auto-dismiss 3.5s, 3 variants
   info/success/error). A remplacer plus tard par `sonner` si une lib est
   ajoutee a la stack.

2. **Composant Checkbox** : pas de `Checkbox` shadcn dans le projet. Pour
   les amenites j'ai utilise des `button` natifs avec `role="checkbox"` +
   `aria-checked` et icone Check visuelle — accessible et coherent avec
   l'approche existante du form mono-page.

3. **Schemas Zod** : le brief decrit des enums (VILLA, OFFICE, price_period,
   etc.) absents de `src/validators/property.ts`. Ce fichier etant hors
   perimetre, j'ai defini les schemas par etape directement dans chaque
   step (`stepXSchema`), fusionnes en un `propertyWizardSchema` global.
   A reconcilier avec Aminata quand le schema serveur sera finalise.

4. **Server action manquante** : `src/actions/properties.ts` existe mais
   son API ne correspond pas au schema wizard etendu. J'ai laisse un
   commentaire `// TODO Aminata: hook server action` + `console.log(values)`
   placeholder pour ne pas bloquer le build, comme demande dans le brief.

5. **Restauration brouillon** : la restauration est silencieuse pour les
   `photos` (les `File` ne survivent pas a un reload). Aucun message
   d'avertissement specifique — le compteur "0 / 10 photos" rend la chose
   evidente. A discuter si la DG veut une notice explicite.

6. **Reset apres publication** : reset complet du form + retour a l'etape
   1 + clear localStorage. Pas de redirection vers la liste des proprietes
   (depend de la server action d'Aminata).

7. **Persistance debouncee** : ecriture localStorage debouncee a 250ms
   pour eviter de saturer le storage pendant la frappe. Decision implicite,
   non couverte par le brief.

8. **Navigation Stepper** : retour en arriere autorise sur toute etape
   deja atteinte (`maxReachedStep`). Saut en avant interdit (cliquer sur
   une etape future est disable). Conforme au brief.

## Tests effectues
- `tsc --noEmit` : zero erreur dans mes fichiers (les erreurs restantes
  sur `next/link`, `next/navigation` etc. sont pre-existantes et touchent
  l'ensemble du projet — probleme de resolution de types `next/*` non lie
  a cette wave).
- Validation `zod.merge()` confirmee fonctionnelle en zod v4.

## A faire (autres equipiers)
- **Aminata** : creer la server action `createProperty` dans
  `src/actions/properties.ts` et exposer l'export — je decommente alors
  l'import en haut de `new-property-form.tsx` et remplace le placeholder
  par `await createProperty(values)`.
- **QA** : tester avec playwright-skill (responsive mobile/tablette/desktop,
  navigation entre etapes, restauration brouillon apres reload, validation
  bloquante par etape).
