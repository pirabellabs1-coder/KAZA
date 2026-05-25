import "server-only";

// =============================================================================
// KAZA - Constructeur de contrat de bail (Bénin)
// =============================================================================
// Génère le HTML d'un bail conforme au droit OHADA / béninois, puis l'enveloppe
// dans un Buffer pour upload Supabase Storage.
//
// MVP : on stocke directement le HTML rendu (binaire UTF-8). Le navigateur du
// locataire/propriétaire affichera le document dans une <iframe>.
//
// TODO(wave3) : remplacer `buildContractPdf` par un vrai rendu PDF via
// `@react-pdf/renderer` (composants React → PDF binaire) ou `puppeteer-core`
// (Chromium headless → print-to-pdf). Le HTML actuel est déjà print-friendly.
// =============================================================================

export interface ContractParty {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  /** Numéro de pièce d'identité (CNI, passeport...) */
  idNumber?: string;
}

export interface ContractData {
  contractId: string;
  contractNumber: string;
  /** Adresse complète du bien loué */
  propertyAddress: string;
  /** Description courte (T2 meublé, surface, étage, etc.) */
  propertyDescription: string;
  /** Loyer mensuel en FCFA (XOF) */
  monthlyRent: number;
  /** Caution en FCFA (souvent 2-3 mois de loyer) */
  securityDeposit: number;
  /** Charges mensuelles en FCFA (eau, électricité, gardiennage...) */
  charges?: number;
  /** Date de prise d'effet (ISO `YYYY-MM-DD`) */
  startDate: string;
  /** Date de fin (ISO `YYYY-MM-DD`) */
  endDate: string;
  owner: ContractParty;
  tenant: ContractParty;
  /** Ville où le bail est signé (pour la mention "Fait à ...") */
  signingCity?: string;
}

// -----------------------------------------------------------------------------
// Helpers de formatage (FR-BJ)
// -----------------------------------------------------------------------------

function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(Math.round(amount)) + " FCFA";
}

