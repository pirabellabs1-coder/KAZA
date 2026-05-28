"use client";

// =============================================================================
// KAZA - /properties/compare (REFONTE LUXE — W11 Olamide)
// Comparateur de biens (jusqu'à 4 colonnes). Persistance localStorage.
// Export PDF via window.print().
// =============================================================================

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bath,
  Bed,
  Building2,
  Check,
  Compass,
  Eye,
  FileDown,
  MapPin,
  Maximize,
  Minus,
  Search,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import { cn, formatPrice } from "@/lib/utils";

// =============================================================================
// Types et seed
// =============================================================================

type CompareProperty = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  neighborhood: string;
  city: string;
  isVerified: boolean;
  amenities: {
    parking: boolean;
    airConditioning: boolean;
    furnished: boolean;
    waterIncluded: boolean;
    internet: boolean;
    securityGuard: boolean;
  };
};

const STORAGE_KEY = "kaza-compare";
const MAX_SLOTS = 4;

const SEED_PROPERTIES: CompareProperty[] = [
  {
    id: "cmp-001",
    title: "Appartement lumineux à Fidjrossè",
    price: 185000,
    imageUrl: "https://picsum.photos/seed/kaza-cmp-001/800/600",
    type: "Appartement",
    bedrooms: 2,
    bathrooms: 1,
    squareMeters: 78,
    neighborhood: "Fidjrossè",
    city: "Cotonou",
    isVerified: true,
    amenities: {
      parking: true,
      airConditioning: true,
      furnished: false,
      waterIncluded: true,
      internet: true,
      securityGuard: true,
    },
  },
  {
    id: "cmp-002",
    title: "Studio meublé moderne à Cadjèhoun",
    price: 130000,
    imageUrl: "https://picsum.photos/seed/kaza-cmp-002/800/600",
    type: "Studio",
    bedrooms: 1,
    bathrooms: 1,
    squareMeters: 38,
    neighborhood: "Cadjèhoun",
    city: "Cotonou",
    isVerified: true,
    amenities: {
      parking: false,
      airConditioning: true,
      furnished: true,
      waterIncluded: true,
      internet: true,
      securityGuard: false,
    },
  },
  {
    id: "cmp-003",
    title: "Villa familiale avec jardin à Akpakpa",
    price: 320000,
    imageUrl: "https://picsum.photos/seed/kaza-cmp-003/800/600",
    type: "Villa",
    bedrooms: 4,
    bathrooms: 3,
    squareMeters: 180,
    neighborhood: "Akpakpa",
    city: "Cotonou",
    isVerified: true,
    amenities: {
      parking: true,
      airConditioning: true,
      furnished: false,
      waterIncluded: false,
      internet: false,
      securityGuard: true,
    },
  },
];

// =============================================================================
// Helpers
// =============================================================================

