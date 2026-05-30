import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  contractReadyTemplate,
  paymentReceivedTemplate,
  verificationApprovedTemplate,
  verificationRejectedTemplate,
  visitRequestTemplate,
  welcomeTemplate,
} from "@/lib/notifications/templates";

// =============================================================================
// KAZA — Queries Email Templates (server-side)
// Lecture de la table `public.email_templates` (RLS : ADMIN only).
//   - `listEmailTemplates` : back-office admin /admin/email-templates
//
// Fallback : si la table est vide, on retourne les 6 modèles transactionnels
// réels définis dans `src/lib/notifications/templates.ts` (rendus avec des
// valeurs d'exemple). Ces modèles de secours servent de base d'édition :
// l'admin peut les enregistrer en base pour les surcharger.
//
// Les types Supabase auto-générés ne connaissent pas encore la table
// `email_templates` (migration 00030) : bypass via `as any`, sécurité RLS.
// =============================================================================

export interface EmailTemplateEntry {
  key: string;
  name: string;
  subject: string;
  bodyHtml: string;
  updatedAt: string | null;
  /** true si le modèle vient du code (catalogue), false s'il est persisté en DB. */
  isFallback: boolean;
}

interface EmailTemplateRow {
  key: string;
  name: string;
  subject: string;
  body_html: string;
  updated_at: string;
}

// Modèles de secours construits à partir des fonctions de templates réelles,
// rendus avec des valeurs d'exemple représentatives.
const FALLBACK_TEMPLATES: Omit<
  EmailTemplateEntry,
  "updatedAt" | "isFallback"
>[] = [
  (() => {
    const t = welcomeTemplate({ firstName: "Aïcha" });
    return {
      key: "welcome",
      name: "Bienvenue",
      subject: t.subject,
      bodyHtml: t.html,
    };
  })(),
  (() => {
    const t = visitRequestTemplate({
      propertyTitle: "Villa 3 chambres — Cocody",
      requesterName: "Kofi Mensah",
      date: "12 juin 2026 à 15h00",
    });
    return {
      key: "visit_request",
      name: "Demande de visite",
      subject: t.subject,
      bodyHtml: t.html,
    };
  })(),
  (() => {
    const t = paymentReceivedTemplate({
      amount: 250000,
      propertyTitle: "Villa 3 chambres — Cocody",
    });
    return {
      key: "payment_received",
      name: "Paiement reçu",
      subject: t.subject,
      bodyHtml: t.html,
    };
  })(),
  (() => {
    const t = contractReadyTemplate({
      propertyTitle: "Villa 3 chambres — Cocody",
      contractUrl: "https://kaza.africa/contrats/exemple",
    });
    return {
      key: "contract_ready",
      name: "Contrat prêt",
      subject: t.subject,
      bodyHtml: t.html,
    };
  })(),
  (() => {
    const t = verificationApprovedTemplate({ firstName: "Aïcha" });
    return {
      key: "identity_approved",
      name: "Identité approuvée",
      subject: t.subject,
      bodyHtml: t.html,
    };
  })(),
  (() => {
    const t = verificationRejectedTemplate({
      firstName: "Aïcha",
      reason: "La photo de la pièce d'identité est floue.",
    });
    return {
      key: "identity_rejected",
      name: "Identité rejetée",
      subject: t.subject,
      bodyHtml: t.html,
    };
  })(),
];

function mapRow(row: EmailTemplateRow): EmailTemplateEntry {
  return {
    key: row.key,
    name: row.name,
    subject: row.subject,
    bodyHtml: row.body_html,
    updatedAt: row.updated_at,
    isFallback: false,
  };
}

/**
 * Liste les templates d'email.
 *
 * Stratégie de fusion : on part du catalogue de secours (6 modèles réels du
 * code) puis on surcharge chaque entrée par sa version persistée en base si
 * elle existe. Les templates personnalisés en base mais absents du catalogue
 * sont ajoutés à la suite. Résultat trié par nom.
 */
export async function listEmailTemplates(): Promise<EmailTemplateEntry[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("email_templates")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    console.warn("[email-templates] listEmailTemplates:", error.message);
  }

  const dbRows = ((data ?? []) as EmailTemplateRow[]).map(mapRow);
  const dbByKey = new Map(dbRows.map((r) => [r.key, r]));

  const merged: EmailTemplateEntry[] = FALLBACK_TEMPLATES.map((fallback) => {
    const override = dbByKey.get(fallback.key);
    if (override) {
      dbByKey.delete(fallback.key);
      return { ...override, name: override.name || fallback.name };
    }
    return { ...fallback, updatedAt: null, isFallback: true };
  });

  // Templates persistés qui ne font pas partie du catalogue de base.
  for (const remaining of dbByKey.values()) {
    merged.push(remaining);
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
