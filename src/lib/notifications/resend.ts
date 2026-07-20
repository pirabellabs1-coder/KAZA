import 'server-only';

// =============================================================================
// Kaabo - Resend email helper
// Wave 3 - Kwame Asante
//
// Wrapper minimaliste autour de l'API Resend (https://resend.com/docs/api).
// En l'absence de `RESEND_API_KEY`, on tombe en mode DEV (log console) afin
// que le tunnel notification soit testable sans facturation ni domaine vérifié.
// =============================================================================

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  message?: string;
  name?: string;
}

/**
 * Envoie un email transactionnel via Resend.
 *
 * @param to       Destinataire (string) ou liste de destinataires.
 * @param subject  Sujet de l'email.
 * @param html     Corps HTML — Resend fait le rendu plain-text auto si omis.
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATIONS_FROM_EMAIL ?? 'noreply@kaza.africa';
  const fromName = process.env.NOTIFICATIONS_FROM_NAME ?? 'Kaabo';
  const from = `${fromName} <${fromEmail}>`;

  const recipients = Array.isArray(to) ? to : [to];

  // Mode DEV : pas de clé API → on logge et on retourne success.
  if (!apiKey) {
    console.log(
      '[RESEND DEV]',
      'to=',
      recipients.join(','),
      'subject=',
      subject,
    );
    return { success: true, id: 'dev-' + Date.now().toString(36) };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as
      | ResendSuccessResponse
      | ResendErrorResponse;

    if (!res.ok) {
      const message =
        (json as ResendErrorResponse).message ?? `Resend HTTP ${res.status}`;
      console.error('[resend] error:', message);
      return { success: false, error: message };
    }

    return { success: true, id: (json as ResendSuccessResponse).id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Resend error';
    console.error('[resend] fetch error:', message);
    return { success: false, error: message };
  }
}
