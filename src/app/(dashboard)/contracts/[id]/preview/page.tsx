import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  FileText,
  Send,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { getUserContractById, type UserContract } from "@/lib/queries/contracts";
import { ContractDownloadActions } from "./download-actions";
import {
  CONTRACT_TEMPLATES,
  getTemplateById,
  type ContractSection,
  type ContractTemplate,
} from "@/lib/contracts/templates";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Aperçu du contrat",
};

// ---------------------------------------------------------------------------
// Substitution des placeholders {{...}} par les valeurs du contrat
// ---------------------------------------------------------------------------

function renderPlaceholders(
  body: string,
  contract: UserContract,
  template: ContractTemplate
): string {
  const charges = Math.round(contract.monthlyRent * 0.08);
  const map: Record<string, string> = {
    "property.title": contract.propertyTitle || "À compléter",
    "property.address": contract.propertyAddress || "À compléter",
    "property.surface": "À compléter",
    "property.bedrooms": "À compléter",
    "property.type": "À compléter",
    "owner.name": contract.ownerName || "À compléter",
    "owner.cni": "À compléter",
    "owner.address": "À compléter",
    "owner.phone": "À compléter",
    "tenant.name": contract.tenantName || "À compléter",
    "tenant.cni": "À compléter",
    "tenant.profession": "À compléter",
    "tenant.employer": "À compléter",
    rent: formatPrice(contract.monthlyRent),
    charges: formatPrice(charges),
    depositAmount: formatPrice(contract.deposit),
    depositMonths: String(template.defaultDepositMonths),
    startDate: contract.startDate ? formatDate(contract.startDate) : "—",
    endDate: contract.endDate ? formatDate(contract.endDate) : "—",
    durationMonths: String(template.defaultDurationMonths),
    place: "Cotonou, République du Bénin",
    signDate: formatDate(new Date().toISOString()),
    contractNumber: `KAZA-2026-${contract.id.slice(-6).toUpperCase()}`,
  };
  return body.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const value = map[key.trim()];
    return value !== undefined ? value : `__${key}__`;
  });
}

// ---------------------------------------------------------------------------
// Rendu markdown léger (gras, listes, tableaux simples, paragraphes)
// ---------------------------------------------------------------------------

