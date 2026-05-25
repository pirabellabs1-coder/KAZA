import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHero } from "@/components/marketing/section-hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Tarifs — KAZA",
  description:
    "Une tarification simple et transparente. Gratuit pour les locataires et étudiants. Commission uniquement sur loyer perçu pour les propriétaires.",
  openGraph: {
    title: "Tarifs KAZA — Simple, transparent, sans frais cachés",
    description:
      "Locataires : gratuit. Propriétaires : 0 FCFA + 5% sur loyer perçu ou abonnement Pro illimité à 15 000 FCFA/mois.",
    type: "website",
  },
};

type PricingPlan = {
  name: string;
  audience: string;
  price: string;
  priceDetail?: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: "Locataire / Étudiant",
    audience: "Pour ceux qui cherchent un logement",
    price: "Gratuit",
    description: "Aucun frais d'inscription, aucun frais caché.",
    features: [
      "Recherche illimitée d'annonces vérifiées",
      "Messagerie directe avec les propriétaires",
      "Paiements sécurisés via Mobile Money",
      "Favoris et alertes personnalisées",
      "Visites virtuelles 360° quand disponibles",
      "Support client 7j/7",
    ],
    cta: { label: "Créer mon compte gratuit", href: "/signup" },
  },
  {
    name: "Propriétaire Starter",
    audience: "Pour les bailleurs indépendants",
    price: "0 FCFA",
    priceDetail: "+ 5% sur loyer perçu",
    description: "Idéal pour publier vos premières annonces sans engagement.",
    features: [
      "Jusqu'à 5 annonces actives",
      "Vérification d'identité gratuite",
      "Contrats de bail numériques",
      "Dashboard analytics de base",
      "Encaissement automatique des loyers",
      "Support standard sous 48h",
    ],
    cta: { label: "Commencer gratuitement", href: "/signup?role=owner" },
  },
  {
    name: "Propriétaire Pro",
    audience: "Pour les agences et investisseurs",
    price: "15 000 FCFA",
    priceDetail: "/ mois + 3% sur loyer",
    description: "La meilleure expérience pour gérer un parc immobilier.",
    features: [
      "Annonces illimitées",
      "Mise en avant prioritaire dans la recherche",
      "Support prioritaire sous 4h",
      "Export comptable (CSV, PDF)",
      "Statistiques avancées et reporting",
      "Gestionnaire de compte dédié",
    ],
    cta: { label: "Passer à Pro", href: "/signup?role=owner&plan=pro" },
    highlighted: true,
  },
];

type ComparisonRow = {
  feature: string;
  starter: boolean | string;
  pro: boolean | string;
};

const comparison: ComparisonRow[] = [
  { feature: "Nombre d'annonces actives", starter: "5", pro: "Illimité" },
  { feature: "Commission sur loyer perçu", starter: "5 %", pro: "3 %" },
  { feature: "Vérification d'identité KYC", starter: true, pro: true },
  { feature: "Contrats numériques signés", starter: true, pro: true },
  { feature: "Encaissement automatique", starter: true, pro: true },
  { feature: "Dashboard analytics", starter: "De base", pro: "Avancé" },
  { feature: "Mise en avant des annonces", starter: false, pro: true },
  { feature: "Badge Pro vérifié", starter: false, pro: true },
  { feature: "Export comptable CSV / PDF", starter: false, pro: true },
  { feature: "Gestion multi-utilisateurs", starter: false, pro: true },
  { feature: "Support prioritaire (4h)", starter: false, pro: true },
  { feature: "Gestionnaire de compte dédié", starter: false, pro: true },
];

const pricingFaq = [
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Non. Notre commission s'applique uniquement lorsque vous percevez un loyer. Pas de frais d'inscription, pas de frais de publication, pas de pénalité de résiliation.",
  },
  {
    q: "Comment fonctionne la commission de 5% ou 3% ?",
    a: "La commission est prélevée automatiquement à chaque encaissement de loyer via la plateforme. Vous recevez 95% (Starter) ou 97% (Pro) sur votre compte Mobile Money ou bancaire, et nous nous occupons du reste.",
  },
  {
    q: "Puis-je changer d'abonnement à tout moment ?",
    a: "Oui. Vous pouvez passer du plan Starter au plan Pro (ou inversement) depuis votre tableau de bord. Le changement prend effet immédiatement, sans frais ni interruption.",
  },
  {
    q: "Quels modes de paiement acceptez-vous ?",
    a: "Nous acceptons MTN Mobile Money, Moov Money, ainsi que les cartes Visa et Mastercard via FedaPay. Toutes les transactions sont sécurisées et chiffrées.",
  },
  {
    q: "Que se passe-t-il si mon locataire ne paie pas ?",
    a: "Aucune commission n'est facturée tant que le loyer n'est pas effectivement perçu. Notre système d'escrow et de relances automatiques protège vos revenus.",
  },
];

export default function PricingPage() {
  return (
    <div>
      <SectionHero
        eyebrow="Tarification"
        title="Une tarification simple et transparente"
        subtitle="Sans frais cachés. Payez seulement quand vous percevez vos loyers."
        variant="light"
      />

      {/* Pricing cards */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={
                  "relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md " +
                  (plan.highlighted
                    ? "border-kaza-blue ring-2 ring-kaza-blue/20"
                    : "border-gray-200")
                }
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-kaza-blue text-white">
                    <Sparkles className="mr-1 size-3" /> Le plus populaire
                  </Badge>
                )}
                <h3 className="font-heading text-xl font-bold text-kaza-navy">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.audience}
                </p>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-4xl font-bold text-kaza-navy">
                      {plan.price}
                    </span>
                  </div>
                  {plan.priceDetail && (
                    <p className="mt-1 text-sm font-medium text-kaza-blue">
                      {plan.priceDetail}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-8 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-kaza-green" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Button
                    asChild
                    className={
                      plan.highlighted
                        ? "w-full bg-kaza-blue hover:bg-kaza-blue/90"
                        : "w-full bg-kaza-navy hover:bg-kaza-navy/90"
                    }
                  >
                    <Link href={plan.cta.href}>{plan.cta.label}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Comparez les plans propriétaires
            </h2>
            <p className="mt-2 text-muted-foreground">
              Toutes les fonctionnalités, en un coup d&apos;œil.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-kaza-navy text-white">
                <tr>
                  <th className="px-6 py-4 font-semibold">Fonctionnalité</th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Starter
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-6 py-4 font-medium">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? (
                          <Check className="mx-auto size-5 text-kaza-green" />
                        ) : (
                          <X className="mx-auto size-5 text-gray-300" />
                        )
                      ) : (
                        <span className="text-muted-foreground">
                          {row.starter}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <Check className="mx-auto size-5 text-kaza-green" />
                        ) : (
                          <X className="mx-auto size-5 text-gray-300" />
                        )
                      ) : (
                        <span className="font-medium text-kaza-navy">
                          {row.pro}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Questions sur la tarification
            </h2>
            <p className="mt-2 text-muted-foreground">
              Les réponses aux questions que l&apos;on nous pose le plus souvent.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {pricingFaq.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <CtaBanner
        title="Prêt à publier votre premier bien ?"
        description="Rejoignez plus de 1 000 propriétaires qui font déjà confiance à KAZA pour gérer leurs biens en toute simplicité."
        primaryAction={{ label: "Créer un compte", href: "/signup" }}
        secondaryAction={{ label: "Parler à un expert", href: "/contact" }}
      />
    </div>
  );
}
