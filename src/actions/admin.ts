"use server";

// =============================================================================
// Kaabo - Admin Actions (Server Actions)
// Wave 8 - Ibrahima Sow
//
// Décisions de modération admin pour le MVP (mode démo) :
//   - suspension utilisateur
//   - approbation / rejet d'annonce
//   - validation / rejet de pièce d'identité
//   - résolution de litige
//
// Chaque action envoie un email transactionnel best-effort via Resend
// (mode DEV-log si pas de clé API). Aucune écriture DB — la persistance
// se fait côté client dans localStorage via `lib/admin-state.ts`.
// =============================================================================

import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { sendEmail } from "@/lib/notifications/resend";
import { buildEmail } from "@/lib/notifications/email-template";
import { writeAuditLog } from "@/lib/audit/write-log";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminActionResult {
  success: boolean;
  emailSent?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// HTML helpers (templates inline-styles — compat clients mail)
// ---------------------------------------------------------------------------

const BRAND_NAVY = "#1A3A52";
const BRAND_BLUE = "#1976D2";
const BRAND_GREEN = "#4CAF50";
const BRAND_RED = "#D32F2F";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kaza.africa";

function esc(input: unknown): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(bodyHtml: string, preheader?: string): string {
  // Délègue au gabarit email unifié Kaabo. Le `bodyHtml` (titre <h2> + contenu)
  // est inséré tel quel dans la carte.
  return buildEmail({ preheader, rawHtml: bodyHtml });
}

function ctaButton(label: string, href: string, color = BRAND_BLUE): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${color}; border-radius:6px;">
        <a href="${esc(href)}" style="display:inline-block; padding:12px 24px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">${esc(label)}</a>
      </td>
    </tr>
  </table>`;
}

function reasonBlock(reason: string, accent = BRAND_RED): string {
  return `<div style="background-color:#fef2f2; border-left:4px solid ${accent}; padding:14px 16px; margin:16px 0; border-radius:4px;">
    <p style="margin:0 0 4px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:${accent};">Motif</p>
    <p style="margin:0; font-size:14px; line-height:1.5; color:#1f2937;">${esc(reason)}</p>
  </div>`;
}

// ---------------------------------------------------------------------------
// Helper d'envoi best-effort — jamais throw.
// ---------------------------------------------------------------------------

async function trySendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const res = await sendEmail(to, subject, html);
    return res.success;
  } catch (err) {
    console.error("[admin] email error:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 1. Suspendre un utilisateur
// ---------------------------------------------------------------------------

export interface SuspendUserInput {
  userId: string;
  userEmail: string;
  userName: string;
  reason: string;
}

export async function suspendUser(
  input: SuspendUserInput,
): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const subject = "Votre compte Kaabo a été suspendu";
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Suspension de votre compte</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.userName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Nous vous informons que votre compte Kaabo a été temporairement suspendu suite à un manquement
      à nos conditions d'utilisation. Pendant cette période, vous ne pourrez plus vous connecter ni
      utiliser nos services.
    </p>
    ${reasonBlock(input.reason)}
    <p style="margin:16px 0; line-height:1.6; font-size:15px;">
      Si vous pensez qu'il s'agit d'une erreur ou souhaitez contester cette décision, contactez
      notre équipe support pour ouvrir une demande de révision.
    </p>
    ${ctaButton("Contacter le support", `${APP_URL}/contact`)}`,
    "Suspension de votre compte Kaabo",
  );

  const emailSent = await trySendEmail(input.userEmail, subject, html);

  await writeAuditLog({
    action: "USER_SUSPENDED",
    targetType: "USER",
    targetId: input.userId,
    targetLabel: input.userName || input.userEmail,
    reason: input.reason,
  });

  return { success: true, emailSent };
}

// ---------------------------------------------------------------------------
// 2. Approuver une annonce
// ---------------------------------------------------------------------------

export interface ApprovePropertyInput {
  propertyId: string;
  propertyTitle: string;
  ownerEmail: string;
  ownerName: string;
}

