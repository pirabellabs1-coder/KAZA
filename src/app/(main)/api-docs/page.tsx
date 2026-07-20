import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Code2,
  KeyRound,
  ShieldCheck,
  Webhook,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "./code-block";

export const metadata: Metadata = {
  title: "Documentation API — Kaabo Developers",
  description:
    "Documentation complète de l'API REST Kaabo : authentification par clé, points de terminaison, paramètres, schémas de réponse, codes d'erreur, limites de débit, webhooks et exemples de code (curl, JavaScript, Python).",
  alternates: { canonical: "/api-docs" },
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kaza-topaz.vercel.app";

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "authentification", label: "Authentification" },
  { id: "url-base", label: "URL de base & versions" },
  { id: "limites", label: "Limites de débit" },
  { id: "pagination", label: "Pagination" },
  { id: "endpoints", label: "Points de terminaison" },
  { id: "erreurs", label: "Codes d'erreur" },
  { id: "exemples", label: "Exemples de code" },
  { id: "webhooks", label: "Webhooks" },
  { id: "tarifs", label: "Tarifs & accès" },
];

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon?: typeof Code2;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
        {Icon && <Icon className="size-6 text-kaza-blue" />}
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

function Endpoint({ method, path }: { method: string; path: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 font-mono text-xs">
      <span className="rounded bg-kaza-green px-2 py-0.5 font-bold text-white">
        {method}
      </span>
      <span className="text-kaza-navy">{path}</span>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-kaza-navy via-[#12304a] to-kaza-blue p-8 text-white md:p-12">
        <Badge className="border-white/20 bg-white/10 text-white">
          <Code2 className="mr-1 size-3" /> API REST v1
        </Badge>
        <h1 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
          Documentation API Kaabo
        </h1>
        <p className="mt-3 max-w-2xl text-white/80">
          Intégrez les données immobilières de Kaabo à vos applications, sites
          web, CRM ou ERP. Une API REST simple, authentifiée par clé, avec des
          réponses JSON. <strong>Gratuite pour les agences</strong>, accessible
          aux développeurs via l&apos;abonnement Kaabo Developer API.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-white text-kaza-navy hover:bg-white/90">
            <Link href="/developers">
              <KeyRound className="mr-1.5 size-4" />
              Obtenir une clé API
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <a href="#exemples">
              Voir les exemples <ArrowRight className="ml-1.5 size-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Sommaire */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sommaire
            </p>
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-kaza-navy"
              >
                {t.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Contenu */}
        <div className="space-y-12">
          <Section id="introduction" title="Introduction" icon={Code2}>
            <p>
              L&apos;API Kaabo est une API <strong>REST</strong> : elle utilise
              des URL prévisibles, l&apos;authentification par clé (Bearer),
              renvoie du <strong>JSON</strong> et s&apos;appuie sur les codes de
              statut HTTP standards. Toutes les requêtes se font en HTTPS.
            </p>
            <p>
              Les données exposées sont <strong>publiques</strong> (annonces
              disponibles). Aucune donnée personnelle d&apos;utilisateur
              n&apos;est accessible via l&apos;API.
            </p>
          </Section>

          <Section
            id="authentification"
            title="Authentification"
            icon={KeyRound}
          >
            <p>
              Chaque requête doit inclure votre clé API dans l&apos;en-tête{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                Authorization
              </code>{" "}
              au format Bearer :
            </p>
            <CodeBlock
              lang="http"
              code={`Authorization: Bearer kaabo_live_xxxxxxxxxxxxxxxxxxxx`}
            />
            <p>
              Générez et gérez vos clés depuis votre espace{" "}
              <Link href="/developers" className="text-kaza-blue underline">
                API & Développeurs
              </Link>
              . Une clé n&apos;est affichée <strong>qu&apos;une seule fois</strong>{" "}
              à sa création : conservez-la en lieu sûr. En cas de fuite,
              révoquez-la et générez-en une nouvelle.
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldCheck className="mr-1 inline size-3.5" />
              Ne partagez jamais votre clé publiquement (dépôt Git, code client,
              navigateur). Utilisez-la uniquement côté serveur.
            </div>
          </Section>

          <Section id="url-base" title="URL de base & versions" icon={Zap}>
            <p>Toutes les requêtes partent de l&apos;URL de base suivante :</p>
            <CodeBlock lang="text" code={`${BASE_URL}/api/v1`} />
            <p>
              La version de l&apos;API est indiquée dans le chemin (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                /v1
              </code>
              ). Les évolutions rétro-incompatibles donneront lieu à une nouvelle
              version (v2, …) ; la v1 restera maintenue.
            </p>
          </Section>

          <Section id="limites" title="Limites de débit" icon={Zap}>
            <p>
              Chaque clé dispose d&apos;un quota de requêtes par jour :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Type de clé</th>
                    <th className="py-2">Quota</th>
                    <th className="py-2">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Agence (compte agence Kaabo)</td>
                    <td className="py-2">5 000 requêtes / jour</td>
                    <td className="py-2 font-semibold text-kaza-green">
                      Gratuit
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2">Développeur externe</td>
                    <td className="py-2">10 000 requêtes / jour</td>
                    <td className="py-2">Kaabo Developer API</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              En cas de dépassement, l&apos;API renvoie un statut{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">429</code>{" "}
              (Too Many Requests).
            </p>
          </Section>

          <Section id="pagination" title="Pagination" icon={Code2}>
            <p>
              Les listes sont paginées via les paramètres de requête{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                limit
              </code>{" "}
              (1–100, défaut 20) et{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                offset
              </code>{" "}
              (défaut 0). Chaque réponse indique{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                count
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                limit
              </code>{" "}
              et{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                offset
              </code>
              .
            </p>
          </Section>

          <Section id="endpoints" title="Points de terminaison" icon={Building2}>
            <div className="space-y-6">
              <div>
                <Endpoint method="GET" path="/api/v1/properties" />
                <p className="mt-3">
                  Retourne la liste des annonces <strong>disponibles</strong>,
                  de la plus récente à la plus ancienne.
                </p>
                <p className="mt-3 font-semibold text-kaza-navy">
                  Paramètres de requête
                </p>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[480px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="py-2">Paramètre</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-mono text-xs">limit</td>
                        <td className="py-2">entier</td>
                        <td className="py-2">
                          Nombre de résultats (1–100, défaut 20)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-xs">offset</td>
                        <td className="py-2">entier</td>
                        <td className="py-2">
                          Décalage pour la pagination (défaut 0)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 font-semibold text-kaza-navy">
                  Exemple de réponse{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                    200 OK
                  </code>
                </p>
                <CodeBlock
                  lang="json"
                  code={`{
  "object": "list",
  "count": 1,
  "limit": 20,
  "offset": 0,
  "data": [
    {
      "id": "ce71652d-0e08-4c0d-8456-2bf5212022d4",
      "title": "Appartement 2 chambres à Lomé",
      "description": "Bel appartement lumineux...",
      "listingType": "RENT",
      "price": 140000,
      "bedrooms": 2,
      "bathrooms": 1,
      "squareMeters": 75,
      "propertyType": "APARTMENT",
      "address": "Quartier Tokoin, Lomé, Togo",
      "createdAt": "2026-07-01T10:00:00Z"
    }
  ]
}`}
                />
              </div>
            </div>
          </Section>

          <Section id="erreurs" title="Codes d'erreur" icon={ShieldCheck}>
            <p>
              L&apos;API utilise les codes de statut HTTP standards. Le corps
              d&apos;une erreur contient un objet{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                error
              </code>{" "}
              et un message lisible.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Statut</th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Signification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-mono">200</td>
                    <td className="py-2 font-mono text-xs">—</td>
                    <td className="py-2">Succès</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">401</td>
                    <td className="py-2 font-mono text-xs">unauthorized</td>
                    <td className="py-2">Clé manquante, invalide ou révoquée</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono">429</td>
                    <td className="py-2 font-mono text-xs">rate_limited</td>
                    <td className="py-2">Quota de requêtes dépassé</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">500</td>
                    <td className="py-2 font-mono text-xs">server_error</td>
                    <td className="py-2">Erreur interne</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <CodeBlock
              lang="json"
              code={`{
  "error": "unauthorized",
  "message": "Clé API invalide ou révoquée."
}`}
            />
          </Section>

          <Section id="exemples" title="Exemples de code" icon={Code2}>
            <p className="font-semibold text-kaza-navy">cURL</p>
            <CodeBlock
              lang="bash"
              code={`curl "${BASE_URL}/api/v1/properties?limit=20" \\
  -H "Authorization: Bearer kaabo_live_xxxxxxxx"`}
            />

            <p className="font-semibold text-kaza-navy">
              JavaScript (Node.js / fetch)
            </p>
            <CodeBlock
              lang="javascript"
              code={`const res = await fetch(
  "${BASE_URL}/api/v1/properties?limit=20",
  { headers: { Authorization: "Bearer " + process.env.KAABO_API_KEY } }
);
const { data } = await res.json();
console.log(data);`}
            />

            <p className="font-semibold text-kaza-navy">Python (requests)</p>
            <CodeBlock
              lang="python"
              code={`import os, requests

r = requests.get(
    "${BASE_URL}/api/v1/properties",
    params={"limit": 20},
    headers={"Authorization": f"Bearer {os.environ['KAABO_API_KEY']}"},
)
print(r.json()["data"])`}
            />
          </Section>

          <Section id="webhooks" title="Webhooks" icon={Webhook}>
            <p>
              Les webhooks vous permettent de recevoir des notifications en temps
              réel lorsqu&apos;un événement se produit (nouvelle annonce, mise à
              jour, etc.), plutôt que d&apos;interroger l&apos;API en continu.
            </p>
            <p>
              Configurez une URL de réception (endpoint HTTPS) dans votre espace
              développeur ; Kaabo y enverra une requête{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                POST
              </code>{" "}
              signée à chaque événement. La signature (en-tête{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                X-Kaabo-Signature
              </code>
              , HMAC-SHA256) permet de vérifier l&apos;authenticité.
            </p>
            <Badge variant="secondary">Bientôt disponible</Badge>
          </Section>

          <Section id="tarifs" title="Tarifs & accès" icon={KeyRound}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border p-5">
                <p className="font-heading text-lg font-semibold text-kaza-navy">
                  Agences
                </p>
                <p className="mt-1 text-2xl font-bold text-kaza-green">Gratuit</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Inclus dans tout compte agence Kaabo. Générez vos clés
                  directement depuis votre tableau de bord.
                </p>
              </div>
              <div className="rounded-2xl border-2 border-kaza-blue p-5">
                <p className="font-heading text-lg font-semibold text-kaza-navy">
                  Kaabo Developer API
                </p>
                <p className="mt-1 text-2xl font-bold text-kaza-navy">
                  15 000 FCFA
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / mois
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pour les développeurs et entreprises externes : jusqu&apos;à
                  10 000 requêtes/jour, accès API + webhooks, support développeur.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/developers">
                  <KeyRound className="mr-1.5 size-4" />
                  Obtenir une clé API
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">Voir tous les tarifs</Link>
              </Button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
