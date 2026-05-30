// =============================================================================
// KAZA - Admin / Demandes de remboursement
// =============================================================================

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listRefundRequests } from "@/lib/queries/refunds-admin";
import { RefundsList, type RefundRequest } from "./refunds-list";

const statusMap: Record<string, RefundRequest["status"]> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export default async function AdminRefundsPage() {
  const admin = await getCurrentDisplayUser();
  const adminEmail = admin?.email ?? "admin@kaza.africa";

  const rows = await listRefundRequests();
  const requests: RefundRequest[] = rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    userEmail: r.userEmail,
    amount: r.amount,
    reason: r.reason,
    requestedAt: r.createdAt,
    status: statusMap[r.status] ?? "pending",
    decisionNote: r.decisionNote,
  }));

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

      <RefundsList requests={requests} adminEmail={adminEmail} />
    </div>
  );
}
