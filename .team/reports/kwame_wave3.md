# Kwame Asante - Wave 3 - Notifications (FCM + Resend)

## Fichiers créés

- `supabase/migrations/00007_push_tokens.sql` — Table `user_push_tokens` (user_id, token, platform, device_info JSONB, enabled, timestamps). Contrainte UNIQUE (user_id, token), index partiel sur tokens actifs, RLS « owner-only ».
- `src/lib/notifications/fcm.ts` — `sendPush(token, payload)` + `sendPushBatch(tokens, payload)`. API HTTP legacy FCM. Mode DEV (log + success) si `FCM_SERVER_KEY` absent. Best-effort, jamais de throw.
- `src/lib/notifications/resend.ts` — `sendEmail(to, subject, html)`. From `KAZA <noreply@kaza.africa>` configurable via `NOTIFICATIONS_FROM_EMAIL`/`NOTIFICATIONS_FROM_NAME`. Mode DEV idem.
- `src/lib/notifications/templates.ts` — 6 templates FR : `welcomeTemplate`, `visitRequestTemplate`, `paymentReceivedTemplate`, `contractReadyTemplate`, `verificationApprovedTemplate`, `verificationRejectedTemplate`. Chacun retourne `{subject, html, text}`. Layout commun (header navy `#1A3A52`, CTA `#1976D2`, footer mentions légales + lien désabonnement).
- `src/lib/notifications/dispatch.ts` — `dispatchNotification({userId, type, channels?, data})`. Lookup user + tokens via `createAdminClient`, insert in_app, sendPushBatch, sendEmail. Default channels par type. Mappe `verification_approved/rejected` → enum `identity_approved/rejected`, `welcome` → `system`.
- `supabase/functions/send-notification/index.ts` — Port Deno : même API, lit `Deno.env`, POST FCM + Resend, response JSON `{ok, results}`. Auth header requis, 400 si type inconnu.

## Contrats publics

```ts
dispatchNotification({ userId, type, channels?, data }): Promise<void>  // best-effort
sendPush(token, {title, body, link?, data?}): Promise<{success, error?}>
sendEmail(to, subject, html): Promise<{success, id?, error?}>
```

Edge function : `POST /functions/v1/send-notification` `{userId, type, data, channels?}`.

## Points de vigilance

1. Cast `@ts-expect-error` sur `user_push_tokens` et `notifications.insert` — types Supabase à régénérer après migration 00007.
2. FCM legacy API (`/fcm/send` + `key=`) — migration vers HTTP v1 + OAuth recommandée en V1.
3. Edge function : Resend nécessite domaine `kaza.africa` vérifié, sinon utiliser `onboarding@resend.dev` en dev.
4. `.env.example` contenait déjà `FIREBASE_SERVER_KEY` et `RESEND_API_KEY` — bloc Notifications appendé pour respecter le spec (dédoublonnage à faire par un autre agent).
