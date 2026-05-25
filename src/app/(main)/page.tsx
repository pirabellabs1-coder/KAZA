import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/property/property-card";
import { PropertySearchBar } from "@/components/property/property-search-bar";
import { fetchWithFallback } from "@/lib/data-fetcher";
import { getFeaturedProperties as getMockFeaturedProperties } from "@/lib/mock-data";
import { getFeaturedProperties } from "@/lib/supabase/queries";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1920&q=80";

const STUDENT_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80",
];

const propertyCategories = [
  { label: "Tous", value: "all", active: true },
  { label: "Maisons", value: "HOUSE", active: false },
  { label: "Appartements", value: "APARTMENT", active: false },
  { label: "Colocation", value: "ROOM", active: false },
  { label: "Studios", value: "STUDIO", active: false },
];

const tenantSteps = [
  {
    step: "01",
    title: "Découvrez",
    description:
      "Parcourez des annonces vérifiées avec photos haute qualité et visites virtuelles.",
  },
  {
    step: "02",
    title: "Réservez en toute sécurité",
    description:
      "Payez via notre tunnel d'escrow sécurisé. Vos fonds sont protégés jusqu'à votre emménagement.",
  },
  {
    step: "03",
    title: "Emménagez sereinement",
    description:
      "Signez votre contrat numérique et gérez votre location depuis votre espace personnel.",
  },
];

const ownerSteps = [
  {
    step: "01",
    title: "Publiez & sélectionnez",
    description:
      "Mettez votre bien en avant auprès de locataires et étudiants vérifiés.",
  },
  {
    step: "02",
    title: "Gestion simplifiée",
    description:
      "Encaissement automatique des loyers, suivi des visites et reporting clair.",
  },
  {
    step: "03",
    title: "Maximisez vos revenus",
    description:
      "Tarification dynamique et analyses pour optimiser le rendement de vos biens.",
  },
];

export default async function HomePage() {
  const featuredProperties = await fetchWithFallback(
    () => getFeaturedProperties(4),
    () => getMockFeaturedProperties(),
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[500px] items-center justify-center overflow-hidden bg-kaza-navy">
        <Image
          src={HERO_IMAGE}
          alt="Vue immobilière premium en Afrique"
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="gradient-hero absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Trouvez votre{" "}
            <span className="text-kaza-green">logement idéal en Afrique</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Des espaces de vie modernes pour les professionnels, les familles et
            les étudiants. Vérifiés, sécurisés, sans intermédiaire.
          </p>

          <div className="mx-auto mt-8 max-w-3xl">
            <PropertySearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Filtres catégories */}
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 lg:px-8">
          {propertyCategories.map((cat) => (
            <Badge
              key={cat.value}
              variant={cat.active ? "default" : "outline"}
              className="shrink-0 cursor-pointer px-4 py-2 text-sm"
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </section>

      {/* Annonces à la une */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Annonces à la une
              </h2>
              <p className="mt-1 text-muted-foreground">
                Une sélection de biens premium dans les grandes villes du Bénin.
              </p>
            </div>
            <Link
              href="/search"
              className="hidden items-center gap-1 text-sm font-medium text-kaza-blue hover:underline sm:flex"
            >
              Voir tout
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title}
                price={property.price}
                address={property.address}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                squareMeters={property.square_meters}
                imageUrl={
                  property.photos[0]?.photo_url ||
                  "https://picsum.photos/seed/kaza-default/800/600"
                }
                propertyType={property.property_type}
                rating={4.5 + Math.random() * 0.5}
                isVerified
              />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/search">
                Voir toutes les propriétés
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Espace étudiant */}
      <section className="bg-kaza-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <Badge className="mb-4 bg-kaza-green/20 text-kaza-green">
                KAZA ÉTUDIANT
              </Badge>
              <h2 className="font-heading text-3xl font-bold lg:text-4xl">
                Des colocations sûres pour les étudiants
              </h2>
              <p className="mt-4 text-lg text-white/70">
                Trouvez une chambre près de votre campus, partagez les frais
                avec des colocataires vérifiés et signez votre bail en quelques
                clics.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  className="bg-kaza-green hover:bg-kaza-green/90"
                  asChild
                >
                  <Link href="/student-living">Trouver une colocation</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/signup">Publier une chambre</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-40 overflow-hidden rounded-xl bg-white/10 lg:h-52">
                  <Image
                    src={STUDENT_IMAGES[0]}
                    alt="Logement étudiant moderne"
                    width={400}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-32 overflow-hidden rounded-xl bg-white/10 lg:h-40">
                  <Image
                    src={STUDENT_IMAGES[1]}
                    alt="Espace de colocation"
                    width={400}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-32 overflow-hidden rounded-xl bg-white/10 lg:h-40">
                  <Image
                    src={STUDENT_IMAGES[2]}
                    alt="Chambre étudiante meublée"
                    width={400}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-40 overflow-hidden rounded-xl bg-white/10 lg:h-52">
                  <Image
                    src={STUDENT_IMAGES[3]}
                    alt="Espace commun de colocation"
                    width={400}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="mb-12 text-center font-heading text-3xl font-bold">
            Comment fonctionne KAZA
          </h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Pour les locataires */}
            <div className="rounded-2xl border p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kaza-blue/10">
                  <Key className="size-5 text-kaza-blue" />
                </div>
                <h3 className="text-xl font-semibold">Pour les locataires</h3>
              </div>
              <div className="space-y-6">
                {tenantSteps.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <span className="font-heading text-2xl font-bold text-kaza-blue/30">
                      {step.step}
                    </span>
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pour les propriétaires */}
            <div className="rounded-2xl border p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kaza-green/10">
                  <Building2 className="size-5 text-kaza-green" />
                </div>
                <h3 className="text-xl font-semibold">Pour les propriétaires</h3>
              </div>
              <div className="space-y-6">
                {ownerSteps.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <span className="font-heading text-2xl font-bold text-kaza-green/30">
                      {step.step}
                    </span>
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold">
            Restez à la pointe du marché
          </h2>
          <p className="mt-2 text-muted-foreground">
            Recevez les nouvelles annonces premium et nos analyses du marché
            local directement par e-mail.
          </p>
          <div className="mt-6 flex gap-3">
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              className="flex-1 rounded-full border bg-white px-5 py-3 text-sm outline-none focus:border-kaza-blue"
            />
            <Button className="rounded-full bg-kaza-navy px-6">
              Rejoindre KAZA
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
