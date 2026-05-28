import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, MessageSquare, CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewForm } from "@/components/property/review-form";
import { formatDate, getInitials } from "@/lib/utils";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listReviewableRentalsForTenant,
  listTenantReviews,
} from "@/lib/queries/reviews";

export const dynamic = "force-dynamic";

export default async function TenantReviewsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/tenant/reviews");
  }

  const [pending, given] = await Promise.all([
    listReviewableRentalsForTenant(user.id),
    listTenantReviews(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes évaluations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Partagez votre expérience pour aider la communauté KAZA.
        </p>
      </div>

      <Tabs defaultValue="todo" className="space-y-5">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="todo" className="px-4">
            À donner
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {pending.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="done" className="px-4">
            Données
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {given.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* À donner */}
        <TabsContent value="todo" className="mt-0">
          {pending.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Aucun avis à donner"
              description="Toutes vos locations actives ou terminées sont déjà évaluées. Bravo !"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {pending.map((item) => {
                const ownerFullName =
                  `${item.ownerFirstName} ${item.ownerLastName}`.trim() ||
                  "Propriétaire";
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div>
                          <Link
                            href={`/properties/${item.propertyId}`}
                            className="text-sm font-semibold leading-snug hover:underline"
                          >
                            {item.propertyTitle || "Logement"}
                          </Link>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {item.propertyAddress || "—"}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarDays className="size-3" />
                            {item.status === "ACTIVE"
                              ? `Location en cours depuis le ${formatDate(item.startDate)}`
                              : `Terminée le ${formatDate(item.endDate ?? item.startDate)}`}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Avatar className="size-5">
                              <AvatarFallback className="bg-kaza-navy text-[10px] text-white">
                                {getInitials(
                                  item.ownerFirstName || "?",
                                  item.ownerLastName || "?",
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-muted-foreground">
                              {ownerFullName}
                            </span>
                          </div>
                        </div>
                        <div>
                          <ReviewForm
                            rentalId={item.id}
                            propertyTitle={item.propertyTitle || "Logement"}
                            ownerName={ownerFullName}
                            triggerLabel="Noter cette location"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Données */}
        <TabsContent value="done" className="mt-0">
          {given.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Pas encore d'avis publié"
              description="Vos évaluations apparaîtront ici après votre première publication."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {given.map((rev) => {
                const ownerFullName =
                  `${rev.ownerFirstName} ${rev.ownerLastName}`.trim() ||
                  "Propriétaire";
                return (
                  <Card key={rev.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="min-w-0">
                        <Link
                          href={`/properties/${rev.propertyId}`}
                          className="hover:underline"
                        >
                          <CardTitle className="line-clamp-1 text-sm">
                            {rev.propertyTitle || "Logement"}
                          </CardTitle>
                        </Link>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <MapPin className="size-3" />
                          {rev.propertyAddress || "—"}
                        </CardDescription>
                        <div className="mt-1 flex items-center gap-2">
                          <RatingStars rating={rev.rating} size="sm" />
                          <span className="text-[10px] text-muted-foreground">
                            · {formatDate(rev.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {rev.comment && (
                        <p className="rounded-md bg-muted/40 p-3 text-xs italic text-muted-foreground">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        À propos de{" "}
                        <span className="font-medium text-foreground">
                          {ownerFullName}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
