// =============================================================================
// KAZA - Email templates (FR)
//
// Templates HTML pour les emails transactionnels KAZA. Tous délèguent le rendu
// au gabarit unique `buildEmail` (src/lib/notifications/email-template.ts) pour
// un design cohérent et soigné sur tous les clients mail.
//
// Chaque template retourne `{ subject, html, text }` :
//  - `subject` : sujet de l'email
//  - `html`    : corps HTML stylé (gabarit KAZA)
//  - `text`    : version texte brut (fallback accessibilité / clients legacy)
// =============================================================================

import { buildEmail } from "./email-template";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://kaza-jade.vercel.app"
).replace(/\/$/, "");

function formatXof(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

// -----------------------------------------------------------------------------
// Templates
// -----------------------------------------------------------------------------

export function welcomeTemplate(params: { firstName: string }): EmailTemplate {
  const { firstName } = params;
  const name = firstName?.trim() || "";
  const subject = name ? `Bienvenue sur KAZA, ${name} !` : "Bienvenue sur KAZA !";

  return {
    subject,
    text: `Bonjour ${name},

Bienvenue sur KAZA, la plateforme d'immobilier en Afrique. Votre compte est créé : explorez des milliers d'annonces, contactez directement les propriétaires et gérez vos paiements en toute sécurité.

Votre espace : ${APP_URL}/dashboard

À très vite,
L'équipe KAZA`,
    html: buildEmail({
      preheader: "Votre compte KAZA est prêt.",
      heading: subject,
      intro: name ? `Bonjour ${name},` : "Bonjour,",
      paragraphs: [
        "Nous sommes ravis de vous compter parmi nous. KAZA simplifie la location immobilière en Afrique : annonces vérifiées, contact direct avec les propriétaires, et paiements 100% sécurisés.",
        "Pour commencer, connectez-vous à votre tableau de bord et complétez votre profil.",
      ],
      button: { label: "Accéder à mon tableau de bord", url: `${APP_URL}/dashboard` },
      outro: "Besoin d'aide ? Répondez simplement à cet email — notre équipe vous accompagne.",
    }),
  };
}

export function visitRequestTemplate(params: {
  propertyTitle: string;
  requesterName: string;
  date: string;
}): EmailTemplate {
  const { propertyTitle, requesterName, date } = params;
  const subject = `Nouvelle demande de visite : ${propertyTitle}`;

  return {
    subject,
    text: `Bonjour,

${requesterName} souhaite visiter votre bien "${propertyTitle}" le ${date}.

Acceptez ou refusez depuis votre tableau de bord : ${APP_URL}/dashboard

L'équipe KAZA`,
    html: buildEmail({
      preheader: `${requesterName} veut visiter ${propertyTitle}`,
      heading: "Nouvelle demande de visite",
      paragraphs: [`${requesterName} souhaite visiter votre bien.`],
      rows: [
        { label: "Bien", value: propertyTitle },
        { label: "Visiteur", value: requesterName },
        { label: "Date proposée", value: date },
      ],
      button: { label: "Voir la demande", url: `${APP_URL}/dashboard`, color: "navy" },
      outro: "Connectez-vous pour accepter, proposer une autre date ou refuser.",
    }),
  };
}

export function paymentReceivedTemplate(params: {
  amount: number;
  propertyTitle: string;
}): EmailTemplate {
  const { amount, propertyTitle } = params;
  const subject = `Paiement reçu : ${formatXof(amount)}`;

  return {
    subject,
    text: `Bonjour,

Vous venez de recevoir un paiement de ${formatXof(amount)} pour le bien "${propertyTitle}". Le montant est en séquestre et sera libéré selon les conditions de la location.

Détails : ${APP_URL}/dashboard

L'équipe KAZA`,
    html: buildEmail({
      preheader: `Paiement de ${formatXof(amount)} reçu`,
      heading: "Paiement reçu 🎉",
      paragraphs: ["Bonne nouvelle ! Vous venez de recevoir un paiement."],
      rows: [
        { label: "Bien", value: propertyTitle },
        { label: "Montant", value: formatXof(amount) },
      ],
      highlight:
        "Le montant est actuellement détenu en séquestre KAZA. Il sera versé sur votre compte selon les conditions du contrat de location.",
      button: { label: "Voir mes paiements", url: `${APP_URL}/dashboard` },
      outro: "L'équipe KAZA",
    }),
  };
}

export function contractReadyTemplate(params: {
  propertyTitle: string;
  contractUrl: string;
}): EmailTemplate {
  const { propertyTitle, contractUrl } = params;
  const subject = `Votre contrat de location est prêt : ${propertyTitle}`;
  const url = contractUrl || `${APP_URL}/dashboard`;

  return {
    subject,
    text: `Bonjour,

Votre contrat de location pour le bien "${propertyTitle}" est prêt à être consulté et signé : ${url}

L'équipe KAZA`,
    html: buildEmail({
      preheader: `Contrat prêt pour ${propertyTitle}`,
      heading: "Votre contrat est prêt",
      paragraphs: [
        `Le contrat de location pour « ${propertyTitle} » est désormais disponible. Prenez le temps de le lire attentivement avant de le signer.`,
      ],
      button: { label: "Consulter et signer le contrat", url },
      outro: "Une question sur le contrat ? Contactez votre interlocuteur depuis la messagerie KAZA.",
    }),
  };
}

export function referralInviteTemplate(params: {
  inviterName: string;
  code: string;
  signupUrl: string;
}): EmailTemplate {
  const { inviterName, code, signupUrl } = params;
  const subject = `${inviterName} vous invite à rejoindre KAZA`;

  return {
    subject,
    text: `Bonjour,

${inviterName} vous invite à rejoindre KAZA. Inscrivez-vous avec le code de parrainage ${code} pour profiter d'avantages exclusifs : ${signupUrl}

Besoin d'aide ? immobilierkaza@gmail.com`,
    html: buildEmail({
      preheader: `${inviterName} vous invite à rejoindre KAZA`,
      heading: `${inviterName} vous invite sur KAZA`,
      paragraphs: [
        `${inviterName} pense que KAZA pourrait vous être utile : annonces vérifiées, contact direct avec les propriétaires et paiements 100% sécurisés.`,
      ],
      rows: [{ label: "Votre code de parrainage", value: code }],
      button: { label: "Créer mon compte KAZA", url: signupUrl },
      outro: "Inscrivez-vous avec ce code pour bénéficier d'un bonus de bienvenue.",
    }),
  };
}

export function verificationApprovedTemplate(params: {
  firstName: string;
}): EmailTemplate {
  const { firstName } = params;
  const name = firstName?.trim() || "";
  const subject = "Votre identité a été vérifiée ✅";

  return {
    subject,
    text: `Bonjour ${name},

Votre identité a été vérifiée avec succès. Votre badge "Vérifié" est maintenant visible sur votre profil. Vous pouvez publier des annonces, faire des demandes de location et accéder à toutes les fonctionnalités.

Mon profil : ${APP_URL}/profile

L'équipe KAZA`,
    html: buildEmail({
      preheader: "Identité vérifiée avec succès",
      heading: "Votre identité est vérifiée",
      intro: name ? `Bonjour ${name},` : "Bonjour,",
      paragraphs: [
        "Bonne nouvelle ! Votre pièce d'identité a été validée par notre équipe. Votre profil affiche désormais le badge « Vérifié », gage de confiance pour les autres utilisateurs.",
      ],
      highlight:
        "Vous pouvez maintenant publier des annonces, faire des demandes de location et finaliser des contrats.",
      button: { label: "Voir mon profil", url: `${APP_URL}/profile` },
      outro: "L'équipe KAZA",
    }),
  };
}

export function verificationRejectedTemplate(params: {
  firstName: string;
  reason: string;
}): EmailTemplate {
  const { firstName, reason } = params;
  const name = firstName?.trim() || "";
  const subject = "Votre vérification d'identité nécessite une action";

  return {
    subject,
    text: `Bonjour ${name},

Nous n'avons pas pu valider votre pièce d'identité pour la raison suivante : ${reason}

Vous pouvez soumettre à nouveau vos documents : ${APP_URL}/verify-identity

L'équipe KAZA reste à votre disposition.`,
    html: buildEmail({
      preheader: "Vérification à recommencer",
      heading: "Vérification d'identité non aboutie",
      intro: name ? `Bonjour ${name},` : "Bonjour,",
      paragraphs: [
        "Nous n'avons malheureusement pas pu valider votre pièce d'identité. Pas d'inquiétude, vous pouvez réessayer.",
      ],
      highlight: `Motif : ${reason}`,
      button: { label: "Recommencer la vérification", url: `${APP_URL}/verify-identity`, color: "navy" },
      outro: "Vérifiez que vos photos sont nettes, bien éclairées et que le document entier est visible.",
    }),
  };
}