function formatDateFr(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

function esc(input: string | number | undefined | null): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function durationMonths(startIso: string, endIso: string): number {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    return Math.max(
      1,
      (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
    );
  } catch {
    return 12;
  }
}

// -----------------------------------------------------------------------------
// buildContractHtml
// -----------------------------------------------------------------------------

export function buildContractHtml(data: ContractData): string {
  const totalMonthly = data.monthlyRent + (data.charges ?? 0);
  const months = durationMonths(data.startDate, data.endDate);
  const city = data.signingCity ?? "Cotonou";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Contrat de bail n°${esc(data.contractNumber)}</title>
  <style>
    @page { size: A4; margin: 2cm 2cm 2.5cm 2cm; }
    body {
      font-family: "Inter", "Helvetica", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.55;
      color: #1A3A52;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      font-size: 18pt;
      text-align: center;
      margin: 0 0 6px;
      letter-spacing: 0.5px;
    }
    h2 {
      font-size: 12pt;
      margin: 24px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #1976D2;
      color: #1A3A52;
    }
    .meta { text-align: center; color: #555; margin-bottom: 24px; font-size: 10pt; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .party { background: #f4f7fa; padding: 12px 16px; border-radius: 6px; }
    .party strong { display: block; font-size: 10pt; color: #1976D2; text-transform: uppercase; margin-bottom: 4px; }
    dl { margin: 0; }
    dl dt { font-weight: 600; margin-top: 6px; }
    dl dd { margin: 0; }
    p { text-align: justify; margin: 8px 0; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 48px; }
    .signatures .box { border: 1px dashed #aab; min-height: 120px; padding: 12px; border-radius: 6px; text-align: center; }
    .signatures .box small { display: block; color: #1976D2; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .signatures .box em { color: #888; font-style: italic; }
    table.amounts { width: 100%; border-collapse: collapse; margin: 12px 0; }
    table.amounts td { padding: 6px 8px; border-bottom: 1px solid #e3e8ee; }
    table.amounts tr:last-child td { border-bottom: 0; font-weight: 600; }
    .clause-num { display: inline-block; min-width: 28px; font-weight: 700; color: #1976D2; }
    footer { margin-top: 32px; font-size: 9pt; color: #777; text-align: center; }
  </style>
</head>
<body>
  <h1>CONTRAT DE BAIL D'HABITATION</h1>
  <div class="meta">
    Contrat n° <strong>${esc(data.contractNumber)}</strong>
    &nbsp;&middot;&nbsp; République du Bénin
    &nbsp;&middot;&nbsp; Établi le ${esc(formatDateFr(new Date().toISOString()))}
  </div>

  <h2>Entre les soussignés</h2>
  <div class="parties">
    <div class="party">
      <strong>Le Bailleur (Propriétaire)</strong>
      <dl>
        <dd>${esc(data.owner.fullName)}</dd>
        ${data.owner.idNumber ? `<dt>Pièce d'identité</dt><dd>${esc(data.owner.idNumber)}</dd>` : ""}
        ${data.owner.address ? `<dt>Adresse</dt><dd>${esc(data.owner.address)}</dd>` : ""}
        ${data.owner.phone ? `<dt>Téléphone</dt><dd>${esc(data.owner.phone)}</dd>` : ""}
        ${data.owner.email ? `<dt>Email</dt><dd>${esc(data.owner.email)}</dd>` : ""}
      </dl>
    </div>
    <div class="party">
      <strong>Le Preneur (Locataire)</strong>
      <dl>
        <dd>${esc(data.tenant.fullName)}</dd>
        ${data.tenant.idNumber ? `<dt>Pièce d'identité</dt><dd>${esc(data.tenant.idNumber)}</dd>` : ""}
        ${data.tenant.address ? `<dt>Adresse</dt><dd>${esc(data.tenant.address)}</dd>` : ""}
        ${data.tenant.phone ? `<dt>Téléphone</dt><dd>${esc(data.tenant.phone)}</dd>` : ""}
        ${data.tenant.email ? `<dt>Email</dt><dd>${esc(data.tenant.email)}</dd>` : ""}
      </dl>
    </div>
  </div>
  <p>Il a été convenu et arrêté ce qui suit, dans le cadre des dispositions du droit
  béninois et des Actes uniformes de l'OHADA applicables au bail à usage d'habitation.</p>

  <h2><span class="clause-num">1.</span>Objet du bail et désignation des lieux loués</h2>
  <p>Le Bailleur donne à bail au Preneur, qui accepte, le bien immobilier ci-après désigné :</p>
  <p><strong>Adresse :</strong> ${esc(data.propertyAddress)}<br />
  <strong>Description :</strong> ${esc(data.propertyDescription)}</p>
  <p>Les lieux sont loués à usage exclusif d'habitation. Toute affectation commerciale,
  artisanale, professionnelle ou de sous-location, totale ou partielle, est interdite
  sans accord écrit préalable du Bailleur.</p>

  <h2><span class="clause-num">2.</span>Durée</h2>
  <p>Le présent bail est consenti pour une durée de <strong>${months} mois</strong>,
  prenant effet le <strong>${esc(formatDateFr(data.startDate))}</strong> pour se terminer
  le <strong>${esc(formatDateFr(data.endDate))}</strong>. Il pourra être renouvelé par
  tacite reconduction sauf dénonciation par l'une des parties moyennant un préavis de
  trois (3) mois notifié par écrit.</p>

  <h2><span class="clause-num">3.</span>Loyer et charges</h2>
  <table class="amounts">
    <tr><td>Loyer mensuel net</td><td style="text-align:right">${esc(formatFcfa(data.monthlyRent))}</td></tr>
    <tr><td>Charges locatives (eau, électricité communes, gardiennage)</td><td style="text-align:right">${esc(formatFcfa(data.charges ?? 0))}</td></tr>
    <tr><td>Total mensuel à payer</td><td style="text-align:right">${esc(formatFcfa(totalMonthly))}</td></tr>
  </table>
  <p>Le loyer est payable d'avance, au plus tard le 5 de chaque mois, par Mobile Money
  via la plateforme KAZA (FedaPay / Kkiapay), virement bancaire ou tout autre moyen
  convenu entre les parties. Tout retard de paiement supérieur à quinze (15) jours
  donnera lieu à une majoration de 5 % du montant dû et pourra entraîner la résiliation
  du présent bail.</p>

  <h2><span class="clause-num">4.</span>Dépôt de garantie (caution)</h2>
  <p>À titre de garantie de la bonne exécution de ses obligations, le Preneur verse
  au Bailleur, le jour de la signature, un dépôt de garantie d'un montant de
  <strong>${esc(formatFcfa(data.securityDeposit))}</strong>. Cette somme est conservée
  en séquestre (escrow) par la plateforme KAZA et sera restituée au Preneur dans un
  délai maximum d'un (1) mois après la restitution des clés, déduction faite des
  éventuelles sommes dues et des coûts de remise en état.</p>

  <h2><span class="clause-num">5.</span>État des lieux</h2>
  <p>Un état des lieux contradictoire, accompagné de photographies datées, sera dressé
  à l'entrée du Preneur dans les lieux, puis à sa sortie. Les deux états des lieux sont
  joints au présent contrat et signés électroniquement par les parties via la
  plateforme KAZA.</p>

  <h2><span class="clause-num">6.</span>Obligations du Preneur</h2>
  <p>Le Preneur s'engage à : (a) payer le loyer et les charges aux dates convenues ;
  (b) user paisiblement des lieux loués en bon père de famille ; (c) effectuer les
  réparations locatives et menus entretiens conformément à l'usage ; (d) souscrire une
  assurance habitation couvrant les risques locatifs (incendie, dégât des eaux,
  responsabilité civile) ; (e) ne pas transformer les lieux sans accord écrit du
  Bailleur ; (f) restituer les lieux en bon état à la fin du bail.</p>

  <h2><span class="clause-num">7.</span>Obligations du Bailleur</h2>
  <p>Le Bailleur s'engage à : (a) délivrer le logement en bon état d'usage et de
  réparation ; (b) assurer au Preneur la jouissance paisible des lieux pendant toute
  la durée du bail ; (c) prendre en charge les grosses réparations affectant la
  structure du bâti ; (d) ne pas s'opposer aux aménagements légers ne modifiant pas la
  destination des lieux.</p>

  <h2><span class="clause-num">8.</span>Résiliation</h2>
  <p>Le présent bail pourra être résilié de plein droit, sans formalité judiciaire,
  en cas : (a) de non-paiement de deux (2) termes consécutifs de loyer ; (b) de
  non-respect des obligations essentielles ci-dessus ; (c) de troubles répétés
  causés au voisinage. La résiliation interviendra un mois après mise en demeure
  restée sans effet.</p>

  <h2><span class="clause-num">9.</span>Droit applicable et juridiction</h2>
  <p>Le présent contrat est soumis au droit béninois et aux Actes uniformes de l'OHADA
  applicables au bail à usage d'habitation. Tout litige relatif à son interprétation
  ou à son exécution sera, à défaut d'accord amiable, porté devant les juridictions
  compétentes de <strong>${esc(city)}</strong>.</p>

  <h2><span class="clause-num">10.</span>Signature électronique</h2>
  <p>Les parties reconnaissent la valeur juridique de la signature électronique
  apposée via la plateforme KAZA, conformément à la Loi n° 2017-20 du 20 avril 2018
  portant Code du numérique en République du Bénin. Chaque signature est horodatée et
  scellée par un condensat cryptographique SHA-256 conservé en base de données.</p>

  <p>Fait à <strong>${esc(city)}</strong>, le ${esc(formatDateFr(new Date().toISOString()))},
  en deux (2) exemplaires originaux électroniques, un pour chacune des parties.</p>

  <div class="signatures">
    <div class="box">
      <small>Le Bailleur</small>
      <em>${esc(data.owner.fullName)}</em>
      <p style="margin-top:32px;font-size:9pt;color:#888">Signature électronique apposée<br/>via la plateforme KAZA</p>
    </div>
    <div class="box">
      <small>Le Preneur</small>
      <em>${esc(data.tenant.fullName)}</em>
      <p style="margin-top:32px;font-size:9pt;color:#888">Signature électronique apposée<br/>via la plateforme KAZA</p>
    </div>
  </div>

  <footer>
    Document généré par KAZA &middot; Référence ${esc(data.contractId)} &middot;
    Ce document a valeur légale une fois signé par les deux parties.
  </footer>
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// buildContractPdf
// -----------------------------------------------------------------------------
// MVP : retourne le HTML enveloppé dans un Buffer (UTF-8). Le content-type
// uploadé restera `text/html` (cf. action/edge function) pour l'affichage en
// iframe. Wave 3 remplacera ceci par un vrai PDF binaire.

export async function buildContractPdf(data: ContractData): Promise<Buffer> {
  const html = buildContractHtml(data);
  // TODO(wave3) : remplacer par @react-pdf/renderer ou puppeteer-core pour un
  // vrai PDF binaire. Exemple :
  //   const pdfStream = await renderToStream(<ContractPdf data={data} />);
  //   return Buffer.from(await streamToArrayBuffer(pdfStream));
  return Buffer.from(html, "utf-8");
}
