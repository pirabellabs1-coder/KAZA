// =============================================================================
// Kaabo — Constantes partenaires (module non-"use server", importable partout)
// Séparé de src/actions/partners.ts car un fichier "use server" ne peut
// exporter que des fonctions async.
// =============================================================================

export const PARTNER_TYPES = [
  "NOTARY",
  "BROKER",
  "INSURANCE",
  "MOVING",
  "CLEANING",
  "DECORATION",
  "TECHNICAL_AUDIT",
  "LEGAL",
  "PROPERTY_MGMT",
  "OTHER",
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  NOTARY: "Notaire",
  BROKER: "Courtier / Agent immobilier",
  INSURANCE: "Assurance",
  MOVING: "Déménagement",
  CLEANING: "Nettoyage / Ménage",
  DECORATION: "Décoration & Aménagement",
  TECHNICAL_AUDIT: "Audit technique / Diagnostic",
  LEGAL: "Juridique",
  PROPERTY_MGMT: "Gestion locative",
  OTHER: "Autre",
};
