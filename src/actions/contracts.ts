"use server";

import "server-only";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";

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
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: contract, error: insertErr } = await admin
    .from("contracts")
    .insert({
      rental_id: input.rentalId,
      contract_type: "RENTAL",
      status: "DRAFT",
      signed_by_owner: false,
      signed_by_tenant: false,
    })
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
// setContractTerms — le bailleur complète le bail (charges, dépôt) en DRAFT
// -----------------------------------------------------------------------------

export interface SetContractTermsInput {
  rentalId: string;
  monthlyCharges: number;
  securityDeposit: number;
}

/**
 * Le bailleur ajuste les conditions financières du bail (charges mensuelles,
 * dépôt de garantie) AVANT envoi au locataire. Possible uniquement tant que le
 * contrat est en cours de rédaction (DRAFT). Réservé au bailleur.
 */
export async function setContractTerms(
  input: SetContractTermsInput,
): Promise<SendContractResult> {
  if (!input.rentalId) return { success: false, error: "Location introuvable." };
  const charges = Math.max(0, Math.round(Number(input.monthlyCharges) || 0));
  const deposit = Math.max(0, Math.round(Number(input.securityDeposit) || 0));

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Authentification requise." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: rental } = await admin
    .from("rentals")
    .select("id, property:properties!property_id(owner_id)")
    .eq("id", input.rentalId)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rr: any = rental;
  const ownerId = rr?.property?.owner_id as string | undefined;
  if (!rr) return { success: false, error: "Location introuvable." };
  if (ownerId !== user.id) {
    return { success: false, error: "Action réservée au bailleur." };
  }

  // Le bail doit être encore en cours de rédaction.
  const { data: contractRow } = await admin
    .from("contracts")
    .select("status")
    .eq("rental_id", input.rentalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const cStatus = (contractRow as { status?: string } | null)?.status;
  if (cStatus && cStatus !== "DRAFT") {
    return {
      success: false,
      error: "Le bail a déjà été envoyé : il n'est plus modifiable.",
    };
  }

  const { error } = await admin
    .from("rentals")
    .update({ monthly_charges: charges, security_deposit: deposit })
    .eq("id", input.rentalId);
  if (error) return { success: false, error: "Impossible d'enregistrer." };

  revalidatePath("/contracts");
  return { success: true };
}

// -----------------------------------------------------------------------------
// sendContractToTenant — le bailleur a fini de rédiger, il envoie au locataire
// -----------------------------------------------------------------------------

export interface SendContractResult {
  success: boolean;
  error?: string;
}

/**
 * Transition « contrat en cours » → « envoyé au locataire ».
 * DRAFT → PENDING_TENANT (le bailleur a complété le bail) + notification au
 * locataire pour qu'il signe. Réservé au bailleur (owner_id du bien).
 */
export async function sendContractToTenant(
  contractId: string,
): Promise<SendContractResult> {
  if (!contractId) return { success: false, error: "Contrat introuvable." };
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { success: false, error: "Authentification requise." };

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: contract } = await admin
    .from("contracts")
    .select(
      `id, status,
       rental:rentals!contracts_rental_id_fkey(
         tenant_id,
         property:properties!rentals_property_id_fkey(owner_id, title)
       )`,
    )
    .eq("id", contractId)
    .maybeSingle();
  if (!contract) return { success: false, error: "Contrat introuvable." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = (contract as any).rental;
  const tenantId = r?.tenant_id as string | undefined;
  const ownerId = r?.property?.owner_id as string | undefined;
  const propertyTitle = (r?.property?.title as string | undefined) ?? "le bien";

  // Le bailleur (propriétaire/agence) est l'owner_id du bien.
  if (ownerId !== user.id) {
    return { success: false, error: "Action réservée au bailleur." };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((contract as any).status !== "DRAFT") {
    return {
      success: false,
      error: "Le bail a déjà été envoyé au locataire.",
    };
  }

  const { error: updErr } = await admin
    .from("contracts")
    .update({ status: "PENDING_TENANT" })
    .eq("id", contractId)
    .eq("status", "DRAFT");
  if (updErr) {
    return { success: false, error: "Impossible d'envoyer le bail." };
  }

  if (tenantId) {
    try {
      await dispatchNotification({
        userId: tenantId,
        type: "contract_ready",
        data: { propertyTitle, contractUrl: `/contracts/${contractId}` },
      });
    } catch (err) {
      console.warn("[contracts] notif envoi bail échec:", err);
    }
  }

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/contracts");
  return { success: true };
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
  // Validation signature (commune aux deux modes)
  if (!input.signatureDataUrl?.startsWith("data:image/")) {
    return { success: false, error: "Signature invalide." };
  }
  if (input.signatureDataUrl.length < 500) {
    return {
      success: false,
      error: "Signature trop courte, veuillez signer à nouveau.",
    };
  }

  // Mode démo : pas de DB, on retourne un succès simulé.
  const { isDemoMode } = await import("@/lib/auth/demo-mode");
  if (isDemoMode()) {
    return { success: true, status: "SIGNED" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "Authentification requise." };
  }

  // Récupère contrat + parties pour identifier le rôle du signataire.
  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select(
      `id, status, tenant_signature_hash, owner_signature_hash,
       rental:rentals!contracts_rental_id_fkey(
         tenant_id,
         property:properties!rentals_property_id_fkey(owner_id, title)
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

  // Ordre de signature STRICT : le bailleur prépare le bail (DRAFT) puis
  // l'« envoie au locataire » (PENDING_TENANT) ; le locataire signe en 1er
  // (→ PENDING_OWNER) ; le bailleur signe en dernier (→ SIGNED).
  if (role === "tenant" && contract.status !== "PENDING_TENANT") {
    return {
      success: false,
      error:
        contract.status === "DRAFT"
          ? "Le bail est en cours de rédaction par le bailleur. Vous pourrez le signer dès qu'il vous l'aura envoyé."
          : "Ce bail n'est pas en attente de votre signature.",
    };
  }
  if (role === "owner" && contract.status !== "PENDING_OWNER") {
    return {
      success: false,
      error:
        contract.status === "DRAFT" || contract.status === "PENDING_TENANT"
          ? "Le locataire doit d'abord signer le bail."
          : "Ce bail n'est pas en attente de votre signature.",
    };
  }

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

  // Notifie l'autre partie (et les deux au SIGNED). Best-effort.
  try {
    const propertyTitle = (r.property?.title as string | undefined) ?? "le bien";
    const contractUrl = `/contracts/${input.contractId}`;
    const newStatus = patch.status ?? contract.status;
    if (newStatus === "PENDING_OWNER" && ownerId) {
      // Le locataire vient de signer → on prévient le bailleur.
      await dispatchNotification({
        userId: ownerId,
        type: "contract_signed",
        data: { propertyTitle, contractUrl, fullySigned: false },
      });
    } else if (newStatus === "PENDING_TENANT" && tenantId) {
      await dispatchNotification({
        userId: tenantId,
        type: "contract_signed",
        data: { propertyTitle, contractUrl, fullySigned: false },
      });
    } else if (newStatus === "SIGNED") {
      for (const uid of [tenantId, ownerId].filter(Boolean) as string[]) {
        await dispatchNotification({
          userId: uid,
          type: "contract_signed",
          data: { propertyTitle, contractUrl, fullySigned: true },
        });
      }
    }
  } catch (err) {
    console.warn("[contracts] notif signature échec:", err);
  }

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
 * Retourne une signed URL Supabase Storage (10 min) pour afficher ou
 * télécharger le PDF/HTML du contrat. 60s était trop court : un utilisateur
 * qui lit un bail de plusieurs pages ou recharge l'iframe dépasse souvent ce
 * délai et reçoit un 403. 600s laisse de la marge sans compromettre la
 * sécurité (l'URL reste à usage unique côté navigateur).
 * L'autorisation est appliquée par les policies RLS du bucket privé `contracts`.
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
    .createSignedUrl(path, 600); // 10 min

  if (sErr || !signed) {
    console.error("[contracts] signed URL échec:", sErr);
    return { success: false, error: "Impossible de générer le lien signé." };
  }

  return { success: true, url: signed.signedUrl };
}
