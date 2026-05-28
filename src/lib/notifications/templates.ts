// =============================================================================
// KAZA - Email templates (FR)
// Wave 3 - Kwame Asante
//
// Templates HTML pour les emails transactionnels KAZA. Style minimaliste :
// header navy (#1A3A52), corps blanc, footer gris clair avec mentions légales.
//
// Chaque template retourne `{ subject, html, text }` :
//  - `subject` : sujet de l'email
//  - `html`    : corps HTML stylé (inline styles pour compat clients mail)
//  - `text`    : version texte brut (fallback accessibilité / clients legacy)
// =============================================================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const BRAND_NAVY = '#1A3A52';
const BRAND_BLUE = '#1976D2';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kaza.africa';

/** Échappe les chaînes destinées à être interpolées dans du HTML. */
function esc(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formate un montant en FCFA (XOF). */
function formatXof(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

/** Wrapper HTML commun : header KAZA, corps, footer. */
function layout(bodyHtml: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KAZA</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f7fa; font-family:'Inter','Helvetica Neue',Arial,sans-serif; color:#1f2937;">
  ${preheader ? `<div style="display:none; max-height:0; overflow:hidden;">${esc(preheader)}</div>` : ''}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f7fa;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color:${BRAND_NAVY}; padding:24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.02em;">KAZA</h1>
              <p style="margin:4px 0 0; color:#cbd5e1; font-size:13px;">L'immobilier en Afrique, en toute confiance.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb; padding:20px 32px; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; color:#6b7280; font-size:12px; line-height:1.5;">
                Vous recevez cet email parce que vous êtes inscrit sur KAZA.
                <br />
                <a href="${APP_URL}/parametres/notifications" style="color:${BRAND_BLUE}; text-decoration:none;">Gérer mes préférences de notifications</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/parametres/notifications?unsubscribe=1" style="color:${BRAND_BLUE}; text-decoration:none;">Se désabonner</a>
              </p>
              <p style="margin:0; color:#9ca3af; font-size:11px;">
                © ${new Date().getFullYear()} KAZA · Cotonou, Bénin · contact@kaza.africa
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

/** Bouton CTA inline-style (compat clients mail). */
function button(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${BRAND_BLUE}; border-radius:6px;">
        <a href="${esc(href)}" style="display:inline-block; padding:12px 24px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">${esc(label)}</a>
      </td>
    </tr>
  </table>`;
}

// -----------------------------------------------------------------------------
// Templates
// -----------------------------------------------------------------------------

export function welcomeTemplate(params: { firstName: string }): EmailTemplate {
  const { firstName } = params;
  const subject = `Bienvenue sur KAZA, ${firstName} !`;
  const text = `Bonjour ${firstName},

Bienvenue sur KAZA, la plus grande plateforme d'immobilier en Afrique.

Votre compte est créé. Vous pouvez dès maintenant explorer des milliers d'annonces, contacter directement les propriétaires, et gérer vos paiements en toute sécurité depuis votre tableau de bord.

Découvrez votre espace : ${APP_URL}/dashboard

À très vite,
L'équipe KAZA`;

  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Bienvenue sur KAZA, ${esc(firstName)} !</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Nous sommes ravis de vous compter parmi nos utilisateurs. KAZA simplifie la location immobilière au Bénin :
      milliers d'annonces vérifiées, contact direct avec les propriétaires, Paiements 100% sécurisés.
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Pour commencer, connectez-vous à votre tableau de bord et complétez votre profil.
    </p>
    ${button('Accéder à mon tableau de bord', `${APP_URL}/dashboard`)}
    <p style="margin:24px 0 0; color:#6b7280; font-size:13px;">
      Besoin d'aide ? Répondez simplement à cet email, notre équipe vous accompagne.
    </p>`,
    `Bienvenue sur KAZA, ${firstName}`,
  );

  return { subject, html, text };
}

export function visitRequestTemplate(params: {
  propertyTitle: string;
  requesterName: string;
  date: string;
}): EmailTemplate {
  const { propertyTitle, requesterName, date } = params;
  const subject = `Nouvelle demande de visite : ${propertyTitle}`;
  const text = `Bonjour,

${requesterName} souhaite visiter votre bien "${propertyTitle}" le ${date}.

Connectez-vous à votre tableau de bord pour accepter ou refuser cette demande :
${APP_URL}/dashboard/visites

L'équipe KAZA`;

  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Nouvelle demande de visite</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      <strong>${esc(requesterName)}</strong> souhaite visiter votre bien :
    </p>
    <div style="background-color:#f9fafb; border-left:4px solid ${BRAND_BLUE}; padding:16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 8px; font-size:16px; font-weight:600; color:${BRAND_NAVY};">${esc(propertyTitle)}</p>
      <p style="margin:0; color:#6b7280; font-size:14px;">Date proposée : <strong>${esc(date)}</strong></p>
    </div>
    <p style="margin:16px 0; line-height:1.6; font-size:15px;">
      Connectez-vous pour accepter, proposer une autre date, ou refuser.
    </p>
    ${button('Voir la demande', `${APP_URL}/dashboard/visites`)}`,
    `${requesterName} veut visiter ${propertyTitle}`,
  );

  return { subject, html, text };
}

export function paymentReceivedTemplate(params: {
  amount: number;
  propertyTitle: string;
}): EmailTemplate {
  const { amount, propertyTitle } = params;
  const subject = `Paiement reçu : ${formatXof(amount)}`;
  const text = `Bonjour,

Bonne nouvelle ! Vous venez de recevoir un paiement de ${formatXof(amount)} pour le bien "${propertyTitle}".

Le montant est actuellement en séquestre et sera libéré sur votre compte selon les conditions de la location.

Détails : ${APP_URL}/dashboard/paiements

L'équipe KAZA`;

  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Paiement reçu</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonne nouvelle ! Vous venez de recevoir un paiement pour le bien :
    </p>
    <div style="background-color:#ecfdf5; border-left:4px solid #10b981; padding:16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 8px; font-size:14px; color:#065f46;">${esc(propertyTitle)}</p>
      <p style="margin:0; font-size:24px; font-weight:700; color:#065f46;">${formatXof(amount)}</p>
    </div>
    <p style="margin:16px 0; line-height:1.6; font-size:14px; color:#6b7280;">
      Le montant est actuellement détenu en séquestre. Il sera versé sur votre compte selon les conditions
      définies dans le contrat de location.
    </p>
    ${button('Voir mes paiements', `${APP_URL}/dashboard/paiements`)}`,
    `Paiement de ${formatXof(amount)} reçu`,
  );

  return { subject, html, text };
}

export function contractReadyTemplate(params: {
  propertyTitle: string;
  contractUrl: string;
}): EmailTemplate {
  const { propertyTitle, contractUrl } = params;
  const subject = `Votre contrat de location est prêt : ${propertyTitle}`;
  const text = `Bonjour,

Votre contrat de location pour le bien "${propertyTitle}" est prêt à être consulté et signé.

Téléchargez et signez votre contrat : ${contractUrl}

L'équipe KAZA`;

  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre contrat est prêt</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Le contrat de location pour le bien <strong>${esc(propertyTitle)}</strong> est désormais disponible.
      Prenez le temps de le lire attentivement avant de le signer.
    </p>
    ${button('Consulter et signer le contrat', contractUrl)}
    <p style="margin:24px 0 0; color:#6b7280; font-size:13px;">
      Une question sur le contrat ? Contactez votre interlocuteur depuis la messagerie KAZA.
    </p>`,
    `Contrat prêt pour ${propertyTitle}`,
  );

  return { subject, html, text };
}

export function verificationApprovedTemplate(params: {
  firstName: string;
}): EmailTemplate {
  const { firstName } = params;
  const subject = 'Votre identité a été vérifiée';
  const text = `Bonjour ${firstName},

Bonne nouvelle ! Votre identité a été vérifiée avec succès. Votre badge "Vérifié" est maintenant visible sur votre profil.

Vous pouvez désormais publier des annonces, soumettre des demandes de location, et accéder à toutes les fonctionnalités KAZA.

Mon profil : ${APP_URL}/dashboard/profil

L'équipe KAZA`;

  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Votre identité est vérifiée</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(firstName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonne nouvelle ! Votre pièce d'identité a été validée par notre équipe.
      Votre profil affiche désormais le badge <strong>Vérifié</strong>, gage de confiance pour les autres utilisateurs.
    </p>
    <div style="background-color:#ecfdf5; border-left:4px solid #10b981; padding:16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0; color:#065f46; font-size:14px;">
        Vous pouvez maintenant publier des annonces, faire des demandes de location et finaliser des contrats.
      </p>
    </div>
    ${button('Voir mon profil', `${APP_URL}/dashboard/profil`)}`,
    'Identité vérifiée avec succès',
  );

  return { subject, html, text };
}

export function verificationRejectedTemplate(params: {
  firstName: string;
  reason: string;
}): EmailTemplate {
  const { firstName, reason } = params;
  const subject = 'Votre vérification d\'identité nécessite une action';
  const text = `Bonjour ${firstName},

Nous n'avons pas pu valider votre pièce d'identité pour la raison suivante :
${reason}

Vous pouvez soumettre à nouveau vos documents depuis votre tableau de bord :
${APP_URL}/dashboard/verification

L'équipe KAZA reste à votre disposition pour vous accompagner.`;

  const html = layout(
    `<h2 style="margin:0 0 16px; color:${BRAND_NAVY}; font-size:22px;">Vérification d'identité non aboutie</h2>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Bonjour ${esc(firstName)},
    </p>
    <p style="margin:0 0 16px; line-height:1.6; font-size:15px;">
      Nous n'avons malheureusement pas pu valider votre pièce d'identité. Pas d'inquiétude, vous pouvez réessayer.
    </p>
    <div style="background-color:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 4px; font-size:13px; font-weight:600; color:#92400e;">Motif :</p>
      <p style="margin:0; color:#78350f; font-size:14px; line-height:1.5;">${esc(reason)}</p>
    </div>
    <p style="margin:16px 0; line-height:1.6; font-size:14px;">
      Vérifiez la qualité des photos (nettes, bien éclairées, document entier visible) et soumettez à nouveau.
    </p>
    ${button('Recommencer la vérification', `${APP_URL}/dashboard/verification`)}
    <p style="margin:24px 0 0; color:#6b7280; font-size:13px;">
      Un doute ? Répondez à cet email, notre équipe vous aide.
    </p>`,
    'Vérification à recommencer',
  );

  return { subject, html, text };
}
