import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildContractHtml, type ContractData } from "@/lib/pdf/contract-builder";

// =============================================================================
// Kaabo — Génération in-app du document de bail (remplace l'Edge Function)
// -----------------------------------------------------------------------------
// Génère le HTML du bail à partir des données réelles (rental + bien + parties),
// l'upload dans le bucket privé `contracts`, et enregistre le chemin sur le
// contrat. NE MODIFIE PAS le statut : la transition DRAFT → PENDING_TENANT est
// pilotée uniquement par l'action bailleur `sendContractToTenant` (le bailleur
// complète d'abord les conditions). Idempotent (upsert du fichier).
//
// Lit les VRAIES colonnes : `rentals.monthly_charges` (et non `charges`) et
// `properties.address` (et non address_line/city/country) — ce que l'ancienne
// Edge Function ratait, produisant des baux à charges 0 et adresse vide.
// =============================================================================

interface UserRow {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export async function generateContractDocument(
  contractId: string,
): Promise<{ ok: boolean; path?: string; error?: string }> {
  if (!contractId) return { ok: false, error: "contractId manquant" };
  const admin = createAdminClient() as unknown as SupabaseClient;

  try {
    const { data: contract } = await admin
      .from("contracts")
      .select("id, rental_id")
      .eq("id", contractId)
      .maybeSingle();
    const rentalId = (contract as { rental_id?: string } | null)?.rental_id;
    if (!rentalId) return { ok: false, error: "contrat/rental introuvable" };

    const { data: rental } = await admin
      .from("rentals")
      .select(
        "id, start_date, end_date, monthly_rent, monthly_charges, security_deposit, tenant_id, property_id",
      )
      .eq("id", rentalId)
      .maybeSingle();
    if (!rental) return { ok: false, error: "location introuvable" };
    const r = rental as {
      start_date: string | null;
      end_date: string | null;
      monthly_rent: number | null;
      monthly_charges: number | null;
      security_deposit: number | null;
      tenant_id: string;
      property_id: string;
    };

    const { data: property } = await admin
      .from("properties")
      .select("id, title, description, address, owner_id")
      .eq("id", r.property_id)
      .maybeSingle();
    const p = property as {
      title?: string | null;
      description?: string | null;
      address?: string | null;
      owner_id?: string | null;
    } | null;
    if (!p?.owner_id) return { ok: false, error: "bien/propriétaire introuvable" };

    const [{ data: ownerData }, { data: tenantData }] = await Promise.all([
      admin
        .from("users")
        .select("first_name, last_name, email, phone, address")
        .eq("id", p.owner_id)
        .maybeSingle(),
      admin
        .from("users")
        .select("first_name, last_name, email, phone, address")
        .eq("id", r.tenant_id)
        .maybeSingle(),
    ]);
    const owner = (ownerData ?? {}) as Partial<UserRow>;
    const tenant = (tenantData ?? {}) as Partial<UserRow>;

    const startDate =
      r.start_date ?? new Date().toISOString().slice(0, 10);
    // Fin par défaut : +12 mois si non renseignée.
    const endDate =
      r.end_date ??
      (() => {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + 12);
        return d.toISOString().slice(0, 10);
      })();

    const data: ContractData = {
      contractId,
      contractNumber: contractId.slice(0, 8).toUpperCase(),
      propertyAddress: p.address ?? "Adresse à préciser",
      propertyDescription: p.title ?? p.description ?? "Bien immobilier",
      monthlyRent: Number(r.monthly_rent ?? 0),
      securityDeposit: Number(r.security_deposit ?? 0),
      charges: r.monthly_charges ? Number(r.monthly_charges) : undefined,
      startDate,
      endDate,
      owner: {
        fullName:
          `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim() ||
          "Propriétaire",
        email: owner.email ?? undefined,
        phone: owner.phone ?? undefined,
        address: owner.address ?? undefined,
      },
      tenant: {
        fullName:
          `${tenant.first_name ?? ""} ${tenant.last_name ?? ""}`.trim() ||
          "Locataire",
        email: tenant.email ?? undefined,
        phone: tenant.phone ?? undefined,
        address: tenant.address ?? undefined,
      },
    };

    const html = buildContractHtml(data);
    const bytes = new TextEncoder().encode(html);
    const objectPath = `${contractId}.html`;
    // Condensat SHA-256 du document généré : scelle le TEXTE du contrat.
    const documentHash = createHash("sha256").update(html).digest("hex");

    const { error: upErr } = await admin.storage
      .from("contracts")
      .upload(objectPath, bytes, {
        contentType: "text/html; charset=utf-8",
        upsert: true,
      });
    if (upErr) return { ok: false, error: `upload: ${upErr.message}` };

    // On enregistre le chemin SANS toucher au statut.
    const { error: updErr } = await admin
      .from("contracts")
      .update({ pdf_url: objectPath, contract_pdf_url: objectPath })
      .eq("id", contractId);
    if (updErr) return { ok: false, error: `maj: ${updErr.message}` };

    // Enregistre le hash du document — mise à jour ISOLÉE et best-effort : si la
    // colonne document_hash n'existe pas encore (migration 00069 non appliquée),
    // l'échec est ignoré et n'affecte pas la génération.
    try {
      await admin
        .from("contracts")
        .update({ document_hash: documentHash })
        .eq("id", contractId);
    } catch {
      /* colonne absente — inerte tant que 00069 n'est pas appliquée */
    }

    return { ok: true, path: objectPath };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "exception" };
  }
}
