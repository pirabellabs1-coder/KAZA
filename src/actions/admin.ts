"use server";

// =============================================================================
// KAZA - Admin Actions (Server Actions)
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

import { sendEmail } from "@/lib/notifications/resend";
import { writeAuditLog } from "@/lib/audit/write-log";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminActionResult {
  success: true;
  emailSent: boolean;
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
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KAZA</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f7fa; font-family:'Inter','Helvetica Neue',Arial,sans-serif; color:#1f2937;">
  ${preheader ? `<div style="display:none; max-height:0; overflow:hidden;">${esc(preheader)}</div>` : ""}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f7fa;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color:${BRAND_NAVY}; padding:24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.02em;">KAZA</h1>
              <p style="margin:4px 0 0; color:#cbd5e1; font-size:13px;">Service de modération</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${bodyHtml}</td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb; padding:20px 32px; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; color:#6b7280; font-size:12px; line-height:1.5;">
                Cet email vous a été envoyé par l'équipe de modération KAZA.
                <br />Pour toute question : <a href="mailto:support@kaza.africa" style="color:${BRAND_BLUE}; text-decoration:none;">support@kaza.africa</a>
              </p>
              <p style="margin:0; color:#9ca3af; font-size:11px;">
                © ${new Date().getFullYear()} KAZA · Cotonou, Bénin
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  const subject = "Votre compte KAZA a été suspendu";
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Suspension de votre compte</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.userName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Nous vous informons que votre compte KAZA a été temporairement suspendu suite à un manquement
      à nos conditions d'utilisation. Pendant cette période, vous ne pourrez plus vous connecter ni
      utiliser nos services.
    </p>
    ${reasonBlock(input.reason)}
    <p style="margin:16px 0; line-height:1.6; font-size:15px;">
      Si vous pensez qu'il s'agit d'une erreur ou souhaitez contester cette décision, contactez
      notre équipe support pour ouvrir une demande de révision.
    </p>
    ${ctaButton("Contacter le support", `${APP_URL}/contact`)}`,
    "Suspension de votre compte KAZA",
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
  const subject = `Annonce publiée : ${input.propertyTitle}`;
  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre annonce est en ligne !</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(input.ownerName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonne nouvelle : votre annonce a été approuvée par notre équipe et est désormais visible
      sur KAZA. Les locataires intéressés peuvent dès maintenant vous contacter.
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
  const subject = "Identité vérifiée — badge de confiance KAZA";
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
  const subject = "Pièce d'identité non conforme — KAZA";
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
