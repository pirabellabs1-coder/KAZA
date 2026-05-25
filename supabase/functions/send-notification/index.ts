// =============================================================================
// KAZA - Edge Function : send-notification
// Wave 3 - Kwame Asante
//
// Endpoint Deno permettant l'envoi de notifications depuis n'importe où via
// fetch : webhooks externes, scheduled jobs Supabase, autres edge functions.
//
// Reproduit la logique de `src/lib/notifications/dispatch.ts` côté Deno :
//   - lecture user (email) + push tokens via service_role
//   - insert dans `notifications` (canal in_app)
//   - POST FCM (https://fcm.googleapis.com/fcm/send) pour le canal push
//   - POST Resend (https://api.resend.com/emails) pour le canal email
//
// Body attendu : { userId: string, type: string, data: Record<string,unknown>,
//                  channels?: ('in_app' | 'push' | 'email')[] }
// Auth : header `Authorization: Bearer <service_role|anon>` (vérif minimaliste).
// =============================================================================

// @ts-ignore — résolu par le runtime Deno de Supabase Edge Functions
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// @ts-ignore — `Deno` global présent uniquement à l'exécution
declare const Deno: { env: { get(key: string): string | undefined } };

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Channel = "in_app" | "push" | "email";

type NotifType =
  | "visit_request"
  | "payment_received"
  | "contract_ready"
  | "verification_approved"
  | "verification_rejected"
  | "welcome";

interface DispatchBody {
  userId?: string;
  type?: NotifType;
  data?: Record<string, unknown>;
  channels?: Channel[];
}

