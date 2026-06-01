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
  /** true = email au PAYEUR (locataire) ; sinon au BÉNÉFICIAIRE (bailleur). */
  forPayer?: boolean;
}): EmailTemplate {
  const { amount, propertyTitle, forPayer } = params;
  if (forPayer) {
    const subject = `Paiement confirmé : ${formatXof(amount)}`;
    return {
      subject,
      text: `Bonjour,

Votre paiement de ${formatXof(amount)} pour le bien "${propertyTitle}" a bien été reçu et placé en séquestre KAZA. Vous recevrez votre reçu dès la confirmation.

Détails : ${APP_URL}/tenant/payments

L'équipe KAZA`,
      html: buildEmail({
        preheader: `Paiement de ${formatXof(amount)} confirmé`,
        heading: "Paiement confirmé ✅",
        paragraphs: ["Votre paiement a bien été pris en compte."],
        rows: [
          { label: "Bien", value: propertyTitle },
          { label: "Montant", value: formatXof(amount) },
        ],
        highlight:
          "Vos fonds sont protégés en séquestre KAZA jusqu'au respect des conditions de la location.",
        button: { label: "Voir mes paiements", url: `${APP_URL}/tenant/payments` },
        outro: "L'équipe KAZA",
      }),
    };
  }
  const subject = `Paiement reçu : ${formatXof(amount)}`;
  return {
    subject,
    text: `Bonjour,

Vous venez de recevoir un paiement de ${formatXof(amount)} pour le bien "${propertyTitle}". Le montant est en séquestre et sera libéré selon les conditions de la location.

Détails : ${APP_URL}/owner/payments

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
      button: { label: "Voir mes paiements", url: `${APP_URL}/owner/payments` },
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

export function applicationReceivedTemplate(params: {
  propertyTitle: string;
  requesterName: string;
}): EmailTemplate {
  const { propertyTitle, requesterName } = params;
  const subject = `Nouvelle candidature : ${propertyTitle}`;
  return {
    subject,
    text: `Bonjour,

${requesterName} a postulé pour louer votre bien "${propertyTitle}". Consultez son dossier et acceptez ou refusez : ${APP_URL}/owner/applications

L'équipe KAZA`,
    html: buildEmail({
      preheader: `${requesterName} a postulé pour ${propertyTitle}`,
      heading: "Nouvelle candidature reçue",
      paragraphs: [`${requesterName} souhaite louer votre bien.`],
      rows: [
        { label: "Bien", value: propertyTitle },
        { label: "Candidat", value: requesterName },
      ],
      button: { label: "Voir la candidature", url: `${APP_URL}/owner/applications`, color: "navy" },
      outro: "Consultez le dossier du candidat (identité, pièces) avant de décider.",
    }),
  };
}

export function applicationAcceptedTemplate(params: {
  propertyTitle: string;
  contractUrl: string;
}): EmailTemplate {
  const { propertyTitle, contractUrl } = params;
  const subject = `Candidature acceptée : ${propertyTitle} 🎉`;
  const url = contractUrl || `${APP_URL}/tenant/rentals`;
  return {
    subject,
    text: `Bonjour,

Bonne nouvelle ! Votre candidature pour "${propertyTitle}" a été acceptée. Le bailleur prépare votre bail. Vous pourrez le signer puis régler le 1er loyer : ${url}

L'équipe KAZA`,
    html: buildEmail({
      preheader: `Candidature acceptée pour ${propertyTitle}`,
      heading: "Votre candidature est acceptée 🎉",
      paragraphs: [
        `Félicitations ! Le bailleur a retenu votre candidature pour « ${propertyTitle} ». Le bail va vous être transmis pour signature.`,
      ],
      highlight: "Prochaine étape : signez le bail, puis réglez le 1er loyer pour finaliser votre location.",
      button: { label: "Suivre ma location", url },
      outro: "L'équipe KAZA",
    }),
  };
}

export function applicationRejectedTemplate(params: {
  propertyTitle: string;
  reason?: string;
}): EmailTemplate {
  const { propertyTitle, reason } = params;
  const subject = `Réponse à votre candidature : ${propertyTitle}`;
  return {
    subject,
    text: `Bonjour,

Votre candidature pour le bien "${propertyTitle}" n'a pas été retenue${reason ? ` : ${reason}` : "."}. D'autres biens vous attendent sur KAZA : ${APP_URL}/search

L'équipe KAZA`,
    html: buildEmail({
      preheader: `Réponse à votre candidature pour ${propertyTitle}`,
      heading: "Votre candidature n'a pas été retenue",
      paragraphs: [
        `Nous vous remercions de l'intérêt porté à « ${propertyTitle} ». Malheureusement, votre candidature n'a pas été retenue${reason ? ` (${reason})` : ""}.`,
      ],
      button: { label: "Découvrir d'autres biens", url: `${APP_URL}/search`, color: "navy" },
      outro: "Ne baissez pas les bras — de nombreux logements sont disponibles sur KAZA.",
    }),
  };
}

