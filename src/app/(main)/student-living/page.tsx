import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Search, GraduationCap, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoommateCard } from "@/components/student/roommate-card";
import { getOpenRoommateListings } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Colocation Étudiante",
  description:
    "Trouvez la colocation idéale près de votre université. Logements vérifiés et sécurisés.",
};

const quickFilters = [
  { label: "Proximité université", icon: GraduationCap },
  { label: "Charges incluses", icon: Shield },
  { label: "Économique", icon: Users },
];

export default function StudentLivingPage() {
  const listings = getOpenRoommateListings();

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[400px] items-center overflow-hidden bg-kaza-navy">
        <Image
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80"
          alt="Logement étudiant"
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
        />
        <div className="gradient-hero absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center">
          <Badge className="mb-4 bg-kaza-green/20 text-kaza-green">
            LOGEMENT ÉTUDIANT PREMIUM
          </Badge>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Votre chez-vous, à deux pas du campus
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
            Logements conçus pour l&apos;étudiant moderne. Emplacements premium
            près des grandes universités avec équipements complets.
          </p>

          <div className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-full bg-white p-2">
            <Search className="ml-3 size-5 text-muted-foreground" />
            <Input
              placeholder="Près de quelle université ?"
              className="border-0 shadow-none focus-visible:ring-0"
            />
            <Button className="rounded-full bg-kaza-navy px-6">
              Chercher
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Filters */}
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-4 lg:px-8">
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Search className="size-4" />
            Filtres rapides
          </span>
          {quickFilters.map((filter) => (
            <Badge
              key={filter.label}
              variant="outline"
              className="shrink-0 cursor-pointer gap-1 px-4 py-2"
            >
              <filter.icon className="size-3.5" />
              {filter.label}
            </Badge>
          ))}
        </div>
      </section>

      {/* Listings Grid */}
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <RoommateCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                address={listing.address}
                imageUrl={`https://picsum.photos/seed/coloc-${listing.id}/800/600`}
                peopleLookingFor={listing.people_looking_for}
                currentRoommates={1}
                amenities={["WiFi", "Charges incluses", "Meublé"]}
                isVerified
              />
            ))}
          </div>
        </div>
      </section>

      {/* Don't Live Alone CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-2xl bg-kaza-navy p-8 text-white lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <h2 className="font-heading text-3xl font-bold">
                  Ne vivez plus seul
                </h2>
                <p className="mt-4 text-white/70">
                  Connectez-vous avec des étudiants partageant les mêmes
                  intérêts. Trouvez le colocataire idéal et rejoignez les
                  événements de la communauté KAZA.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Button className="bg-kaza-green hover:bg-kaza-green/90">
                    <Users className="mr-2 size-4" />
                    Trouver un colocataire
                  </Button>
                </div>
              </div>
              <div className="hidden items-center justify-center lg:flex">
                <div className="rounded-xl bg-white/10 p-6">
                  <p className="italic text-white/80">
                    &ldquo;Cherche quelqu&apos;un de calme qui aime cuisiner et
                    ne fait pas trop de bruit le weekend.&rdquo;
                  </p>
                  <p className="mt-3 text-sm text-white/50">
                    — Fatou D., UAC Abomey-Calavi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
