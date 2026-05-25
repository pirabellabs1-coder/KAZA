# KAZA — Checklist de déploiement production

> Procédure validée pour passer du dev local à une bêta fermée sur Vercel + Supabase Cloud.

## 0. Pré-requis

- [ ] Compte Vercel (équipe ou personnel) avec accès au repo Git
- [ ] Compte Supabase Cloud (région recommandée : `eu-west-3` ou `eu-central-1`)
- [ ] Comptes prestataires : FedaPay (sandbox + live), Kkiapay, Twilio, Resend, Firebase project
- [ ] Domaine `kaza.africa` (ou équivalent) avec DNS gérable
- [ ] Certificat SSL (géré automatiquement par Vercel)

## 1. Supabase Cloud — Provisionning

- [ ] Créer le projet Supabase
- [ ] Noter `Project URL` et les 3 clés API (`anon`, `service_role`, `jwt_secret`)
- [ ] Activer les extensions : `postgis`, `pg_trgm`, `pgcrypto`
- [ ] Appliquer les migrations dans l'ordre via `npx supabase db push` ou manuellement :
  ```
  00001_initial_schema.sql
  00002_rls_policies.sql
  00003_indexes.sql
  00004_notifications.sql
  00005_verifications.sql
  00006_contracts.sql
  00007_push_tokens.sql
  00008_realtime_publications.sql
  00009_storage_buckets.sql
  ```
- [ ] Vérifier que les buckets `identity-documents`, `contracts`, `property-photos` apparaissent dans Storage
- [ ] Vérifier que Realtime montre `messages`, `notifications`, `visit_requests`, `identity_verifications`, `contracts` dans la publication `supabase_realtime`
- [ ] Régénérer `src/types/supabase.ts` localement et committer

## 2. Variables d'environnement Vercel

Ajouter pour environnements `Production`, `Preview`, `Development`.

### Public (exposé client)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL=https://kaza.africa`

### Serveur uniquement
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_JWT_SECRET`

### Paiements
- [ ] `FEDAPAY_PUBLIC_KEY`
- [ ] `FEDAPAY_SECRET_KEY`
- [ ] `FEDAPAY_WEBHOOK_SECRET`
- [ ] `FEDAPAY_ENV` = `live` en prod
- [ ] `KKIAPAY_PUBLIC_KEY`
- [ ] `KKIAPAY_PRIVATE_KEY`
- [ ] `KKIAPAY_SECRET`
- [ ] `KKIAPAY_WEBHOOK_SECRET`
- [ ] `KKIAPAY_ENV` = `live` en prod
- [ ] `ESCROW_DEFAULT_HOLD_DAYS=7`

### Notifications
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_FROM_NUMBER` (numéro alphanumérique ou court)
- [ ] `FCM_SERVER_KEY` (Firebase Cloud Messaging)
- [ ] `RESEND_API_KEY`
- [ ] `NOTIFICATIONS_FROM_EMAIL=noreply@kaza.africa`
- [ ] `NOTIFICATIONS_FROM_NAME=KAZA`

## 3. Webhooks externes à configurer

- [ ] **FedaPay** → `https://kaza.africa/api/webhooks/fedapay`
- [ ] **Kkiapay** → `https://kaza.africa/api/webhooks/kkiapay`
- [ ] **Twilio** : DLR (delivery report) facultatif pour OTP
- [ ] **Resend** : webhook events (delivered, bounced) → optionnel pour wave 5

## 4. Supabase Edge Functions

Déployer les fonctions Deno :

```bash
npx supabase functions deploy generate-contract-pdf
npx supabase functions deploy send-notification
npx supabase functions deploy verify-identity
```

- [ ] Vérifier que chaque fonction est `INVOKER` ou `SERVICE_ROLE` selon le besoin
- [ ] Configurer les secrets de chaque fonction :
  ```bash
  npx supabase secrets set RESEND_API_KEY=... FCM_SERVER_KEY=... NOTIFICATIONS_FROM_EMAIL=...
  ```

## 5. DNS et domaine

