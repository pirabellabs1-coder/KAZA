import "server-only";

// =============================================================================
// Kaabo — Requêtes B2B agence (mandats, commissions, litiges, fiche locataire)
//
// Tables : agency_mandates, disputes (migration 00037), rentals, payments,
// properties, users. Le client typé ne connaît pas encore agency_mandates /
// disputes : on passe par un client « loose » (cast), comme owner-activity.ts.
//
// Toutes les lectures sont scopées par l'AGENCE courante (RLS agency_id =
// auth.uid()) — l'appelant passe son propre id.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function loose(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

function adminLoose(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}

function fullName(first?: string | null, last?: string | null): string {
  const v = `${first ?? ""} ${last ?? ""}`.trim();
  return v.length > 0 ? v : "—";
}

// ---------------------------------------------------------------------------
// Mandats
// ---------------------------------------------------------------------------

export interface AgencyMandate {
  id: string;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  ownerId: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  mandateType: string;
  commissionRate: number;
  status: string;
  isExclusive: boolean;
  startDate: string | null;
  endDate: string | null;
  signedAt: string | null;
  contractUrl: string | null;
  notes: string | null;
  createdAt: string;
}

interface MandateRow {
  id: string;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  property_id: string | null;
  mandate_type: string;
  commission_rate: number;
  status: string;
  is_exclusive: boolean;
  start_date: string | null;
  end_date: string | null;
  signed_at: string | null;
  contract_url: string | null;
  notes: string | null;
  created_at: string;
}

async function propertyTitleMap(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = ids.filter(Boolean);
  if (clean.length === 0) return map;
  const { data } = await supabase
    .from("properties")
    .select("id, title")
    .in("id", clean);
  for (const p of (data ?? []) as Array<{ id: string; title: string }>) {
    map.set(p.id, p.title);
  }
  return map;
}

