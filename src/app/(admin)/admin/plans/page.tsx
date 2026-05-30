// =============================================================================
// KAZA — Admin / Tarifs des abonnements
// Server Component. Charge les plans depuis la table `plans` (via getAllPlans,
// avec fallback statique) et affiche un éditeur de prix par plan (mensuel +
// annuel). L'édition est branchée sur l'action serveur `updatePlan`.
//
// La garde de rôle ADMIN est assurée par `(admin)/layout.tsx` + l'action.
// =============================================================================

import { Tag, Building2, Sparkles, Check } from "lucide-react";

import { getAllPlans } from "@/lib/queries/plans";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa } from "@/lib/utils";

import { PlanEditRow } from "./plan-edit-row";

export const dynamic = "force-dynamic";

// Ordre d'affichage stable (les plans hors liste sont ajoutés à la fin).
const DISPLAY_ORDER = [
  "PRO_STARTER",
  "PRO_PREMIUM",
  "PRO_ELITE",
  "PLUS_MONTHLY",
  "PLUS_YEARLY",
];

// Seuls ces plans exposent un tarif annuel éditable.
const YEARLY_PLAN_KEYS = new Set(["PLUS_YEARLY"]);

export default async function AdminPlansPage() {
  const plans = await getAllPlans();

  const keys = Object.keys(plans).sort((a, b) => {
    const ia = DISPLAY_ORDER.indexOf(a);
    const ib = DISPLAY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const agencyKeys = keys.filter((k) => plans[k].audience === "AGENCY");
  const tenantKeys = keys.filter((k) => plans[k].audience === "TENANT");

  function renderGroup(groupKeys: string[]) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {groupKeys.map((key) => {
          const plan = plans[key];
          const hasYearly = YEARLY_PLAN_KEYS.has(key);
          return (
            <Card key={key} className="border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-heading text-lg text-kaza-navy">
                      {plan.name}
                    </CardTitle>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {key}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-kaza-blue/30 bg-kaza-blue/5 text-xs font-semibold text-kaza-blue"
                  >
                    {plan.audience === "AGENCY" ? "Agence" : "Locataire"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-1 text-muted-foreground">
                  <span className="font-heading text-2xl font-bold text-kaza-navy">
                    {formatFcfa(plan.priceMonthly)}
                  </span>
                  <span className="text-xs">/ mois</span>
                  {plan.priceYearly !== undefined && (
                    <span className="ml-2 text-xs">
                      · {formatFcfa(plan.priceYearly)} / an
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <PlanEditRow
                  planKey={key}
                  name={plan.name}
                  priceMonthly={plan.priceMonthly}
                  priceYearly={plan.priceYearly ?? null}
                  hasYearly={hasYearly}
                />

                {plan.features.length > 0 && (
                  <ul className="space-y-1.5 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-kaza-green" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          <Tag className="size-6 text-kaza-blue" />
          Tarifs des abonnements
        </h1>
        <p className="text-sm text-muted-foreground">
          Modifiez les prix des plans KAZA Pro et KAZA Plus. Les changements
          sont appliqués immédiatement sur les pages publiques de tarifs, sans
          redéploiement.
        </p>
      </div>

      {/* KAZA Pro (agences) */}
      {agencyKeys.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-kaza-blue" />
            <h2 className="font-heading text-xl font-bold text-kaza-navy">
              KAZA Pro — Agences
            </h2>
          </div>
          {renderGroup(agencyKeys)}
        </section>
      )}

      {/* KAZA Plus (locataires) */}
      {tenantKeys.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            <h2 className="font-heading text-xl font-bold text-kaza-navy">
              KAZA Plus — Locataires &amp; étudiants
            </h2>
          </div>
          {renderGroup(tenantKeys)}
        </section>
      )}
    </div>
  );
}
