"use client";

import { Camera, Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { getInitials } from "@/lib/utils";

// Hardcoded mock user
const mockUser = {
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@gmail.com",
  phone: "+22997000001",
  bio: "Propriétaire immobilier à Cotonou depuis 10 ans. Je propose des appartements modernes et bien entretenus dans les meilleurs quartiers de la ville.",
  address: "Fidjrossè, Cotonou, Bénin",
  profilePhotoUrl: null,
  verificationStatus: "APPROVED" as const,
};

export function ProfileForm() {
  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative">
            <Avatar className="size-24">
              <AvatarImage
                src={mockUser.profilePhotoUrl}
                alt={`${mockUser.firstName} ${mockUser.lastName}`}
              />
              <AvatarFallback className="bg-kaza-navy text-white text-2xl">
                {getInitials(mockUser.firstName, mockUser.lastName)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-kaza-navy text-white shadow-sm transition-colors hover:bg-kaza-navy/80"
              aria-label="Changer la photo"
            >
              <Camera className="size-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold">
              {mockUser.firstName} {mockUser.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">{mockUser.email}</p>
            <div className="mt-2">
              <VerificationBadge status={mockUser.verificationStatus} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Mettez à jour vos informations de profil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  defaultValue={mockUser.firstName}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  defaultValue={mockUser.lastName}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={mockUser.email}
                disabled
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                L&apos;adresse email ne peut pas être modifiée.
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                defaultValue={mockUser.phone}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                defaultValue={mockUser.bio}
                className="mt-1.5 min-h-[100px]"
                placeholder="Présentez-vous en quelques mots..."
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                defaultValue={mockUser.address}
                className="mt-1.5"
                placeholder="Votre adresse"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button>Mettre à jour</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-kaza-navy" />
            Vérification d&apos;identité
          </CardTitle>
          <CardDescription>
            Vérifiez votre identité pour renforcer la confiance des autres
            utilisateurs et accéder à toutes les fonctionnalités de KAZA.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <VerificationBadge status={mockUser.verificationStatus} />
            <p className="text-sm">
              {mockUser.verificationStatus === "APPROVED"
                ? "Votre identité a été vérifiée avec succès."
                : mockUser.verificationStatus === "PENDING"
                ? "Votre vérification est en cours de traitement."
                : "Veuillez soumettre vos documents pour vérification."}
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Pièce d&apos;identité (CNI, Passeport ou Carte étudiant)
              </Label>
              <div className="mt-2 flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 size-4" />
                  {mockUser.verificationStatus === "APPROVED"
                    ? "Document soumis"
                    : "Télécharger le document"}
                </Button>
                {mockUser.verificationStatus === "APPROVED" && (
                  <span className="text-xs text-kaza-green">Vérifié</span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Photo selfie de vérification
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Prenez un selfie en tenant votre pièce d&apos;identité à côté
                de votre visage.
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <Camera className="mr-2 size-4" />
                  {mockUser.verificationStatus === "APPROVED"
                    ? "Selfie soumis"
                    : "Prendre le selfie"}
                </Button>
                {mockUser.verificationStatus === "APPROVED" && (
                  <span className="text-xs text-kaza-green">Vérifié</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
