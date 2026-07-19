import type { Metadata } from "next";

import { listAdminDisputes } from "@/lib/queries/admin-disputes";
import { DisputesView } from "./disputes-view";

export const metadata: Metadata = { title: "Litiges — Admin KAZA" };
export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const disputes = await listAdminDisputes();
  return <DisputesView initialDisputes={disputes} />;
}