export async function approveProperty(
  input: ApprovePropertyInput,
): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  // Publie RÉELLEMENT l'annonce (statut AVAILABLE) — sans ça l'annonce
  // restait en attente malgré l'« approbation ».
  const adminDb = createAdminClient() as unknown as SupabaseClient;
  const { error: statusErr } = await adminDb
    .from("properties")
    .update({ status: "AVAILABLE" })
    .eq("id", input.propertyId);
  if (statusErr) {
    return { success: false, error: "Impossible de publier l'annonce." };
  }

  const subject = `Annonce publiée : ${input.propertyTitle}`;
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre annonce est en ligne !</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.ownerName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonne nouvelle : votre annonce a été approuvée par notre équipe et est désormais visible
      sur Kaabo. Les locataires intéressés peuvent dès maintenant vous contacter.
    </p>
    <div style="background-color:#ecfdf5; border-left:4px solid ${BRAND_GREEN}; padding:16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 4px; font-size:13px; color:#065f46; font-weight:600;">Annonce publiée</p>
      <p style="margin:0; font-size:16px; font-weight:600; color:${BRAND_NAVY};">${esc(input.propertyTitle)}</p>
      <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">Référence : #${esc(input.propertyId)}</p>
    </div>
    ${ctaButton("Voir mon annonce", `${APP_URL}/dashboard/owner/properties`, BRAND_GREEN)}`,
    `Annonce ${input.propertyTitle} publiée`,
  );

  const emailSent = await trySendEmail(input.ownerEmail, subject, html);

  await writeAuditLog({
    action: "PROPERTY_APPROVED",
    targetType: "PROPERTY",
    targetId: input.propertyId,
    targetLabel: input.propertyTitle,
  });

  return { success: true, emailSent };
}

// ---------------------------------------------------------------------------
// 3. Rejeter une annonce
// ---------------------------------------------------------------------------

export interface RejectPropertyInput {
  propertyId: string;
  propertyTitle: string;
  ownerEmail: string;
  ownerName: string;
  reason: string;
}

export async function rejectProperty(
  input: RejectPropertyInput,
): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  // Repasse l'annonce en brouillon (le propriétaire pourra corriger + resoumettre).
  const adminDb = createAdminClient() as unknown as SupabaseClient;
  await adminDb
    .from("properties")
    .update({ status: "DRAFT" })
    .eq("id", input.propertyId);

  const subject = `Annonce rejetée : ${input.propertyTitle}`;
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre annonce n'a pas été publiée</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.ownerName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Après examen, notre équipe de modération n'a pas pu valider la publication de votre annonce
      <strong>${esc(input.propertyTitle)}</strong> (référence #${esc(input.propertyId)}).
    </p>
    ${reasonBlock(input.reason)}
    <p style="margin:16px 0; line-height:1.6; font-size:15px;">
      Vous pouvez modifier votre annonce en tenant compte de ces remarques puis la soumettre à
      nouveau pour validation.
    </p>
    ${ctaButton("Modifier mon annonce", `${APP_URL}/dashboard/owner/properties`)}`,
    `Annonce ${input.propertyTitle} rejetée`,
  );

  const emailSent = await trySendEmail(input.ownerEmail, subject, html);

  await writeAuditLog({
    action: "PROPERTY_REJECTED",
    targetType: "PROPERTY",
    targetId: input.propertyId,
    targetLabel: input.propertyTitle,
    reason: input.reason,
  });

  return { success: true, emailSent };
}

// ---------------------------------------------------------------------------
// 4. Approuver une vérification d'identité
// ---------------------------------------------------------------------------

export interface ApproveIdentityInput {
  userId: string;
  userEmail: string;
  userName: string;
}

export async function approveIdentity(
  input: ApproveIdentityInput,
): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const subject = "Identité vérifiée — badge de confiance Kaabo";
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre identité est vérifiée</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.userName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Excellente nouvelle : votre pièce d'identité a été validée par notre équipe.
      Votre compte affiche désormais le badge <strong style="color:${BRAND_GREEN};">Identité vérifiée</strong>
      qui rassure vos interlocuteurs et accélère vos échanges sur la plateforme.
    </p>
    <div style="background-color:#ecfdf5; border-left:4px solid ${BRAND_GREEN}; padding:16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0; font-size:14px; line-height:1.5; color:#065f46;">
        <strong>Badge activé.</strong> Vous bénéficiez d'une meilleure visibilité et de plus
        de confiance auprès des autres utilisateurs.
      </p>
    </div>
    ${ctaButton("Voir mon profil", `${APP_URL}/profile`, BRAND_GREEN)}`,
    "Identité vérifiée",
  );

  const emailSent = await trySendEmail(input.userEmail, subject, html);
  return { success: true, emailSent };
}

// ---------------------------------------------------------------------------
// 5. Rejeter une vérification d'identité
// ---------------------------------------------------------------------------

export interface RejectIdentityInput {
  userId: string;
  userEmail: string;
  userName: string;
  reason: string;
}

export async function rejectIdentity(
  input: RejectIdentityInput,
): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const subject = "Pièce d'identité non conforme — Kaabo";
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre pièce d'identité n'a pas été validée</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.userName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Après vérification, votre pièce d'identité n'a pas pu être acceptée par notre équipe.
      Vous pouvez recommencer la procédure en corrigeant le problème identifié ci-dessous.
    </p>
    ${reasonBlock(input.reason)}
    <p style="margin:16px 0; line-height:1.6; font-size:15px;">
      Conseils : pièce dans une zone bien éclairée, photo nette et non rognée, selfie
      correspondant au document.
    </p>
    ${ctaButton("Recommencer la vérification", `${APP_URL}/verify-identity`)}`,
    "Pièce d'identité non conforme",
  );

  const emailSent = await trySendEmail(input.userEmail, subject, html);
  return { success: true, emailSent };
}

