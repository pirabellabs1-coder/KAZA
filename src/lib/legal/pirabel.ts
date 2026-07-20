// =============================================================================
// Kaabo — Identité légale de l'émetteur (PIRABEL) pour les documents officiels
// -----------------------------------------------------------------------------
// Kaabo est exploitée par l'établissement PIRABEL. Ces informations figurent
// sur toutes les factures/reçus émis par la plateforme (mentions légales
// obligatoires OHADA/Bénin). Source : annonce légale RCCM Abomey.
// =============================================================================

export const PIRABEL = {
  brand: "Kaabo",
  legalName: "PIRABEL",
  manager: "Gildas Lissanon",
  rccm: "RB/ABY/26 A 39852",
  /** IFU (numéro fiscal) — à renseigner dès obtention. */
  ifu: "",
  address: "Bohicon, Zou — République du Bénin",
  email: "immobilierkaza@gmail.com",
  /** Taux de TVA applicable au Bénin (%). */
  vatRate: 18,
} as const;
