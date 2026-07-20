import "server-only";

// =============================================================================
// Kaabo - Twilio SMS Helper
// Wave 2 - Aminata Traoré
//
// Helper d'envoi de SMS via l'API Twilio Programmable Messaging
// (POST /2010-04-01/Accounts/{SID}/Messages.json, Basic auth).
//
// Comportement selon les credentials :
//   - Credentials présents (SID + token + numéro émetteur) → appel API réel,
//     on retourne le `sid` Twilio.
//   - Credentials absents EN DÉVELOPPEMENT (NODE_ENV !== 'production') → mode
//     "DEV" : on logge le SMS en console et on retourne un succès simulé
//     explicite (messageId préfixé "dev-").
//   - Credentials absents EN PRODUCTION → échec explicite { success:false } :
//     on ne prétend jamais avoir envoyé le SMS.
// =============================================================================

import crypto from "node:crypto";

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Erreur de configuration affichée quand les credentials manquent. */
const MISSING_CREDS_ERROR =
  "Service SMS indisponible (configuration Twilio manquante). Réessayez plus tard.";

/**
 * Envoie un SMS via Twilio. En l'absence de credentials :
 *   - en dev, log le contenu en console et retourne un succès simulé ;
 *   - en production, retourne un échec explicite (jamais de faux succès).
 *
 * @param to     Numéro destinataire au format E.164 (+22996123456).
 * @param message Texte du SMS (max ~160 caractères pour un segment unique).
 */
export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  // Credentials incomplets : dev → succès simulé, prod → échec explicite.
  if (!accountSid || !authToken || !fromNumber) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[SMS DEV]", to, "→", message);
      return {
        success: true,
        messageId: "dev-" + crypto.randomBytes(4).toString("hex"),
      };
    }
    console.error(
      "[SMS] Credentials Twilio manquants en production — envoi impossible."
    );
    return { success: false, error: MISSING_CREDS_ERROR };
  }

  // Appel API Twilio réel.
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: fromNumber,
    To: to,
    Body: message,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const json = (await res.json().catch(() => null)) as {
      sid?: string;
      message?: string;
      code?: number;
    } | null;

    if (!res.ok) {
      const errMsg =
        json?.message ?? `Erreur Twilio (HTTP ${res.status}).`;
      console.error("[SMS] Échec Twilio:", res.status, errMsg);
      return { success: false, error: errMsg };
    }

    if (!json?.sid) {
      console.error("[SMS] Réponse Twilio sans sid:", json);
      return { success: false, error: "Réponse Twilio invalide." };
    }

    return { success: true, messageId: json.sid };
  } catch (err) {
    console.error(
      "[SMS] Erreur réseau lors de l'appel Twilio:",
      err instanceof Error ? err.message : err
    );
    return {
      success: false,
      error: "Impossible de contacter le service SMS. Réessayez dans un instant.",
    };
  }
}

/**
 * Génère un OTP à 6 chiffres et son hash SHA-256.
 * On ne stocke jamais le code en clair en DB ; on compare les hashs au moment
 * de la vérification.
 */
export function generateOtp(): { code: string; hash: string } {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, hash };
}

/** Hash SHA-256 d'un code utilisateur pour comparaison en DB. */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}
