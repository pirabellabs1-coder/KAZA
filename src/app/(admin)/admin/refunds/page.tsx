// =============================================================================
// KAZA - Admin / Demandes de remboursement (mode démo)
// Wave 9 - Yaw Boateng
// =============================================================================

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { RefundsList, type RefundRequest } from "./refunds-list";

const allRefunds: RefundRequest[] = [
  {
    id: "RF-3201",
    userName: "Aminata Sow",
    userEmail: "aminata.sow@gmail.com",
    amount: 95000,
    reason:
      "Le propriétaire a annulé ma réservation 24h avant la date d'emménagement.",
    propertyTitle: "Studio meublé - Fidjrossè",
    requestedAt: "2026-05-26T10:14:00Z",
    status: "pending",
  },
  {
    id: "RF-3200",
    userName: "Karim Lawal",
    userEmail: "karim.lawal@gmail.com",
    amount: 60000,
    reason:
      "Bien non conforme à l'annonce : photos trompeuses, problèmes d'électricité non mentionnés.",
    propertyTitle: "Studio Calavi",
    requestedAt: "2026-05-25T16:50:00Z",
    status: "pending",
  },
  {
    id: "RF-3199",
    userName: "Fatima Adjovi",
    userEmail: "fatima.adjovi@etu.uac.bj",
    amount: 45000,
    reason: "Annulation pour cause de force majeure (maladie certifiée).",
    propertyTitle: "Chambre étudiante Abomey-Calavi",
    requestedAt: "2026-05-25T09:32:00Z",
    status: "pending",
  },
  {
    id: "RF-3198",
    userName: "Lucie Houessou",
    userEmail: "lucie.h@gmail.com",
    amount: 55000,
    reason: "Double paiement par erreur, demande de remboursement immédiat.",
    propertyTitle: "Colocation 4 chambres Haie Vive",
    requestedAt: "2026-05-24T14:08:00Z",
    status: "approved",
  },
  {
    id: "RF-3197",
    userName: "Moussa Adékambi",
    userEmail: "moussa.a@gmail.com",
    amount: 110000,
    reason:
      "Le bien a été déjà loué à un autre locataire — propriétaire malhonnête.",
    propertyTitle: "Appartement F2 Zogbo",
    requestedAt: "2026-05-23T11:45:00Z",
    status: "approved",
  },
  {
    id: "RF-3196",
    userName: "Eric Tchégoun",
    userEmail: "eric.t@orange.bj",
    amount: 150000,
    reason: "Changement de situation professionnelle, déménagement nécessaire.",
    propertyTitle: "Maison de plain-pied avec jardin",
    requestedAt: "2026-05-22T17:20:00Z",
    status: "rejected",
  },
  {
    id: "RF-3195",
    userName: "Sébastien Aho",
    userEmail: "seb.aho@gmail.com",
    amount: 85000,
    reason: "Refus de demande de remboursement — bien conforme à l'annonce.",
    propertyTitle: "Studio meublé Akpakpa",
    requestedAt: "2026-05-21T13:00:00Z",
    status: "rejected",
  },
  {
    id: "RF-3194",
    userName: "Yvonne Dossou",
    userEmail: "y.dossou@gmail.com",
    amount: 130000,
    reason: "Bien insalubre découvert lors de la visite d'état des lieux.",
    propertyTitle: "Appartement 2 pièces Ganhi",
    requestedAt: "2026-05-20T08:25:00Z",
    status: "approved",
  },
];

export default async function AdminRefundsPage() {
  const admin = await getCurrentDisplayUser();
  const adminEmail = admin?.email ?? "admin@kaza.africa";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Demandes de remboursement
        </h1>
        <p className="text-sm text-muted-foreground">
          Examinez les demandes et libérez les fonds escrow selon votre décision.
        </p>
      </div>

      <RefundsList requests={allRefunds} adminEmail={adminEmail} />
    </div>
  );
}
