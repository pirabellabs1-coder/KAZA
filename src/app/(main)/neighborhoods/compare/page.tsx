"use client";

// =============================================================================
// KAZA - /neighborhoods/compare (REFONTE LUXE — W11 Olamide)
// Comparateur de quartiers (jusqu'à 3 colonnes). Persistance localStorage.
// =============================================================================

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Compass,
  FileDown,
  Hospital,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn } from "@/components/shared/fade-in";
import { RevealOnScroll } from "@/components/shared/reveal-on-scroll";
import {
  NEIGHBORHOODS,
  getNeighborhoodBySlug,
  type Neighborhood,
} from "@/lib/demo-neighborhoods";
import { cn, formatPrice } from "@/lib/utils";

const STORAGE_KEY = "kaza-neighborhoods-compare";
const MAX_SLOTS = 3;

const SCORE_LABELS: Record<keyof Neighborhood["scores"], string> = {
  safety: "Sécurité",
  schools: "Écoles",
  transport: "Transports",
  healthcare: "Santé",
  nightlife: "Vie nocturne",
  family: "Familial",
  shopping: "Commerces",
};

const SCORE_ORDER: Array<keyof Neighborhood["scores"]> = [
  "safety",
  "schools",
  "transport",
  "healthcare",
  "nightlife",
  "family",
  "shopping",
];

// =============================================================================
// Helpers persistance
// =============================================================================

function loadFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((s): s is string => typeof s === "string")
        .slice(0, MAX_SLOTS);
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    /* noop */
  }
}

function scoreColor(score: number) {
  if (score >= 7) return { bar: "bg-kaza-green", text: "text-kaza-green" };
  if (score >= 5) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-500", text: "text-rose-600" };
}

// =============================================================================
// Page
// =============================================================================

