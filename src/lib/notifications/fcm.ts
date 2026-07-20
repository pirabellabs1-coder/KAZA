import 'server-only';

// =============================================================================
// Kaabo - Firebase Cloud Messaging (FCM) helper
// Wave 3 - Kwame Asante
//
// Envoi de notifications push via l'API HTTP legacy FCM. En l'absence de
// `FCM_SERVER_KEY`, on tombe en mode DEV (log console) pour permettre les tests
// locaux sans Firebase.
//
// NOTE : l'API HTTP v1 (OAuth2 + service account) est plus moderne mais nécessite
// un JWT signé côté serveur. On reste sur l'API legacy pour le MVP — migration
// possible en V1 quand un service-account JSON sera disponible.
// =============================================================================

export interface PushPayload {
  title: string;
  body: string;
  /** URL ouverte au clic (web) / deeplink mobile. */
  link?: string;
  /** Données supplémentaires (clés/valeurs string uniquement, contrainte FCM). */
  data?: Record<string, string>;
}

export interface PushResult {
  success: boolean;
  error?: string;
}

/**
 * Envoie une notification push à un token FCM unique.
 * Best-effort : ne throw jamais, retourne `{success: false, error}` en cas d'échec.
 */
export async function sendPush(
  token: string,
  payload: PushPayload,
): Promise<PushResult> {
  const serverKey = process.env.FCM_SERVER_KEY;

  // Mode DEV : pas de credentials → on logge et on retourne success.
  if (!serverKey) {
    console.log(
      '[FCM DEV]',
      token.slice(0, 12) + '…',
      payload.title,
      '-',
      payload.body,
    );
    return { success: true };
  }

  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
          click_action: payload.link,
        },
        data: payload.data ?? {},
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[fcm] HTTP', res.status, errText.slice(0, 200));
      return { success: false, error: `FCM HTTP ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown FCM error';
    console.error('[fcm] fetch error:', message);
    return { success: false, error: message };
  }
}

/**
 * Envoi groupé : un appel par token, exécutés en parallèle.
 * Retourne le résultat brut de `Promise.allSettled` pour permettre au caller
 * d'identifier les tokens cassés et de les désactiver côté DB.
 */
export async function sendPushBatch(
  tokens: string[],
  payload: PushPayload,
): Promise<PromiseSettledResult<PushResult>[]> {
  if (tokens.length === 0) return [];
  return Promise.allSettled(tokens.map((t) => sendPush(t, payload)));
}
