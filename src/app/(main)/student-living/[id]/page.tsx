import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, Users, Bed, Wifi, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Détail Colocation",
};

export default async function StudentLivingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left */}
        <div>
          {/* Gallery placeholder */}
          <div className="mb-6 h-[300px] overflow-hidden rounded-xl bg-muted sm:h-[400px]">
            <Image
              src="https://picsum.photos/seed/kaza-student-room/800/400"
              alt="Chambre colocation"
              width={800}
              height={400}
              className="h-full w-full object-cover"
            />
          </div>

          <Badge className="mb-3 bg-kaza-green text-white">
            <Shield className="mr-1 size-3" />
            Vérifié
          </Badge>

          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            Chambre partagée près de l&apos;UAC
          </h1>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            <span>Abomey-Calavi, près de l&apos;UAC</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Bed className="size-4 text-muted-foreground" />
              <span>1 chambre disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="size-4 text-muted-foreground" />
              <span>2 colocataires actuels</span>
            </div>
          </div>

          <Separator className="my-6" />

          <h2 className="mb-3 text-lg font-semibold">
            À propos de cette colocation
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Chambre spacieuse dans un appartement moderne à 5 minutes de
            l&apos;Université d&apos;Abomey-Calavi. L&apos;appartement dispose
            d&apos;une cuisine équipée, d&apos;un salon commun, du WiFi haut
            débit et de la climatisation. Les charges (eau, électricité,
            internet) sont incluses dans le loyer.
          </p>

          <Separator className="my-6" />

          {/* Amenities */}
          <h2 className="mb-4 text-lg font-semibold">
            Équipements partagés
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              "WiFi haut débit",
              "Climatisation",
              "Cuisine équipée",
              "Salon commun",
              "Machine à laver",
              "Eau chaude",
              "Sécurité 24h",
              "Charges incluses",
            ].map((amenity) => (
              <div key={amenity} className="flex items-center gap-2 text-sm">
                <span className="text-kaza-green">✓</span>
                <span>{amenity}</span>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* House Rules */}
          <h2 className="mb-4 text-lg font-semibold">Règles de la maison</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Pas de bruit excessif après 22h</li>
            <li>• Ménage des espaces communs par rotation</li>
            <li>• Visiteurs autorisés avec prévenance</li>
            <li>• Non-fumeur dans l&apos;appartement</li>
          </ul>

          <Separator className="my-6" />

          {/* Current Roommates (anonymous) */}
          <h2 className="mb-4 text-lg font-semibold">
            Colocataires actuels
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Les noms et contacts seront partagés après approbation mutuelle
          </p>
          <div className="flex gap-4">
            <div className="rounded-lg border p-4">
              <Avatar className="mb-2">
                <AvatarFallback className="bg-kaza-navy text-white">
                  ?
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">Colocataire 1</p>
              <p className="text-xs text-muted-foreground">
                22 ans · Sciences économiques
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <Avatar className="mb-2">
                <AvatarFallback className="bg-kaza-navy text-white">
                  ?
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium">Colocataire 2</p>
              <p className="text-xs text-muted-foreground">
                21 ans · Informatique
              </p>
            </div>
          </div>
        </div>

        {/* Right: Join Card */}
        <div>
          <div className="sticky top-20 rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <span className="text-2xl font-bold">
                {formatPrice(45000)}
              </span>
              <span className="text-muted-foreground"> /mois</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Charges incluses (eau, électricité, internet)
            </p>

            <Button className="mb-3 w-full bg-kaza-blue text-base hover:bg-kaza-blue/90">
              <Users className="mr-2 size-4" />
              Demander à rejoindre
            </Button>

            <p className="mb-4 text-center text-xs text-muted-foreground">
              Votre demande sera soumise aux colocataires actuels pour
              approbation
            </p>

            <Separator className="my-4" />

            <h3 className="mb-3 text-sm font-semibold">
              Profil recherché
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Étudiant(e) de 19 à 25 ans</li>
              <li>• Calme et respectueux(se)</li>
              <li>• Disponible dès maintenant</li>
            </ul>

            <Separator className="my-4" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loyer mensuel</span>
                <span>{formatPrice(45000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Caution</span>
                <span>{formatPrice(45000)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total à l&apos;entrée</span>
                <span>{formatPrice(90000)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