interface PushPayload {
  title: string;
  body: string;
  link?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const DEFAULT_CHANNELS: Record<NotifType, Channel[]> = {
  visit_request: ["in_app", "push", "email"],
  payment_received: ["in_app", "push", "email"],
  contract_ready: ["in_app", "push", "email"],
  verification_approved: ["in_app", "push", "email"],
  verification_rejected: ["in_app", "push", "email"],
  welcome: ["in_app", "email"],
};

const IN_APP_TYPE: Record<NotifType, string> = {
  visit_request: "visit_request",
  payment_received: "payment_received",
  contract_ready: "contract_ready",
  verification_approved: "identity_approved",
  verification_rejected: "identity_rejected",
  welcome: "system",
};

const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://kaza.africa";
const BRAND_NAVY = "#1A3A52";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function asString(v: unknown, fb = ""): string {
  return typeof v === "string" ? v : fb;
}

function asNumber(v: unknown, fb = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fb;
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

function formatXof(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function buildPush(type: NotifType, data: Record<string, unknown>): PushPayload {
  switch (type) {
    case "visit_request":
      return {
        title: "Nouvelle demande de visite",
        body: `${asString(data.requesterName, "Un utilisateur")} veut visiter "${asString(data.propertyTitle, "votre bien")}".`,
        link: "/dashboard/visites",
      };
    case "payment_received":
      return {
        title: "Paiement reçu",
        body: `Vous avez reçu ${formatXof(asNumber(data.amount))} pour "${asString(data.propertyTitle, "votre bien")}".`,
        link: "/dashboard/paiements",
      };
    case "contract_ready":
      return {
        title: "Contrat prêt",
        body: `Votre contrat pour "${asString(data.propertyTitle, "le bien")}" est disponible.`,
        link: asString(data.contractUrl, "/dashboard/contrats"),
      };
    case "verification_approved":
      return {
        title: "Identité vérifiée",
        body: "Votre profil affiche désormais le badge Vérifié.",
        link: "/dashboard/profil",
      };
    case "verification_rejected":
      return {
        title: "Vérification à recommencer",
        body: asString(data.reason, "Merci de soumettre à nouveau vos documents."),
        link: "/dashboard/verification",
      };
    case "welcome":
      return {
        title: "Bienvenue sur KAZA",
        body: `Bonjour ${asString(data.firstName, "")}, explorez des milliers d'annonces.`,
        link: "/dashboard",
      };
  }
}

/** Layout email simplifié (parité visuelle avec templates.ts côté Next). */
function emailLayout(bodyHtml: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Inter',Arial,sans-serif;color:#1f2937;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:${BRAND_NAVY};padding:24px 32px;">
  <h1 style="margin:0;color:#fff;font-size:24px;">KAZA</h1>
  <p style="margin:4px 0 0;color:#cbd5e1;font-size:13px;">L'immobilier en Afrique, en toute confiance.</p>
</td></tr>
<tr><td style="padding:32px;">${bodyHtml}</td></tr>
<tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
  <p style="margin:0;color:#6b7280;font-size:12px;">
    Vous recevez cet email parce que vous êtes inscrit sur KAZA.
    <a href="${APP_URL}/parametres/notifications" style="color:#1976D2;text-decoration:none;">Gérer mes préférences</a>
  </p>
  <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} KAZA · Cotonou, Bénin</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function buildEmail(type: NotifType, data: Record<string, unknown>): EmailTemplate | null {
  const push = buildPush(type, data);

  switch (type) {
    case "visit_request":
      return {
        subject: `Nouvelle demande de visite : ${asString(data.propertyTitle, "votre bien")}`,
        html: emailLayout(
          `<h2 style="margin:0 0 16px;color:${BRAND_NAVY};">Nouvelle demande de visite</h2>
          <p>${esc(asString(data.requesterName, "Un utilisateur"))} souhaite visiter <strong>${esc(asString(data.propertyTitle))}</strong>.</p>
          <p>Date proposée : <strong>${esc(asString(data.date, "non précisée"))}</strong></p>
          <p><a href="${APP_URL}/dashboard/visites" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voir la demande</a></p>`,
        ),
      };
    case "payment_received":
      return {
        subject: `Paiement reçu : ${formatXof(asNumber(data.amount))}`,
        html: emailLayout(
          `<h2 style="margin:0 0 16px;color:${BRAND_NAVY};">Paiement reçu</h2>
          <p>Vous avez reçu <strong>${formatXof(asNumber(data.amount))}</strong> pour <strong>${esc(asString(data.propertyTitle))}</strong>.</p>
          <p style="color:#6b7280;font-size:14px;">Le montant est en séquestre et sera libéré selon les conditions de la location.</p>
          <p><a href="${APP_URL}/dashboard/paiements" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voir mes paiements</a></p>`,
        ),
      };
    case "contract_ready":
      return {
        subject: `Votre contrat est prêt : ${asString(data.propertyTitle)}`,
        html: emailLayout(
          `<h2 style="margin:0 0 16px;color:${BRAND_NAVY};">Votre contrat est prêt</h2>
          <p>Le contrat de location pour <strong>${esc(asString(data.propertyTitle))}</strong> est disponible.</p>
          <p><a href="${esc(asString(data.contractUrl, APP_URL))}" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Consulter et signer</a></p>`,
        ),
      };
    case "verification_approved":
      return {
        subject: "Votre identité a été vérifiée",
        html: emailLayout(
          `<h2 style="margin:0 0 16px;color:${BRAND_NAVY};">Identité vérifiée</h2>
          <p>Bonjour ${esc(asString(data.firstName))}, votre identité a été validée. Votre badge Vérifié est désormais visible.</p>
          <p><a href="${APP_URL}/dashboard/profil" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Voir mon profil</a></p>`,
        ),
      };
    case "verification_rejected":
      return {
        subject: "Votre vérification d'identité nécessite une action",
        html: emailLayout(
          `<h2 style="margin:0 0 16px;color:${BRAND_NAVY};">Vérification non aboutie</h2>
          <p>Bonjour ${esc(asString(data.firstName))}, nous n'avons pas pu valider votre pièce d'identité.</p>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:12px 0;border-radius:4px;color:#78350f;">${esc(asString(data.reason, "Document non conforme."))}</div>
          <p><a href="${APP_URL}/dashboard/verification" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Recommencer</a></p>`,
        ),
      };
    case "welcome":
      return {
        subject: `Bienvenue sur KAZA, ${asString(data.firstName)} !`,
        html: emailLayout(
          `<h2 style="margin:0 0 16px;color:${BRAND_NAVY};">Bienvenue ${esc(asString(data.firstName))} !</h2>
          <p>Nous sommes ravis de vous compter parmi nous. Découvrez des milliers d'annonces vérifiées.</p>
          <p><a href="${APP_URL}/dashboard" style="display:inline-block;background:#1976D2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Mon tableau de bord</a></p>`,
        ),
      };
  }
  // Fallback — log pour signaler un type non géré
  console.warn("[send-notification] unknown type", type, push.title);
  return null;
}

// -----------------------------------------------------------------------------
// Senders
// -----------------------------------------------------------------------------

async function sendFcm(token: string, payload: PushPayload): Promise<boolean> {
  const serverKey = Deno.env.get("FCM_SERVER_KEY");
  if (!serverKey) {
    console.log("[FCM DEV]", token.slice(0, 12) + "…", payload.title);
    return true;
  }
  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
          click_action: payload.link,
        },
      }),
    });
    if (!res.ok) {
      console.error("[fcm]", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[fcm] exception", err);
    return false;
  }
}

