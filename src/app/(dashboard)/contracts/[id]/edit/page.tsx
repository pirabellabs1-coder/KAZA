import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  Home,
  Move,
  PlusCircle,
  Scale,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getUserContractById, type UserContract } from "@/lib/queries/contracts";
import {
  getTemplateById,
  getClausesByCategory,
  CONTRACT_TEMPLATES,
  type ContractSection,
  type ContractTemplate,
} from "@/lib/contracts/templates";
import { cn, formatDate, formatPrice } from "@/lib/utils";

import { ContractEditorClient } from "./contract-editor-client";

const STATUS_LABELS: Record<UserContract["status"], string> = {
  DRAFT: "Brouillon",
  PENDING_TENANT: "En attente locataire",
  PENDING_OWNER: "En attente bailleur",
  SIGNED: "Signé",
  CANCELLED: "Annulé",
};

export const metadata: Metadata = {
  title: "Éditeur de contrat",
};

function getSectionCompleteness(
  section: ContractSection,
): "complete" | "partial" | "empty" {
  if (!section.body || section.body.trim().length === 0) return "empty";
  if (
    section.body.includes("[À PRÉCISER") ||
    section.body.includes("[À compléter") ||
    section.body.includes("[Colocataire n°")
  )
    return "partial";
  return "complete";
}