function renderMarkdownBlock(text: string, keyPrefix = "b"): React.ReactNode {
  const blocks = text.split(/\n\n+/);
  return blocks.map((block, bIdx) => {
    const k = `${keyPrefix}-${bIdx}`;
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Tableau markdown
    if (trimmed.includes("\n|") && trimmed.startsWith("|")) {
      const lines = trimmed.split("\n").filter((l) => l.trim().startsWith("|"));
      const rows = lines
        .filter((l) => !/^\|\s*[-:|\s]+\|$/.test(l.trim()))
        .map((l) =>
          l
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );
      if (rows.length > 0) {
        const [header, ...body] = rows;
        return (
          <table
            key={k}
            className="my-3 w-full border-collapse text-xs"
          >
            <thead>
              <tr>
                {header.map((c, i) => (
                  <th
                    key={i}
                    className="border border-gray-300 bg-gray-50 px-2 py-1.5 text-left font-semibold"
                  >
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, r) => (
                <tr key={r}>
                  {row.map((c, i) => (
                    <td
                      key={i}
                      className="border border-gray-300 px-2 py-1.5"
                    >
                      {renderInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      }
    }

    // Listes numérotées
    if (/^\d+\.\s/m.test(trimmed)) {
      const items = trimmed
        .split("\n")
        .filter((l) => /^\d+\.\s/.test(l.trim()));
      if (items.length > 0) {
        return (
          <ol
            key={k}
            className="my-2 list-decimal space-y-1 pl-5 text-justify text-[13px] leading-relaxed"
          >
            {items.map((it, i) => (
              <li key={i}>{renderInline(it.replace(/^\d+\.\s+/, ""))}</li>
            ))}
          </ol>
        );
      }
    }

    // Listes à puces
    if (/^[-•]\s/m.test(trimmed)) {
      const items = trimmed
        .split("\n")
        .filter((l) => /^[-•]\s/.test(l.trim()));
      if (items.length > 0) {
        return (
          <ul
            key={k}
            className="my-2 list-disc space-y-1 pl-5 text-justify text-[13px] leading-relaxed"
          >
            {items.map((it, i) => (
              <li key={i}>{renderInline(it.replace(/^[-•]\s+/, ""))}</li>
            ))}
          </ul>
        );
      }
    }

    // Paragraphe
    return (
      <p
        key={k}
        className="my-2 text-justify text-[13px] leading-relaxed"
      >
        {renderInline(trimmed)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Gras **xxx**
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`b-${i++}`} className="font-bold text-black">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default async function ContractPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const { id } = await params;
  const { template: templateParam } = await searchParams;

  const user = await getCurrentDisplayUser();
  if (!user) redirect(`/login?redirect=/contracts/${id}/preview`);

  // Contrat réel (table contracts), scopé à l'utilisateur. Repli brouillon
  // vierge si l'id ne correspond pas encore à un contrat existant.
  const contract: UserContract = (await getUserContractById(user.id, id)) ?? {
    id,
    status: "DRAFT",
    propertyTitle: "",
    propertyAddress: "",
    ownerName: "",
    tenantName: "",
    monthlyRent: 0,
    deposit: 0,
    startDate: "",
    endDate: "",
    createdAt: new Date().toISOString(),
  };

  const template: ContractTemplate =
    (templateParam && getTemplateById(templateParam)) ||
    CONTRACT_TEMPLATES[1];

  const isDraft = contract.status === "DRAFT" || !contract.signedAt;
  const contractNumber = `KAZA-2026-${contract.id.slice(-6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* === Sidebar actions === */}
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start">
          <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
            <Button variant="ghost" size="sm" asChild className="w-full justify-start">
              <Link href={`/contracts/${id}`}>
                <ArrowLeft className="mr-1.5 size-4" />
                Retour au contrat
              </Link>
            </Button>
            <Separator />
            <ContractDownloadActions
              contractId={id}
              contractNumber={contractNumber}
            />
            <Button variant="outline" className="w-full justify-start">
              <Send className="mr-2 size-4" />
              Envoyer pour signature
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/contracts/${id}/edit`}>
                <Edit3 className="mr-2 size-4" />
                Modifier
              </Link>
            </Button>
            <Separator />
            <div className="rounded-lg bg-kaza-blue/5 p-3 text-xs">
              <p className="font-semibold text-kaza-navy">
                <ShieldCheck className="mr-1 inline size-3.5" /> Document
                certifié KAZA
              </p>
              <p className="mt-1 text-muted-foreground">
                Sceau électronique conforme Loi 2017-20 (Code du numérique).
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-xs">
              <p className="font-semibold text-foreground">Base légale</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {template.legalBasis}
              </p>
            </div>
          </div>
        </aside>

        {/* === Page A4 simulée === */}
        <main>
          <article
            className={cn(
              "relative mx-auto max-w-[820px] overflow-hidden rounded-lg border bg-white px-10 py-12 font-serif text-gray-900 shadow-xl sm:px-14 sm:py-16",
              "min-h-[1100px]"
            )}
            style={{
              fontFamily:
                "'Times New Roman', Cambria, Georgia, serif",
            }}
          >
            {/* Watermark */}
            {isDraft && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <span
                  className="select-none text-[10rem] font-bold uppercase tracking-widest text-red-500/[0.06]"
                  style={{ transform: "rotate(-30deg)" }}
                >
                  Brouillon
                </span>
              </div>
            )}

            {/* En-tête */}
            <header className="relative border-b-2 border-kaza-navy pb-6 text-center">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-left">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-navy text-base font-bold text-white">
                    K
                  </div>
                  <div>
                    <p className="font-sans text-sm font-bold text-kaza-navy">
                      KAZA
                    </p>
                    <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                      Plateforme immobilière du Bénin
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                    N° de contrat
                  </p>
                  <p className="font-mono text-sm font-bold text-kaza-navy">
                    {contractNumber}
                  </p>
                </div>
              </div>
              <h1 className="mt-6 text-2xl font-bold uppercase tracking-wide text-kaza-navy">
                {template.name}
              </h1>
              <p className="mt-2 text-xs italic text-muted-foreground">
                {template.legalBasis}
              </p>
            </header>

            {/* Corps */}
            <section className="relative mt-8 space-y-6">
              {template.sections.map((section, idx) => (
                <ArticleBlock
                  key={section.id}
                  num={idx + 1}
                  section={section}
                  contract={contract}
                  template={template}
                  isLast={section.id === "signatures"}
                />
              ))}
            </section>

            {/* Page de signatures dédiée */}
            <section className="relative mt-12 border-t-2 border-kaza-navy pt-8">
              <h2 className="mb-2 text-center text-base font-bold uppercase tracking-wider text-kaza-navy">
                Signatures des parties
              </h2>
              <p className="mb-6 text-center text-xs italic text-muted-foreground">
                Fait à Cotonou, République du Bénin, le{" "}
                {formatDate(new Date().toISOString())}, en deux (2)
                exemplaires originaux.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <SignatureBlock
                  role="LE BAILLEUR"
                  name={contract.ownerName}
                  signedAt={contract.signedAt}
                />
                <SignatureBlock
                  role="LE LOCATAIRE"
                  name={contract.tenantName}
                  signedAt={contract.signedAt}
                />
              </div>

              <p className="mt-6 text-center text-[11px] italic text-muted-foreground">
                Mention manuscrite obligatoire avant signature :{" "}
                <span className="font-semibold">
                  « Lu et approuvé, bon pour bail »
                </span>
              </p>
            </section>

            {/* Footer */}
            <footer className="relative mt-10 border-t pt-4 text-center text-[10px] font-sans text-muted-foreground">
              <p>
                KAZA — Plateforme immobilière agréée · Document généré
                électroniquement
              </p>
              <p>
                Conforme Loi 2018-12 du 02/07/2018 · OHADA AUDCG · Loi 2017-20
                Code du numérique
              </p>
              <p className="mt-1 font-mono">
                Réf : {contractNumber} · Vérification : kaza.bj/verify/
                {contract.id.slice(-6)}
              </p>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------------

function ArticleBlock({
  num,
  section,
  contract,
  template,
  isLast,
}: {
  num: number;
  section: ContractSection;
  contract: UserContract;
  template: ContractTemplate;
  isLast?: boolean;
}) {
  if (section.id === "signatures") return null; // rendu séparé
  if (isLast) return null;

  const body = renderPlaceholders(section.body, contract, template);
  const isParties = section.id === "parties";

  return (
    <div className="break-inside-avoid">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-kaza-navy">
        Article {num} — {section.title}
      </h2>
      <div className={cn(isParties && "rounded-lg bg-gray-50/60 p-3")}>
        {renderMarkdownBlock(body, `s-${section.id}`)}
      </div>
    </div>
  );
}

function SignatureBlock({
  role,
  name,
  signedAt,
}: {
  role: string;
  name: string;
  signedAt?: string;
}) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 p-4">
      <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {role}
      </p>
      <p className="mt-1 text-sm font-bold">{name}</p>
      <Separator className="my-3" />
      <div className="space-y-1.5 text-[11px]">
        <p>
          <span className="text-muted-foreground">Date :</span>{" "}
          <span className="font-semibold">
            {signedAt ? formatDate(signedAt) : "______________"}
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">Lieu :</span>{" "}
          <span className="font-semibold">Cotonou</span>
        </p>
        <p className="pt-2">
          <span className="text-muted-foreground">Signature :</span>
        </p>
        <div
          className={cn(
            "mt-1 flex h-16 items-center justify-center rounded border bg-gray-50/50",
            signedAt &&
              "border-kaza-green/30 bg-kaza-green/5 text-kaza-green"
          )}
        >
          {signedAt ? (
            <p className="font-sans text-xs font-semibold">
              <ShieldCheck className="mr-1 inline size-3.5" />
              Signé électroniquement le {formatDate(signedAt)}
            </p>
          ) : (
            <FileText className="size-5 text-muted-foreground/40" />
          )}
        </div>
      </div>
    </div>
  );
}
