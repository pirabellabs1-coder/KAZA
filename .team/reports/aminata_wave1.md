# Rapport Wave 1 — Aminata Traoré (Backend)

Date : 2026-05-25
Branche : `main`
Scope : Server Actions + Query Helpers (Supabase)

---

## 1. Fichiers créés (10)

### Server Actions (`'use server'`)
| Fichier | Rôle |
|---|---|
| `src/actions/properties.ts` | CRUD propriétaire + publish/unpublish |
| `src/actions/visits.ts` | Demande, accept, reject, cancel — notifs auto |
| `src/actions/messages.ts` | sendMessage / markConversationRead / startConversation |
| `src/actions/favorites.ts` | toggleFavorite + getFavorites |
| `src/actions/reviews.ts` | createReview (1/rental/auteur) + deleteReview |
| `src/actions/notifications.ts` | mark read / mark all / delete + helper `createNotification` |

### Query Helpers (Server Components, **pas** `'use server'`)
| Fichier | Rôle |
|---|---|
| `src/lib/supabase/queries/properties.ts` | searchProperties, getPropertyById, getFeaturedProperties, getPropertiesByOwner |
| `src/lib/supabase/queries/users.ts` | getUserById, getCurrentUser, getOwnerStats, getFullUserById |
| `src/lib/supabase/queries/messages.ts` | getConversations, getConversationMessages, getUnreadCount |
| `src/lib/supabase/queries/index.ts` | Ré-exports |

Aucun fichier existant n'a été modifié.

---

## 2. Fonctions exposées

### `src/actions/properties.ts`
- `createProperty(formData: CreatePropertyFormData)`
- `updateProperty(id, formData: Partial<UpdatePropertyFormData>)`
- `deleteProperty(id)`
- `publishProperty(id)` → status `AVAILABLE`
- `unpublishProperty(id)` → status `UNAVAILABLE`

### `src/actions/visits.ts`
- `requestVisit({propertyId, requestedDate, requestedTime?, message?})`
- `acceptVisit(id)` → status `CONFIRMED` + notif locataire
- `rejectVisit(id)` → status `CANCELLED` + notif locataire
- `cancelVisit(id)` → annulable par les deux parties

### `src/actions/messages.ts`
- `sendMessage({conversationId, content, propertyId?})`
- `markConversationRead(conversationId)`
- `startConversation({recipientId, propertyId?, content})`

### `src/actions/favorites.ts`
- `toggleFavorite(propertyId)` → `{favorited: boolean}`
- `getFavorites()`

### `src/actions/reviews.ts`
- `createReview({targetUserId, rentalId, rating, comment?})` — refuse self, doublons et participations externes
- `deleteReview(id)` — auteur uniquement

### `src/actions/notifications.ts`
- `createNotification(supabase, {userId, type, title, body?, link?})` — helper réutilisable (best-effort si table absente)
- `markNotificationRead(id)`
- `markAllNotificationsRead()`
- `deleteNotification(id)`

Convention de retour unique pour toutes les Server Actions :

