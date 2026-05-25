// =============================================================================
// KAZA - Edge Function : generate-contract-pdf
// =============================================================================
// Déclenchée par la Server Action `createContract` après insertion d'une ligne
// `contracts` en status='DRAFT'. Elle :
//   1) Récupère le contrat + rental + property + parties via service_role
//   2) Reconstruit le HTML du bail (copie inline du builder pour Deno)
//   3) Upload le rendu dans le bucket privé `contracts` (path: `<id>.html`)
//   4) Met à jour `contracts.pdf_url` + `contract_pdf_url` + status
//
// Le service_role key est fourni par la plateforme Supabase via la variable
// d'environnement `SUPABASE_SERVICE_ROLE_KEY`. Elle n'est jamais exposée au
// client.
// =============================================================================

// @ts-ignore — résolu par le runtime Deno de Supabase Edge Functions
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// -----------------------------------------------------------------------------
// Helpers (copie inline du builder — Deno ne peut pas importer src/lib)
// -----------------------------------------------------------------------------

interface Party {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
}

interface ContractData {
  contractId: string;
  contractNumber: string;
  propertyAddress: string;
  propertyDescription: string;
  monthlyRent: number;
  securityDeposit: number;
  charges?: number;
  startDate: string;
  endDate: string;
  owner: Party;
  tenant: Party;
  signingCity?: string;
}

function esc(input: unknown): string {
  if (input === null || input === undefined) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatFcfa(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(Math.round(amount)) + " FCFA"
  );
}

