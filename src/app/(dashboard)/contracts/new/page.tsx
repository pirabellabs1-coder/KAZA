import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  FileSignature,
  Home,
  Info,
  Sofa,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  CONTRACT_TEMPLATES,
  type ContractTemplate,
} from "@/lib/contracts/templates";

export const metadata: Metadata = {
  title: "Contrats de bail — Modèles & création",
};

const ICON_MAP: Record<string, LucideIcon> = { Sofa, Home, Users, Store };

export default async function NewContractPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/contracts/new");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contracts">
            <ArrowLeft className="mr-1.5 size-4" />
            Retour
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/contracts/templates">Voir tous les modèles</Link>
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Contrats de bail Kaabo
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Modèles conformes à la Loi 2018-12 (Bénin) et au droit OHADA.
        </p>
      </div>

      {/* Comment ça marche : le contrat est généré à l'acceptation */}
      <Card className="border-2 border-kaza-blue/20 bg-kaza-blue/5">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-kaza-blue/15">
              <Info className="size-5 text-kaza-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-kaza-navy">
                Le contrat de bail est créé automatiquement
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Dès que vous <strong>acceptez une candidature</strong> sur l&apos;un
                de vos biens, un contrat de bail pré-rempli (parties, bien, loyer)
                est généré « en cours de rédaction ». Vous le complétez, puis vous
                l&apos;<strong>envoyez au locataire</strong> pour signature.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button asChild className="gap-1.5">
              <Link href="/owner/applications">
                <ClipboardList className="size-4" /> Mes candidatures
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/contracts">
                <FileSignature className="size-4" /> Mes contrats
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modèles disponibles (informatif) */}
      <section className="space-y-5">
        <div>
          <h2 className="font-heading text-xl font-bold">
            Modèles de bail disponibles
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le modèle adapté est appliqué automatiquement selon le type de bien.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {CONTRACT_TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TemplateCard({ template }: { template: ContractTemplate }) {
  const Icon = ICON_MAP[template.icon] ?? Home;
  const isRecommended = template.category === "RESIDENTIAL_UNFURNISHED";

  return (
    <Link href="/contracts/templates" className="group block">
      <Card className="h-full overflow-hidden border-2 transition-all hover:-translate-y-1 hover:border-kaza-navy/40 hover:shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-kaza-navy text-white">
              <Icon className="size-7" />
            </div>
            {isRecommended && (
              <Badge className="bg-kaza-green text-white">Recommandé</Badge>
            )}
          </div>
          <div>
            <CardTitle className="text-lg leading-tight">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {template.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center text-xs">
            <div>
              <p className="font-semibold text-foreground">
                {template.defaultDurationMonths} mois
              </p>
              <p className="text-muted-foreground">Durée</p>
            </div>
            <div className="border-l border-r">
              <p className="font-semibold text-foreground">
                {template.defaultDepositMonths} mois
              </p>
              <p className="text-muted-foreground">Dépôt</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {template.sections.length}
              </p>
              <p className="text-muted-foreground">Sections</p>
            </div>
          </div>
          <p className="rounded-lg bg-kaza-blue/5 px-3 py-2 text-xs leading-relaxed text-kaza-navy/80">
            <span className="font-semibold">Base légale :</span>{" "}
            {template.legalBasis}
          </p>
          <div className="flex items-center justify-between text-sm font-medium text-kaza-blue transition-colors group-hover:text-kaza-navy">
            <span>Voir le détail du modèle</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
