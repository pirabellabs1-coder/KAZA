import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, Code2, KeyRound, Webhook } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getApiUsage } from "@/lib/queries/api-usage";
import { listMyApiKeys } from "@/actions/api-keys";
import { listMyWebhooks } from "@/actions/webhooks";
import { Card, CardContent } from "@/components/ui/card";
import { ApiKeysManager } from "./api-keys-manager";
import { WebhooksManager } from "./webhooks-manager";

export const metadata: Metadata = {
  title: "API & Développeurs — Kaabo",
};

export default async function DevelopersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/developers");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;

  const [keys, webhooks, usage] = await Promise.all([
    listMyApiKeys(),
    listMyWebhooks(),
    getApiUsage(user.id),
  ]);

  const canCreate =
    role === "AGENCY" || role === "ADMIN" || role === "DEVELOPER";

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://kaza-topaz.vercel.app";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
          <Code2 className="size-6 text-kaza-blue" />
          API & Développeurs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accédez aux données des annonces Kaabo par programmation : récupérez
          le catalogue, synchronisez vos outils, recevez les nouveautés en
          temps réel.
        </p>
      </div>

      {/* Suivi d'utilisation (données réelles) */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-kaza-navy">
          <Activity className="size-5" />
          Suivi d&apos;utilisation
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Appels (total)</p>
              <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
                {usage.totalCalls.toLocaleString("fr-FR")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
              <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
                {usage.callsToday.toLocaleString("fr-FR")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Clés actives</p>
              <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
                {usage.activeKeys}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Webhooks</p>
              <p className="mt-1 font-heading text-2xl font-bold text-kaza-navy">
                {webhooks.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {usage.recent.length > 0 && (
          <Card className="mt-3">
            <CardContent className="p-0">
              <p className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Requêtes récentes
              </p>
              <div className="divide-y">
                {usage.recent.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-4 py-2 text-xs"
                  >
                    <span className="flex items-center gap-2 font-mono">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-semibold">
                        {r.method}
                      </span>
                      {r.path}
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className={
                          r.status >= 200 && r.status < 300
                            ? "text-kaza-green"
                            : "text-red-500"
                        }
                      >
                        {r.status}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Clés API */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-kaza-navy">
          <KeyRound className="size-5" />
          Vos clés API
        </h2>
        <ApiKeysManager keys={keys} canCreate={canCreate} />
      </section>

      {/* Webhooks */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-kaza-navy">
          <Webhook className="size-5" />
          Webhooks
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Recevez une requête HTTP signée à chaque événement (nouvelle annonce,
          etc.), plutôt que d&apos;interroger l&apos;API en continu.
        </p>
        <WebhooksManager webhooks={webhooks} canCreate={canCreate} />
      </section>

      {/* Documentation rapide */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-kaza-navy">
          <Webhook className="size-5" />
          Démarrage rapide
        </h2>
        <Card>
          <CardContent className="space-y-3 p-4 text-sm">
            <p className="text-muted-foreground">
              Authentifiez chaque requête avec l&apos;en-tête{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                Authorization: Bearer VOTRE_CLÉ
              </code>
              .
            </p>
            <div className="overflow-x-auto rounded-lg bg-kaza-navy p-3">
              <pre className="whitespace-pre text-xs leading-relaxed text-white">
                <code>{`curl "${baseUrl}/api/v1/properties?limit=20" \\
  -H "Authorization: Bearer kaabo_live_xxxxxxxx"`}</code>
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Points de terminaison disponibles :
            </p>
            <ul className="space-y-1 text-xs">
              <li>
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  GET /api/v1/properties
                </code>{" "}
                — annonces disponibles (paramètres : limit, offset)
              </li>
            </ul>
            <a
              href="/api-docs"
              className="inline-flex items-center gap-1 text-sm font-medium text-kaza-blue hover:underline"
            >
              Consulter la documentation complète
            </a>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
