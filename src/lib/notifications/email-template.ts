import "server-only";

// =============================================================================
// Kaabo — Gabarit email transactionnel (marque Kaabo)
//
// Un seul gabarit responsive, compatible clients mail (Gmail, Outlook, Apple
// Mail, mobile) : tables + styles inline, largeur 600px, polices web-safe.
// Toutes les actions du site (inscription, paiement, visite, KYC, contact…)
// passent par `buildEmail` pour un rendu cohérent et soigné.
// =============================================================================

const NAVY = "#1A3A52";
const BLUE = "#1976D2";
const GREEN = "#4CAF50";
const TEXT = "#374151";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const BG = "#F3F4F6";

const CONTACT_EMAIL = "immobilierkaza@gmail.com";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://kaza-jade.vercel.app";

export interface EmailButton {
  label: string;
  url: string;
  /** Couleur du bouton : "green" (défaut) ou "navy". */
  color?: "green" | "navy";
}

export interface EmailRow {
  label: string;
  value: string;
}

export interface BuildEmailParams {
  /** Texte d'aperçu masqué (preview boîte de réception). */
  preheader?: string;
  /** Titre principal dans la carte (optionnel si le bloc `rawHtml` porte
   *  déjà son propre titre). */
  heading?: string;
  /** Ligne d'accroche / salutation (ex. « Bonjour Awa, »). */
  intro?: string;
  /** Paragraphes de corps (texte brut, échappé automatiquement). */
  paragraphs?: string[];
  /** Tableau d'informations clé/valeur (récap commande, paiement…). */
  rows?: EmailRow[];
  /** Bouton d'action principal. */
  button?: EmailButton;
  /** Ligne de clôture (ex. « L'équipe Kaabo »). */
  outro?: string;
  /** Encart info optionnel (texte mis en avant, fond bleu clair). */
  highlight?: string;
  /** Bloc HTML déjà échappé pour cas particuliers (inséré tel quel). */
  rawHtml?: string;
}

function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderButton(btn: EmailButton): string {
  const bg = btn.color === "navy" ? NAVY : GREEN;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr>
      <td align="center" bgcolor="${bg}" style="border-radius:9999px;">
        <a href="${esc(btn.url)}" target="_blank"
           style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:9999px;">
          ${esc(btn.label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function renderRows(rows: EmailRow[]): string {
  const trs = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:10px 0;border-top:${i === 0 ? "none" : `1px solid ${BORDER}`};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${MUTED};">${esc(r.label)}</td>
        <td align="right" style="padding:10px 0;border-top:${i === 0 ? "none" : `1px solid ${BORDER}`};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${NAVY};">${esc(r.value)}</td>
      </tr>`,
    )
    .join("");
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="margin:20px 0;border:1px solid ${BORDER};border-radius:10px;padding:6px 16px;">
    ${trs}
  </table>`;
}

export function buildEmail(params: BuildEmailParams): string {
  const {
    preheader,
    heading,
    intro,
    paragraphs = [],
    rows,
    button,
    outro,
    highlight,
    rawHtml,
  } = params;

  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT};">${esc(p)}</p>`,
    )
    .join("");

  const introHtml = intro
    ? `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${TEXT};">${esc(intro)}</p>`
    : "";

  const highlightHtml = highlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
         <tr><td style="background:#EAF2FB;border-left:4px solid ${BLUE};border-radius:6px;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${NAVY};">${esc(highlight)}</td></tr>
       </table>`
    : "";

  const outroHtml = outro
    ? `<p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${TEXT};">${esc(outro)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${esc(heading ?? preheader ?? "Kaabo")}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(preheader ?? heading ?? "")}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:8px 0 20px;">
              <span style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;letter-spacing:1px;color:${NAVY};">Kaabo<span style="color:${GREEN};">.</span></span>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};margin-top:2px;">Immobilier en Afrique</div>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:36px 34px;">
              ${heading ? `<h1 style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:800;color:${NAVY};">${esc(heading)}</h1>` : ""}
              ${introHtml}
              ${highlightHtml}
              ${paragraphsHtml}
              ${rawHtml ?? ""}
              ${rows && rows.length ? renderRows(rows) : ""}
              ${button ? renderButton(button) : ""}
              ${outroHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 16px 8px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">
                Une question ? Écrivez-nous à
                <a href="mailto:${CONTACT_EMAIL}" style="color:${BLUE};text-decoration:none;">${CONTACT_EMAIL}</a>
              </p>
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">
                <a href="${SITE_URL}" style="color:${MUTED};text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
                &nbsp;·&nbsp; Kaabo, une plateforme PIRABEL LABS
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;">
                Cet email vous a été envoyé suite à une action sur votre compte ou à votre demande.
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
