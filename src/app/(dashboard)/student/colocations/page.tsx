import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Users,
  MapPin,
  CalendarDays,
  CreditCard,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { createClient } from "@/lib/supabase/server";
import {
  mockRoommateGroups,
  mockRoommateMembers,
  mockRoommateListings,
  getRentalsByTenantId,
  getPropertyById,
  getUserById,
} from "@/lib/mock-data";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";
import type { PropertyWithPhotos, Rental } from "@/types/properties";

export const metadata: Metadata = {
  title: "Mes Colocations",
};

const MOCK_STUDENT_ID = "u-005-student-fatou";

// ---------------------------------------------------------------------------
// Types & data loading
// ---------------------------------------------------------------------------

/**
 * Vue agregee pour la page Colocations etudiant : on conserve le rental
 * (source de verite cote DB) et on joint la propriete + photos.
 */
interface StudentColocation {
  rental: Rental;
  property: PropertyWithPhotos | null;
}

/**
 * Charge les colocations de l'utilisateur courant.
 * Pour le MVP, on definit une "coloc" comme un rental dont la propriete est
 * de type ROOM (chambre partagee). La colonne `co_tenants` n'existe pas
 * encore dans le schema initial (00001) - a ajouter en V1 si besoin.
 */
async function loadStudentColocations(): Promise<StudentColocation[]> {
  return fetchWithFallback<StudentColocation[]>(
    async () => {
      const supabase = (await createClient()) as unknown as SupabaseClient;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("rentals")
        .select(
          `
          *,
          property:properties!inner (
            *,
            photos:property_photos (*)
          )
        `
        )
        .eq("tenant_id", user.id)
        .eq("property.property_type", "ROOM");

      if (error) {
        console.warn("[student/colocations] supabase error", error.message);
        return [];
      }

      // Le join Supabase renvoie `property` comme objet ou tableau selon la
      // version - on normalise.
      return (data ?? []).map((row: unknown) => {
        const r = row as Rental & {
          property: PropertyWithPhotos | PropertyWithPhotos[] | null;
        };
        const property = Array.isArray(r.property)
          ? r.property[0] ?? null
          : r.property ?? null;
        return { rental: r as Rental, property };
      });
    },
    () => {
      const rentals = getRentalsByTenantId(MOCK_STUDENT_ID);
      return rentals.map<StudentColocation>((rental) => ({
        rental,
        property: getPropertyById(rental.property_id) ?? null,
      }));
    }
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function StudentColocationsPage() {
  // Le modele "rentals" cote DB ne couvre pas encore la notion de groupe de
  // colocataires (mockRoommateGroups / mockRoommateMembers). On utilise donc
  // les rentals comme source de verite branchee, et on enrichit avec le mock
  // local pour la vue "membres" lorsque dispo. A migrer vers une vraie table
  // `roommate_groups` en V1.
  const colocations = await loadStudentColocations();

  const fallbackMemberships = mockRoommateMembers.filter(
    (m) => m.user_id === MOCK_STUDENT_ID && m.status === "ACTIVE"
  );

  const hasColocation = colocations.length > 0 || fallbackMemberships.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Mes Colocations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerez vos colocations et vos colocataires
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 size-4" />
          Creer une annonce
        </Button>
      </div>

      {hasColocation ? (
        <div className="space-y-4">
          {/* Colocations branchees sur Supabase (rentals) */}
          {colocations.map(({ rental, property }) => (
            <Card key={rental.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5 text-kaza-navy" />
                    {property?.title || "Colocation"}
                  </CardTitle>
                  <Badge className="bg-kaza-green text-white">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {property && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <h3 className="text-sm font-semibold">{property.title}</h3>
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {property.address}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CreditCard className="size-3" />
                        {formatPrice(rental.monthly_rent)}/pers./mois
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        Depuis {formatDate(rental.start_date)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Fallback : groupes mock (modele non encore migre cote DB) */}
          {colocations.length === 0 &&
            fallbackMemberships.map((membership) => {
              const group = mockRoommateGroups.find(
                (g) => g.id === membership.group_id
              );
              const listing = group
                ? mockRoommateListings.find((l) => l.id === group.listing_id)
                : undefined;
              const members = mockRoommateMembers.filter(
                (m) => m.group_id === membership.group_id
              );

              return (
                <Card key={membership.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="size-5 text-kaza-navy" />
                        {group?.group_name || "Colocation"}
                      </CardTitle>
                      <Badge className="bg-kaza-green text-white">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {listing && (
                      <div className="rounded-lg bg-muted/50 p-4">
                        <h3 className="text-sm font-semibold">
                          {listing.title}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {listing.address}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CreditCard className="size-3" />
                            {formatPrice(listing.price)}/pers./mois
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            Depuis {formatDate(group?.created_at || "")}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="mb-3 text-sm font-medium">
                        Colocataires ({members.length})
                      </p>
                      <div className="space-y-2">
                        {members.map((member) => {
                          const user = getUserById(member.user_id);
                          const isMe = member.user_id === MOCK_STUDENT_ID;
                          return (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 rounded-lg border p-3"
                            >
                              <Avatar>
                                <AvatarImage
                                  src={user?.profile_photo_url || undefined}
                                />
                                <AvatarFallback className="bg-kaza-navy text-white text-xs">
                                  {user
                                    ? getInitials(
                                        user.first_name,
                                        user.last_name
                                      )
                                    : "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">
                                    {user
                                      ? `${user.first_name} ${user.last_name}`
                                      : "Membre inconnu"}
                                  </p>
                                  {isMe && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      Vous
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Rejoint le{" "}
                                  {formatDate(member.joined_at || "")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Aucune colocation active"
          description="Vous ne faites partie d'aucune colocation pour le moment. Parcourez les annonces de colocation ou creez la votre."
          actionLabel="Explorer les colocations"
        />
      )}
    </div>
  );
}