function loadFromStorage(): CompareProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompareProperty[];
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_SLOTS);
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CompareProperty[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

// =============================================================================
// Page
// =============================================================================

export default function ComparePage() {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<CompareProperty[]>([]);

  useEffect(() => {
    // Hydratation depuis localStorage (pattern client-only, pas de SSR)
    const stored = loadFromStorage();
    if (stored.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(stored);
    } else {
      setItems(SEED_PROPERTIES);
      saveToStorage(SEED_PROPERTIES);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(items);
  }, [items, hydrated]);

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  function exportPdf() {
    if (typeof window !== "undefined") window.print();
  }

  const isEmpty = items.length === 0;
  const isFull = items.length >= MAX_SLOTS;
  const slots = items.length;

  return (
    <div className="bg-white print:bg-white">
      {/* Print styles minimaux */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { @page { size: A4 landscape; margin: 14mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`,
        }}
      />

      {/* ============== HERO COMPACT ====================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue py-20 text-white print:hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-24 size-[420px] rounded-full bg-kaza-green/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-32 size-[420px] rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 text-center lg:px-8">
          <FadeIn>
            <Badge className="mb-6 inline-flex border-0 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Compass className="mr-2 size-3 text-kaza-green" />
              Outil interactif
            </Badge>
            <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Comparateur de{" "}
              <span className="bg-gradient-to-r from-kaza-green to-white bg-clip-text text-transparent">
                biens
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
              Confrontez jusqu&apos;à {MAX_SLOTS} logements côte à côte :
              caractéristiques, équipements, localisation et prix. Vos
              sélections sont sauvegardées sur cet appareil.
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 print:py-6">
        {/* Toolbar */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm print:hidden">
          <Badge
            variant="secondary"
            className="rounded-full px-4 py-1.5 text-sm font-semibold"
          >
            {slots} / {MAX_SLOTS} biens sélectionnés
          </Badge>
          {!isEmpty && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={exportPdf}
                className="gap-2 rounded-full"
              >
                <FileDown className="size-4" />
                Exporter PDF
              </Button>
              <Button
                variant="outline"
                onClick={clearAll}
                className="gap-2 rounded-full"
              >
                <Trash2 className="size-4" />
                Tout effacer
              </Button>
            </div>
          )}
        </div>

        {/* État vide stylé */}
        {hydrated && isEmpty && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white via-[#F4F7FB] to-white p-20 text-center">
              <div className="mb-6 inline-flex size-24 items-center justify-center rounded-3xl bg-kaza-blue/10 text-kaza-blue">
                <Building2 className="size-12" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
                Comparez jusqu&apos;à {MAX_SLOTS} biens
              </h2>
              <p className="mt-4 max-w-md text-base text-muted-foreground">
                Parcourez les annonces et cliquez sur «&nbsp;Comparer&nbsp;»
                pour les ajouter à votre sélection.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-10 h-12 rounded-full bg-kaza-blue px-8 text-base font-semibold text-white hover:bg-kaza-navy"
              >
                <Link href="/search">
                  <Search className="mr-2 size-4" />
                  Rechercher des biens
                </Link>
              </Button>
            </div>
          </FadeIn>
        )}

        {/* Comparateur rempli */}
        {hydrated && !isEmpty && (
          <>
            {/* Cards header */}
            <div
              className={cn(
                "grid gap-6 print:gap-4",
                slots === 1 && "max-w-md grid-cols-1",
                slots === 2 && "grid-cols-1 sm:grid-cols-2",
                slots === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                slots === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
              )}
            >
              {items.map((item, idx) => (
                <RevealOnScroll key={item.id} delay={idx * 70}>
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-2xl print:shadow-none">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                      />
                      {item.isVerified && (
                        <Badge className="absolute left-3 top-3 gap-1 border-0 bg-kaza-green/95 px-2.5 py-1 text-[10px] font-semibold text-white">
                          <ShieldCheck className="size-3" />
                          Vérifié
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Retirer ${item.title}`}
                        className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-white/95 text-kaza-navy shadow-md backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-500 hover:text-white print:hidden"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h3 className="font-heading line-clamp-2 text-lg font-semibold text-kaza-navy">
                        {item.title}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading text-2xl font-bold text-kaza-navy">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          /mois
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-kaza-blue" />
                        {item.neighborhood}, {item.city}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => removeItem(item.id)}
                        className="mt-auto gap-2 rounded-full print:hidden"
                      >
                        <Trash2 className="size-4" />
                        Retirer
                      </Button>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}

              {/* Slot d'ajout */}
              {!isFull && (
                <Link
                  href="/search"
                  className="group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white via-[#F7F9FC] to-white p-8 text-center transition-all hover:-translate-y-1 hover:border-kaza-blue hover:bg-kaza-blue/5 hover:shadow-xl print:hidden"
                >
                  <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue transition-transform group-hover:scale-110">
                    <Search className="size-6" />
                  </div>
                  <p className="font-heading text-lg font-bold text-kaza-navy">
                    Ajouter un bien
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Encore {MAX_SLOTS - slots} emplacement
                    {MAX_SLOTS - slots > 1 ? "s" : ""}
                  </p>
                </Link>
              )}
            </div>

            {/* Tableau comparatif premium */}
            <div className="mt-12 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gradient-to-r from-[#F4F7FB] to-white px-6 py-5">
                <h2 className="font-heading text-xl font-bold text-kaza-navy sm:text-2xl">
                  Tableau comparatif détaillé
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Caractéristiques détaillées des {slots} bien
                  {slots > 1 ? "s" : ""} sélectionné{slots > 1 ? "s" : ""}.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    <ComparisonRow
                      label="Type"
                      icon={Building2}
                      values={items.map((i) => i.type)}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Chambres"
                      icon={Bed}
                      values={items.map((i) => `${i.bedrooms} ch.`)}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Salles de bain"
                      icon={Bath}
                      values={items.map((i) => `${i.bathrooms} sdb`)}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Surface"
                      icon={Maximize}
                      values={items.map((i) => `${i.squareMeters} m²`)}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Loyer mensuel"
                      icon={Wallet}
                      values={items.map((i) => formatPrice(i.price))}
                      slots={slots}
                      emphasize
                    />
                    <ComparisonRow
                      label="Quartier"
                      icon={MapPin}
                      values={items.map((i) => `${i.neighborhood}, ${i.city}`)}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Vérifié KAZA"
                      icon={ShieldCheck}
                      values={items.map((i) => (
                        <AmenityCheck key={i.id} on={i.isVerified} label="Vérifié" />
                      ))}
                      slots={slots}
                    />

                    <tr>
                      <td
                        colSpan={slots + 1}
                        className="bg-gradient-to-r from-[#F4F7FB] to-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-kaza-navy"
                      >
                        Équipements
                      </td>
                    </tr>

                    <ComparisonRow
                      label="Parking"
                      values={items.map((i) => (
                        <AmenityCheck
                          key={i.id}
                          on={i.amenities.parking}
                          label="Parking"
                        />
                      ))}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Climatisation"
                      values={items.map((i) => (
                        <AmenityCheck
                          key={i.id}
                          on={i.amenities.airConditioning}
                          label="Climatisation"
                        />
                      ))}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Meublé"
                      values={items.map((i) => (
                        <AmenityCheck
                          key={i.id}
                          on={i.amenities.furnished}
                          label="Meublé"
                        />
                      ))}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Eau incluse"
                      values={items.map((i) => (
                        <AmenityCheck
                          key={i.id}
                          on={i.amenities.waterIncluded}
                          label="Eau incluse"
                        />
                      ))}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Internet fibre"
                      values={items.map((i) => (
                        <AmenityCheck
                          key={i.id}
                          on={i.amenities.internet}
                          label="Internet"
                        />
                      ))}
                      slots={slots}
                    />
                    <ComparisonRow
                      label="Gardien"
                      values={items.map((i) => (
                        <AmenityCheck
                          key={i.id}
                          on={i.amenities.securityGuard}
                          label="Gardien"
                        />
                      ))}
                      slots={slots}
                    />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions finales */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-[#F4F7FB] to-white p-6 shadow-sm print:hidden">
              <div className="text-sm text-muted-foreground">
                Une fois votre choix fait, demandez les visites en un seul
                clic.
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" className="gap-2 rounded-full">
                  <Link href="/search">
                    <Eye className="size-4" />
                    Voir plus de biens
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={exportPdf}
                  className="gap-2 rounded-full"
                >
                  <FileDown className="size-4" />
                  Exporter PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="gap-2 rounded-full"
                >
                  <Trash2 className="size-4" />
                  Tout effacer
                </Button>
                <Button className="gap-2 rounded-full bg-kaza-blue text-white hover:bg-kaza-navy">
                  Demander une visite ({slots})
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Skeleton hydratation */}
        {!hydrated && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[460px] animate-pulse rounded-3xl border bg-white"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function AmenityCheck({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {on ? (
        <Check
          className="size-4 shrink-0 text-kaza-green"
          aria-label={`${label} : oui`}
        />
      ) : (
        <Minus
          className="size-4 shrink-0 text-muted-foreground"
          aria-label={`${label} : non`}
        />
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function ComparisonRow({
  label,
  icon: Icon,
  values,
  emphasize,
  slots,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  values: React.ReactNode[];
  emphasize?: boolean;
  slots: number;
}) {
  // Couleurs alternées rangées
  return (
    <tr className="border-t border-gray-100 even:bg-gray-50/50">
      <td className="w-52 px-6 py-4 text-sm font-medium text-kaza-navy">
        <span className="inline-flex items-center gap-2">
          {Icon && <Icon className="size-4 shrink-0 text-kaza-blue" />}
          {label}
        </span>
      </td>
      {values.map((value, i) => (
        <td
          key={i}
          className={cn(
            "px-6 py-4 text-sm text-foreground",
            emphasize && "font-heading text-base font-bold text-kaza-navy",
            slots <= 2 && "min-w-[180px]",
          )}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}
