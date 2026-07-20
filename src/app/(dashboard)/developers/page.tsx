import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Code2, KeyRound, Webhook } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/queries/subscriptions";
import { listMyApiKeys } from "@/actions/api-keys";
import { Card, CardContent } from "@/components/ui/card";
import { ApiKeysManager } from "./api-keys-manager";

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

  const [keys, subscription] = await Promise.all([
    listMyApiKeys(),
    getActiveSubscription(user.id),
  ]);

  const isAgency = role === "AGENCY" || role === "ADMIN";
  const canCreate = isAgency || subscription?.plan === "DEVELOPER_API";

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
          Accédez aux données publiques des annonces Kaabo par programmation.
          {isAgency
            ? " En tant qu'agence, l'accès API est inclus gratuitement."
            : " L'accès API nécessite l'abonnement Kaabo Developer API (gratuit pour les agences)."}
        </p>
      </div>

      {/* Clés API */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-kaza-navy">
          <KeyRound className="size-5" />
          Vos clés API
        </h2>
        <ApiKeysManager keys={keys} canCreate={canCreate} />
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
