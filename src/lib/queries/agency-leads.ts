import "server-only";

// =============================================================================
// Kaabo — Queries leads CRM agence (server-side)
// Lit `agency_leads` filtré par agency_id avec join sur agency_members
// (agent assigné) et properties (bien d'intérêt éventuel).
// =============================================================================

import { createClient } from "@/lib/supabase/server";

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "VISIT_SCHEDULED"
  | "OFFER"
  | "WON"
  | "LOST";

export type LeadSource =
  | "SITE_KAZA"
  | "SOCIAL"
  | "WORD_OF_MOUTH"
  | "GOOGLE_ADS"
  | "EVENT"
  | "OTHER";

export interface AgencyLead {
  id: string;
  agencyId: string;
  assignedTo: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  budgetFcfa: number | null;
  propertyId: string | null;
  stage: LeadStage;
  notes: string | null;
  score: number;
  lastActivityAt: string;
  createdAt: string;
  // Joints
  assignedMember: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  property: {
    id: string;
    title: string;
    address: string | null;
  } | null;
}

export interface LeadFilters {
  stage?: LeadStage;
  assignedTo?: string;
  source?: LeadSource;
}

export interface LeadStats {
  total: number;
  byStage: Record<LeadStage, number>;
  pipelineValueFcfa: number;
  openLeads: number;
  averageScore: number;
  conversionRate: number;
}

const ALL_STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "OFFER",
  "WON",
  "LOST",
];

interface RawLeadRow {
  id: string;
  agency_id: string;
  assigned_to: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  budget_fcfa: number | string | null;
  property_id: string | null;
  stage: LeadStage;
  notes: string | null;
  score: number | null;
  last_activity_at: string;
  created_at: string;
  assigned_member?: {
    id: string;
    full_name: string;
    role: string;
  } | null;
  property?: { id: string; title: string; address: string | null } | null;
}

function mapLead(raw: RawLeadRow): AgencyLead {
  return {
    id: raw.id,
    agencyId: raw.agency_id,
    assignedTo: raw.assigned_to,
    fullName: raw.full_name,
    email: raw.email,
    phone: raw.phone,
    source: raw.source,
    budgetFcfa:
      raw.budget_fcfa === null ? null : Number(raw.budget_fcfa),
    propertyId: raw.property_id,
    stage: raw.stage,
    notes: raw.notes,
    score: raw.score ?? 50,
    lastActivityAt: raw.last_activity_at,
    createdAt: raw.created_at,
    assignedMember: raw.assigned_member
      ? {
          id: raw.assigned_member.id,
          fullName: raw.assigned_member.full_name,
          role: raw.assigned_member.role,
        }
      : null,
    property: raw.property
      ? {
          id: raw.property.id,
          title: raw.property.title,
          address: raw.property.address ?? null,
        }
      : null,
  };
}

/**
 * Liste les leads d'une agence avec filtres optionnels, joint à l'agent
 * assigné et au bien d'intérêt.
 */
export async function listLeads(
  agencyId: string,
  filters?: LeadFilters,
): Promise<AgencyLead[]> {
  const supabase = await createClient();
  // Cast loose pour bypasser l'absence de types Supabase regen.
  let query = (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (col: string, v: string) => unknown;
      };
    };
  })
    .from("agency_leads")
    .select(
      `
      id, agency_id, assigned_to, full_name, email, phone, source,
      budget_fcfa, property_id, stage, notes, score, last_activity_at, created_at,
      assigned_member:agency_members!agency_leads_assigned_to_fkey(id, full_name, role),
      property:properties!agency_leads_property_id_fkey(id, title, address)
    `,
    )
    .eq("agency_id", agencyId) as unknown as {
    eq: (col: string, v: string) => unknown;
    order: (
      col: string,
      opts: { ascending: boolean },
    ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
  };

  if (filters?.stage) {
    query = (query as unknown as {
      eq: (col: string, v: string) => unknown;
    }).eq("stage", filters.stage) as typeof query;
  }
  if (filters?.assignedTo) {
    query = (query as unknown as {
      eq: (col: string, v: string) => unknown;
    }).eq("assigned_to", filters.assignedTo) as typeof query;
  }
  if (filters?.source) {
    query = (query as unknown as {
      eq: (col: string, v: string) => unknown;
    }).eq("source", filters.source) as typeof query;
  }

  const { data, error } = await query.order("last_activity_at", {
    ascending: false,
  });

  if (error) {
    console.error("[agency-leads] listLeads:", error.message);
    return [];
  }

  return ((data ?? []) as RawLeadRow[]).map(mapLead);
}

/**
 * Stats CRM : counts par stage + valeur pipeline (somme budget hors LOST/WON).
 */
export async function getLeadStats(agencyId: string): Promise<LeadStats> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (
          col: string,
          v: string,
        ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  })
    .from("agency_leads")
    .select("stage, budget_fcfa, score")
    .eq("agency_id", agencyId);

  const empty: LeadStats = {
    total: 0,
    byStage: ALL_STAGES.reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<LeadStage, number>,
    ),
    pipelineValueFcfa: 0,
    openLeads: 0,
    averageScore: 0,
    conversionRate: 0,
  };

  if (error || !data) {
    console.error("[agency-leads] getLeadStats:", error?.message);
    return empty;
  }

  const rows = data as Array<{
    stage: LeadStage;
    budget_fcfa: number | string | null;
    score: number | null;
  }>;

  const byStage = ALL_STAGES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<LeadStage, number>,
  );
  rows.forEach((r) => {
    byStage[r.stage] = (byStage[r.stage] ?? 0) + 1;
  });

  const openRows = rows.filter(
    (r) => r.stage !== "WON" && r.stage !== "LOST",
  );
  const pipelineValueFcfa = openRows.reduce(
    (sum, r) => sum + Number(r.budget_fcfa ?? 0),
    0,
  );
  const averageScore =
    openRows.length > 0
      ? Math.round(
          openRows.reduce((sum, r) => sum + (r.score ?? 50), 0) /
            openRows.length,
        )
      : 0;
  const conversionRate =
    rows.length > 0 ? Math.round((byStage.WON / rows.length) * 100) : 0;

  return {
    total: rows.length,
    byStage,
    pipelineValueFcfa,
    openLeads: openRows.length,
    averageScore,
    conversionRate,
  };
}

/** Détail d'un lead (avec join agent + property). */
export async function getLead(leadId: string): Promise<AgencyLead | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (q: string) => {
        eq: (
          col: string,
          v: string,
        ) => {
          maybeSingle: () => Promise<{
            data: unknown | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("agency_leads")
    .select(
      `
      id, agency_id, assigned_to, full_name, email, phone, source,
      budget_fcfa, property_id, stage, notes, score, last_activity_at, created_at,
      assigned_member:agency_members!agency_leads_assigned_to_fkey(id, full_name, role),
      property:properties!agency_leads_property_id_fkey(id, title, address)
    `,
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[agency-leads] getLead:", error.message);
    return null;
  }
  return mapLead(data as RawLeadRow);
}
