// =============================================================================
// KAZA - Admin / Transactions globales (mode démo)
// Wave 9 - Yaw Boateng
// =============================================================================

import { Wallet, ArrowLeftRight, Percent, Landmark } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { StatsGrid } from "@/components/admin/stats-grid";
import { formatPrice } from "@/lib/utils";
import { PaymentsTable, type PaymentRow } from "./payments-table";

const allPayments: PaymentRow[] = [
  {
    id: "TX-2026-05-1547",
    date: "2026-05-26T14:32:00Z",
    userName: "Aminata Sow",
    userEmail: "aminata.sow@gmail.com",
    propertyTitle: "Studio meublé - Fidjrossè",
    propertyId: "A-1547",
    amount: 95000,
    status: "success",
    method: "kaza_pay",
  },
  {
    id: "TX-2026-05-1546",
    date: "2026-05-26T11:08:00Z",
    userName: "Pierre Hounsou",
    userEmail: "p.hounsou@yahoo.fr",
    propertyTitle: "Villa familiale 4 chambres",
    propertyId: "A-1546",
    amount: 320000,
    status: "pending",
    method: "kaza_pay",
  },
  {
    id: "TX-2026-05-1545",
    date: "2026-05-26T09:45:00Z",
    userName: "Jean Sossa",
    userEmail: "jean.sossa@yahoo.fr",
    propertyTitle: "Appartement F3 Cadjèhoun",
    propertyId: "A-1545",
    amount: 180000,
    status: "success",
    method: "kaza_wallet",
  },
  {
    id: "TX-2026-05-1544",
    date: "2026-05-25T18:22:00Z",
    userName: "Fatima Adjovi",
    userEmail: "fatima.adjovi@etu.uac.bj",
    propertyTitle: "Chambre étudiante Abomey-Calavi",
    propertyId: "A-1544",
    amount: 45000,
    status: "success",
    method: "kaza_pay",
  },
  {
    id: "TX-2026-05-1543",
    date: "2026-05-25T16:10:00Z",
    userName: "Eric Tchégoun",
    userEmail: "eric.t@orange.bj",
    propertyTitle: "Maison de plain-pied avec jardin",
    propertyId: "A-1543",
    amount: 150000,
    status: "failed",
    method: "card",
  },
  {
    id: "TX-2026-05-1542",
    date: "2026-05-25T14:54:00Z",
    userName: "Rose Akpovi",
    userEmail: "rose.akpovi@hotmail.com",
    propertyTitle: "Duplex moderne Akpakpa",
    propertyId: "A-1542",
    amount: 275000,
    status: "success",
    method: "card",
  },
  {
    id: "TX-2026-05-1541",
    date: "2026-05-25T12:30:00Z",
    userName: "Karim Lawal",
    userEmail: "karim.lawal@gmail.com",
    propertyTitle: "Studio Calavi",
    propertyId: "A-1541",
    amount: 60000,
    status: "refunded",
    method: "kaza_pay",
  },
  {
    id: "TX-2026-05-1540",
    date: "2026-05-25T10:18:00Z",
    userName: "Lucie Houessou",
    userEmail: "lucie.h@gmail.com",
    propertyTitle: "Colocation 4 chambres Haie Vive",
    propertyId: "A-1540",
    amount: 55000,
    status: "success",
    method: "kaza_wallet",
  },
  {
    id: "TX-2026-05-1539",
    date: "2026-05-24T21:02:00Z",
    userName: "Antoine Zinsou",
    userEmail: "antoine.z@kaza.dev",
    propertyTitle: "Loft Cotonou Centre",
    propertyId: "A-1539",
    amount: 210000,
    status: "success",
    method: "card",
  },
  {
    id: "TX-2026-05-1538",
    date: "2026-05-24T17:45:00Z",
    userName: "Yvonne Dossou",
    userEmail: "y.dossou@gmail.com",
    propertyTitle: "Appartement 2 pièces Ganhi",
    propertyId: "A-1538",
    amount: 130000,
    status: "pending",
    method: "kaza_pay",
  },
  {
    id: "TX-2026-05-1537",
    date: "2026-05-24T13:12:00Z",
    userName: "Pascal Agbo",
    userEmail: "p.agbo@outlook.com",
    propertyTitle: "Bureau partagé Sikècodji",
    propertyId: "A-1537",
    amount: 90000,
    status: "success",
    method: "kaza_wallet",
  },
  {
    id: "TX-2026-05-1536",
    date: "2026-05-24T09:38:00Z",
    userName: "Mariam Bio",
    userEmail: "mariam.bio@yahoo.fr",
    propertyTitle: "Villa de standing Cocotomey",
    propertyId: "A-1536",
    amount: 450000,
    status: "success",
    method: "kaza_pay",
  },
  {
    id: "TX-2026-05-1535",
    date: "2026-05-23T19:25:00Z",
    userName: "Sébastien Aho",
    userEmail: "seb.aho@gmail.com",
    propertyTitle: "Studio meublé Akpakpa",
    propertyId: "A-1535",
    amount: 85000,
    status: "failed",
    method: "card",
  },
  {
    id: "TX-2026-05-1534",
    date: "2026-05-23T15:40:00Z",
    userName: "Béatrice Codjia",
    userEmail: "beatrice.c@gmail.com",
    propertyTitle: "Maison 5 pièces Godomey",
    propertyId: "A-1534",
    amount: 240000,
    status: "success",
    method: "kaza_pay",
  },
  {
    id: "TX-2026-05-1533",
    date: "2026-05-23T11:05:00Z",
    userName: "Moussa Adékambi",
    userEmail: "moussa.a@gmail.com",
    propertyTitle: "Appartement F2 Zogbo",
    propertyId: "A-1533",
    amount: 110000,
    status: "refunded",
    method: "kaza_wallet",
  },
];

export default function AdminPaymentsPage() {
  const successOnly = allPayments.filter((p) => p.status === "success");
  const revenue30d = successOnly.reduce((sum, p) => sum + p.amount, 0);
  const commission = Math.round(revenue30d * 0.03);
  const escrowActive = allPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Transactions globales
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue agrégée de tous les paiements traités sur la plateforme.
        </p>
      </div>

      <StatsGrid cols={4}>
        <StatsCard
          title="Revenus 30j"
          value={formatPrice(revenue30d)}
          icon={Wallet}
          trend={{ label: "+14% vs mois dernier", type: "positive" }}
        />
        <StatsCard
          title="Volume transactions"
          value={allPayments.length.toString()}
          icon={ArrowLeftRight}
          trend={{ label: "+8% vs mois dernier", type: "positive" }}
        />
        <StatsCard
          title="Commission KAZA (3%)"
          value={formatPrice(commission)}
          icon={Percent}
          trend={{ label: "Sur transactions réussies", type: "neutral" }}
        />
        <StatsCard
          title="Fonds escrow actifs"
          value={formatPrice(escrowActive)}
          icon={Landmark}
          trend={{ label: "En attente de libération", type: "neutral" }}
        />
      </StatsGrid>

      <PaymentsTable rows={allPayments} />
    </div>
  );
}