- [ ] `A` ou `CNAME` `kaza.africa` → Vercel
- [ ] `CNAME` `www.kaza.africa` → Vercel
- [ ] Vérifier les enregistrements SPF + DKIM + DMARC pour le domaine d'envoi Resend
- [ ] Email `noreply@kaza.africa` vérifié dans Resend
- [ ] Email `contact@kaza.africa` → boîte ou redirection Google Workspace

## 6. Validation avant ouverture publique

### Tests fonctionnels manuels
- [ ] Signup nouveau compte → réception email confirmation
- [ ] Login → cookie session présent
- [ ] Vérification identité : OTP SMS reçu → upload pièce → soumission → page "en attente"
- [ ] Owner : publication d'une annonce 4 étapes → photos uploadées dans bucket → annonce visible dans `/search`
- [ ] Tenant : recherche → favori → demande de visite → owner reçoit notif
- [ ] Tunnel paiement : checkout FedaPay → redirect → success → ligne payments insérée
- [ ] Contrat : génération PDF → signature tenant → signature owner → status SIGNED
- [ ] Messagerie : 2 sessions, message envoyé apparaît en temps réel chez le destinataire
- [ ] Admin : page modération annonce → approuver → annonce visible publiquement

### Tests automatisés (Playwright — à écrire wave 5)
- [ ] Parcours signup + identité (tenant)
- [ ] Parcours publication annonce (owner)
- [ ] Parcours paiement
- [ ] Parcours messagerie Realtime

### Sécurité
- [ ] Rejouer un webhook FedaPay avec mauvaise signature → 401 retourné
- [ ] Tenter d'accéder à `/admin` avec un compte non-admin → redirect `/dashboard`
- [ ] Tenter `/owner/properties` avec compte TENANT → redirect `/dashboard`
- [ ] Tenter de lire un contrat dont on n'est pas partie → 403 ou message refus
- [ ] Vérifier qu'aucune clé secrète n'apparaît dans le bundle client (`grep -r SECRET_KEY .next/`)

### Performance & SEO
- [ ] Lighthouse mobile > 80 sur landing
- [ ] Sitemap `/sitemap.xml` accessible et listant annonces + carrières
- [ ] `robots.txt` cohérent (autoriser tout en bêta privée non, en bêta ouverte oui)
- [ ] Open Graph image sur landing + property detail (tester via opengraph.xyz)
- [ ] PWA installable depuis Chrome desktop + Android (manifest + icons)

### Conformité
- [ ] Pages légales relues par un juriste avant ouverture publique (CGU, mentions, confidentialité, cookies)
- [ ] Bandeau cookies fonctionnel
- [ ] Email DPO actif (`dpo@kaza.africa`)
- [ ] Procédure d'export de données utilisateur testée
- [ ] Procédure de suppression de compte testée

## 7. Observabilité

- [ ] Vercel Analytics activé
- [ ] Supabase logs (Postgres + Auth + Realtime) accessibles à l'équipe
- [ ] Alerte sur erreurs 5xx via Vercel Notifications
- [ ] Plausible Analytics configuré (script ajouté à `src/app/layout.tsx` après consentement cookies)
- [ ] Dashboard d'observabilité paiement (taux conversion, échec webhook) — wave 5

## 8. Plan de rollback

En cas d'incident grave :
1. Vercel — revenir à un déploiement précédent en 1 clic (instant)
2. Supabase — restaurer un point-in-time recovery (rétention 7 jours en plan Pro)
3. Désactiver l'enregistrement de nouveaux utilisateurs via flag DB :
   ```sql
   INSERT INTO public.platform_settings (key, value)
   VALUES ('signup_enabled', 'false')
   ON CONFLICT (key) DO UPDATE SET value = 'false';
   ```
   (table à créer si pas déjà au schéma)
4. Communiquer sur le status page (à mettre en place wave 5)

## 9. Go-live

Une fois toutes les cases cochées :
- [ ] Tag git `v1.0.0-mvp`
- [ ] Annonce interne équipe
- [ ] Onboarding de 10-20 utilisateurs bêta fermée
- [ ] Collecte feedback 2 semaines
- [ ] Décision Go/No-Go pour bêta ouverte
