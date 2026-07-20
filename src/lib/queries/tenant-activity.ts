import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Kaabo — Queries activité locataire / étudiant (server-side)
//
// Toutes les fonctions retournent des données prêtes à afficher.
// Empty array si erreur ou aucune donnée — pas de throw.
// console.error pour le debug.
// =============================================================================

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80";

// TODO : générer les types complets depuis Supabase (`gen types`) — pour
// l'instant on utilise un client "loose" car le schéma `Database` exporté
// dans `@/types/supabase` ne couvre pas les relations de joints utilisées ici.
async function getLooseClient(): Promise<SupabaseClient> {
  return (await createClient()) as unknown as SupabaseClient;
}

// ---------------------------------------------------------------------------
// Saved properties (favoris)
// ---------------------------------------------------------------------------

export interface SavedPropertyItem {
  id: string;
  savedAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    price: number;
    primaryPhotoUrl: string;
    bedrooms: number;
    bathrooms: number;
    sqm: number;
    type: string;
  };
}

export async function listSavedProperties(
  userId: string,
): Promise<SavedPropertyItem[]> {
  if (!userId) return [];
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("saved_properties")
    .select(
      `
      id,
      created_at,
      property:properties (
        id, title, address, price, bedrooms, bathrooms,
        square_meters, property_type,
        photos:property_photos(photo_url, display_order)
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tenant-activity] listSavedProperties:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row: unknown): SavedPropertyItem | null => {
      const r = row as {
        id: string;
        created_at: string;
        property:
          | {
              id: string;
              title: string;
              address: string | null;
              price: number | string;
              bedrooms: number | null;
              bathrooms: number | null;
              square_meters: number | null;
              property_type: string;
              photos:
                | Array<{ photo_url: string; display_order: number | null }>
                | null;
            }
          | Array<unknown>
          | null;
      };
      const prop = Array.isArray(r.property) ? r.property[0] : r.property;
      if (!prop) return null;
      const property = prop as {
        id: string;
        title: string;
        address: string | null;
        price: number | string;
        bedrooms: number | null;
        bathrooms: number | null;
        square_meters: number | null;
        property_type: string;
        photos:
          | Array<{ photo_url: string; display_order: number | null }>
          | null;
      };
      const photos = (property.photos ?? [])
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      return {
        id: r.id,
        savedAt: r.created_at,
        property: {
          id: property.id,
          title: property.title,
          address: property.address ?? "",
          price: Number(property.price),
          primaryPhotoUrl: photos[0]?.photo_url ?? DEFAULT_PHOTO,
          bedrooms: property.bedrooms ?? 0,
          bathrooms: property.bathrooms ?? 0,
          sqm: property.square_meters ?? 0,
          type: property.property_type,
        },
      };
    })
    .filter((x): x is SavedPropertyItem => x !== null);
}

// ---------------------------------------------------------------------------
// Visit requests (locataire)
// ---------------------------------------------------------------------------

export type TenantVisitStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "REJECTED";

export interface TenantVisitItem {
  id: string;
  status: TenantVisitStatus;
  requestedDate: string;
  requestedTime: string | null;
  message: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    primaryPhotoUrl: string;
  };
}

export async function listTenantVisits(
  userId: string,
): Promise<TenantVisitItem[]> {
  if (!userId) return [];
  const supabase = await getLooseClient();
  // Schéma DB : la colonne s'appelle `tenant_id` (et non `requester_id`).
  const { data, error } = await supabase
    .from("visit_requests")
    .select(
      `
      id, requested_date, requested_time, message, status, created_at,
      property:properties (
        id, title, address,
        photos:property_photos(photo_url, display_order)
      )
    `,
    )
    .eq("tenant_id", userId)
    .order("requested_date", { ascending: false });

  if (error) {
    console.error("[tenant-activity] listTenantVisits:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row: unknown): TenantVisitItem | null => {
      const r = row as {
        id: string;
        requested_date: string;
        requested_time: string | null;
        message: string | null;
        status: TenantVisitStatus;
        created_at: string;
        property:
          | {
              id: string;
              title: string;
              address: string | null;
              photos:
                | Array<{ photo_url: string; display_order: number | null }>
                | null;
            }
          | Array<unknown>
          | null;
      };
      const prop = Array.isArray(r.property) ? r.property[0] : r.property;
      if (!prop) return null;
      const property = prop as {
        id: string;
        title: string;
        address: string | null;
        photos:
          | Array<{ photo_url: string; display_order: number | null }>
          | null;
      };
      const photos = (property.photos ?? [])
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      return {
        id: r.id,
        status: r.status,
        requestedDate: r.requested_date,
        requestedTime: r.requested_time,
        message: r.message,
        createdAt: r.created_at,
        property: {
          id: property.id,
          title: property.title,
          address: property.address ?? "",
          primaryPhotoUrl: photos[0]?.photo_url ?? DEFAULT_PHOTO,
        },
      };
    })
    .filter((x): x is TenantVisitItem => x !== null);
}

// ---------------------------------------------------------------------------
// Rentals (locataire)
// ---------------------------------------------------------------------------

export type TenantRentalStatus =
  | "PENDING"
  | "ACTIVE"
  | "COMPLETED"
  | "TERMINATED"
  | "ENDED"
  | "CANCELLED";

export interface TenantRentalItem {
  id: string;
  status: TenantRentalStatus;
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  securityDeposit: number | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    primaryPhotoUrl: string;
    bedrooms: number;
    bathrooms: number;
    sqm: number;
    type: string;
  };
}

export async function listTenantRentals(
  userId: string,
): Promise<TenantRentalItem[]> {
  if (!userId) return [];
  const supabase = await getLooseClient();
  const { data, error } = await supabase
    .from("rentals")
    .select(
      `
      id, start_date, end_date, monthly_rent, security_deposit,
      status, created_at,
      property:properties (
        id, title, address, bedrooms, bathrooms, square_meters,
        property_type,
        photos:property_photos(photo_url, display_order)
      )
    `,
    )
    .eq("tenant_id", userId)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("[tenant-activity] listTenantRentals:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row: unknown): TenantRentalItem | null => {
      const r = row as {
        id: string;
        start_date: string;
        end_date: string | null;
        monthly_rent: number | string;
        security_deposit: number | string | null;
        status: TenantRentalStatus;
        created_at: string;
        property:
          | {
              id: string;
              title: string;
              address: string | null;
              bedrooms: number | null;
              bathrooms: number | null;
              square_meters: number | null;
              property_type: string;
              photos:
                | Array<{ photo_url: string; display_order: number | null }>
                | null;
            }
          | Array<unknown>
          | null;
      };
      const prop = Array.isArray(r.property) ? r.property[0] : r.property;
      if (!prop) return null;
      const property = prop as {
        id: string;
        title: string;
        address: string | null;
        bedrooms: number | null;
        bathrooms: number | null;
        square_meters: number | null;
        property_type: string;
        photos:
          | Array<{ photo_url: string; display_order: number | null }>
          | null;
      };
      const photos = (property.photos ?? [])
        .slice()
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      return {
        id: r.id,
        status: r.status,
        startDate: r.start_date,
        endDate: r.end_date,
        monthlyRent: Number(r.monthly_rent),
        securityDeposit:
          r.security_deposit !== null && r.security_deposit !== undefined
            ? Number(r.security_deposit)
            : null,
        createdAt: r.created_at,
        property: {
          id: property.id,
          title: property.title,
          address: property.address ?? "",
          primaryPhotoUrl: photos[0]?.photo_url ?? DEFAULT_PHOTO,
          bedrooms: property.bedrooms ?? 0,
          bathrooms: property.bathrooms ?? 0,
          sqm: property.square_meters ?? 0,
          type: property.property_type,
        },
      };
    })
    .filter((x): x is TenantRentalItem => x !== null);
}

// ---------------------------------------------------------------------------
// Messages (locataire) — derniers fils de conversation
// ---------------------------------------------------------------------------

export interface TenantMessageConversation {
  conversationKey: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl: string | null;
  };
  property: {
    id: string;
    title: string;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    isFromMe: boolean;
  };
  unreadCount: number;
}

export async function listTenantMessages(
  userId: string,
  limit: number = 20,
): Promise<TenantMessageConversation[]> {
  if (!userId) return [];
  const supabase = await getLooseClient();
  // Schéma DB : `recipient_id` (et non `receiver_id`), `is_read` (et non `read_at`).
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id, sender_id, recipient_id, property_id, content, is_read, created_at,
      sender:users!sender_id(id, first_name, last_name, profile_photo_url),
      recipient:users!recipient_id(id, first_name, last_name, profile_photo_url),
      property:properties(id, title)
    `,
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[tenant-activity] listTenantMessages:", error.message);
    return [];
  }

  type Row = {
    id: string;
    sender_id: string;
    recipient_id: string;
    property_id: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
    sender:
      | { id: string; first_name: string; last_name: string; profile_photo_url: string | null }
      | Array<unknown>
      | null;
    recipient:
      | { id: string; first_name: string; last_name: string; profile_photo_url: string | null }
      | Array<unknown>
      | null;
    property: { id: string; title: string } | Array<unknown> | null;
  };

  const rows = (data ?? []) as Row[];
  const grouped = new Map<string, TenantMessageConversation>();

  for (const m of rows) {
    const isFromMe = m.sender_id === userId;
    const otherRaw = isFromMe ? m.recipient : m.sender;
    const other = (Array.isArray(otherRaw) ? otherRaw[0] : otherRaw) as
      | { id: string; first_name: string; last_name: string; profile_photo_url: string | null }
      | null;
    if (!other) continue;
    const propRaw = Array.isArray(m.property) ? m.property[0] : m.property;
    const property = propRaw as { id: string; title: string } | null;

    // clé conversation : couple (autre user, propriété éventuelle)
    const conversationKey = `${other.id}::${m.property_id ?? "none"}`;
    if (grouped.has(conversationKey)) {
      // déjà rempli avec le dernier (data trié desc), juste incrémente unread
      const existing = grouped.get(conversationKey)!;
      if (!m.is_read && !isFromMe) existing.unreadCount += 1;
      continue;
    }

    grouped.set(conversationKey, {
      conversationKey,
      otherUser: {
        id: other.id,
        firstName: other.first_name,
        lastName: other.last_name,
        profilePhotoUrl: other.profile_photo_url,
      },
      property: property ? { id: property.id, title: property.title } : null,
      lastMessage: {
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        isRead: m.is_read,
        isFromMe,
      },
      unreadCount: !m.is_read && !isFromMe ? 1 : 0,
    });
  }

  return Array.from(grouped.values())
    .sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime(),
    )
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Colocations (étudiant)
// ---------------------------------------------------------------------------

