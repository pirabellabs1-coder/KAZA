import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { dispatchNotification } from "@/lib/notifications/dispatch";

// =============================================================================
// KAZA — Fin de bail automatique
//
// Passe les locations ACTIVE dont la date de fin est dépassée à COMPLETED et
// libère le bien (RENTED → AVAILABLE). Notifie les deux parties. Idempotent.
// Appelé par le cron quotidien /api/cron/end-leases.
// =============================================================================

export interface EndLeasesResult {
  scanned: number;
  completed: number;
  freedProperties: number;
}

export async function completeEndedRentals(
  admin: SupabaseClient,
  options: { today?: string; limit?: number } = {},
): Promise<EndLeasesResult> {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const limit = options.limit ?? 500;

  // Locations actives arrivées à terme.
  const { data, error } = await admin
    .from("rentals")
    .select(
      `id, tenant_id, property_id, end_date, status,
       property:properties!property_id(owner_id, title, status)`,
    )
    .eq("status", "ACTIVE")
    .not("end_date", "is", null)
    .lt("end_date", today)
    .limit(limit);

  if (error) {
    console.error("[end-leases] select:", error.message);
    return { scanned: 0, completed: 0, freedProperties: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  let completed = 0;
  let freed = 0;

  for (const r of rows) {
    const rentalId = r.id as string;
    const propertyId = r.property_id as string | undefined;
    const tenantId = r.tenant_id as string | undefined;
    const ownerId = r.property?.owner_id as string | undefined;
    const propertyTitle = (r.property?.title as string | undefined) ?? "le bien";
    const endDate = (r.end_date as string | undefined) ?? today;

    // Location → COMPLETED (garde WHERE status=ACTIVE contre la double exécution).
    const { error: updErr } = await admin
      .from("rentals")
      .update({ status: "COMPLETED" })
      .eq("id", rentalId)
      .eq("status", "ACTIVE");
    if (updErr) {
      console.error("[end-leases] update rental:", updErr.message);
      continue;
    }
    completed += 1;

    // Bien → AVAILABLE (s'il était loué).
    if (propertyId) {
      const { error: propErr } = await admin
        .from("properties")
        .update({ status: "AVAILABLE" })
        .eq("id", propertyId)
        .eq("status", "RENTED");
      if (!propErr) freed += 1;
    }

    // Notifie les 2 parties (fin de bail). Best-effort.
    try {
      if (tenantId) {
        await dispatchNotification({
          userId: tenantId,
          type: "rental_terminated",
          data: { propertyTitle, endDate, forOwner: false },
        });
      }
      if (ownerId) {
        await dispatchNotification({
          userId: ownerId,
          type: "rental_terminated",
          data: { propertyTitle, endDate, forOwner: true },
        });
      }
    } catch (err) {
      console.error("[end-leases] notify:", err);
    }
  }

  return { scanned: rows.length, completed, freedProperties: freed };
}
