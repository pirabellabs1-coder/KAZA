import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, FileText, Home, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ContractStatusBadge,
  type ContractStatus,
} from "@/components/contracts/contract-status-badge";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getDemoContractById } from "@/lib/demo-data";
import { formatPrice, formatDate } from "@/lib/utils";

import { SignaturePad } from "./signature-pad";

export const metadata = {
  title: "Contrat de location",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDisplayUser();
  if (!user) redirect(`/login?redirect=/contracts/${id}`);

  const contract = getDemoContractById(id);
  if (!contract) notFound();

  const isOwner = user.role === "OWNER";
  const isTenant = user.role === "TENANT" || user.role === "STUDENT";
  const isSigned = contract.status === "SIGNED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contracts">
            <ArrowLeft className="mr-1.5 size-4" />
            Retour
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Contrat de location
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            N° {contract.id.slice(-6).toUpperCase()} — Créé le{" "}
            {formatDate(contract.createdAt)}
          </p>
        </div>
        <ContractStatusBadge status={contract.status as ContractStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document du contrat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-kaza-blue" />
              Document du contrat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 rounded-xl border bg-gray-50 p-6 text-sm leading-relaxed">
              <h2 className="font-heading text-lg font-bold text-kaza-navy">
                Bail à usage d&apos;habitation
              </h2>
              <p className="text-muted-foreground">Entre les soussignés :</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Bailleur
                  </p>
                  <p className="mt-1 font-semibold">{contract.ownerName}</p>
                </div>
                <div className="rounded-lg bg-white p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Locataire
                  </p>
                  <p className="mt-1 font-semibold">{contract.tenantName}</p>
                </div>
              </div>

              <Separator />

              <Article num="1" title="Objet">
                Le bailleur loue au locataire, qui accepte, le bien suivant :{" "}
                <strong>{contract.propertyTitle}</strong>, sis à{" "}
                <strong>{contract.propertyAddress}</strong>.
              </Article>

              <Article num="2" title="Durée">
                Le présent bail est conclu pour une durée d&apos;un an, du{" "}
                {formatDate(contract.startDate)} au{" "}
                {formatDate(contract.endDate)}, renouvelable par tacite
                reconduction.
              </Article>

              <Article num="3" title="Loyer">
                Le loyer mensuel est fixé à{" "}
                <strong>{formatPrice(contract.monthlyRent)}</strong>, payable
                d&apos;avance le 1er de chaque mois via la plateforme KAZA
                (escrow sécurisé).
              </Article>

              <Article num="4" title="Dépôt de garantie">
                Un dépôt de garantie de{" "}
                <strong>{formatPrice(contract.deposit)}</strong> (équivalent à
                2 mois de loyer) est versé à la signature et conservé sur le
                compte escrow KAZA. Il sera restitué dans les 30 jours suivant
                la fin du bail, déduction faite des éventuelles dégradations.
              </Article>

              <Article num="5" title="Obligations">
                Le locataire s&apos;engage à user paisiblement des lieux loués
                et à les rendre en bon état. Le bailleur garantit la jouissance
                paisible du bien et son entretien conformément à l&apos;Acte
                uniforme OHADA portant droit commercial général.
              </Article>

              <Article num="6" title="Droit applicable">
                Le présent contrat est régi par le droit béninois. Tout litige
                sera soumis à la médiation KAZA puis, à défaut, aux tribunaux
                compétents de Cotonou.
              </Article>
            </div>
          </CardContent>
        </Card>

        {/* Détails + signatures */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails du bail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Home className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{contract.propertyTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.propertyAddress}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Loyer mensuel</span>
                <span className="font-semibold">
                  {formatPrice(contract.monthlyRent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dépôt de garantie</span>
                <span className="font-semibold">
                  {formatPrice(contract.deposit)}
                </span>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 size-4 text-muted-foreground" />
                <div className="text-xs">
                  <p>Du {formatDate(contract.startDate)}</p>
                  <p>au {formatDate(contract.endDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-kaza-blue" />
                Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <SignatureBlock
                label="Propriétaire"
                name={contract.ownerName}
                signedAt={isSigned ? contract.signedAt ?? null : null}
                canSign={isOwner && !isSigned}
                contractId={contract.id}
                role="owner"
              />
              <Separator />
              <SignatureBlock
                label="Locataire"
                name={contract.tenantName}
                signedAt={isSigned ? contract.signedAt ?? null : null}
                canSign={isTenant && !isSigned}
                contractId={contract.id}
                role="tenant"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Article({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-semibold">
        Article {num} — {title}
      </p>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

function SignatureBlock({
  label,
  name,
  signedAt,
  canSign,
  contractId,
  role,
}: {
  label: string;
  name: string;
  signedAt: string | null;
  canSign: boolean;
  contractId: string;
  role: "owner" | "tenant";
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <User className="size-4 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      <p className="ml-6 text-xs text-muted-foreground">{name}</p>

      {signedAt ? (
        <p className="ml-6 mt-1 text-xs text-kaza-green">
          ✓ Signé le {formatDate(signedAt)}
        </p>
      ) : canSign ? (
        <div className="mt-3">
          <SignaturePad contractId={contractId} role={role} />
        </div>
      ) : (
        <p className="ml-6 mt-1 text-xs text-muted-foreground">
          En attente de signature
        </p>
      )}
    </div>
  );
}
