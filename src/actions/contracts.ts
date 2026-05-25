"use server";

import "server-only";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// =============================================================================
// KAZA - Server Actions Contrats (génération + signature électronique)
// =============================================================================
// Toutes les actions ici sont 'use server' + 'server-only'. Aucun SECRET ni
// service_role_key n'est jamais exposé au client.
//
// Cycle :
//   DRAFT -> (createContract + Edge Function) -> PENDING_TENANT
//   PENDING_TENANT -> (signContract by tenant) -> PENDING_OWNER
//   PENDING_OWNER -> (signContract by owner) -> SIGNED
//
// Sécurité signatures :
//   - Le PNG dataURL est haché en SHA-256 côté serveur.
//   - Seul le hash est persisté (jamais le PNG en clair).
//   - L'utilisateur courant ne peut signer que pour sa propre partie
//     (tenant_id ou owner_id du rental).
// =============================================================================

export interface CreateContractInput {
  rentalId: string;
}

export interface CreateContractResult {
  success: boolean;
  contractId?: string;
  error?: string;
}

/**
 * Crée un contrat lié à un rental existant, en status='DRAFT', puis déclenche
 * l'Edge Function `generate-contract-pdf` qui génère et upload le rendu.
 */
export async function createContract(
  input: CreateContractInput
): Promise<CreateContractResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "Authentification requise." };
  }

  // Vérifie que l'utilisateur est partie au rental (tenant ou owner).
  const { data: rental, error: rentalErr } = await supabase
    .from("rentals")
    .select("id, tenant_id, property:properties!rentals_property_id_fkey(owner_id)")
    .eq("id", input.rentalId)
    .single();

  if (rentalErr || !rental) {
    return { success: false, error: "Location introuvable." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (rental as any).property?.owner_id as string | undefined;
  if (rental.tenant_id !== user.id && ownerId !== user.id) {
    return {
      success: false,
      error: "Vous n'êtes pas autorisé à créer ce contrat.",
    };
  }

  // Insert via admin client (RLS sur INSERT est bloquante côté contracts).
  const admin = createAdminClient();
  const { data: contract, error: insertErr } = await admin
    .from("contracts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      rental_id: input.rentalId,
      contract_type: "RENTAL",
      status: "DRAFT",
      signed_by_owner: false,
      signed_by_tenant: false,
    } as any)
    .select("id")
    .single();

  if (insertErr || !contract) {
    console.error("[contracts] insert échec:", insertErr);
    return { success: false, error: "Impossible de créer le contrat." };
  }

  // Déclenche l'Edge Function (fire-and-forget : on n'attend pas le PDF pour
  // rendre la main, l'UI affichera "génération en cours" jusqu'au refresh).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/generate-contract-pdf`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ contractId: contract.id }),
      });
    } catch (err) {
      console.warn("[contracts] Edge Function trigger échec:", err);
      // Non bloquant : on pourra relancer la génération via un bouton dédié.
    }
  }

  revalidatePath("/contracts");
  return { success: true, contractId: contract.id };
}

// -----------------------------------------------------------------------------
// signContract
// -----------------------------------------------------------------------------

export interface SignContractInput {
  contractId: string;
  /** dataURL PNG (`data:image/png;base64,...`) issu du `<canvas>`. */
  signatureDataUrl: string;
}

export interface SignContractResult {
  success: boolean;
  status?: string;
  error?: string;
}

export async function signContract(
  input: SignContractInput
): Promise<SignContractResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "Authentification requise." };
  }

  if (!input.signatureDataUrl?.startsWith("data:image/")) {
    return { success: false, error: "Signature invalide." };
  }
  if (input.signatureDataUrl.length < 500) {
    return {
      success: false,
      error: "Signature trop courte, veuillez signer à nouveau.",
    };
  }

  // Récupère contrat + parties pour identifier le rôle du signataire.
  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select(
      `id, status, tenant_signature_hash, owner_signature_hash,
       rental:rentals!contracts_rental_id_fkey(
         tenant_id,
         property:properties!rentals_property_id_fkey(owner_id)
       )`
    )
    .eq("id", input.contractId)
    .single();

  if (cErr || !contract || !contract.rental) {
    return { success: false, error: "Contrat introuvable." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = contract.rental;
  const tenantId = r.tenant_id as string | undefined;
  const ownerId = r.property?.owner_id as string | undefined;

  let role: "tenant" | "owner";
  if (user.id === tenantId) role = "tenant";
  else if (user.id === ownerId) role = "owner";
  else return { success: false, error: "Vous n'êtes pas partie à ce contrat." };

  // Hash SHA-256 du dataURL (on ne stocke jamais le PNG en clair).
  const signatureHash = createHash("sha256")
    .update(input.signatureDataUrl)
    .digest("hex");

  const now = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: Record<string, any> = {};
  if (role === "tenant") {
    if (contract.tenant_signature_hash) {
      return { success: false, error: "Vous avez déjà signé ce contrat." };
    }
    patch.tenant_signature_hash = signatureHash;
    patch.tenant_signed_at = now;
    patch.signed_by_tenant = true;
  } else {
    if (contract.owner_signature_hash) {
      return { success: false, error: "Vous avez déjà signé ce contrat." };
    }
    patch.owner_signature_hash = signatureHash;
    patch.owner_signed_at = now;
    patch.signed_by_owner = true;
  }

  // Recalcule le statut en fonction des deux hash (le nouveau + l'existant).
  const tenantSigned =
    role === "tenant" ? true : Boolean(contract.tenant_signature_hash);
  const ownerSigned =
    role === "owner" ? true : Boolean(contract.owner_signature_hash);

  if (tenantSigned && ownerSigned) {
    patch.status = "SIGNED";
    patch.signed_at = now;
  } else if (tenantSigned && !ownerSigned) {
    patch.status = "PENDING_OWNER";
  } else if (!tenantSigned && ownerSigned) {
    patch.status = "PENDING_TENANT";
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updErr } = await (supabase as any)
    .from("contracts")
    .update(patch)
    .eq("id", input.contractId);

  if (updErr) {
    console.error("[contracts] update signature échec:", updErr);
    return { success: false, error: "Impossible d'enregistrer la signature." };
  }

  revalidatePath(`/contracts/${input.contractId}`);
  revalidatePath("/contracts");

  return { success: true, status: patch.status ?? contract.status };
}

// -----------------------------------------------------------------------------
// getContractPdfUrl
// -----------------------------------------------------------------------------

export interface GetContractPdfUrlInput {
  contractId: string;
}

export interface GetContractPdfUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Retourne une signed URL Supabase Storage (60s) pour afficher le PDF/HTML du
 * contrat dans une iframe. L'autorisation est appliquée par les policies RLS
 * du bucket privé `contracts`.
 */
export async function getContractPdfUrl(
  input: GetContractPdfUrlInput
): Promise<GetContractPdfUrlResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "Authentification requise." };
  }

  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select("id, pdf_url, contract_pdf_url")
    .eq("id", input.contractId)
    .single();

  if (cErr || !contract) {
    return { success: false, error: "Contrat introuvable." };
  }

  const path = contract.pdf_url ?? contract.contract_pdf_url;
  if (!path) {
    return { success: false, error: "PDF non encore généré." };
  }

  const admin = createAdminClient();
  const { data: signed, error: sErr } = await admin.storage
    .from("contracts")
    .createSignedUrl(path, 60);

  if (sErr || !signed) {
    console.error("[contracts] signed URL échec:", sErr);
    return { success: false, error: "Impossible de générer le lien signé." };
  }

  return { success: true, url: signed.signedUrl };
}
