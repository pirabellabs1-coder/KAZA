import 'server-only';

// =============================================================================
// KAZA - Notification dispatcher
// Wave 3 - Kwame Asante
//
// Point d'entrée unique pour l'envoi de notifications côté Next.js (server
// actions, route handlers, webhooks). Trois canaux supportés :
//
//   - `in_app` : insertion dans `public.notifications` (visible dans le centre
//                de notifications et via realtime)
//   - `push`   : envoi FCM à tous les tokens actifs de l'utilisateur
//   - `email`  : envoi via Resend à l'adresse principale du compte
//
// Best-effort : les erreurs sont loggées mais ne sont jamais propagées au
// caller. Une notification ratée ne doit pas casser un paiement ou une visite.
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin';

import { sendPushBatch, type PushPayload } from './fcm';
import { sendEmail } from './resend';
import {
  contractReadyTemplate,
  paymentReceivedTemplate,
  verificationApprovedTemplate,
  verificationRejectedTemplate,
  visitRequestTemplate,
  welcomeTemplate,
  type EmailTemplate,
} from './templates';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type NotificationChannel = 'push' | 'email' | 'in_app';

export type NotificationType =
  | 'visit_request'
  | 'payment_received'
  | 'contract_ready'
  | 'verification_approved'
  | 'verification_rejected'
  | 'welcome';

