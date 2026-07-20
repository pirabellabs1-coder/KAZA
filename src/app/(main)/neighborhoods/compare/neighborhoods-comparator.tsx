"use client";

import { useState, useTransition } from "react";
import { MapPin, Plus, Star, X } from "lucide-react";

import {
  getNeighborhoodComparison,
  type NeighborhoodOption,
  type NeighborhoodStats,
} from "@/actions/neighborhoods";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFcfa } from "@/lib/utils";

const MAX_SLOTS = 3;

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  VILLA: "Villa",
  STUDIO: "Studio",
  ROOM: "Chambre",
  OFFICE: "Bureau",
  LAND: "Terrain",
  COMMERCIAL: "Local commercial",
};

function fcfaOrDash(v: number): string {
  return v > 0 ? formatFcfa(v) : "—";
}

export function NeighborhoodsComparator({
  options,
}: {
  options: NeighborhoodOption[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [stats, setStats] = useState<NeighborhoodStats[]>([]);
  const [pending, startTransition] = useTransition();

  const refresh = (slugs: string[]) => {
    if (slugs.length === 0) {
      setStats([]);
      return;
    }
    startTransition(async () => {
      const res = await getNeighborhoodComparison(slugs);
      setStats(res);
    });
  };

  const add = (slug: string) => {
    if (selected.includes(slug) || selected.length >= MAX_SLOTS) return;
    const next = [...selected, slug];
    setSelected(next);
    refresh(next);
  };

  const remove = (slug: string) => {
    const next = selected.filter((s) => s !== slug);
    setSelected(next);
    refresh(next);
  };

  const available = options.filter((o) => !selected.includes(o.slug));

  return (
    <div className="space-y-6">
      {/* Sélecteur */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-full max-w-md">
          <Select onValueChange={add} value="">
            <SelectTrigger disabled={selected.length >= MAX_SLOTS}>
              <SelectValue
                placeholder={
                  selected.length >= MAX_SLOTS
                    ? `Maximum ${MAX_SLOTS} quartiers`
                    : "Ajouter un quartier à comparer…"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {available.map((o) => (
                <SelectItem key={o.slug} value={o.slug}>
                  {o.name} · {o.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {stats.map((s) => (
              <span
                key={s.slug}
                className="flex items-center gap-1.5 rounded-full bg-kaza-blue/10 px-3 py-1 text-sm font-medium text-kaza-blue"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => remove(s.slug)}
                  aria-label={`Retirer ${s.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white via-[#F4F7FB] to-white p-16 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue">
            <MapPin className="size-8" />
          </div>
          <h2 className="font-heading text-xl font-bold text-kaza-navy">
            Sélectionnez des quartiers à comparer
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Les statistiques (loyer moyen, surface, équipements) sont calculées
            en direct à partir des annonces réellement disponibles.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium text-muted-foreground">
                  Critère
                </th>
                {stats.map((s) => (
                  <th key={s.slug} className="p-3">
                    <p className="font-heading text-base font-bold text-kaza-navy">
                      {s.name}
                    </p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {s.city}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <Row label="Standing (référentiel)">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3">
                    <span className="inline-flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < s.priceTier
                              ? "size-3.5 fill-amber-400 text-amber-400"
                              : "size-3.5 text-gray-300"
                          }
                        />
                      ))}
                    </span>
                  </td>
                ))}
              </Row>
              <Row label="Biens disponibles">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3 font-semibold">
                    {s.count}
                  </td>
                ))}
              </Row>
              <Row label="Loyer moyen">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3 font-semibold text-kaza-navy">
                    {fcfaOrDash(s.avgRent)}
                  </td>
                ))}
              </Row>
              <Row label="Fourchette de loyer">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3 text-xs text-muted-foreground">
                    {s.minRent > 0
                      ? `${fcfaOrDash(s.minRent)} – ${fcfaOrDash(s.maxRent)}`
                      : "—"}
                  </td>
                ))}
              </Row>
              <Row label="Surface moyenne">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3">
                    {s.avgSurface > 0 ? `${s.avgSurface} m²` : "—"}
                  </td>
                ))}
              </Row>
              <Row label="Loyer moyen / m²">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3">
                    {fcfaOrDash(s.avgPricePerM2)}
                  </td>
                ))}
              </Row>
              <Row label="Type dominant">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3">
                    {TYPE_LABELS[s.topType] ?? "—"}
                  </td>
                ))}
              </Row>
              <AmenityRow label="Parking" stats={stats} pick={(a) => a.parking} />
              <AmenityRow
                label="Climatisation"
                stats={stats}
                pick={(a) => a.airConditioning}
              />
              <AmenityRow label="Meublé" stats={stats} pick={(a) => a.furnished} />
              <AmenityRow
                label="Internet / WiFi"
                stats={stats}
                pick={(a) => a.internet}
              />
              <AmenityRow
                label="Gardien / sécurité"
                stats={stats}
                pick={(a) => a.securityGuard}
              />
              <Row label="Ambiance">
                {stats.map((s) => (
                  <td key={s.slug} className="p-3">
                    <span className="flex flex-wrap gap-1">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  </td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
      )}

      {pending && (
        <p className="text-center text-xs text-muted-foreground">
          Calcul en cours…
        </p>
      )}

      {selected.length < MAX_SLOTS && selected.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          <Plus className="mr-1 inline size-3" />
          Ajoutez encore {MAX_SLOTS - selected.length} quartier
          {MAX_SLOTS - selected.length > 1 ? "s" : ""} pour comparer.
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td className="p-3 font-medium text-muted-foreground">{label}</td>
      {children}
    </tr>
  );
}

function AmenityRow({
  label,
  stats,
  pick,
}: {
  label: string;
  stats: NeighborhoodStats[];
  pick: (a: NeighborhoodStats["amenities"]) => number;
}) {
  return (
    <tr>
      <td className="p-3 font-medium text-muted-foreground">{label}</td>
      {stats.map((s) => {
        const v = pick(s.amenities);
        return (
          <td key={s.slug} className="p-3">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full bg-kaza-green"
                  style={{ width: `${v}%` }}
                />
              </span>
              <span className="text-xs text-muted-foreground">{v}%</span>
            </span>
          </td>
        );
      })}
    </tr>
  );
}