```ts
type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

Les query helpers retournent directement la donnée ou **throw** sur erreur — convention dédiée à l'usage en Server Components avec `error.tsx`.

---

## 3. Types Supabase manquants / incohérences détectées

### 3.1 `Database` (src/types/supabase.ts) — bloquant
La définition `Database` actuelle ne déclare pas `Relationships: []` sur chaque table. Avec `@supabase/postgrest-js@2.99` (livré avec `@supabase/supabase-js@^2.99.2`), cela fait collapser `Tables<T>['Insert']` et `['Update']` vers `never`, rendant **toute mutation typée impossible**.

**Mitigation appliquée** : helper local `getLooseClient()` dans chaque fichier qui cast en `SupabaseClient` (sans generic). Les lectures sont retypées via `as unknown as PropertyWithPhotos[]` etc.

**Action requise (Yaw)** : régénérer les types via
```
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
```
puis supprimer les helpers `getLooseClient` et les casts.

### 3.2 `PropertyStatus` (src/types/properties.ts) trop étroit
- Fichier types/ : `"AVAILABLE" | "RENTED" | "ARCHIVED"`
- DB : `DRAFT | PENDING_REVIEW | AVAILABLE | RENTED | UNAVAILABLE | ARCHIVED`

J'utilise `DRAFT` à la création et `UNAVAILABLE` au unpublish — incompatible avec le type courant. **Hypothèse** : la DB fait foi, le type sera élargi.

### 3.3 `PropertyType` (src/types/properties.ts) trop étroit
- Fichier types/ : `"APARTMENT" | "HOUSE" | "ROOM" | "STUDIO"`
- DB : ajoute `VILLA | SHARED_ROOM | COMMERCIAL | LAND`

Le Zod (`createPropertySchema.propertyType`) ne valide que les 4 du type étroit — cohérent pour le MVP, mais `searchProperties({type})` accepte une string libre pour anticiper.

### 3.4 `RentalStatus` (src/types/properties.ts) divergent
- Fichier types/ : `"PENDING" | "ACTIVE" | "ENDED" | "CANCELLED"`
- DB : `PENDING | ACTIVE | COMPLETED | CANCELLED | TERMINATED`
- Validator payments : `COMPLETED` (cf. `getOwnerStats` filtre `status = COMPLETED`)

### 3.5 `VisitRequestStatus` (src/types/properties.ts) divergent
- Fichier types/ : `"PENDING" | "CONFIRMED" | "REJECTED" | "COMPLETED"`
- DB : `PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW`

`rejectVisit` n'a **pas** d'état `REJECTED` côté DB → je passe en `CANCELLED` (la notif `VISIT_REJECTED` reste sémantique côté UI).

### 3.6 `VerificationStatus` (src/types/users.ts) incomplet
- Fichier types/ : `"PENDING" | "APPROVED" | "REJECTED"`
- DB : ajoute `UNVERIFIED` (statut par défaut)

### 3.7 Table `notifications` absente du schéma SQL
Aucune migration ne crée la table `notifications`. Le helper `createNotification` insère dans une table inexistante et logue un warning sans casser le flux appelant (visites, messages, reviews créent toutes des notifs en cascade).

**Action requise** : migration `00004_notifications.sql` avec colonnes `user_id, type, title, body, link, is_read, created_at` + RLS (user voit ses notifs uniquement).

### 3.8 Contrainte unique manquante sur `ratings`
La règle "1 review par auteur/location" n'est imposée qu'**applicativement** (vérif `maybeSingle` avant insert). Une `UNIQUE (rater_id, rental_id)` sur `ratings` éviterait la condition de course.

### 3.9 `Rating.created_at` vs `updated_at`
La table `ratings` SQL n'a pas de trigger `updated_at` — cohérent avec un avis immuable, mais à confirmer côté produit (édition d'avis ?).

---

## 4. Hypothèses prises

1. **Géoloc** : conversion `lat/lng` → WKT `SRID=4326;POINT(lng lat)` pour la colonne `location geography(Point, 4326)`. Lecture brute via `select '*'` (le PostGIS `location` est renvoyé en tant que `unknown` côté types).
2. **Routes revalidées** : `/owner/properties`, `/owner/visits`, `/tenant/visits`, `/tenant/favorites`, `/messages`, `/messages/[id]`, `/properties`, `/properties/[id]`, `/profile/[id]`, `/dashboard`. À aligner avec le routing final.
3. **`conversationId`** côté `sendMessage` = ID de l'autre utilisateur (pas une row de table — la table `conversations` n'existe pas). Filtrage par `property_id` optionnel pour le contexte.
4. **`requested_time`** : si non fourni par le locataire, défaut à `"10:00"` (la colonne `requested_time TIME NOT NULL` n'a pas de DEFAULT côté DB).
5. **Auth** : récupération uniforme via `supabase.auth.getUser()` (jamais `getSession()` qui n'est pas sécurisée).
6. **Messages d'erreur** : tous en français, sans accent (`etre` au lieu de `être`) pour rester cohérent avec le style existant dans `auth.ts` et CLAUDE.md.
7. **RLS** : on délègue intégralement l'autorisation à RLS côté DB (`createClient()` SSR), avec en complément une vérif d'ownership applicative pour produire des messages d'erreur lisibles.

---

## 5. Vérification

```
node node_modules/typescript/bin/tsc --noEmit
```

Seules erreurs résiduelles sur mes fichiers : `TS7016 Cannot find module 'next/cache'` — **pré-existante** au niveau projet (même symptôme sur `src/actions/auth.ts` livré par Yaw, lié à `node_modules/next/cache.js` sans `.d.ts`). Aucune erreur métier ni d'inférence sur mes 10 fichiers.

---

## 6. À planifier (handoff)

- [ ] **Yaw** : régénérer `src/types/supabase.ts` via Supabase CLI (corrige §3.1).
- [ ] **Yaw** : élargir `PropertyStatus`, `PropertyType`, `RentalStatus`, `VisitRequestStatus`, `VerificationStatus` dans `src/types/`.
- [ ] **Migration** `00004_notifications.sql` (§3.7) + RLS.
- [ ] **Migration** `UNIQUE (rater_id, rental_id)` sur `ratings` (§3.8).
- [ ] Réinstaller `node_modules` (npm ci) pour résoudre les types `next/cache` & `next/navigation`.
- [ ] **Wave 2** côté front : brancher les Server Actions sur les écrans owner/tenant/student.
