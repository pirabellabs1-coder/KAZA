import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/utils";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Mon Profil",
};

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  OWNER: {
    label: "Propriétaire",
    className: "bg-kaza-navy text-white hover:bg-kaza-navy/90",
  },
  TENANT: {
    label: "Locataire",
    className: "bg-kaza-blue text-white hover:bg-kaza-blue/90",
  },
  STUDENT: {
    label: "Étudiant",
    className: "bg-kaza-green text-white hover:bg-kaza-green/90",
  },
  ADMIN: {
    label: "Administrateur",
    className: "bg-slate-800 text-white hover:bg-slate-800/90",
  },
};

export default async function ProfilePage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  // Charge les colonnes etendues (telephone, adresse, bio, photo) qui
  // ne sont pas exposees par `getCurrentDisplayUser`.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select(
      "phone, address, bio, profile_photo_url, created_at, is_verified, verification_status",
    )
    .eq("id", user.id)
    .maybeSingle();

  const isVerified =
    profile?.is_verified === true ||
    profile?.verification_status === "APPROVED";
  const verificationLabel =
    profile?.verification_status === "PENDING"
      ? "Vérification en cours"
      : isVerified
        ? "Identité vérifiée"
        : "Non vérifiée";

  const role = ROLE_LABELS[user.role] ?? {
    label: user.role,
    className: "bg-muted text-foreground",
  };
  const initials = getInitials(user.firstName, user.lastName || " ");
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${user.firstName} ${user.lastName}`.trim() || user.email
  )}&background=1A3A52&color=ffffff&size=256&bold=true`;
  const avatarUrl = profile?.profile_photo_url ?? fallbackAvatar;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mon Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez vos informations personnelles, vos préférences et votre bio publique.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche */}
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="relative">
                <Avatar className="size-32 ring-4 ring-kaza-navy/10">
                  <AvatarImage src={avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className="bg-kaza-navy text-3xl text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge className={role.className}>{role.label}</Badge>
                {isVerified ? (
                  <Badge className="gap-1 bg-kaza-green text-white hover:bg-kaza-green/90">
                    <ShieldCheck className="size-3" />
                    Vérifié
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <ShieldCheck className="size-3" />
                    {verificationLabel}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Modifiez votre photo dans le formulaire ci-dessous.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Statistiques du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 text-kaza-blue" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Membre depuis
                  </p>
                  <p className="font-medium text-foreground">{memberSince}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-kaza-green" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Identité
                  </p>
                  <p className="font-medium text-foreground">
                    {verificationLabel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2">
          <ProfileForm
            initialFirstName={user.firstName}
            initialLastName={user.lastName}
            initialEmail={user.email}
            initialPhone={profile?.phone ?? ""}
            initialAddress={profile?.address ?? ""}
            initialBio={profile?.bio ?? ""}
            userId={user.id}
            currentPhotoUrl={profile?.profile_photo_url ?? null}
          />
        </div>
      </div>
    </div>
  );
}
