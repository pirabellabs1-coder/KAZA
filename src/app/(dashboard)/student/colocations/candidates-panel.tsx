"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast-helper";

import { decideColocationMember } from "@/actions/roommate-listings";
import type { ColocationCandidate } from "@/lib/queries/colocation-members";

export function ColocationCandidatesPanel({
  candidates,
}: {
  candidates: ColocationCandidate[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (candidates.length === 0) return null;

  const decide = (memberId: string, decision: "ACCEPTED" | "REJECTED") => {
    startTransition(async () => {
      const res = await decideColocationMember(memberId, decision);
      if (res.success) {
        toast.success(
          decision === "ACCEPTED" ? "Candidat accepté" : "Candidat refusé",
        );
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec");
      }
    });
  };

  return (
    <Card className="border-kaza-blue/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4 text-kaza-blue" />
          Candidats à valider ({candidates.length})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          En tant que colocataire principal, vérifiez l&apos;identité de chaque
          candidat avant de l&apos;accepter dans votre colocation.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {candidates.map((c) => (
          <div
            key={c.memberId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {c.candidateName}
                </span>
                {c.verified ? (
                  <Badge className="gap-1 bg-kaza-green/15 text-kaza-green">
                    <ShieldCheck className="size-3.5" /> Identité vérifiée
                  </Badge>
                ) : (
                  <Badge className="gap-1 bg-amber-100 text-amber-800">
                    <ShieldAlert className="size-3.5" /> Non vérifiée
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.groupName}
                {c.candidateEmail ? ` · ${c.candidateEmail}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-rose-600 hover:text-rose-700"
                disabled={isPending}
                onClick={() => decide(c.memberId, "REJECTED")}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                Refuser
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={isPending}
                onClick={() => decide(c.memberId, "ACCEPTED")}
              >
                <Check className="size-3.5" /> Accepter
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
