import type { Metadata } from "next";
import { Activity, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Statut de la plateforme",
  description:
    "État en temps réel des services KAZA : application, base de données, paiements, notifications.",
};

type ServiceStatus = "operational" | "degraded" | "down" | "maintenance";

const services: Array<{
  name: string;
  description: string;
  status: ServiceStatus;
}> = [
  {
    name: "Application Web",
    description: "Site kaza.africa et tableaux de bord",
    status: "operational",
  },
  {
    name: "Authentification",
    description: "Connexion, inscription, sessions",
    status: "operational",
  },
  {
    name: "Base de données",
    description: "Lecture et écriture des annonces, profils, paiements",
    status: "operational",
  },
  {
    name: "Stockage des images",
    description: "Photos d'annonces et pièces d'identité",
    status: "operational",
  },
  {
    name: "Paiements FedaPay",
    description: "Mobile Money et cartes bancaires",
    status: "operational",
  },
  {
    name: "Paiements Kkiapay",
    description: "Fournisseur secondaire Mobile Money",
    status: "operational",
  },
  {
    name: "SMS (Twilio)",
    description: "Envoi des codes OTP de vérification",
    status: "operational",
  },
  {
    name: "Emails (Resend)",
    description: "Notifications transactionnelles",
    status: "operational",
  },
  {
    name: "Messagerie temps réel",
    description: "Échanges instantanés via Supabase Realtime",
    status: "operational",
  },
  {
    name: "Notifications push",
    description: "Firebase Cloud Messaging (web + mobile à venir)",
    status: "operational",
  },
];

const incidents: Array<{
  date: string;
  title: string;
  description: string;
  resolved: boolean;
}> = [
  {
    date: "2026-05-25",
    title: "Lancement de la plateforme",
    description:
      "KAZA est désormais ouvert en bêta fermée pour les premiers utilisateurs au Bénin.",
    resolved: true,
  },
];

const STATUS_META: Record<
  ServiceStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  operational: {
    label: "Opérationnel",
    badgeClass: "bg-green-100 text-green-800 hover:bg-green-100",
    dotClass: "bg-green-500",
  },
  degraded: {
    label: "Performances dégradées",
    badgeClass: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    dotClass: "bg-orange-500",
  },
  down: {
    label: "Indisponible",
    badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
    dotClass: "bg-red-500",
  },
  maintenance: {
    label: "Maintenance planifiée",
    badgeClass: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    dotClass: "bg-blue-500",
  },
};

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === "operational");
  const globalLabel = allOperational
    ? "Tous les systèmes sont opérationnels"
    : "Certains services rencontrent un incident";

  return (
    <div className="bg-white">
      <section className="bg-kaza-navy py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Activity className="size-7 text-kaza-green" />
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              Statut de la plateforme
            </h1>
          </div>
          <p className="mt-3 flex items-center gap-2 text-lg text-white/90">
            {allOperational ? (
              <CheckCircle2 className="size-5 text-kaza-green" />
            ) : (
              <Clock className="size-5 text-orange-300" />
            )}
            {globalLabel}
          </p>
          <p className="mt-1 text-sm text-white/60">
            Actualisé le{" "}
            {new Date().toLocaleString("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <h2 className="font-heading text-xl font-semibold">Services</h2>
        <div className="mt-4 space-y-2">
          {services.map((service) => {
            const meta = STATUS_META[service.status];
            return (
              <Card key={service.name}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${meta.dotClass}`}
                    />
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <Badge className={meta.badgeClass}>{meta.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <h2 className="mt-12 font-heading text-xl font-semibold">
          Historique récent
        </h2>
        <div className="mt-4 space-y-3">
          {incidents.map((incident) => (
            <Card key={incident.title}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{incident.title}</CardTitle>
                  <Badge
                    className={
                      incident.resolved
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                    }
                  >
                    {incident.resolved ? "Résolu" : "En cours"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{incident.date}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {incident.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Cette page est mise à jour manuellement par l&apos;équipe KAZA. Une
          intégration automatique sera ajoutée dans une prochaine version. Pour
          signaler un problème, contactez{" "}
          <a
            href="mailto:support@kaza.africa"
            className="font-medium text-kaza-blue hover:underline"
          >
            support@kaza.africa
          </a>
          .
        </p>
      </section>
    </div>
  );
}
