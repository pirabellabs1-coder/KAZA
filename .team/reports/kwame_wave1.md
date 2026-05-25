# Kwame Asante - Wave 1 - Payments Integration

## Fichiers crees

- `src/lib/payments/types.ts` - Types partages (PaymentProvider, PaymentMethod, PaymentStatus, CreatePaymentInput, PaymentResult, WebhookEvent) + erreurs typees (`PaymentProviderError`, `WebhookSignatureError`).
- `src/lib/payments/fedapay.ts` - Client FedaPay (sandbox/live via `FEDAPAY_ENV`). Flow 2-etapes (transaction + token). HMAC SHA-256 timing-safe.
- `src/lib/payments/kkiapay.ts` - Client Kkiapay (meme interface). Headers `x-api-key` / `x-private-key` / `x-secret-key`.
- `src/lib/payments/index.ts` - Facade `createPayment(input, {provider, fallback})` avec fallback auto FedaPay -> Kkiapay. Helpers `getPaymentProvider`, `verifyWebhook`, `parseWebhook`.
- `src/lib/escrow.ts` - `holdInEscrow`, `releaseFromEscrow`, `refundFromEscrow`, `computeReleaseDate(date, days=7)`. Source de verite: table `escrow_payments` (status: HELD/RELEASED/REFUNDED).
- `src/actions/payments.ts` - Server actions: `initiateRentPayment`, `getPaymentHistory`, `requestRefund`. Verifie auth + ownership tenant.
- `src/app/api/webhooks/fedapay/route.ts` + `src/app/api/webhooks/kkiapay/route.ts` - Route handlers Node runtime, `import 'server-only'`, signature -> 401, idempotence sur statuts finaux, declenchent `holdInEscrow` sur `transaction.approved`.
- `.env.example` - Bloc `# === Paiements ===` appende a la fin (variables exactes du spec).

## Contrats publics

```ts
createPayment(input: CreatePaymentInput, opts?: { provider?, fallback? }): Promise<PaymentResult>
verifyWebhook(provider, rawBody, signature): boolean
parseWebhook(provider, body): WebhookEvent
holdInEscrow(paymentId, releaseDate): Promise<EscrowResult>
initiateRentPayment({rentalId, provider?}): Promise<{success, paymentId?, checkoutUrl?, error?}>
```

## Securite

- Toutes les cles (SECRET_KEY, WEBHOOK_SECRET, PRIVATE_KEY) lues cote serveur uniquement via `process.env`, jamais exposees.
- `import "server-only"` sur tous les modules paiements + escrow + routes webhook.
- Signature HMAC SHA-256 verifiee avant tout traitement, comparaison `timingSafeEqual` (resistant aux attaques par timing).
- Idempotence: paiements en statut final (COMPLETED/FAILED/REFUNDED) skippes silencieusement, retour 200.
- Admin client (`service_role`) utilise uniquement dans webhooks + insert post-checkout (necessaire car le webhook n'a pas de session user).
- Ownership verifie dans `initiateRentPayment` (rental.tenant_id === user.id) et `requestRefund` (payment.user_id === user.id).

## Points de vigilance

1. **Endpoints API** : URLs Kkiapay (`api-sandbox.kkiapay.me/api/v1`) a confirmer avec la doc officielle - structure de reponse `{transactionId, paymentUrl}` deduite, ajuster si necessaire.
2. **Format signature FedaPay** : parse `t=...,s=<hex>` ET hex brut pour compatibilite.
3. **Payouts non implementes** : `releaseFromEscrow`/`refundFromEscrow` mettent a jour la BDD mais le transfert reel vers le proprietaire n'est pas branche (TODO marques dans le code).
4. **Erreurs TypeScript pre-existantes** : les overloads Supabase resolvent en `never` dans tout le projet (visible aussi sur `favorites.ts`, `messages.ts`, etc.) - probleme de generation de types Database, pas specifique a mon code.
5. **.env.example dupliques** : variables FedaPay/Kkiapay deja partiellement presentes dans le fichier - bloc Paiements appende pour respecter le spec, dedoublonnage a faire par un autre agent.