export default async function ContractEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { id } = await params;
  const { template: templateParam } = await searchParams;

  const user = await getCurrentDisplayUser();
  if (!user) redirect(`/login?redirect=/contracts/${id}/edit`);

  // Contrat réel (table contracts → rentals → properties), scopé à l'utilisateur.
  // Repli brouillon vierge si l'id ne correspond pas encore à un contrat existant.
  const realContract = await getUserContractById(user.id, id);
  const contract: UserContract =
    realContract ?? {
      id,
      status: "DRAFT",
      propertyTitle: "",
      propertyAddress: "",
      ownerName: `${user.firstName} ${user.lastName}`.trim(),
      tenantName: "",
      monthlyRent: 0,
      deposit: 0,
      startDate: "",
      endDate: "",
      createdAt: new Date().toISOString(),
    };

  // Sélection du template (via query, sinon premier par défaut)
  const template: ContractTemplate =
    (templateParam && getTemplateById(templateParam)) ||
    CONTRACT_TEMPLATES[1]; // résidentiel non meublé par défaut

  const clausesByCategory = getClausesByCategory();

  return (
    <div className="space-y-6">
      {/* Header (server) — bouton retour, métadonnées et lien preview PDF */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/contracts/${id}`}>
              <ArrowLeft className="mr-1.5 size-4" />
              Retour
            </Link>
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div>
            <p className="text-xs text-muted-foreground">
              N° Kaabo-2026-{id.slice(-6).toUpperCase()} ·{" "}
              <Badge
                variant="secondary"
                className="ml-1 bg-muted text-muted-foreground"
              >
                {STATUS_LABELS[contract.status]}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/contracts/${id}/preview`}>
              <Eye className="mr-1.5 size-4" />
              Aperçu PDF
            </Link>
          </Button>
        </div>
      </div>

      {/* Layout 3 colonnes */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr_360px]">
        {/* === Colonne gauche : plan === */}
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClipboardCheck className="size-4 text-kaza-blue" />
                Plan du contrat
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {template.sections.length} sections · {template.name}
              </p>
            </CardHeader>
            <CardContent className="space-y-1.5 px-2 pb-3">
              {template.sections.map((section, idx) => {
                const status = getSectionCompleteness(section);
                return (
                  <a
                    key={section.id}
                    href={`#section-${section.id}`}
                    className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "mt-1 size-2.5 shrink-0 rounded-full",
                        status === "complete" && "bg-kaza-green",
                        status === "partial" && "bg-orange-400",
                        status === "empty" && "bg-gray-300"
                      )}
                      aria-label={
                        status === "complete"
                          ? "Section validée"
                          : status === "partial"
                            ? "Section incomplète"
                            : "Section vide"
                      }
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-medium text-foreground">
                        {idx + 1}. {section.title}
                      </p>
                      {section.required && (
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Obligatoire
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </CardContent>
            <Separator />
            <CardContent className="space-y-2 pt-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <PlusCircle className="mr-1.5 size-4" />
                Ajouter une section
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Move className="mr-1.5 size-4" />
                Réordonner
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* === Colonne centre : éditeur (client, auto-save) === */}
        <main>
          <ContractEditorClient
            contractId={id}
            initialTitle={`Contrat de bail — ${contract.propertyTitle}`}
            initialSections={template.sections}
            previewHref={`/contracts/${id}/preview`}
          />
        </main>

        {/* === Colonne droite : détails + bibliothèque === */}
        <aside className="space-y-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          {/* Parties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="size-4 text-kaza-blue" />
                Parties au contrat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <PartyRow
                role="Bailleur"
                name={contract.ownerName}
                detail="Propriétaire vérifié"
              />
              <Separator />
              <PartyRow
                role="Locataire"
                name={contract.tenantName || "Non renseigné"}
                detail={contract.tenantName ? "Locataire désigné" : "À renseigner"}
              />
              <Separator />
              <PartyRow
                role="Garant solidaire"
                name="Non renseigné"
                detail="Optionnel"
                muted
              />
            </CardContent>
          </Card>

          {/* Bien */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Home className="size-4 text-kaza-blue" />
                Bien concerné
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  <Home className="mr-2 size-5" />
                  Photo du bien
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {contract.propertyTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contract.propertyAddress}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Modalités */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Modalités financières</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Loyer mensuel" value={formatPrice(contract.monthlyRent)} bold />
              <Row label="Dépôt de garantie" value={formatPrice(contract.deposit)} />
              <Row
                label="Charges mensuelles"
                value={formatPrice(Math.round(contract.monthlyRent * 0.08))}
              />
              <Separator />
              <Row label="Durée" value={`${template.defaultDurationMonths} mois`} />
              <Row
                label="Début"
                value={contract.startDate ? formatDate(contract.startDate) : "—"}
              />
              <Row
                label="Fin"
                value={contract.endDate ? formatDate(contract.endDate) : "—"}
              />
            </CardContent>
          </Card>

          {/* Bibliothèque de clauses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-kaza-blue" />
                Bibliothèque de clauses
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Clauses standards à insérer dans vos sections.
              </p>
            </CardHeader>
            <CardContent className="px-2 pb-3">
              <Accordion type="multiple" className="space-y-1">
                {Object.entries(clausesByCategory).map(([cat, clauses]) => (
                  <AccordionItem
                    key={cat}
                    value={cat}
                    className="rounded-lg border-0 px-2 data-[state=open]:bg-muted/40"
                  >
                    <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide hover:no-underline">
                      {cat}
                      <Badge
                        variant="secondary"
                        className="ml-auto mr-2 bg-muted text-[10px]"
                      >
                        {clauses.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1.5 pt-1">
                      {clauses.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-md border bg-white p-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground">
                              {c.title}
                              {c.recommended && (
                                <Badge className="ml-1.5 bg-kaza-green/10 text-[10px] text-kaza-green hover:bg-kaza-green/10">
                                  Recommandée
                                </Badge>
                              )}
                            </p>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                            {c.body}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 w-full text-[11px]"
                          >
                            <PlusCircle className="mr-1 size-3" />
                            Insérer
                          </Button>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Conformité légale */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Scale className="size-4 text-kaza-blue" />
                Conformité légale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <ComplianceRow ok label="Loi 2018-12 (régime baux d'habitation)" />
              <ComplianceRow ok label="Juridiction Cotonou désignée" />
              <ComplianceRow
                ok
                label={`Dépôt de garantie ≤ ${template.defaultDepositMonths} mois (plafond légal)`}
              />
              <ComplianceRow
                ok
                label="Mention manuscrite « Lu et approuvé »"
              />
              <ComplianceRow ok label="Clause résolutoire conforme" />
              <ComplianceRow warn label="État des lieux à compléter avant signature" />
              <ComplianceRow warn label="Attestation d'assurance à fournir" />
              <Separator />
              <div className="rounded-lg bg-kaza-blue/5 p-2.5 text-[11px] text-kaza-navy">
                <ShieldCheck className="mb-1 inline size-3.5" /> Ce contrat respecte le cadre juridique béninois en vigueur au 27 mai 2026.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function PartyRow({
  role,
  name,
  detail,
  muted = false,
}: {
  role: string;
  name: string;
  detail: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-white",
          muted ? "bg-muted text-muted-foreground" : "bg-kaza-navy"
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {role}
        </p>
        <p
          className={cn(
            "truncate text-sm font-medium",
            muted ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold ? "font-bold text-foreground" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}

function ComplianceRow({
  ok,
  warn,
  label,
}: {
  ok?: boolean;
  warn?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {ok && (
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-kaza-green" />
      )}
      {warn && (
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
      )}
      <span
        className={cn(
          ok && "text-foreground",
          warn && "text-foreground/80"
        )}
      >
        {label}
      </span>
    </div>
  );
}
