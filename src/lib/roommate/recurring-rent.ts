import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// =============================================================================
// Kaabo — Frais partagés récurrents : génération mensuelle du loyer de colocation
// -----------------------------------------------------------------------------
// Pour chaque colocation active (annonce ACTIVE/FULL, ≥ 2 colocataires ACCEPTED,
// loyer > 0), crée une dépense « Loyer — <mois> » (catégorie RENT) répartie en
// parts égales entre les membres. Le colocataire PRINCIPAL est le payeur (il
// règle le bailleur) ; sa part est marquée réglée, les autres lui doivent leur
// quote-part. Idempotent : ne recrée pas la dépense du mois si elle existe déjà.
// =============================================================================

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

interface MemberRow {
  user_id: string;
  is_lead: boolean | null;
}

export async function generateMonthlyRentExpenses(
  admin: SupabaseClient,
  now: Date = new Date(),
): Promise<{ groups: number; created: number; skipped: number }> {
  const periodLabel = `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const { data: groupsData, error } = await admin
    .from("roommate_groups")
    .select("id, listing_id")
    .limit(1000);
  if (error || !groupsData) return { groups: 0, created: 0, skipped: 0 };

  let created = 0;
  let skipped = 0;

  for (const g of groupsData as Array<{ id: string; listing_id: string }>) {
    try {
      if (!g.listing_id) {
        skipped += 1;
        continue;
      }

      // Loyer + statut de l'annonce.
      const { data: listing } = await admin
        .from("roommate_listings")
        .select("price, status, title")
        .eq("id", g.listing_id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l: any = listing;
      const price = Number(l?.price ?? 0);
      const status = String(l?.status ?? "");
      if (price <= 0 || !["ACTIVE", "FULL"].includes(status)) {
        skipped += 1;
        continue;
      }

      // Membres ACCEPTED.
      const { data: members } = await admin
        .from("roommate_members")
        .select("user_id, is_lead")
        .eq("group_id", g.id)
        .eq("status", "ACCEPTED");
      const rows = (members ?? []) as MemberRow[];
      if (rows.length < 2) {
        skipped += 1;
        continue;
      }
      const lead = rows.find((m) => m.is_lead)?.user_id ?? rows[0].user_id;

      // Idempotence : loyer du mois déjà généré ?
      const title = `Loyer — ${periodLabel}`;
      const { count: existing } = await admin
        .from("roommate_expenses")
        .select("id", { count: "exact", head: true })
        .eq("group_id", g.id)
        .eq("category", "RENT")
        .eq("title", title);
      if ((existing ?? 0) > 0) {
        skipped += 1;
        continue;
      }

      // Dépense loyer.
      const { data: expense, error: expErr } = await admin
        .from("roommate_expenses")
        .insert({
          group_id: g.id,
          paid_by: lead,
          created_by: lead,
          title,
          category: "RENT",
          amount_fcfa: price,
          expense_date: firstOfMonth,
        })
        .select("id")
        .single();
      if (expErr || !expense) {
        skipped += 1;
        continue;
      }

      // Répartition égale (reliquat au payeur, part du payeur réglée).
      const n = rows.length;
      const base = Math.floor(price / n);
      const remainder = price - base * n;
      const nowIso = now.toISOString();
      const shares = rows.map((m) => ({
        expense_id: (expense as { id: string }).id,
        user_id: m.user_id,
        share_fcfa: m.user_id === lead ? base + remainder : base,
        settled: m.user_id === lead,
        settled_at: m.user_id === lead ? nowIso : null,
      }));
      await admin.from("expense_shares").insert(shares);
      created += 1;
    } catch (e) {
      skipped += 1;
      console.error(
        `[roommate:recurring-rent] échec groupe ${g.id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return { groups: groupsData.length, created, skipped };
}