export function contractSignedTemplate(params: {
  propertyTitle: string;
  contractUrl: string;
  fullySigned: boolean;
}): EmailTemplate {
  const { propertyTitle, contractUrl, fullySigned } = params;
  const url = contractUrl || `${APP_URL}/contracts`;
  const subject = fullySigned
    ? `Bail signé par les deux parties : ${propertyTitle}`
    : `Signature reçue : ${propertyTitle}`;
  return {
    subject,
    text: fullySigned
      ? `Bonjour,

Le bail pour "${propertyTitle}" est signé par les deux parties. Vous pouvez désormais finaliser via le paiement du 1er loyer : ${url}

L'équipe KAZA`
      : `Bonjour,

Le bail pour "${propertyTitle}" vient d'être signé par l'autre partie. À vous de le signer pour le finaliser : ${url}

L'équipe KAZA`,
    html: buildEmail({
      preheader: fullySigned
        ? `Bail entièrement signé pour ${propertyTitle}`
        : `Signature reçue pour ${propertyTitle}`,
      heading: fullySigned ? "Bail signé par les deux parties ✅" : "Une signature a été apposée",
      paragraphs: [
        fullySigned
          ? `Le contrat de bail pour « ${propertyTitle} » est désormais signé par le bailleur et le locataire.`
          : `Le contrat de bail pour « ${propertyTitle} » vient d'être signé par l'autre partie. Votre signature est attendue pour finaliser.`,
      ],
      highlight: fullySigned
        ? "Prochaine étape : le règlement du 1er loyer active la location."
        : undefined,
      button: { label: fullySigned ? "Voir le contrat" : "Signer le contrat", url },
      outro: "L'équipe KAZA",
    }),
  };
}

export function rentalActivatedTemplate(params: {
  propertyTitle: string;
  monthlyRent: number;
  forOwner: boolean;
}): EmailTemplate {
  const { propertyTitle, monthlyRent, forOwner } = params;
  const subject = `Location active : ${propertyTitle} 🎉`;
  return {
    subject,
    text: forOwner
      ? `Bonjour,

Le 1er loyer a été réglé : la location de "${propertyTitle}" (${formatXof(monthlyRent)}/mois) est désormais ACTIVE. Votre bien est marqué comme loué.

Détails : ${APP_URL}/owner/rentals

L'équipe KAZA`
      : `Bonjour,

Félicitations ! Votre location de "${propertyTitle}" (${formatXof(monthlyRent)}/mois) est désormais ACTIVE. Bienvenue chez vous !

Détails : ${APP_URL}/tenant/rentals

L'équipe KAZA`,
    html: buildEmail({
      preheader: `Location active : ${propertyTitle}`,
      heading: "Votre location est active 🎉",
      paragraphs: [
        forOwner
          ? `Le 1er loyer a été réglé. La location de « ${propertyTitle} » est désormais active et votre bien est marqué comme loué.`
          : `Félicitations ! Votre location de « ${propertyTitle} » est désormais active. Bienvenue dans votre nouveau logement !`,
      ],
      rows: [
        { label: "Bien", value: propertyTitle },
        { label: "Loyer mensuel", value: formatXof(monthlyRent) },
      ],
      button: {
        label: "Voir ma location",
        url: forOwner ? `${APP_URL}/owner/rentals` : `${APP_URL}/tenant/rentals`,
      },
      outro: "L'équipe KAZA",
    }),
  };
}

