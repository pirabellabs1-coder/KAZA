import "server-only";

// =============================================================================
// KAZA - Twilio SMS Helper (placeholder)
// Wave 2 - Aminata Traoré
//
// Helper minimaliste pour l'envoi de SMS via Twilio. Tant que les credentials
// Twilio ne sont pas configurés (TWILIO_ACCOUNT_SID), on tombe sur un mode
// "DEV" qui logge le SMS dans la console et retourne un message id factice.
//
// L'appel réel Twilio (POST /2010-04-01/Accounts/{SID}/Messages.json) est à
// brancher quand la décision sera prise (Twilio Programmable SMS ou Verify API).
// =============================================================================

import crypto from "node:crypto";

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoie un SMS via Twilio. En l'absence de credentials, log le contenu en
 * console (mode DEV) — pratique pour tester le tunnel d'OTP sans facturation.
 *
 * @param to     Numéro destinataire au format E.164 (+22996123456).
 * @param message Texte du SMS (max ~160 caractères pour un segment unique).
 */
export async function sendSms(to: string, message: string): Promise<SmsResult> {
  // Mode DEV : pas de credentials → on logge le SMS et on retourne un id factice.
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log("[SMS DEV]", to, "→", message);
    return {
      success: true,
      messageId: "dev-" + crypto.randomBytes(4).toString("hex"),
    };
  }

  // TODO: appel API Twilio réel
  // const auth = Buffer.from(
  //   `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  // ).toString("base64");
  // const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  // const body = new URLSearchParams({
  //   To: to,
  //   From: process.env.TWILIO_PHONE_NUMBER!,
  //   Body: message,
  // });
  // const res = await fetch(url, {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Basic ${auth}`,
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  //   body,
  // });
  // const json = await res.json();
  // if (!res.ok) return { success: false, error: json.message ?? "Erreur Twilio" };
  // return { success: true, messageId: json.sid };

  return { success: true, messageId: "live-todo" };
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
