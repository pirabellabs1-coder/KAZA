import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Home,
  Pencil,
  ShieldCheck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ContractStatusBadge,
  type ContractStatus,
} from "@/components/contracts/contract-status-badge";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  getContractForRental,
  type ContractParty,
} from "@/lib/queries/contract-view";
import { formatPrice, formatDate } from "@/lib/utils";

import { SignaturePad } from "./signature-pad";
import { SendContractButton } from "./send-contract-button";
import { ContractTermsForm } from "./contract-terms-form";

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

  const contract = await getContractForRental(id, user.id);
  if (!contract) notFound();

  const isOwner = user.id === contract.ownerId;
  const isTenant = user.id === contract.tenantId;
  const { status } = contract;

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
            N° {contract.contractId.slice(-6).toUpperCase()} — Créé le{" "}
            {formatDate(contract.createdAt)}
          </p>
        </div>
        <ContractStatusBadge status={status as ContractStatus} />
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
              <p className="text-muted-foreground">
                Régi par la Loi n° 2018-12 du 2 juillet 2018 (baux
                d&apos;habitation, Bénin) et les Actes uniformes OHADA. Entre les
                soussignés :
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <PartyCard label="Bailleur" party={contract.owner} />
                <PartyCard label="Locataire" party={contract.tenant} />
              </div>

              <Separator />

              <Article num="1" title="Désignation du bien loué">
                Le bailleur loue au locataire, qui accepte, à usage exclusif
                d&apos;habitation, le bien suivant :{" "}
                <strong>{contract.propertyTitle}</strong>
                {contract.propertyType ? ` (${contract.propertyType})` : ""}, sis
                à <strong>{contract.propertyAddress || "[adresse]"}</strong>
                {contract.propertySurface
                  ? `, d'une superficie d'environ ${contract.propertySurface} m²`
                  : ""}
                {contract.propertyBedrooms
                  ? `, comprenant ${contract.propertyBedrooms} chambre(s)`
                  : ""}
                .
              </Article>

              <Article num="2" title="Durée">
                Le présent bail est conclu pour une durée d&apos;un an, du{" "}
                {formatDate(contract.startDate)} au{" "}
                {formatDate(contract.endDate)}, renouvelable par tacite
                reconduction sauf congé donné dans les conditions légales.
              </Article>

              <Article num="3" title="Loyer">
                Le loyer mensuel est fixé à{" "}
                <strong>{formatPrice(contract.monthlyRent)}</strong>, payable
                d&apos;avance au plus tard le 5 de chaque mois via la plateforme
                Kaabo (séquestre sécurisé — Mobile Money ou solde Kaabo).
              </Article>

              <Article num="4" title="Charges">
                {contract.monthlyCharges > 0 ? (
                  <>
                    Une provision mensuelle pour charges récupérables de{" "}
                    <strong>{formatPrice(contract.monthlyCharges)}</strong> est
                    versée avec le loyer, régularisée annuellement sur
                    justificatifs.
                  </>
                ) : (
                  <>
                    Le loyer est convenu charges comprises, sauf charges
                    individuelles (eau, électricité) restant à la charge du
                    locataire selon les compteurs.
                  </>
                )}
              </Article>

              <Article num="5" title="Dépôt de garantie">
                Un dépôt de garantie de{" "}
                <strong>{formatPrice(contract.deposit)}</strong> est versé à la
                signature et conservé sur le compte séquestre Kaabo. Il sera
                restitué dans les délais légaux suivant la remise des clés,
                déduction faite des éventuelles dégradations dûment constatées.
              </Article>

              <Article num="6" title="État des lieux">
                Un état des lieux contradictoire est établi à la remise des clés
                et annexé au présent contrat. À défaut, le locataire est présumé
                avoir reçu le bien en bon état de réparations locatives.
              </Article>

              <Article num="7" title="Obligations du locataire">
                Le locataire s&apos;engage à : payer le loyer et les charges aux
                échéances ; user paisiblement des lieux conformément à leur
                destination ; en assurer l&apos;entretien courant ; souscrire une
                assurance habitation et en justifier annuellement ; ne pas
                transformer les lieux sans accord écrit du bailleur ; restituer le
                bien en bon état en fin de bail.
              </Article>

              <Article num="8" title="Obligations du bailleur">
                Le bailleur s&apos;engage à : délivrer le bien en bon état ;
                assurer au locataire la jouissance paisible des lieux ; effectuer
                les grosses réparations ; délivrer gratuitement quittance ;
                respecter les durées de préavis légales.
              </Article>

              <Article num="9" title="Résiliation">
                Le bail pourra être résilié de plein droit deux (2) mois après un
                commandement de payer demeuré infructueux, ou en cas de défaut
                d&apos;assurance, d&apos;usage non conforme, de troubles graves de
                voisinage ou de sous-location non autorisée.
              </Article>

              <Article num="10" title="Droit applicable et litiges">
                Le présent contrat est régi par le droit béninois (Loi n° 2018-12)
                et l&apos;OHADA. Tout litige sera soumis à la médiation gratuite
                Kaabo puis, à défaut d&apos;accord sous 30 jours, aux tribunaux
                compétents de Cotonou. La signature électronique apposée via Kaabo
                a valeur probante (Loi n° 2017-20, Code du numérique).
              </Article>
            </div>
          </CardContent>
        </Card>

        {/* Détails + statut + signatures */}
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

          {/* Étape en cours + action contextuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-kaza-blue" />
                {status === "SIGNED"
                  ? "Bail signé"
                  : status === "DRAFT"
                    ? "Contrat en cours de rédaction"
                    : status === "CANCELLED"
                      ? "Bail annulé"
                      : "Signatures"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* --- ÉTAPE : DRAFT (en cours de rédaction) --- */}
              {status === "DRAFT" && isOwner && (
                <div className="space-y-3">
                  <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                    Complétez le bail puis envoyez-le au locataire. Il pourra
                    alors le signer, avant votre propre signature.
                  </p>
                  <ContractTermsForm
                    rentalId={contract.rentalId}
                    initialCharges={contract.monthlyCharges}
                    initialDeposit={contract.deposit}
                  />
                  <Button variant="outline" size="sm" asChild className="w-full gap-1.5">
                    <Link href={`/contracts/${contract.contractId}/edit`}>
                      <Pencil className="size-3.5" /> Éditeur avancé
                    </Link>
                  </Button>
                  <SendContractButton contractId={contract.contractId} />
                </div>
              )}
              {status === "DRAFT" && isTenant && (
                <p className="rounded-lg bg-muted/50 px-3 py-3 text-xs text-muted-foreground">
                  <Clock className="mr-1 inline size-3.5" /> Le bailleur prépare
                  votre bail. Vous serez notifié dès qu&apos;il vous l&apos;aura
                  envoyé pour signature.
                </p>
              )}

              {/* --- ÉTAPE : bail annulé --- */}
              {status === "CANCELLED" && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-700">
                  Ce bail a été annulé : le bien a été attribué à un autre
                  candidat ou la location a été résiliée. Aucune action n&apos;est
                  requise.
                </p>
              )}

              {/* --- ÉTAPE : signatures (PENDING_TENANT / PENDING_OWNER / SIGNED) --- */}
              {status !== "DRAFT" && status !== "CANCELLED" && (
                <>
                  <SignatureBlock
                    label="Locataire"
                    name={contract.tenantName}
                    signed={contract.signedByTenant}
                    signedAt={contract.tenantSignedAt}
                    canSign={isTenant && status === "PENDING_TENANT"}
                    waiting={!contract.signedByTenant}
                    contractId={contract.contractId}
                    role="tenant"
                  />
                  <Separator />
                  <SignatureBlock
                    label="Propriétaire"
                    name={contract.ownerName}
                    signed={contract.signedByOwner}
                    signedAt={contract.ownerSignedAt}
                    canSign={isOwner && status === "PENDING_OWNER"}
                    waiting={status !== "SIGNED" && !contract.signedByOwner}
                    contractId={contract.contractId}
                    role="owner"
                  />
                </>
              )}

              {/* --- ÉTAPE : SIGNED → payer le 1er loyer --- */}
              {status === "SIGNED" && isTenant && (
                <div className="rounded-lg bg-kaza-green/10 p-3">
                  <p className="text-xs text-kaza-green">
                    Bail signé par les deux parties. Réglez le 1<sup>er</sup>{" "}
                    loyer pour activer votre location.
                  </p>
                  <Button asChild size="sm" className="mt-2 w-full gap-1.5">
                    <Link
                      href={`/tenant/payments/checkout?rentalId=${contract.rentalId}`}
                    >
                      <CreditCard className="size-3.5" /> Payer le 1er loyer
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PartyCard({
  label,
  party,
}: {
  label: string;
  party: ContractParty;
}) {
  const todo = (
    <span className="italic text-amber-600">[à compléter au profil]</span>
  );
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold">{party.name}</p>
      <dl className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Pièce d&apos;identité : </span>
          {party.idNumber ?? todo}
        </div>
        <div>
          <span className="font-medium">Profession : </span>
          {party.profession ?? todo}
        </div>
        {party.employer && (
          <div>
            <span className="font-medium">Employeur : </span>
            {party.employer}
          </div>
        )}
        <div>
          <span className="font-medium">Adresse : </span>
          {party.address ?? todo}
        </div>
        <div>
          <span className="font-medium">Téléphone : </span>
          {party.phone ?? todo}
        </div>
      </dl>
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
  signed,
  signedAt,
  canSign,
  waiting,
  contractId,
  role,
}: {
  label: string;
  name: string;
  signed: boolean;
  signedAt: string | null;
  canSign: boolean;
  waiting: boolean;
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

      {signed ? (
        <p className="ml-6 mt-1 flex items-center gap-1 text-xs text-kaza-green">
          <CheckCircle2 className="size-3.5" /> Signé
          {signedAt ? ` le ${formatDate(signedAt)}` : ""}
        </p>
      ) : canSign ? (
        <div className="mt-3">
          <SignaturePad contractId={contractId} role={role} />
        </div>
      ) : waiting ? (
        <p className="ml-6 mt-1 text-xs text-muted-foreground">
          En attente de signature
        </p>
      ) : null}
    </div>
  );
}