export function rentalTerminatedTemplate(params: {
  propertyTitle: string;
  endDate: string;
  forOwner: boolean;
}): EmailTemplate {
  const { propertyTitle, endDate, forOwner } = params;
  const subject = `Bail résilié : ${propertyTitle}`;
  const endLabel = endDate
    ? new Date(endDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "ce jour";
  return {
    subject,
    text: forOwner
      ? `Bonjour,

La location de "${propertyTitle}" a été résiliée (fin au ${endLabel}). Votre bien est de nouveau disponible à la location.

Détails : ${APP_URL}/owner/rentals

L'équipe KAZA`
      : `Bonjour,

Votre location de "${propertyTitle}" a pris fin le ${endLabel}. Nous vous remercions de votre confiance.

Détails : ${APP_URL}/tenant/rentals

L'équipe KAZA`,
    html: buildEmail({
      preheader: `Bail résilié : ${propertyTitle}`,
      heading: "Fin de votre bail",
      paragraphs: [
        forOwner
          ? `La location de « ${propertyTitle} » a été résiliée. Votre bien est de nouveau disponible à la location et peut être proposé à de nouveaux candidats.`
          : `Votre location de « ${propertyTitle} » a pris fin. Nous vous remercions de votre confiance et restons à votre disposition pour votre prochain logement.`,
      ],
      rows: [
        { label: "Bien", value: propertyTitle },
        { label: "Date de fin", value: endLabel },
      ],
      button: {
        label: forOwner ? "Voir mes locations" : "Trouver un logement",
        url: forOwner ? `${APP_URL}/owner/rentals` : `${APP_URL}/search`,
      },
      outro: "L'équipe KAZA",
    }),
  };
}

export function offerReceivedTemplate(params: {
  propertyTitle: string;
  buyerName: string;
  amount: number;
}): EmailTemplate {
  const { propertyTitle, buyerName, amount } = params;
  const subject = `Nouvelle offre d'achat : ${propertyTitle}`;
  return {
    subject,
    text: `Bonjour,

${buyerName} a fait une offre de ${formatXof(amount)} pour votre bien "${propertyTitle}".

Consultez et répondez à l'offre : ${APP_URL}/owner/offers

L'équipe KAZA`,
    html: buildEmail({
      preheader: `Offre de ${formatXof(amount)} pour ${propertyTitle}`,
      heading: "Nouvelle offre d'achat",
      paragraphs: [
        `${buyerName} a fait une offre pour votre bien « ${propertyTitle} ». Vous pouvez l'accepter ou la refuser depuis votre espace.`,
      ],
      rows: [
        { label: "Bien", value: propertyTitle },
        { label: "Acheteur", value: buyerName },
        { label: "Offre", value: formatXof(amount) },
      ],
      button: {
        label: "Voir l'offre",
        url: `${APP_URL}/owner/offers`,
      },
      outro: "L'équipe KAZA",
    }),
  };
}

export function offerDecisionTemplate(params: {
  propertyTitle: string;
  accepted: boolean;
  depositAmount: number;
}): EmailTemplate {
  const { propertyTitle, accepted, depositAmount } = params;
  const subject = accepted
    ? `Votre offre est acceptée : ${propertyTitle}`
    : `Votre offre pour ${propertyTitle}`;
  return {
    subject,
    text: accepted
      ? `Bonjour,

Bonne nouvelle ! Votre offre pour "${propertyTitle}" a été acceptée. Pour réserver le bien, versez l'acompte de réservation de ${formatXof(depositAmount)} via Mobile Money. La vente sera finalisée chez le notaire.

Réserver le bien : ${APP_URL}/buyer/offers

L'équipe KAZA`
      : `Bonjour,

Votre offre pour "${propertyTitle}" n'a pas été retenue par le vendeur. D'autres biens correspondent peut-être à votre recherche.

Voir d'autres biens : ${APP_URL}/search

L'équipe KAZA`,
    html: buildEmail({
      preheader: accepted
        ? `Offre acceptée — réservez ${propertyTitle}`
        : `Réponse à votre offre`,
      heading: accepted ? "Votre offre est acceptée 🎉" : "Réponse à votre offre",
      paragraphs: [
        accepted
          ? `Le vendeur a accepté votre offre pour « ${propertyTitle} ». Versez l'acompte de réservation pour bloquer le bien ; la vente se conclura ensuite chez le notaire.`
          : `Le vendeur n'a pas retenu votre offre pour « ${propertyTitle} ». Continuez votre recherche : de nombreux biens sont disponibles.`,
      ],
      rows: accepted
        ? [
            { label: "Bien", value: propertyTitle },
            { label: "Acompte à verser", value: formatXof(depositAmount) },
          ]
        : [{ label: "Bien", value: propertyTitle }],
      button: accepted
        ? { label: "Réserver le bien", url: `${APP_URL}/buyer/offers` }
        : { label: "Voir d'autres biens", url: `${APP_URL}/search` },
      outro: "L'équipe KAZA",
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