export interface DispatchInput {
  userId: string;
  type: NotificationType;
  /** Canaux à utiliser. Si omis, déduit du type via `defaultChannels`. */
  channels?: NotificationChannel[];
  /** Payload spécifique au type (propertyTitle, amount, etc.). */
  data: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Tables de configuration
// -----------------------------------------------------------------------------

/**
 * Canaux activés par défaut pour chaque type. Les flows critiques (paiement,
 * contrat, vérif KYC) ajoutent `email` pour la traçabilité côté utilisateur.
 */
const DEFAULT_CHANNELS: Record<NotificationType, NotificationChannel[]> = {
  visit_request: ['in_app', 'push', 'email'],
  payment_received: ['in_app', 'push', 'email'],
  contract_ready: ['in_app', 'push', 'email'],
  verification_approved: ['in_app', 'push', 'email'],
  verification_rejected: ['in_app', 'push', 'email'],
  welcome: ['in_app', 'email'],
};

/**
 * Mapping vers le `notification_type` ENUM Postgres (cf. migration 00004).
 */
const IN_APP_TYPE: Record<NotificationType, string> = {
  visit_request: 'visit_request',
  payment_received: 'payment_received',
  contract_ready: 'contract_ready',
  verification_approved: 'identity_approved',
  verification_rejected: 'identity_rejected',
  welcome: 'system',
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Construit le payload push (titre/body court) en fonction du type. */
function buildPushPayload(type: NotificationType, data: Record<string, unknown>): PushPayload {
  switch (type) {
    case 'visit_request':
      return {
        title: 'Nouvelle demande de visite',
        body: `${asString(data.requesterName, 'Un utilisateur')} veut visiter "${asString(data.propertyTitle, 'votre bien')}".`,
        link: '/dashboard/visites',
      };
    case 'payment_received':
      return {
        title: 'Paiement reçu',
        body: `Vous avez reçu ${new Intl.NumberFormat('fr-FR').format(asNumber(data.amount))} FCFA pour "${asString(data.propertyTitle, 'votre bien')}".`,
        link: '/dashboard/paiements',
      };
    case 'contract_ready':
      return {
        title: 'Contrat prêt',
        body: `Votre contrat pour "${asString(data.propertyTitle, 'le bien')}" est disponible.`,
        link: asString(data.contractUrl, '/dashboard/contrats'),
      };
    case 'verification_approved':
      return {
        title: 'Identité vérifiée',
        body: 'Votre profil affiche désormais le badge Vérifié.',
        link: '/dashboard/profil',
      };
    case 'verification_rejected':
      return {
        title: 'Vérification à recommencer',
        body: asString(data.reason, 'Merci de soumettre à nouveau vos documents.'),
        link: '/dashboard/verification',
      };
    case 'welcome':
      return {
        title: 'Bienvenue sur KAZA',
        body: `Bonjour ${asString(data.firstName, '')}, explorez des milliers d'annonces.`,
        link: '/dashboard',
      };
  }
}

/** Construit le template email en fonction du type. Retourne `null` si données manquantes. */
function buildEmailTemplate(
  type: NotificationType,
  data: Record<string, unknown>,
): EmailTemplate | null {
  switch (type) {
    case 'visit_request':
      return visitRequestTemplate({
        propertyTitle: asString(data.propertyTitle, 'Votre bien'),
        requesterName: asString(data.requesterName, 'Un utilisateur'),
        date: asString(data.date, 'date non précisée'),
      });
    case 'payment_received':
      return paymentReceivedTemplate({
        propertyTitle: asString(data.propertyTitle, 'Votre bien'),
        amount: asNumber(data.amount, 0),
      });
    case 'contract_ready':
      return contractReadyTemplate({
        propertyTitle: asString(data.propertyTitle, 'Votre bien'),
        contractUrl: asString(data.contractUrl, ''),
      });
    case 'verification_approved':
      return verificationApprovedTemplate({
        firstName: asString(data.firstName, ''),
      });
    case 'verification_rejected':
      return verificationRejectedTemplate({
        firstName: asString(data.firstName, ''),
        reason: asString(data.reason, 'Document non conforme.'),
      });
    case 'welcome':
      return welcomeTemplate({
        firstName: asString(data.firstName, ''),
      });
  }
}

// -----------------------------------------------------------------------------
// Dispatcher principal
// -----------------------------------------------------------------------------

/**
 * Dispatche une notification sur les canaux configurés. Best-effort :
 * - récupère email + tokens FCM via service role
 * - écrit la row in_app (canal `in_app`)
 * - envoie le push à tous les devices actifs (canal `push`)
 * - envoie l'email transactionnel (canal `email`)
 *
 * Toute erreur est loggée mais jamais propagée — un caller (server action,
 * webhook) ne doit pas voir son flow casser à cause d'une notif ratée.
 */
export async function dispatchNotification(input: DispatchInput): Promise<void> {
  const { userId, type, data } = input;
  const channels = input.channels ?? DEFAULT_CHANNELS[type];

  if (!channels || channels.length === 0) {
    console.warn('[dispatch] no channels for type', type);
    return;
  }

  const admin = createAdminClient();

  // -- 1. Récupération destinataire (email + tokens push) -------------------
  let userEmail: string | null = null;
  let pushTokens: string[] = [];

  try {
    const { data: user, error } = await admin
      .from('users')
      .select('email, first_name')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      console.error('[dispatch] user lookup failed', userId, error?.message);
      return;
    }
    userEmail = user.email;
  } catch (err) {
    console.error('[dispatch] user fetch error', err);
    return;
  }

  if (channels.includes('push')) {
    try {
      const { data: tokens } = await admin
        .from('user_push_tokens')
        // @ts-expect-error — table introduite par 00007, pas encore dans les types générés
        .select('token')
        .eq('user_id', userId)
        .eq('enabled', true);
      pushTokens = (tokens ?? [])
        .map((r: { token?: string }) => r.token)
        .filter((t): t is string => typeof t === 'string' && t.length > 0);
    } catch (err) {
      // Table pas encore appliquée localement → on continue sans push
      console.warn('[dispatch] push tokens lookup failed:', err);
    }
  }

  // -- 2. Canal in_app ------------------------------------------------------
  if (channels.includes('in_app')) {
    const push = buildPushPayload(type, data);
    try {
      const { error } = await admin
        .from('notifications')
        // @ts-expect-error — types générés trop stricts (Insert sur enum literal)
        .insert({
          user_id: userId,
          type: IN_APP_TYPE[type],
          title: push.title,
          body: push.body,
          link: push.link ?? null,
          metadata: data as Record<string, unknown>,
        });
      if (error) {
        console.error('[dispatch] in_app insert failed', error.message);
      }
    } catch (err) {
      console.error('[dispatch] in_app exception', err);
    }
  }

  // -- 3. Canal push --------------------------------------------------------
  if (channels.includes('push') && pushTokens.length > 0) {
    const payload = buildPushPayload(type, data);
    try {
      const results = await sendPushBatch(pushTokens, payload);
      const failures = results.filter(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success),
      ).length;
      if (failures > 0) {
        console.warn(`[dispatch] push: ${failures}/${pushTokens.length} failed`);
      }
    } catch (err) {
      console.error('[dispatch] push exception', err);
    }
  }

  // -- 4. Canal email -------------------------------------------------------
  if (channels.includes('email') && userEmail) {
    const tpl = buildEmailTemplate(type, data);
    if (!tpl) {
      console.warn('[dispatch] no template for type', type);
      return;
    }
    try {
      const res = await sendEmail(userEmail, tpl.subject, tpl.html);
      if (!res.success) {
        console.error('[dispatch] email failed', res.error);
      }
    } catch (err) {
      console.error('[dispatch] email exception', err);
    }
  }
}