async function sendResendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("NOTIFICATIONS_FROM_EMAIL") ?? "noreply@kaza.africa";
  const fromName = Deno.env.get("NOTIFICATIONS_FROM_NAME") ?? "KAZA";
  if (!apiKey) {
    console.log("[RESEND DEV]", "to=", to, "subject=", subject);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[resend]", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[resend] exception", err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// HTTP handler
// -----------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auth minimale : présence du header Authorization (la plateforme Supabase
  // valide déjà le JWT en amont quand `--no-verify-jwt` n'est pas passé).
  const auth = req.headers.get("Authorization");
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: DispatchBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId, type, data = {} } = body;
  if (!userId || !type) {
    return new Response(
      JSON.stringify({ error: "Missing userId or type" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const channels = body.channels ?? DEFAULT_CHANNELS[type];
  if (!channels) {
    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[send-notification] missing SUPABASE_URL or SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // -- 1. Fetch destinataire ------------------------------------------------
  let userEmail: string | null = null;
  try {
    const { data: user, error } = await admin
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    if (error || !user) {
      console.error("[send-notification] user lookup failed", userId, error?.message);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    userEmail = (user as { email: string }).email;
  } catch (err) {
    console.error("[send-notification] user fetch error", err);
    return new Response(JSON.stringify({ error: "User fetch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Tokens push
  let pushTokens: string[] = [];
  if (channels.includes("push")) {
    try {
      const { data: tokens } = await admin
        .from("user_push_tokens")
        .select("token")
        .eq("user_id", userId)
        .eq("enabled", true);
      pushTokens = ((tokens ?? []) as Array<{ token: string }>)
        .map((r) => r.token)
        .filter((t) => typeof t === "string" && t.length > 0);
    } catch (err) {
      console.warn("[send-notification] push tokens lookup failed", err);
    }
  }

  const push = buildPush(type, data);
  const results: Record<string, unknown> = {};

  // -- 2. in_app ------------------------------------------------------------
  if (channels.includes("in_app")) {
    try {
      const { error } = await admin.from("notifications").insert({
        user_id: userId,
        type: IN_APP_TYPE[type],
        title: push.title,
        body: push.body,
        link: push.link ?? null,
        metadata: data,
      });
      if (error) {
        console.error("[send-notification] in_app insert", error.message);
        results.in_app = { success: false, error: error.message };
      } else {
        results.in_app = { success: true };
      }
    } catch (err) {
      console.error("[send-notification] in_app exception", err);
      results.in_app = { success: false, error: "exception" };
    }
  }

  // -- 3. push --------------------------------------------------------------
  if (channels.includes("push") && pushTokens.length > 0) {
    const sent = await Promise.all(pushTokens.map((t) => sendFcm(t, push)));
    const successCount = sent.filter(Boolean).length;
    results.push = { sent: successCount, total: pushTokens.length };
  } else if (channels.includes("push")) {
    results.push = { sent: 0, total: 0 };
  }

  // -- 4. email -------------------------------------------------------------
  if (channels.includes("email") && userEmail) {
    const tpl = buildEmail(type, data);
    if (tpl) {
      const ok = await sendResendEmail(userEmail, tpl.subject, tpl.html);
      results.email = { success: ok };
    } else {
      results.email = { success: false, error: "no template" };
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