// ---------------------------------------------------------------------------
// 6. Résoudre un litige
// ---------------------------------------------------------------------------

export interface ResolveDisputeInput {
  disputeId: string;
  plaintiffEmail?: string;
  plaintiffName?: string;
  note: string;
}

export async function resolveDispute(
  input: ResolveDisputeInput,
): Promise<AdminActionResult> {
  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  if (!input.plaintiffEmail) {
    return { success: true, emailSent: false };
  }

  const subject = `Litige #${input.disputeId} résolu`;
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre litige a été résolu</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.plaintiffName ?? "")},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Notre équipe de modération a traité votre signalement
      <strong>#${esc(input.disputeId)}</strong>. Voici la conclusion :
    </p>
    <div style="background-color:#eff6ff; border-left:4px solid ${BRAND_BLUE}; padding:14px 16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 4px; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:${BRAND_BLUE};">Décision</p>
      <p style="margin:0; font-size:14px; line-height:1.5; color:#1f2937;">${esc(input.note)}</p>
    </div>
    <p style="margin:16px 0; line-height:1.6; font-size:15px;">
      Si vous estimez que cette décision mérite d'être réexaminée, vous pouvez répondre à cet email
      ou contacter notre équipe support sous 7 jours.
    </p>
    ${ctaButton("Contacter le support", `${APP_URL}/contact`)}`,
    `Litige ${input.disputeId} résolu`,
  );

  const emailSent = await trySendEmail(input.plaintiffEmail, subject, html);
  return { success: true, emailSent };
}

// ===========================================================================
// 7. Modération des agences B2B (users où role = 'AGENCY')
// ===========================================================================
//
// Ces actions écrivent réellement dans `public.users` via le client
// service_role (bypass RLS) après vérification du rôle ADMIN du caller.
// Le statut d'une agence est dérivé côté affichage (cf. /admin/agencies)
// depuis `verification_status` :
//   - APPROVED  → ACTIVE
//   - REJECTED  → SUSPENDED
//   - PENDING / UNVERIFIED → KYC en attente
// ===========================================================================

/** Convention de retour homogène avec les autres actions du projet. */
export type AgencyActionResult =
  | { success: true }
  | { success: false; error: string };

/** Vérifie que le caller est admin. Renvoie l'id admin en cas de succès. */
async function assertAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile as { role?: string } | null)?.role !== "ADMIN") {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  return { ok: true, adminId: user.id };
}

/**
 * Récupère le profil agence ciblé (nom + email) et garantit que la cible
 * est bien une agence. Utilise le service_role pour fiabiliser la lecture.
 */
async function loadAgency(
  admin: SupabaseClient,
  userId: string,
): Promise<
  | { ok: true; name: string; email: string }
  | { ok: false; error: string }
> {
  const { data, error } = await admin
    .from("users")
    .select("first_name, last_name, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Agence introuvable." };
  }

  const row = data as {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: string | null;
  };

  if (row.role !== "AGENCY") {
    return { ok: false, error: "Cet utilisateur n'est pas une agence." };
  }

  const name =
    `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
    (row.email ?? "Agence");

  return { ok: true, name, email: row.email ?? "" };
}

/** Best-effort : notification in-app pour l'agence (jamais throw). */
async function notifyAgency(
  admin: SupabaseClient,
  userId: string,
  type: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      link: "/agency/settings",
    });
  } catch (err) {
    console.warn("[admin.agency] notification skipped:", err);
  }
}

/**
 * Active / désactive le badge "vérifiée" d'une agence (KYC).
 *  - verified=true  → is_verified=true, verification_status='APPROVED'
 *  - verified=false → is_verified=false, verification_status='UNVERIFIED'
 */