function formatDateFr(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function durationMonths(s: string, e: string): number {
  try {
    const sd = new Date(s);
    const ed = new Date(e);
    return Math.max(
      1,
      (ed.getFullYear() - sd.getFullYear()) * 12 +
        (ed.getMonth() - sd.getMonth())
    );
  } catch {
    return 12;
  }
}

function buildContractHtml(data: ContractData): string {
  const totalMonthly = data.monthlyRent + (data.charges ?? 0);
  const months = durationMonths(data.startDate, data.endDate);
  const city = data.signingCity ?? "Cotonou";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><title>Contrat n°${esc(data.contractNumber)}</title>
<style>
@page{size:A4;margin:2cm}
body{font-family:Inter,Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.55;color:#1A3A52;max-width:800px;margin:0 auto;padding:24px}
h1{font-size:18pt;text-align:center;margin:0 0 6px}
h2{font-size:12pt;margin:24px 0 8px;padding-bottom:4px;border-bottom:1px solid #1976D2}
.meta{text-align:center;color:#555;margin-bottom:24px;font-size:10pt}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.party{background:#f4f7fa;padding:12px 16px;border-radius:6px}
.party strong{display:block;font-size:10pt;color:#1976D2;text-transform:uppercase;margin-bottom:4px}
dl{margin:0}dl dt{font-weight:600;margin-top:6px}dl dd{margin:0}
p{text-align:justify;margin:8px 0}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:48px}
.signatures .box{border:1px dashed #aab;min-height:120px;padding:12px;border-radius:6px;text-align:center}
.signatures .box small{display:block;color:#1976D2;font-weight:600;margin-bottom:6px;text-transform:uppercase}
table.amounts{width:100%;border-collapse:collapse;margin:12px 0}
table.amounts td{padding:6px 8px;border-bottom:1px solid #e3e8ee}
table.amounts tr:last-child td{border-bottom:0;font-weight:600}
.clause-num{display:inline-block;min-width:28px;font-weight:700;color:#1976D2}
footer{margin-top:32px;font-size:9pt;color:#777;text-align:center}
</style></head><body>
<h1>CONTRAT DE BAIL D'HABITATION</h1>
<div class="meta">Contrat n° <strong>${esc(data.contractNumber)}</strong> &middot; République du Bénin &middot; Établi le ${esc(formatDateFr(new Date().toISOString()))}</div>
<h2>Entre les soussignés</h2>
<div class="parties">
  <div class="party"><strong>Le Bailleur</strong><dl><dd>${esc(data.owner.fullName)}</dd>
    ${data.owner.idNumber ? `<dt>Pièce d'identité</dt><dd>${esc(data.owner.idNumber)}</dd>` : ""}
    ${data.owner.address ? `<dt>Adresse</dt><dd>${esc(data.owner.address)}</dd>` : ""}
    ${data.owner.phone ? `<dt>Téléphone</dt><dd>${esc(data.owner.phone)}</dd>` : ""}
    ${data.owner.email ? `<dt>Email</dt><dd>${esc(data.owner.email)}</dd>` : ""}
  </dl></div>
  <div class="party"><strong>Le Preneur</strong><dl><dd>${esc(data.tenant.fullName)}</dd>
    ${data.tenant.idNumber ? `<dt>Pièce d'identité</dt><dd>${esc(data.tenant.idNumber)}</dd>` : ""}
    ${data.tenant.address ? `<dt>Adresse</dt><dd>${esc(data.tenant.address)}</dd>` : ""}
    ${data.tenant.phone ? `<dt>Téléphone</dt><dd>${esc(data.tenant.phone)}</dd>` : ""}
    ${data.tenant.email ? `<dt>Email</dt><dd>${esc(data.tenant.email)}</dd>` : ""}
  </dl></div>
</div>
<p>Il a été convenu et arrêté ce qui suit, dans le cadre du droit béninois et des Actes uniformes de l'OHADA.</p>
<h2><span class="clause-num">1.</span>Objet et désignation des lieux</h2>
<p><strong>Adresse :</strong> ${esc(data.propertyAddress)}<br/><strong>Description :</strong> ${esc(data.propertyDescription)}</p>
<p>Les lieux sont loués à usage exclusif d'habitation.</p>
<h2><span class="clause-num">2.</span>Durée</h2>
<p>Bail consenti pour ${months} mois, du <strong>${esc(formatDateFr(data.startDate))}</strong> au <strong>${esc(formatDateFr(data.endDate))}</strong>, renouvelable par tacite reconduction sauf préavis écrit de trois (3) mois.</p>
<h2><span class="clause-num">3.</span>Loyer et charges</h2>
<table class="amounts">
<tr><td>Loyer mensuel net</td><td style="text-align:right">${esc(formatFcfa(data.monthlyRent))}</td></tr>
<tr><td>Charges locatives</td><td style="text-align:right">${esc(formatFcfa(data.charges ?? 0))}</td></tr>
<tr><td>Total mensuel</td><td style="text-align:right">${esc(formatFcfa(totalMonthly))}</td></tr>
</table>
<p>Payable d'avance, au plus tard le 5 de chaque mois, par Mobile Money via KAZA. Retard de plus de 15 jours : majoration de 5 %.</p>
<h2><span class="clause-num">4.</span>Dépôt de garantie</h2>
<p>Le Preneur verse une caution de <strong>${esc(formatFcfa(data.securityDeposit))}</strong>, conservée en séquestre par KAZA, restituée sous un (1) mois après remise des clés.</p>
<h2><span class="clause-num">5.</span>État des lieux</h2>
<p>État des lieux contradictoire dressé à l'entrée et à la sortie, photographies datées, signé électroniquement via KAZA.</p>
<h2><span class="clause-num">6.</span>Obligations du Preneur</h2>
<p>Payer le loyer, user paisiblement des lieux, effectuer les réparations locatives, souscrire une assurance habitation, ne pas transformer sans accord, restituer en bon état.</p>
<h2><span class="clause-num">7.</span>Obligations du Bailleur</h2>
<p>Délivrer le logement en bon état, assurer la jouissance paisible, prendre en charge les grosses réparations.</p>
<h2><span class="clause-num">8.</span>Résiliation</h2>
<p>Résiliation de plein droit en cas de non-paiement de deux termes consécutifs ou troubles répétés, un mois après mise en demeure restée sans effet.</p>
<h2><span class="clause-num">9.</span>Droit applicable</h2>
<p>Droit béninois et OHADA. Litiges portés devant les juridictions de <strong>${esc(city)}</strong>.</p>
<h2><span class="clause-num">10.</span>Signature électronique</h2>
<p>Les parties reconnaissent la valeur juridique des signatures électroniques apposées via KAZA (Loi n° 2017-20 portant Code du numérique), scellées par un condensat SHA-256.</p>
<p>Fait à <strong>${esc(city)}</strong>, le ${esc(formatDateFr(new Date().toISOString()))}, en deux exemplaires originaux électroniques.</p>
<div class="signatures">
  <div class="box"><small>Le Bailleur</small><em>${esc(data.owner.fullName)}</em><p style="margin-top:32px;font-size:9pt;color:#888">Signature électronique via KAZA</p></div>
  <div class="box"><small>Le Preneur</small><em>${esc(data.tenant.fullName)}</em><p style="margin-top:32px;font-size:9pt;color:#888">Signature électronique via KAZA</p></div>
</div>
<footer>Document généré par KAZA &middot; Réf. ${esc(data.contractId)}</footer>
</body></html>`;
}

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

interface RequestBody {
  contractId: string;
}

// @ts-ignore — runtime Deno
serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "content-type": "application/json" } }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "JSON invalide" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  if (!body.contractId) {
    return new Response(
      JSON.stringify({ success: false, error: "contractId requis" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  // @ts-ignore — Deno.env disponible côté Edge
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  // @ts-ignore
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Configuration Supabase manquante" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Fetch contract + rental + property + parties
  const { data: contract, error: cErr } = await admin
    .from("contracts")
    .select(
      `id, rental_id, contract_type, status,
       rental:rentals!contracts_rental_id_fkey(
         id, start_date, end_date, monthly_rent, security_deposit, charges,
         tenant:users!rentals_tenant_id_fkey(id, first_name, last_name, email, phone, address),
         property:properties!rentals_property_id_fkey(
           id, title, description, address_line, city, country,
           owner:users!properties_owner_id_fkey(id, first_name, last_name, email, phone, address)
         )
       )`
    )
    .eq("id", body.contractId)
    .single();

  if (cErr || !contract || !contract.rental) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Contrat introuvable: ${cErr?.message ?? "inconnu"}`,
      }),
      { status: 404, headers: { "content-type": "application/json" } }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = contract.rental;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = r.property;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = p?.owner ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t: any = r.tenant ?? {};

  const data: ContractData = {
    contractId: contract.id,
    contractNumber: contract.id.slice(0, 8).toUpperCase(),
    propertyAddress: [p?.address_line, p?.city, p?.country].filter(Boolean).join(", "),
    propertyDescription: p?.title ?? p?.description ?? "Bien immobilier",
    monthlyRent: Number(r.monthly_rent ?? 0),
    securityDeposit: Number(r.security_deposit ?? r.monthly_rent ?? 0),
    charges: r.charges ? Number(r.charges) : undefined,
    startDate: r.start_date,
    endDate: r.end_date,
    owner: {
      fullName: `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim() || "Propriétaire",
      email: o.email,
      phone: o.phone,
      address: o.address,
    },
    tenant: {
      fullName: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "Locataire",
      email: t.email,
      phone: t.phone,
      address: t.address,
    },
    signingCity: p?.city ?? "Cotonou",
  };

  // 2) Generate HTML
  const html = buildContractHtml(data);
  const bytes = new TextEncoder().encode(html);

  // 3) Upload to private bucket
  const objectPath = `${contract.id}.html`;
  const { error: upErr } = await admin.storage
    .from("contracts")
    .upload(objectPath, bytes, {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });

  if (upErr) {
    return new Response(
      JSON.stringify({ success: false, error: `Upload échec: ${upErr.message}` }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // 4) Update contract row
  const nextStatus =
    contract.status === "DRAFT" ? "PENDING_TENANT" : contract.status;

  const { error: updErr } = await admin
    .from("contracts")
    .update({
      pdf_url: objectPath,
      contract_pdf_url: objectPath,
      status: nextStatus,
    })
    .eq("id", contract.id);

  if (updErr) {
    return new Response(
      JSON.stringify({ success: false, error: `Update échec: ${updErr.message}` }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, pdfUrl: objectPath }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
});
