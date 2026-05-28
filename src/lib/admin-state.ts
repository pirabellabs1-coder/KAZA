// =============================================================================
// KAZA - Admin actions state (mode démo)
// Wave 8 - Ibrahima Sow
//
// Helpers localStorage pour persister les décisions admin entre les
// navigations en mode démo (pas de Supabase). On ne stocke que les
// "événements" — les composants client appliquent ces événements aux
// données mock pour calculer l'état affiché.
// =============================================================================

export type AdminActionType =
  | "suspend_user"
  | "reactivate_user"
  | "approve_property"
  | "reject_property"
  | "approve_identity"
  | "reject_identity"
  | "resolve_dispute";

export interface AdminAction {
  id: string;
  type: AdminActionType;
  /** Identifiant de la cible (userId, propertyId, verificationId, disputeId). */
  targetId: string;
  /** Motif (rejet) ou note (résolution). */
  reason?: string;
  /** ISO date string. */
  decidedAt: string;
  /** Email de l'admin ayant pris la décision. */
  decidedBy: string;
}

const STORAGE_KEY = "kaza-admin-actions";

/** Lecture sécurisée — renvoie [] côté SSR ou si parsing impossible. */
export function getAdminActions(): AdminAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is AdminAction =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as AdminAction).id === "string" &&
        typeof (a as AdminAction).type === "string" &&
        typeof (a as AdminAction).targetId === "string",
    );
  } catch {
    return [];
  }
}

/** Enregistre une nouvelle décision et la renvoie hydratée (id, decidedAt). */
export function recordAdminAction(
  input: Omit<AdminAction, "id" | "decidedAt">,
): AdminAction {
  const action: AdminAction = {
    ...input,
    id: `act-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    decidedAt: new Date().toISOString(),
  };

  if (typeof window === "undefined") return action;

  try {
    const current = getAdminActions();
    current.push(action);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // best-effort : quota ou storage désactivé
  }

  return action;
}

/** Retourne la dernière décision pour une cible donnée. */
export function getActionForTarget(
  targetId: string,
  type: AdminAction["type"],
): AdminAction | null {
  const all = getAdminActions();
  for (let i = all.length - 1; i >= 0; i--) {
    const a = all[i];
    if (a.targetId === targetId && a.type === type) return a;
  }
  return null;
}

/** Retourne toutes les décisions concernant une cible (toutes catégories). */
export function getActionsForTarget(targetId: string): AdminAction[] {
  return getAdminActions().filter((a) => a.targetId === targetId);
}

/** Réinitialise toutes les décisions stockées (utile en démo/QA). */
export function clearAdminActions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