export async function listAgencyMandates(
  agencyId: string,
): Promise<AgencyMandate[]> {
  if (!agencyId) return [];
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("agency_mandates")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    const rows = (data ?? []) as MandateRow[];
    const titles = await propertyTitleMap(
      supabase,
      rows.map((r) => r.property_id ?? "").filter(Boolean),
    );

    return rows.map((r) => ({
      id: r.id,
      ownerName: r.owner_name || "Propriétaire mandant",
      ownerEmail: r.owner_email,
      ownerPhone: r.owner_phone,
      ownerId: r.owner_id,
      propertyId: r.property_id,
      propertyTitle: r.property_id ? titles.get(r.property_id) ?? null : null,
      mandateType: r.mandate_type,
      commissionRate: Number(r.commission_rate),
      status: r.status,
      isExclusive: r.is_exclusive,
      startDate: r.start_date,
      endDate: r.end_date,
      signedAt: r.signed_at,
      contractUrl: r.contract_url,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getAgencyMandate(
  agencyId: string,
  id: string,
): Promise<AgencyMandate | null> {
  if (!agencyId || !id) return null;
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("agency_mandates")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("id", id)
      .maybeSingle();
    if (!data) return null;
    const r = data as MandateRow;
    let propertyTitle: string | null = null;
    if (r.property_id) {
      const { data: p } = await supabase
        .from("properties")
        .select("title")
        .eq("id", r.property_id)
        .maybeSingle();
      propertyTitle = (p as { title?: string } | null)?.title ?? null;
    }
    return {
      id: r.id,
      ownerName: r.owner_name || "Propriétaire mandant",
      ownerEmail: r.owner_email,
      ownerPhone: r.owner_phone,
      ownerId: r.owner_id,
      propertyId: r.property_id,
      propertyTitle,
      mandateType: r.mandate_type,
      commissionRate: Number(r.commission_rate),
      status: r.status,
      isExclusive: r.is_exclusive,
      startDate: r.start_date,
      endDate: r.end_date,
      signedAt: r.signed_at,
      contractUrl: r.contract_url,
      notes: r.notes,
      createdAt: r.created_at,
    };
  } catch {
    return null;
  }
}

// Liste des biens de l'agence (pour le sélecteur du formulaire de mandat)
export interface AgencyPropertyOption {
  id: string;
  title: string;
  price: number;
}

export async function listAgencyPropertyOptions(
  agencyId: string,
): Promise<AgencyPropertyOption[]> {
  if (!agencyId) return [];
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("properties")
      .select("id, title, price")
      .eq("owner_id", agencyId)
      .order("created_at", { ascending: false });
    return ((data ?? []) as Array<{ id: string; title: string; price: number }>).map(
      (p) => ({ id: p.id, title: p.title, price: Number(p.price) }),
    );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Commissions (dérivées des mandats actifs)
// ---------------------------------------------------------------------------

export interface CommissionLine {
  mandateId: string;
  ownerName: string;
  propertyTitle: string;
  commissionRate: number;
  monthlyBase: number; // loyer mensuel (bail actif) ou prix affiché du bien
  monthlyCommission: number;
  basis: "ACTIVE_RENT" | "LISTED_PRICE";
}

export interface CommissionsSummary {
  lines: CommissionLine[];
  totalMonthlyCommission: number;
  totalAnnualCommission: number;
  activeMandates: number;
}

export async function computeAgencyCommissions(
  agencyId: string,
): Promise<CommissionsSummary> {
  const empty: CommissionsSummary = {
    lines: [],
    totalMonthlyCommission: 0,
    totalAnnualCommission: 0,
    activeMandates: 0,
  };
  if (!agencyId) return empty;
  try {
    const supabase = await loose();
    const mandates = (await listAgencyMandates(agencyId)).filter(
      (m) => m.status === "ACTIVE",
    );
    if (mandates.length === 0) return empty;

    // Loyers mensuels réels via les baux actifs sur les biens mandatés
    const propIds = mandates.map((m) => m.propertyId ?? "").filter(Boolean);
    const rentByProperty = new Map<string, number>();
    const priceByProperty = new Map<string, number>();

    if (propIds.length > 0) {
      const { data: rentals } = await supabase
        .from("rentals")
        .select("property_id, monthly_rent, status")
        .in("property_id", propIds)
        .eq("status", "ACTIVE");
      for (const r of (rentals ?? []) as Array<{
        property_id: string;
        monthly_rent: number;
      }>) {
        rentByProperty.set(r.property_id, Number(r.monthly_rent));
      }
      const { data: props } = await supabase
        .from("properties")
        .select("id, price")
        .in("id", propIds);
      for (const p of (props ?? []) as Array<{ id: string; price: number }>) {
        priceByProperty.set(p.id, Number(p.price));
      }
    }

    const lines: CommissionLine[] = mandates.map((m) => {
      const pid = m.propertyId ?? "";
      const activeRent = rentByProperty.get(pid);
      const base = activeRent ?? priceByProperty.get(pid) ?? 0;
      const basis: CommissionLine["basis"] =
        activeRent != null ? "ACTIVE_RENT" : "LISTED_PRICE";
      const monthlyCommission = Math.round((base * m.commissionRate) / 100);
      return {
        mandateId: m.id,
        ownerName: m.ownerName,
        propertyTitle: m.propertyTitle ?? "Bien non précisé",
        commissionRate: m.commissionRate,
        monthlyBase: base,
        monthlyCommission,
        basis,
      };
    });

    const totalMonthlyCommission = lines.reduce(
      (s, l) => s + l.monthlyCommission,
      0,
    );
    return {
      lines,
      totalMonthlyCommission,
      totalAnnualCommission: totalMonthlyCommission * 12,
      activeMandates: mandates.length,
    };
  } catch {
    return empty;
  }
}

// ---------------------------------------------------------------------------
// Litiges
// ---------------------------------------------------------------------------

export interface AgencyDispute {
  id: string;
  title: string;
  description: string | null;
  disputeType: string;
  priority: string;
  status: string;
  resolution: string | null;
  amountFcfa: number | null;
  tenantId: string | null;
  tenantName: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  rentalId: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface DisputeRow {
  id: string;
  title: string;
  description: string | null;
  dispute_type: string;
  priority: string;
  status: string;
  resolution: string | null;
  amount_fcfa: number | null;
  tenant_id: string | null;
  property_id: string | null;
  rental_id: string | null;
  resolved_at: string | null;
  created_at: string;
}

export async function listAgencyDisputes(
  agencyId: string,
): Promise<AgencyDispute[]> {
  if (!agencyId) return [];
  try {
    const supabase = await loose();
    const { data } = await supabase
      .from("disputes")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    const rows = (data ?? []) as DisputeRow[];

    const tenantIds = rows.map((r) => r.tenant_id ?? "").filter(Boolean);
    const tenantMap = new Map<string, string>();
    if (tenantIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", tenantIds);
      for (const u of (users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>) {
        tenantMap.set(u.id, fullName(u.first_name, u.last_name));
      }
    }

    const titles = await propertyTitleMap(
      supabase,
      rows.map((r) => r.property_id ?? "").filter(Boolean),
    );

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      disputeType: r.dispute_type,
      priority: r.priority,
      status: r.status,
      resolution: r.resolution,
      amountFcfa: r.amount_fcfa != null ? Number(r.amount_fcfa) : null,
      tenantId: r.tenant_id,
      tenantName: r.tenant_id ? tenantMap.get(r.tenant_id) ?? null : null,
      propertyId: r.property_id,
      propertyTitle: r.property_id ? titles.get(r.property_id) ?? null : null,
      rentalId: r.rental_id,
      resolvedAt: r.resolved_at,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

// Options locataires (baux de l'agence) pour le formulaire de litige
export interface TenantOption {
  tenantId: string;
  tenantName: string;
  rentalId: string;
  propertyId: string | null;
  propertyTitle: string;
}

export async function listAgencyTenantOptions(
  agencyId: string,
): Promise<TenantOption[]> {
  if (!agencyId) return [];
  try {
    const supabase = await loose();
    // Biens de l'agence
    const { data: props } = await supabase
      .from("properties")
      .select("id, title")
      .eq("owner_id", agencyId);
    const propList = (props ?? []) as Array<{ id: string; title: string }>;
    if (propList.length === 0) return [];
    const propTitle = new Map(propList.map((p) => [p.id, p.title]));

    const { data: rentals } = await supabase
      .from("rentals")
      .select("id, tenant_id, property_id, status")
      .in(
        "property_id",
        propList.map((p) => p.id),
      )
      .in("status", ["ACTIVE", "PENDING"]);

    const rentalRows = (rentals ?? []) as Array<{
      id: string;
      tenant_id: string;
      property_id: string;
      status: string;
    }>;
    if (rentalRows.length === 0) return [];

    const tenantIds = [...new Set(rentalRows.map((r) => r.tenant_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in("id", tenantIds);
    const nameMap = new Map(
      ((users ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>).map((u) => [u.id, fullName(u.first_name, u.last_name)]),
    );

    return rentalRows.map((r) => ({
      tenantId: r.tenant_id,
      tenantName: nameMap.get(r.tenant_id) ?? "Locataire",
      rentalId: r.id,
      propertyId: r.property_id,
      propertyTitle: propTitle.get(r.property_id) ?? "Bien",
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fiche locataire (détail) — scopée à l'agence
// ---------------------------------------------------------------------------

export interface AgencyTenantDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  createdAt: string;
  rentals: Array<{
    id: string;
    propertyTitle: string;
    monthlyRent: number;
    status: string;
    startDate: string | null;
    endDate: string | null;
  }>;
  totalPaidFcfa: number;
  paymentsCount: number;
  openDisputes: number;
}

export async function getAgencyTenantDetail(
  agencyId: string,
  tenantId: string,
): Promise<AgencyTenantDetail | null> {
  if (!agencyId || !tenantId) return null;
  try {
    const supabase = await loose();

    const { data: user } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone, is_verified, created_at")
      .eq("id", tenantId)
      .maybeSingle();
    if (!user) return null;
    const u = user as {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      phone: string | null;
      is_verified: boolean;
      created_at: string;
    };

    // Biens de l'agence
    const { data: props } = await supabase
      .from("properties")
      .select("id, title")
      .eq("owner_id", agencyId);
    const propList = (props ?? []) as Array<{ id: string; title: string }>;
    const propTitle = new Map(propList.map((p) => [p.id, p.title]));
    const propIds = propList.map((p) => p.id);

    let rentals: AgencyTenantDetail["rentals"] = [];
    if (propIds.length > 0) {
      const { data: rentalRows } = await supabase
        .from("rentals")
        .select(
          "id, property_id, monthly_rent, status, start_date, end_date",
        )
        .eq("tenant_id", tenantId)
        .in("property_id", propIds)
        .order("start_date", { ascending: false });
      rentals = ((rentalRows ?? []) as Array<{
        id: string;
        property_id: string;
        monthly_rent: number;
        status: string;
        start_date: string | null;
        end_date: string | null;
      }>).map((r) => ({
        id: r.id,
        propertyTitle: propTitle.get(r.property_id) ?? "Bien",
        monthlyRent: Number(r.monthly_rent),
        status: r.status,
        startDate: r.start_date,
        endDate: r.end_date,
      }));
    }

    // Paiements complétés du locataire sur les baux de l'agence
    let totalPaidFcfa = 0;
    let paymentsCount = 0;
    const rentalIds = rentals.map((r) => r.id);
    if (rentalIds.length > 0) {
      const { data: pays } = await supabase
        .from("payments")
        .select("amount, status, rental_id")
        .in("rental_id", rentalIds)
        .eq("status", "COMPLETED");
      const payRows = (pays ?? []) as Array<{ amount: number }>;
      paymentsCount = payRows.length;
      totalPaidFcfa = payRows.reduce((s, p) => s + Number(p.amount), 0);
    }

    // Litiges ouverts concernant ce locataire (scopés agence par RLS)
    const { data: disp } = await supabase
      .from("disputes")
      .select("id, status")
      .eq("agency_id", agencyId)
      .eq("tenant_id", tenantId);
    const openDisputes = ((disp ?? []) as Array<{ status: string }>).filter(
      (d) => d.status === "OPEN" || d.status === "IN_PROGRESS",
    ).length;

    return {
      id: u.id,
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      email: u.email,
      phone: u.phone,
      isVerified: u.is_verified,
      createdAt: u.created_at,
      rentals,
      totalPaidFcfa,
      paymentsCount,
      openDisputes,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fiche bail (détail) — scopée à l'agence
// ---------------------------------------------------------------------------

export interface RentalPaymentLine {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AgencyRentalDetail {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string | null;
  monthlyRent: number;
  securityDeposit: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  contractUrl: string | null;
  contractStatus: string | null;
  payments: RentalPaymentLine[];
  totalCollected: number;
  latePayments: RentalPaymentLine[];
}

export async function getAgencyRentalDetail(
  agencyId: string,
  rentalId: string,
): Promise<AgencyRentalDetail | null> {
  if (!agencyId || !rentalId) return null;
  try {
    const supabase = await loose();

    const { data: rental } = await supabase
      .from("rentals")
      .select(
        "id, property_id, tenant_id, monthly_rent, security_deposit, status, start_date, end_date, contract_url",
      )
      .eq("id", rentalId)
      .maybeSingle();
    if (!rental) return null;
    const r = rental as {
      id: string;
      property_id: string;
      tenant_id: string;
      monthly_rent: number;
      security_deposit: number | null;
      status: string;
      start_date: string | null;
      end_date: string | null;
      contract_url: string | null;
    };

    // Vérifie que le bien appartient bien à l'agence courante
    const { data: prop } = await supabase
      .from("properties")
      .select("title, owner_id")
      .eq("id", r.property_id)
      .maybeSingle();
    const p = prop as { title: string; owner_id: string } | null;
    if (!p || p.owner_id !== agencyId) return null;

    // Locataire
    const { data: tenant } = await supabase
      .from("users")
      .select("first_name, last_name, email, phone")
      .eq("id", r.tenant_id)
      .maybeSingle();
    const t = tenant as {
      first_name: string | null;
      last_name: string | null;
      email: string;
      phone: string | null;
    } | null;

    // Paiements du bail
    const { data: pays } = await supabase
      .from("payments")
      .select("id, amount, status, payment_method, payment_date, created_at")
      .eq("rental_id", rentalId)
      .order("created_at", { ascending: false });
    const payments: RentalPaymentLine[] = (
      (pays ?? []) as Array<{
        id: string;
        amount: number;
        status: string;
        payment_method: string | null;
        payment_date: string | null;
        created_at: string;
      }>
    ).map((x) => ({
      id: x.id,
      amount: Number(x.amount),
      status: x.status,
      method: x.payment_method,
      paidAt: x.payment_date,
      createdAt: x.created_at,
    }));

    const totalCollected = payments
      .filter((x) => x.status === "COMPLETED")
      .reduce((s, x) => s + x.amount, 0);
    const latePayments = payments.filter(
      (x) => x.status === "PENDING" || x.status === "FAILED",
    );

    // Contrat le plus récent
    const { data: contract } = await supabase
      .from("contracts")
      .select("pdf_url, contract_pdf_url, status, created_at")
      .eq("rental_id", rentalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const c = contract as {
      pdf_url: string | null;
      contract_pdf_url: string | null;
      status: string;
    } | null;

    return {
      id: r.id,
      propertyId: r.property_id,
      propertyTitle: p.title,
      tenantId: r.tenant_id,
      tenantName: fullName(t?.first_name, t?.last_name),
      tenantEmail: t?.email ?? "",
      tenantPhone: t?.phone ?? null,
      monthlyRent: Number(r.monthly_rent),
      securityDeposit:
        r.security_deposit != null ? Number(r.security_deposit) : null,
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date,
      contractUrl: r.contract_url ?? c?.pdf_url ?? c?.contract_pdf_url ?? null,
      contractStatus: c?.status ?? null,
      payments,
      totalCollected,
      latePayments,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Documents agence : contrats de bail (biens gérés) + contrats de mandat
// Lecture via service role, strictement scopée aux biens de l'agence.
// ---------------------------------------------------------------------------

export interface AgencyDocument {
  id: string;
  kind: "BAIL" | "MANDAT";
  label: string;
  reference: string;
  status: string;
  url: string | null;
  createdAt: string;
}

export async function listAgencyDocuments(
  agencyId: string,
): Promise<AgencyDocument[]> {
  if (!agencyId) return [];
  try {
    const admin = adminLoose();

    // Biens de l'agence
    const { data: props } = await admin
      .from("properties")
      .select("id, title")
      .eq("owner_id", agencyId);
    const propList = (props ?? []) as Array<{ id: string; title: string }>;
    const propTitle = new Map(propList.map((p) => [p.id, p.title]));

    const docs: AgencyDocument[] = [];

    // Contrats de bail sur les baux des biens de l'agence
    if (propList.length > 0) {
      const { data: rentals } = await admin
        .from("rentals")
        .select("id, property_id")
        .in(
          "property_id",
          propList.map((p) => p.id),
        );
      const rentalRows = (rentals ?? []) as Array<{
        id: string;
        property_id: string;
      }>;
      const rentalProp = new Map(rentalRows.map((r) => [r.id, r.property_id]));

      if (rentalRows.length > 0) {
        const { data: contracts } = await admin
          .from("contracts")
          .select("id, rental_id, pdf_url, contract_pdf_url, status, created_at")
          .in(
            "rental_id",
            rentalRows.map((r) => r.id),
          )
          .order("created_at", { ascending: false });

        for (const c of (contracts ?? []) as Array<{
          id: string;
          rental_id: string;
          pdf_url: string | null;
          contract_pdf_url: string | null;
          status: string;
          created_at: string;
        }>) {
          const pid = rentalProp.get(c.rental_id) ?? "";
          docs.push({
            id: c.id,
            kind: "BAIL",
            label: propTitle.get(pid) ?? "Bail",
            reference: "Contrat de bail",
            status: c.status,
            url: c.pdf_url ?? c.contract_pdf_url ?? null,
            createdAt: c.created_at,
          });
        }
      }
    }

    // Contrats de mandat (agency_mandates.contract_url)
    const { data: mandates } = await admin
      .from("agency_mandates")
      .select("id, owner_name, status, contract_url, created_at")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    for (const m of (mandates ?? []) as Array<{
      id: string;
      owner_name: string | null;
      status: string;
      contract_url: string | null;
      created_at: string;
    }>) {
      docs.push({
        id: m.id,
        kind: "MANDAT",
        label: m.owner_name || "Mandat",
        reference: "Contrat de mandat",
        status: m.status,
        url: m.contract_url,
        createdAt: m.created_at,
      });
    }

    docs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return docs;
  } catch {
    return [];
  }
}