export default function NeighborhoodsComparePage() {
  const [hydrated, setHydrated] = useState(false);
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    // Hydratation depuis localStorage (pattern client-only, pas de SSR)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlugs(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveToStorage(slugs);
  }, [slugs, hydrated]);

  const items = useMemo(
    () =>
      slugs
        .map((s) => getNeighborhoodBySlug(s))
        .filter((n): n is Neighborhood => Boolean(n)),
    [slugs],
  );

  const availableToAdd = useMemo(
    () => NEIGHBORHOODS.filter((n) => !slugs.includes(n.slug)),
    [slugs],
  );

  const groupedByCity = useMemo(() => {
    const map = new Map<string, Neighborhood[]>();
    for (const n of availableToAdd) {
      if (!map.has(n.cityName)) map.set(n.cityName, []);
      map.get(n.cityName)!.push(n);
    }
    return Array.from(map.entries());
  }, [availableToAdd]);

  // Top 6 par score moyen
  const topNeighborhoods = useMemo(() => {
    return [...NEIGHBORHOODS]
      .map((n) => {
        const scores = Object.values(n.scores);
        const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
        return { n, avg };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 6)
      .map((s) => s.n);
  }, []);

  function addSlug(slug: string) {
    setSlugs((prev) => {
      if (prev.includes(slug)) return prev;
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, slug];
    });
  }

  function removeSlug(slug: string) {
    setSlugs((prev) => prev.filter((s) => s !== slug));
  }

  function clearAll() {
    setSlugs([]);
  }

  function exportPdf() {
    if (typeof window !== "undefined") window.print();
  }

  const isEmpty = items.length === 0;
  const isFull = items.length >= MAX_SLOTS;

  return (
    <div className="bg-white print:bg-white">
      {/* ============== HERO COMPACT GRADIENT ============================== */}
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
                quartiers
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
              Confrontez jusqu&apos;à {MAX_SLOTS} quartiers du Bénin sur la
              qualité de vie, les prix, les équipements et la sécurité. Vos
              choix sont sauvegardés sur cet appareil.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
              <MapPin className="size-4 text-kaza-green" />
              Tous les quartiers du Bénin
            </div>
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
            {items.length} / {MAX_SLOTS} quartiers sélectionnés
          </Badge>
          <div className="flex flex-wrap items-center gap-2">
            {!isEmpty && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* État vide */}
        {hydrated && isEmpty && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white via-[#F4F7FB] to-white p-20 text-center">
              <div className="mb-6 inline-flex size-24 items-center justify-center rounded-3xl bg-kaza-blue/10 text-kaza-blue">
                <MapPin className="size-12" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl">
                Comparez les quartiers du Bénin
              </h2>
              <p className="mt-4 max-w-md text-base text-muted-foreground">
                Sélectionnez votre premier quartier pour commencer
                l&apos;analyse comparative.
              </p>
              <div className="mt-10 w-full max-w-sm">
                <NeighborhoodPicker
                  grouped={groupedByCity}
                  onPick={addSlug}
                  placeholder="Ajouter mon premier quartier"
                />
              </div>
            </div>
          </FadeIn>
        )}

        {/* État rempli */}
        {hydrated && !isEmpty && (
          <>
            {/* ===== Colonnes quartiers ===== */}
            <div
              className={cn(
                "grid gap-8 print:gap-4",
                items.length === 1 && "max-w-md grid-cols-1",
                items.length === 2 && "grid-cols-1 sm:grid-cols-2",
                items.length === 3 &&
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {items.map((n, idx) => (
                <RevealOnScroll key={n.slug} delay={idx * 80}>
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-2xl print:shadow-none">
                    {/* Image avec overlay */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src={n.imageUrl}
                        alt={`Photo du quartier ${n.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <button
                        type="button"
                        onClick={() => removeSlug(n.slug)}
                        aria-label={`Retirer ${n.name}`}
                        className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/95 text-kaza-navy shadow-md backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-500 hover:text-white print:hidden"
                      >
                        <X className="size-4" />
                      </button>
                      <Badge className="absolute left-4 top-4 gap-1 border-0 bg-white/95 px-3 py-1 text-xs font-semibold text-kaza-navy backdrop-blur-md">
                        <MapPin className="size-3 text-kaza-blue" />
                        {n.cityName}
                      </Badge>
                      <h3 className="absolute bottom-4 left-5 right-5 font-heading text-2xl font-bold text-white drop-shadow-md sm:text-3xl">
                        {n.name}
                      </h3>
                    </div>

                    {/* Corps */}
                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Loyer moyen
                        </p>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="font-heading text-3xl font-bold text-kaza-navy">
                            {formatPrice(n.averagePrice)}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">
                            /m²
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <Users className="mr-1 inline size-3" />
                          {n.population.toLocaleString("fr-FR")} habitants
                        </p>
                      </div>

                      {/* Scores barres */}
                      <div className="space-y-2.5 border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Qualité de vie
                        </p>
                        {SCORE_ORDER.map((key) => {
                          const score = n.scores[key];
                          const c = scoreColor(score);
                          return (
                            <div
                              key={key}
                              className="grid grid-cols-[80px_minmax(0,1fr)_35px] items-center gap-2"
                            >
                              <span className="text-xs font-medium text-kaza-navy">
                                {SCORE_LABELS[key]}
                              </span>
                              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    c.bar,
                                  )}
                                  style={{ width: `${score * 10}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-right text-xs font-bold tabular-nums",
                                  c.text,
                                )}
                              >
                                {score}/10
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Highlights */}
                      {n.highlights.length > 0 && (
                        <div className="border-t border-gray-100 pt-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-kaza-green">
                            <Sparkles className="mr-1 inline size-3" />
                            Points forts
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {n.highlights.map((h) => (
                              <Badge
                                key={h}
                                className="rounded-full border-0 bg-kaza-green/10 text-xs font-medium text-kaza-green hover:bg-kaza-green/15"
                              >
                                {h}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Concerns */}
                      {n.concerns.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-700">
                            Points faibles
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {n.concerns.map((c) => (
                              <Badge
                                key={c}
                                className="rounded-full border-0 bg-amber-50 text-xs font-medium text-amber-700 hover:bg-amber-100"
                              >
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Équipements */}
                      <div className="border-t border-gray-100 pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Équipements
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <AmenityStat
                            icon={Building2}
                            label="Écoles"
                            value={n.amenitiesCount.schools}
                          />
                          <AmenityStat
                            icon={Hospital}
                            label="Hôpitaux"
                            value={n.amenitiesCount.hospitals}
                          />
                          <AmenityStat
                            icon={Store}
                            label="Marchés"
                            value={n.amenitiesCount.markets}
                          />
                          <AmenityStat
                            icon={ShoppingBag}
                            label="Restos"
                            value={n.amenitiesCount.restaurants}
                          />
                        </div>
                      </div>

                      {/* CTA */}
                      <Button
                        asChild
                        className="mt-auto w-full gap-2 rounded-full bg-kaza-blue text-white hover:bg-kaza-navy print:hidden"
                      >
                        <Link href={`/search?location=${n.city}`}>
                          <Search className="size-4" />
                          Voir annonces
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </article>
                </RevealOnScroll>
              ))}

              {/* Slot d'ajout */}
              {!isFull && (
                <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white via-[#F7F9FC] to-white p-10 text-center print:hidden">
                  <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue">
                    <Plus className="size-6" />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold text-kaza-navy">
                      Ajouter un quartier
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Encore {MAX_SLOTS - items.length} emplacement
                      {MAX_SLOTS - items.length > 1 ? "s" : ""} disponible
                      {MAX_SLOTS - items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <NeighborhoodPicker
                      grouped={groupedByCity}
                      onPick={addSlug}
                      placeholder="Choisir un quartier…"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Skeleton hydratation */}
        {!hydrated && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[640px] animate-pulse rounded-3xl border bg-white"
              />
            ))}
          </div>
        )}
      </div>

      {/* ============== TOP QUARTIERS KAZA ================================= */}
      <section className="bg-gradient-to-b from-[#F4F7FB] to-white py-24 print:hidden">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <FadeIn>
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-kaza-blue">
                Sélection rédactionnelle
              </p>
              <h2 className="font-heading text-3xl font-bold text-kaza-navy sm:text-4xl lg:text-5xl">
                Top quartiers KAZA
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Les quartiers les mieux notés du Bénin selon notre indice de
                qualité de vie composite.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topNeighborhoods.map((n, i) => (
              <RevealOnScroll key={n.slug} delay={i * 60}>
                <article className="group relative h-full overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={n.imageUrl}
                      alt={`Vue du quartier ${n.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <Badge className="absolute left-4 top-4 border-0 bg-white/95 px-3 py-1 text-xs font-semibold text-kaza-navy backdrop-blur-md">
                      <MapPin className="mr-1.5 size-3 text-kaza-blue" />
                      {n.cityName}
                    </Badge>
                    <div className="absolute bottom-4 left-5 right-5">
                      <h3 className="font-heading text-2xl font-bold text-white drop-shadow-md">
                        {n.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-6">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        À partir de
                      </p>
                      <p className="font-heading text-lg font-bold text-kaza-navy">
                        {formatPrice(n.averagePrice)} /m²
                      </p>
                    </div>
                    <Button
                      onClick={() => addSlug(n.slug)}
                      disabled={slugs.includes(n.slug) || isFull}
                      className="gap-2 rounded-full bg-kaza-blue text-white hover:bg-kaza-navy"
                    >
                      {slugs.includes(n.slug) ? (
                        "Ajouté"
                      ) : (
                        <>
                          <Plus className="size-4" />
                          Comparer
                        </>
                      )}
                    </Button>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// Sous-composants
// =============================================================================

function NeighborhoodPicker({
  grouped,
  onPick,
  placeholder,
}: {
  grouped: Array<[string, Neighborhood[]]>;
  onPick: (slug: string) => void;
  placeholder: string;
}) {
  if (grouped.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">
        Tous les quartiers disponibles sont déjà ajoutés.
      </p>
    );
  }
  return (
    <Select
      value=""
      onValueChange={(v) => {
        if (v) onPick(v);
      }}
    >
      <SelectTrigger className="h-11 w-full rounded-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {grouped.map(([city, neighborhoods]) => (
          <SelectGroup key={city}>
            <SelectLabel>{city}</SelectLabel>
            {neighborhoods.map((n) => (
              <SelectItem key={n.slug} value={n.slug}>
                {n.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function AmenityStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
      <Icon className="size-4 shrink-0 text-kaza-blue" />
      <div className="min-w-0">
        <p className="font-heading text-base font-bold leading-tight text-kaza-navy tabular-nums">
          {value}
        </p>
        <p className="text-[10px] leading-tight text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
