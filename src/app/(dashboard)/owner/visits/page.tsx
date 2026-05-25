import type { Metadata } from "next";
import { VisitRequestsList } from "./visits-list";

export const metadata: Metadata = {
  title: "Demandes de Visite",
};

export default function OwnerVisitsPage() {
  return <VisitRequestsList />;
}
