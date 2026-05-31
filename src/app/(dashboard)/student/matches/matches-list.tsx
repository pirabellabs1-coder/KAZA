"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Sparkles, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompatibilityScore } from "@/components/student/compatibility-score";
import { cn, getInitials } from "@/lib/utils";

export interface MatchItem {
  userId: string;
  name: string;
  avatarUrl: string | null;
  university: string;
  discipline: string;
  bio: string;
  score: number;
  reasons: string[];
}

export function MatchesList({ matches }: { matches: MatchItem[] }) {
  const [minScore, setMinScore] = useState(0);

  const filters = [
    { key: 0, label: "Tous" },
    { key: 60, label: "60%+" },
    { key: 80, label: "80%+" },
  ];
  const filtered = matches.filter((m) => m.score >= minScore);

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <Users className="size-7 text-kaza-blue" />
        </div>
        <p className="font-heading text-base font-semibold text-kaza-navy">
          Aucun match pour le moment
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Complétez votre{" "}
          <Link href="/student/profile-coloc" className="text-kaza-blue underline">
            profil colocataire
          </Link>{" "}
          pour que l&apos;algorithme vous propose des colocataires compatibles
          (les matchs apparaissent dès que d&apos;autres étudiants ont rempli le
          leur).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setMinScore(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              minScore === f.key
                ? "border-kaza-blue bg-kaza-blue text-white"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center text-sm text-muted-foreground">
          Aucun match au-dessus de ce seuil de compatibilité.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((m) => {
            const [first, ...rest] = m.name.split(" ");
            return (
              <Card key={m.userId} className="overflow-hidden">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex gap-4">
                    <Avatar className="size-16 shrink-0">
                      {m.avatarUrl ? (
                        <AvatarImage src={m.avatarUrl} alt={m.name} />
                      ) : null}
                      <AvatarFallback className="bg-kaza-navy text-base text-white">
                        {getInitials(first ?? "", rest.join(" "))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[m.discipline, m.university].filter(Boolean).join(" · ") ||
                          "Profil colocataire"}
                      </p>
                      {m.bio ? (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {m.bio}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      <CompatibilityScore score={m.score} size="sm" />
                    </div>
                  </div>

                  {m.reasons.length > 0 && (
                    <div>
                      <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-kaza-green">
                        <Sparkles className="size-3" /> Points communs
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.reasons.map((h) => (
                          <Badge
                            key={h}
                            className="bg-kaza-green/10 text-[11px] text-kaza-green hover:bg-kaza-green/15"
                          >
                            {h}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1" size="sm">
                      <Link href={`/messages?to=${m.userId}`}>
                        <MessageSquare className="mr-1.5 size-4" />
                        Contacter
                      </Link>
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
