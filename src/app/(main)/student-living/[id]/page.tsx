import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Users,
  MapPin,
  Ruler,
  MessageSquare,
  Inbox,
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
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getRoommateListing,
  listListingVisitRequests,
} from "@/lib/queries/roommate-listings";
import { formatPrice, getInitials } from "@/lib/utils";

import {
  RequestVisitButton,
  JoinColocationButton,
  OwnerVisitRequests,
  type VisitRequestItem,
} from "./coloc-actions";

export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<string, string> = {
  mixte: "Mixte (indifférent)",
  femmes: "Uniquement femmes",
  hommes: "Uniquement hommes",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getRoommateListing(id);
  return {
    title: listing ? `${listing.title} — Colocation Kaabo` : "Colocation — Kaabo",
  };
}

export default async function StudentLivingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getRoommateListing(id);
  if (!listing) notFound();

  const user = await getCurrentDisplayUser();
  const isOwner = user?.id === listing.ownerId;
  const requests: VisitRequestItem[] = isOwner
    ? (await listListingVisitRequests(listing.id)).map((r) => ({
        id: r.id,
        requesterName: r.requesterName,
        requestedDate: r.requestedDate,
        requestedTime: r.requestedTime,
        message: r.message,
        status: r.status,
      }))
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5">
        <Link href="/student-living">
          <ArrowLeft className="size-4" /> Toutes les colocations
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-kaza-green/15 text-kaza-green">Colocation</Badge>
              {listing.status !== "ACTIVE" ? (
                <Badge variant="outline">{listing.status}</Badge>
              ) : null}
            </div>
            <h1 className="mt-2 font-heading text-2xl font-bold text-kaza-navy sm:text-3xl">
              {listing.title}
            </h1>
            {listing.address ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {listing.address}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              icon={<BedDouble className="size-4" />}
              label="Chambres dispo"
              value={String(listing.bedroomsAvailable)}
            />
            <Stat
              icon={<Users className="size-4" />}
              label="Colocs recherchés"
              value={String(listing.peopleLookingFor)}
            />
            <Stat
              icon={<Ruler className="size-4" />}
              label="Chambre"
              value={listing.roomSize ?? "—"}
            />
            <Stat
              icon={<Users className="size-4" />}
              label="Profil"
              value={GENDER_LABEL[listing.preferredGender] ?? "Mixte"}
            />
          </div>

          {listing.description ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Inbox className="size-5 text-kaza-blue" />
                  Demandes de visite reçues
                  <Badge variant="outline" className="ml-1 text-xs">
                    {requests.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OwnerVisitRequests requests={requests} />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Loyer par personne
                </p>
                <p className="font-heading text-2xl font-bold text-kaza-navy">
                  {formatPrice(listing.price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    /mois
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 border-t pt-3">
                <Avatar>
                  {listing.ownerAvatar ? (
                    <AvatarImage src={listing.ownerAvatar} alt={listing.ownerName} />
                  ) : null}
                  <AvatarFallback className="bg-kaza-navy text-xs text-white">
                    {getInitials(
                      listing.ownerName.split(" ")[0] ?? "É",
                      listing.ownerName.split(" ")[1] ?? " ",
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {listing.ownerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Créateur de l&apos;annonce
                  </p>
                </div>
              </div>

              {isOwner ? (
                <p className="rounded-md border border-dashed bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                  C&apos;est votre annonce. Les demandes de visite apparaissent
                  à gauche.
                </p>
              ) : (
                <div className="space-y-2">
                  <RequestVisitButton
                    listingId={listing.id}
                    isAuthenticated={Boolean(user)}
                  />
                  <JoinColocationButton
                    listingId={listing.id}
                    isAuthenticated={Boolean(user)}
                  />
                  <Button asChild variant="outline" className="w-full gap-2">
                    <Link href={`/messages?to=${listing.ownerId}`}>
                      <MessageSquare className="size-4" /> Contacter
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
