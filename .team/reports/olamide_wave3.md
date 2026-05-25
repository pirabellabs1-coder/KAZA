# Rapport Wave 3 — Olamide Adesanya (Mobile/UX)

## Fichiers créés / modifiés

- `src/hooks/use-expense-split.ts` — hook `useExpenseSplit(expenses, roommates)` mémoïsé. Calcule la balance nette par coloc (payeur crédité du montant, chaque participant débité de `amount/n`). Settlement greedy : tri débiteurs/créditeurs à chaque tour, match du plus gros débiteur avec le plus gros créditeur jusqu'à solder. Borné par `n*2` itérations, tolérance 1 FCFA après arrondi.
- `src/components/student/expense-card.tsx` — card + modal détails. Mapping catégorie → icône (Zap/Droplet/Wifi/UtensilsCrossed/Home/MoreHorizontal) avec tint coloré. Affiche payeur (avatar + nom), date, badge "Partagé entre N personnes", bouton Détails qui ouvre `<Dialog>` listant les participants avec leur part.
- `src/components/student/split-summary.tsx` — Card de synthèse : 3 stats (total mois, vous devez en rouge, on vous doit en vert) + liste de 3 settlements suggérés, triés pour mettre en avant ceux qui concernent l'utilisateur courant (surlignés en bleu kaza).
- `src/app/(dashboard)/student/expenses/expenses-tracker.tsx` — client component. Header + `<SplitSummary>` + Tabs (Toutes / Mes dépenses / À régler). 12 dépenses mock entre Aïcha, Kofi, Mariam, Tomé. Bouton "Ajouter" → `<Link href="/student/expenses/new">`.
- `src/app/(dashboard)/student/expenses/page.tsx` — RSC simplifiée qui rend `<ExpensesTracker />` (TODO Supabase laissé en commentaire).
- `src/app/(dashboard)/student/expenses/new/page.tsx` — formulaire client (controlled, validation locale) : titre, catégorie (Select), montant (number > 0), date (default today), payé par (Select), partagé entre (checkboxes natifs, multi). Affiche en live la part calculée. Submit → `window.alert("Dépense enregistrée")` + `router.push("/student/expenses")`. Annuler → retour via Link.
- `src/components/property/virtual-tour.tsx` — Tabs "Photos / Vidéo / Visite 360°" (uniquement les onglets dispo selon props). Vidéo : iframe responsive 16/9, URLs YouTube/Vimeo converties auto en embed via `toEmbedUrl`. Embed Matterport : iframe directe. Sinon fallback panorama : drag pointeur → `translateX` (max ±80px, facteur 0.5) avec `scale(1.15)` pour éviter les bords. Bouton Maximize → lightbox noir plein écran (Esc pour fermer), navigation chevrons en mode photo.

## Notes

- Aucune nouvelle dépendance. Tout sur shadcn/ui (Card, Tabs, Dialog, Select, Input, Label, Button, Avatar, Badge) + lucide-react.
- TypeScript strict respecté (vérifié via `tsc --noEmit` — seules erreurs : `next/*` non résolus dans le repo, pré-existantes, identiques sur tous les fichiers).
- Le `currentUserId` est hardcodé à `"aicha"` dans le tracker — à remplacer par l'ID Supabase Auth quand le backend sera branché.
- `VirtualTour` n'est pas encore intégré dans la page d'annonce (`src/app/...`) — hors périmètre. À brancher par Awa/Kossi en remplacement ou complément de `PropertyGallery`.
- Les checkboxes du formulaire sont natifs (pas de `<Checkbox>` shadcn dans le repo) — stylés cohérents avec les inputs.

## Tests à faire (UI)

- Responsive : tracker, formulaire et virtual-tour testés à 375 / 768 / 1280 — header se réorganise en column sur sm, grid summary 1/3 col, tabs scrollables au besoin.
- Lightbox virtual-tour : vérifier que Esc ferme bien, et que les chevrons cyclent les photos.
- Settlement greedy : avec les 12 dépenses mock, on obtient ~3 transferts pour 4 colocs.
