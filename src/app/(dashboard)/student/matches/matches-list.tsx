"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toast-helper";
import { CompatibilityScore } from "@/components/student/compatibility-score";
import { cn, getInitials } from "@/lib/utils";

type MatchStatus = "new" | "viewed" | "requested";

type Match = {
  id: string;
  name: string;
  age: number;
  university: string;
  discipline: string;
  score: number;
  commonHabits: string[];
  differences: string[];
  bio: string;
};

// Profils de colocataires compatibles — alimentés par les vrais profils
// étudiants une fois le matching branché. Vide tant qu'aucun profil réel.
const MATCHES: Match[] = [];

type FilterKey = "new" | "viewed" | "requested" | "all";

const STORAGE_KEY = "kaza-matches-status";

export function MatchesList() {
  const [statuses, setStatuses] = useState<Record<string, MatchStatus>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setStatuses(JSON.parse(raw) as Record<string, MatchStatus>);
      }
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  const persist = (next: Record<string, MatchStatus>) => {
    setStatuses(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const getStatus = (id: string): MatchStatus => statuses[id] ?? "new";

  const handleView = (id: string, name: string) => {
    const current = getStatus(id);
    if (current === "new") persist({ ...statuses, [id]: "viewed" });
    toast.info(`Profil de ${name} ouvert.`);
  };

  const handleRequest = (id: string, name: string) => {
    if (getStatus(id) === "requested") {
      toast.info("Demande déjà envoyée.");
      return;
    }
    persist({ ...statuses, [id]: "requested" });
    toast.success(`Demande envoyée à ${name} ✓`);
  };

  const counts = useMemo(() => {
    const c = { new: 0, viewed: 0, requested: 0 };
    for (const m of MATCHES) {
      c[getStatus(m.id)]++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses]);

  const filtered = useMemo(() => {
    if (filter === "all") return MATCHES;
    return MATCHES.filter((m) => getStatus(m.id) === filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, statuses]);

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-xl border border-dashed bg-muted/30" />;
  }

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: MATCHES.length },
    { key: "new", label: "Nouveau", count: counts.new },
    { key: "viewed", label: "Vu", count: counts.viewed },
    { key: "requested", label: "Demandé", count: counts.requested },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              filter === f.key
                ? "border-kaza-blue bg-kaza-blue text-white"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {f.label}
            <span
              className={cn(
                "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                filter === f.key
                  ? "bg-white/20 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center text-sm text-muted-foreground">
          Aucun match dans cette catégorie pour le moment.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((m) => {
            const status = getStatus(m.id);
            const [first, ...rest] = m.name.split(" ");
            return (
              <Card key={m.id} className="overflow-hidden">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex gap-4">
                    <Avatar className="size-16 shrink-0">
                      <AvatarFallback className="bg-kaza-navy text-base text-white">
                        {getInitials(first ?? "", rest.join(" "))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="truncate font-semibold">
                            {m.name}, {m.age}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {m.discipline} · {m.university}
                          </p>
                        </div>
                        {status === "requested" && (
                          <Badge className="bg-kaza-green/10 text-[10px] text-kaza-green">
                            <Check className="mr-0.5 size-3" />
                            Demandé
                          </Badge>
                        )}
                        {status === "viewed" && (
                          <Badge variant="secondary" className="text-[10px]">
                            Vu
                          </Badge>
                        )}
                        {status === "new" && (
                          <Badge className="bg-kaza-blue text-[10px] text-white">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {m.bio}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <CompatibilityScore score={m.score} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-kaza-green">
                        En commun
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.commonHabits.map((h) => (
                          <Badge
                            key={h}
                            className="bg-kaza-green/10 text-[11px] text-kaza-green hover:bg-kaza-green/15"
                          >
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {m.differences.length > 0 && (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                          Différences
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.differences.map((d) => (
                            <Badge
                              key={d}
                              className="bg-orange-50 text-[11px] text-orange-700 hover:bg-orange-100"
                            >
                              {d}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(m.id, m.name)}
                    >
                      <Eye className="mr-1.5 size-4" />
                      Voir profil
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={status === "requested"}
                      onClick={() => handleRequest(m.id, m.name)}
                    >
                      <UserPlus className="mr-1.5 size-4" />
                      {status === "requested" ? "Envoyée" : "Rejoindre"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