export type StudentColocStatus = "ACTIVE" | "FULL" | "CLOSED";

export interface StudentColocationItem {
  id: string;
  title: string;
  description: string | null;
  address: string;
  monthlyShare: number;
  bedroomsAvailable: number;
  peopleLookingFor: number;
  membersCount: number;
  spotsLeft: number;
  status: StudentColocStatus;
  createdAt: string;
  isOwner: boolean;
  primaryPhotoUrl: string;
}

export async function listStudentColocations(
  userId: string,
): Promise<StudentColocationItem[]> {
  if (!userId) return [];
  const supabase = await getLooseClient();

  // Étape 1 : récupérer les listings dont l'utilisateur est le créateur.
  // Schéma DB : `roommate_listings.user_id` (et non `owner_id`).
  const ownedQuery = supabase
    .from("roommate_listings")
    .select(
      `
      id, title, description, address, price, bedrooms_available,
      people_looking_for, status, created_at, user_id
    `,
    )
    .eq("user_id", userId);

  // Étape 2 : récupérer les groups dont l'utilisateur est membre (actif).
  const membershipsQuery = supabase
    .from("roommate_members")
    .select(
      `
      group_id,
      group:roommate_groups (
        id, listing_id,
        listing:roommate_listings (
          id, title, description, address, price, bedrooms_available,
          people_looking_for, status, created_at, user_id
        )
      )
    `,
    )
    .eq("user_id", userId)
    .in("status", ["APPROVED", "ACTIVE"]);

  const [ownedRes, membershipsRes] = await Promise.all([
    ownedQuery,
    membershipsQuery,
  ]);

  if (ownedRes.error) {
    console.error(
      "[tenant-activity] listStudentColocations owned:",
      ownedRes.error.message,
    );
  }
  if (membershipsRes.error) {
    console.error(
      "[tenant-activity] listStudentColocations memberships:",
      membershipsRes.error.message,
    );
  }

  type RawListing = {
    id: string;
    title: string;
    description: string | null;
    address: string | null;
    price: number | string;
    bedrooms_available: number | null;
    people_looking_for: number | null;
    status: StudentColocStatus;
    created_at: string;
    user_id: string;
  };

  const byId = new Map<string, RawListing>();

  for (const row of (ownedRes.data ?? []) as RawListing[]) {
    byId.set(row.id, row);
  }

  for (const m of (membershipsRes.data ?? []) as Array<{
    group:
      | { id: string; listing_id: string; listing: RawListing | RawListing[] | null }
      | Array<unknown>
      | null;
  }>) {
    const group = (Array.isArray(m.group) ? m.group[0] : m.group) as
      | { id: string; listing_id: string; listing: RawListing | RawListing[] | null }
      | null;
    if (!group) continue;
    const listing = (Array.isArray(group.listing) ? group.listing[0] : group.listing) as
      | RawListing
      | null;
    if (!listing) continue;
    if (!byId.has(listing.id)) byId.set(listing.id, listing);
  }

  const listingIds = Array.from(byId.keys());
  if (listingIds.length === 0) return [];

  // Étape 3 : compter les membres actifs par listing (via groups).
  const { data: countRows, error: countError } = await supabase
    .from("roommate_groups")
    .select(
      `
      id, listing_id,
      members:roommate_members(id, status)
    `,
    )
    .in("listing_id", listingIds);

  if (countError) {
    console.error(
      "[tenant-activity] listStudentColocations counts:",
      countError.message,
    );
  }

  const membersByListing = new Map<string, number>();
  for (const g of (countRows ?? []) as Array<{
    listing_id: string;
    members: Array<{ status: string }> | null;
  }>) {
    const active = (g.members ?? []).filter((mm) =>
      ["APPROVED", "ACTIVE"].includes(mm.status),
    ).length;
    membersByListing.set(
      g.listing_id,
      (membersByListing.get(g.listing_id) ?? 0) + active,
    );
  }

  return Array.from(byId.values())
    .map((row): StudentColocationItem => {
      const members = membersByListing.get(row.id) ?? 0;
      const capacity = row.people_looking_for ?? row.bedrooms_available ?? 1;
      const spotsLeft = Math.max(0, capacity - members);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        address: row.address ?? "",
        monthlyShare: Number(row.price),
        bedroomsAvailable: row.bedrooms_available ?? 0,
        peopleLookingFor: capacity,
        membersCount: members,
        spotsLeft,
        status: row.status,
        createdAt: row.created_at,
        isOwner: row.user_id === userId,
        primaryPhotoUrl: DEFAULT_PHOTO,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}
