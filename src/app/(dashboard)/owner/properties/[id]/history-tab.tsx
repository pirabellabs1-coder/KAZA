import {
  CheckCircle,
  CalendarCheck,
  FileSignature,
  CreditCard,
  Eye,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  type LucideIcon,
  Wrench,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HistoryEvent {
  id: string;
  type:
    | "visit_confirmed"
    | "rental_signed"
    | "payment_received"
    | "id_verified"
    | "review_received"
    | "listing_published"
    | "visit_cancelled"
    | "message_received"
    | "maintenance"
    | "price_updated";
  title: string;
  description: string;
  date: string;
}

const ICONS: Record<HistoryEvent["type"], LucideIcon> = {
  visit_confirmed: CalendarCheck,
  rental_signed: FileSignature,
  payment_received: CreditCard,
  id_verified: ShieldCheck,
  review_received: Star,
  listing_published: Eye,
  visit_cancelled: AlertCircle,
  message_received: MessageSquare,
  maintenance: Wrench,
  price_updated: CheckCircle,
};

const COLORS: Record<HistoryEvent["type"], string> = {
  visit_confirmed: "bg-kaza-warning/15 text-kaza-warning",
  rental_signed: "bg-kaza-blue/15 text-kaza-blue",
  payment_received: "bg-kaza-green/15 text-kaza-green",
  id_verified: "bg-kaza-blue/15 text-kaza-blue",
  review_received: "bg-yellow-100 text-yellow-700",
  listing_published: "bg-muted text-foreground",
  visit_cancelled: "bg-destructive/15 text-destructive",
  message_received: "bg-muted text-foreground",
  maintenance: "bg-orange-100 text-orange-700",
  price_updated: "bg-kaza-green/15 text-kaza-green",
};

const EVENTS: HistoryEvent[] = [
  {
    id: "h-1",
    type: "payment_received",
    title: "Paiement de loyer recu",
    description: "150 000 FCFA recus de Fatou Diallo via Mobile Money MTN.",
    date: "Il y a 2 heures",
  },
  {
    id: "h-2",
    type: "review_received",
    title: "Nouvel avis 5/5",
    description:
      "Thomas Leroy : « Excellent appartement, proprietaire reactif. »",
    date: "Il y a 1 jour",
  },
  {
    id: "h-3",
    type: "visit_confirmed",
    title: "Visite confirmee",
    description: "Amadou Sow visitera le bien demain a 15h00.",
    date: "Il y a 2 jours",
  },
  {
    id: "h-4",
    type: "message_received",
    title: "Nouveau message",
    description:
      "Marie Ahoussou a pose une question sur les charges mensuelles.",
    date: "Il y a 3 jours",
  },
  {
    id: "h-5",
    type: "id_verified",
    title: "Identite locataire verifiee",
    description: "La piece d'identite de Fatou Diallo a ete validee par KAZA.",
    date: "Il y a 5 jours",
  },
  {
    id: "h-6",
    type: "rental_signed",
    title: "Contrat de location signe",
    description: "Bail signe avec Fatou Diallo pour une duree de 12 mois.",
    date: "Il y a 7 jours",
  },
  {
    id: "h-7",
    type: "visit_confirmed",
    title: "Visite realisee",
    description: "Visite avec Fatou Diallo realisee avec succes.",
    date: "Il y a 10 jours",
  },
  {
    id: "h-8",
    type: "price_updated",
    title: "Prix mis a jour",
    description: "Loyer mensuel ajuste de 140 000 a 150 000 FCFA.",
    date: "Il y a 15 jours",
  },
  {
    id: "h-9",
    type: "maintenance",
    title: "Intervention plomberie",
    description: "Reparation du chauffe-eau effectuee — 25 000 FCFA.",
    date: "Il y a 20 jours",
  },
  {
    id: "h-10",
    type: "listing_published",
    title: "Annonce publiee",
    description: "L'annonce est maintenant visible sur la plateforme KAZA.",
    date: "Il y a 28 jours",
  },
];

export function HistoryTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique d&apos;activite</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5 border-l border-border pl-6">
          {EVENTS.map((event) => {
            const Icon = ICONS[event.type];
            const color = COLORS[event.type];
            return (
              <li key={event.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[34px] flex size-8 items-center justify-center rounded-full ring-4 ring-background",
                    color,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="ml-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {event.title}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {event.date}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
