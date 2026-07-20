import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// Kaabo - Badge de statut de contrat
// =============================================================================
// Composant serveur (pas d'état) qui mappe l'enum `contract_status` à un Badge
// shadcn coloré, avec libellé français.
// =============================================================================

export type ContractStatus =
  | "DRAFT"
  | "PENDING_TENANT"
  | "PENDING_OWNER"
  | "SIGNED"
  | "CANCELLED";

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_MAP: Record<ContractStatus, StatusConfig> = {
  DRAFT: {
    label: "En cours de rédaction",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  },
  PENDING_TENANT: {
    label: "En attente du locataire",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  PENDING_OWNER: {
    label: "En attente du propriétaire",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  SIGNED: {
    label: "Signé",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  CANCELLED: {
    label: "Annulé",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

interface Props {
  status: ContractStatus | string;
  className?: string;
}

export function ContractStatusBadge({ status, className }: Props) {
  const config =
    STATUS_MAP[status as ContractStatus] ?? {
      label: String(status),
      className: "bg-muted text-muted-foreground",
    };

  return (
    <Badge
      variant="secondary"
      className={cn(config.className, "border-0", className)}
    >
      {config.label}
    </Badge>
  );
}
