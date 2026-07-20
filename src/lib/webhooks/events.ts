// =============================================================================
// Kaabo — Catalogue des événements webhook (module partagé, non-serveur)
// =============================================================================

export const WEBHOOK_EVENTS = [
  "property.created",
  "property.updated",
  "property.rented",
] as const;

export type WebhookEventName = (typeof WEBHOOK_EVENTS)[number];
