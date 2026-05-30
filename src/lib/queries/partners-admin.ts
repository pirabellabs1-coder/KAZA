import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { PartnerType } from "@/lib/partners/constants";

// =============================================================================
// KAZA — Queries Partenaires (back-office admin, server-side)
// Lecture de `partner_applications` pour la page /admin/partners.
// RLS : SELECT réservé aux ADMIN (l'INSERT public est géré par la server action
// `submitPartnerApplication`). Ne throw jamais : retourne [] en cas d'erreur.
// =============================================================================

export type PartnerApplicationStatus =
  | "PENDING"
  | "REVIEWING"
  | "APPROVED"
  | "REJECTED";

export interface PartnerApplicationSummary {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  partnerType: PartnerType;
  city: string;
  countryCode: string;
  status: PartnerApplicationStatus;
  createdAt: string;
}

interface PartnerApplicationRow {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  partner_type: PartnerType;
  city: string;
  country_code: string;
  status: PartnerApplicationStatus;
  created_at: string;
}

function mapRow(row: PartnerApplicationRow): PartnerApplicationSummary {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    partnerType: row.partner_type,
    city: row.city,
    countryCode: row.country_code,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Liste les candidatures partenaires, de la plus récente à la plus ancienne.
 * Le passage des policies RLS garantit que seuls les ADMIN voient la liste.
 * Renvoie un tableau vide en cas d'erreur ou d'absence de données.
 */
export async function listPartnerApplications(): Promise<
  PartnerApplicationSummary[]
> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("partner_applications")
    .select(
      "id, company_name, contact_name, email, phone, partner_type, city, country_code, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[partners-admin] listPartnerApplications:", error.message);
    return [];
  }

  return ((data ?? []) as PartnerApplicationRow[]).map(mapRow);
}
