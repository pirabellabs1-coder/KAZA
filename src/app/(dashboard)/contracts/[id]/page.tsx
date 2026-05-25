import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, FileText, Home, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ContractStatusBadge,
  type ContractStatus,
} from "@/components/contracts/contract-status-badge";
import { createClient } from "@/lib/supabase/server";
import { getContractPdfUrl } from "@/actions/contracts";
import { formatPrice, formatDate } from "@/lib/utils";

import { SignaturePad } from "./signature-pad";

interface ContractRow {
  id: string;
  rental_id: string;
  owner_id: string;
  tenant_id: string;
  status: ContractStatus;
  monthly_rent: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  pdf_url: string | null;
  tenant_signed_at: string | null;
  owner_signed_at: string | null;
  created_at: string;
  property?: { title: string; address: string } | null;
  owner?: { first_name: string; last_name: string } | null;
  tenant?: { first_name: string; last_name: string } | null;
}

export const metadata = {
  title: "Contrat de location",
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/contracts/${id}`);
  }

  const { data: row } = await supabase
    .from("contracts")
    .select(
      `
      *,
      property:properties (title, address),
      owner:users!contracts_owner_id_fkey (first_name, last_name),
      tenant:users!contracts_tenant_id_fkey (first_name, last_name)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  const contract = row as unknown as ContractRow;

  // Garde d'accès : seul l'owner, le tenant ou un admin peuvent voir le contrat.
  if (
    contract.owner_id !== user.id &&
    contract.tenant_id !== user.id &&
    user.user_metadata?.role !== "ADMIN"
  ) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="mt-2 text-muted-foreground">
          Vous n&apos;êtes pas partie à ce contrat.
        </p>
      </div>
    );
  }

  const isOwner = contract.owner_id === user.id;
  const isTenant = contract.tenant_id === user.id;

  let signedPdfUrl: string | null = null;
  if (contract.pdf_url) {
    try {
      const res = await getContractPdfUrl({ contractId: contract.id });
      if (res.success && res.url) signedPdfUrl = res.url;
    } catch {
      signedPdfUrl = null;
    }
  }

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
            N° {contract.id.slice(0, 8).toUpperCase()} — Créé le{" "}
            {formatDate(contract.created_at)}
          </p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-kaza-blue" />
              Document du contrat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signedPdfUrl ? (
              <iframe
                src={signedPdfUrl}
                title="Contrat de location"
                className="h-[700px] w-full rounded-md border"
              />
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/30 text-center">
                <FileText className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Le document PDF est en cours de génération.
                </p>
                <p className="text-xs text-muted-foreground">
                  Rafraîchissez la page dans quelques instants.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {contract.property ? (
                <div className="flex items-start gap-2">
                  <Home className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contract.property.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {contract.property.address}
                    </p>
                  </div>
                </div>
              ) : null}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Loyer mensuel</span>
                <span className="font-semibold">
                  {formatPrice(contract.monthly_rent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dépôt de garantie</span>
                <span className="font-semibold">
                  {formatPrice(contract.deposit_amount)}
                </span>
              </div>
              <Separator />
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 size-4 text-muted-foreground" />
                <div className="text-xs">
                  <p>Du {formatDate(contract.start_date)}</p>
                  <p>au {formatDate(contract.end_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <SignatureBlock
                label="Propriétaire"
                name={
                  contract.owner
                    ? `${contract.owner.first_name} ${contract.owner.last_name}`
                    : "—"
                }
                signedAt={contract.owner_signed_at}
                canSign={isOwner && !contract.owner_signed_at}
                contractId={contract.id}
                role="owner"
              />
              <Separator />
              <SignatureBlock
                label="Locataire"
                name={
                  contract.tenant
                    ? `${contract.tenant.first_name} ${contract.tenant.last_name}`
                    : "—"
                }
                signedAt={contract.tenant_signed_at}
                canSign={isTenant && !contract.tenant_signed_at}
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
