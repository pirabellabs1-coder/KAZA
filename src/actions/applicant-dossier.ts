"use server";

import "server-only";

// =============================================================================
// Kaabo — Dossier d'un candidat (vu par le propriétaire / agence / admin)
// Permet au bailleur de consulter l'identité + les pièces du candidat AVANT de
// rédiger et signer le bail. Autorisation stricte : seul le propriétaire du
// bien concerné (ou un ADMIN) peut consulter le dossier d'une candidature.
// Les fichiers sont servis via des Signed URLs courtes (bucket privé).
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

const TENANT_BUCKET = "identity-documents";

const DOC_TYPE_LABELS: Record<string, string> = {
  payslip: "Bulletin de salaire",
  id: "Pièce d'identité",
  address_proof: "Justificatif de domicile",
  guarantor: "Document du garant",
  other: "Autre document",
};

export interface ApplicantDocument {
  id: string;
  docType: string;
  docTypeLabel: string;
  label: string;
  amount: string | null;
  uploadedAt: string;
  signedUrl: string | null;
}

export interface ApplicantDossier {
  tenant: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    verificationStatus: string;
    verified: boolean;
  };
  documents: ApplicantDocument[];
}

export interface ApplicantDossierResult {
  success: boolean;
  error?: string;
  dossier?: ApplicantDossier;
}

export async function getApplicantDossier(
  applicationId: string,
): Promise<ApplicantDossierResult> {
  if (!applicationId) return { success: false, error: "Candidature introuvable." };

  const user = await getCurrentDisplayUser();
  if (!user) return { success: false, error: "Vous devez être connecté." };
  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && user.role !== "OWNER" && user.role !== "AGENCY") {
    return { success: false, error: "Action réservée au bailleur." };
  }

  const admin = createAdminClient() as unknown as SupabaseClient;

  // 1) Candidature → tenant + property.
  const { data: appRow } = await admin
    .from("rental_applications")
    .select("id, tenant_id, property_id")
    .eq("id", applicationId)
    .maybeSingle();
  const app = appRow as
    | { id: string; tenant_id: string; property_id: string }
    | null;
  if (!app) return { success: false, error: "Candidature introuvable." };

  // 2) Autorisation : propriétaire du bien (ou admin).
  if (!isAdmin) {
    const { data: prop } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", app.property_id)
      .maybeSingle();
    if (!prop || (prop as { owner_id: string }).owner_id !== user.id) {
      return { success: false, error: "Ce dossier ne vous concerne pas." };
    }
  }

  // 3) Profil candidat.
  const { data: profile } = await admin
    .from("users")
    .select("id, first_name, last_name, email, phone, verification_status")
    .eq("id", app.tenant_id)
    .maybeSingle();
  const p = profile as
    | {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone: string | null;
        verification_status: string | null;
      }
    | null;

  const name =
    `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "Candidat";
  const verificationStatus = p?.verification_status ?? "UNVERIFIED";

  // 4) Pièces du dossier locatif + Signed URLs (10 min).
  const { data: docsData } = await admin
    .from("tenant_documents")
    .select("id, doc_type, label, file_url, amount, uploaded_at")
    .eq("user_id", app.tenant_id)
    .order("uploaded_at", { ascending: false });
  const docRows = (docsData ?? []) as Array<{
    id: string;
    doc_type: string;
    label: string;
    file_url: string | null;
    amount: string | null;
    uploaded_at: string;
  }>;

  const documents: ApplicantDocument[] = await Promise.all(
    docRows.map(async (d) => {
      let signedUrl: string | null = null;
      if (d.file_url) {
        const { data: signed } = await admin.storage
          .from(TENANT_BUCKET)
          .createSignedUrl(d.file_url, 60 * 10);
        signedUrl = signed?.signedUrl ?? null;
      }
      return {
        id: d.id,
        docType: d.doc_type,
        docTypeLabel: DOC_TYPE_LABELS[d.doc_type] ?? "Document",
        label: d.label,
        amount: d.amount,
        uploadedAt: d.uploaded_at,
        signedUrl,
      };
    }),
  );

  return {
    success: true,
    dossier: {
      tenant: {
        id: app.tenant_id,
        name,
        email: p?.email ?? null,
        phone: p?.phone ?? null,
        verificationStatus,
        verified: verificationStatus === "APPROVED",
      },
      documents,
    },
  };
}