export async function setAgencyVerified(
  userId: string,
  verified: boolean,
): Promise<AgencyActionResult> {
  if (!userId) return { success: false, error: "Identifiant manquant." };

  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const admin = createAdminClient() as unknown as SupabaseClient;

  const agency = await loadAgency(admin, userId);
  if (!agency.ok) return { success: false, error: agency.error };

  const { error } = await admin
    .from("users")
    .update({
      is_verified: verified,
      verification_status: verified ? "APPROVED" : "UNVERIFIED",
    })
    .eq("id", userId);

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre à jour le statut de vérification.",
    };
  }

  await notifyAgency(
    admin,
    userId,
    verified ? "agency_verified" : "agency_unverified",
    verified ? "Agence vérifiée" : "Vérification retirée",
    verified
      ? "Votre agence a été vérifiée par l'équipe Kaabo. Le badge de confiance est activé."
      : "Le badge de vérification de votre agence a été retiré. Contactez le support pour en savoir plus.",
  );

  await writeAuditLog({
    action: verified ? "AGENCY_VERIFIED" : "AGENCY_UNVERIFIED",
    targetType: "AGENCY",
    targetId: userId,
    targetLabel: agency.name,
  });

  revalidatePath("/admin/agencies");
  revalidatePath("/admin/audit-log");

  return { success: true };
}

/**
 * Suspend ou réactive une agence.
 *  - "SUSPEND"   → verification_status='REJECTED' (affiché "Suspendu")
 *  - "ACTIVATE"  → verification_status='APPROVED', is_verified=true
 */
export async function setAgencyStatus(
  userId: string,
  action: "SUSPEND" | "ACTIVATE",
  reason?: string,
): Promise<AgencyActionResult> {
  if (!userId) return { success: false, error: "Identifiant manquant." };
  if (action !== "SUSPEND" && action !== "ACTIVATE") {
    return { success: false, error: "Action invalide." };
  }

  const guard = await assertAdmin();
  if (!guard.ok) return { success: false, error: guard.error };

  const admin = createAdminClient() as unknown as SupabaseClient;

  const agency = await loadAgency(admin, userId);
  if (!agency.ok) return { success: false, error: agency.error };

  const suspend = action === "SUSPEND";

  const { error } = await admin
    .from("users")
    .update(
      suspend
        ? { verification_status: "REJECTED" }
        : { verification_status: "APPROVED", is_verified: true },
    )
    .eq("id", userId);

  if (error) {
    return {
      success: false,
      error: suspend
        ? "Impossible de suspendre l'agence."
        : "Impossible de réactiver l'agence.",
    };
  }

  const trimmedReason = reason?.trim() || undefined;

  await notifyAgency(
    admin,
    userId,
    suspend ? "agency_suspended" : "agency_reactivated",
    suspend ? "Agence suspendue" : "Agence réactivée",
    suspend
      ? trimmedReason
        ? `Votre agence a été suspendue. Motif : ${trimmedReason}`
        : "Votre agence a été suspendue par l'équipe Kaabo. Contactez le support."
      : "Votre agence a été réactivée. Vous pouvez de nouveau utiliser tous les services Kaabo.",
  );

  // Email best-effort à l'agence lors d'une suspension (template existant).
  if (suspend && agency.email) {
    const subject = "Votre agence Kaabo a été suspendue";
    const html = layout(
      `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Suspension de votre agence</h2>
      <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
        Bonjour ${esc(agency.name)},
      </p>
      <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
        Nous vous informons que votre agence a été suspendue sur Kaabo. Pendant cette période,
        vos annonces ne sont plus mises en avant et certains services sont restreints.
      </p>
      ${trimmedReason ? reasonBlock(trimmedReason) : ""}
      <p style="margin:16px 0; line-height:1.6; font-size:15px;">
        Pour contester cette décision ou obtenir des précisions, contactez notre équipe.
      </p>
      ${ctaButton("Contacter le support", `${APP_URL}/contact`)}`,
      "Suspension de votre agence Kaabo",
    );
    await trySendEmail(agency.email, subject, html);
  }

  await writeAuditLog({
    action: suspend ? "AGENCY_SUSPENDED" : "AGENCY_REACTIVATED",
    targetType: "AGENCY",
    targetId: userId,
    targetLabel: agency.name,
    reason: trimmedReason,
  });

  revalidatePath("/admin/agencies");
  revalidatePath("/admin/audit-log");

  return { success: true };
}
