import { cn } from "@/lib/utils";

export type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "suspended"
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "published"
  | "draft";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; classes: string }
> = {
  pending: {
    label: "En attente",
    classes: "bg-orange-100 text-orange-700 border-orange-200",
  },
  approved: {
    label: "Approuvée",
    classes: "bg-green-100 text-green-700 border-green-200",
  },
  rejected: {
    label: "Rejetée",
    classes: "bg-red-100 text-red-700 border-red-200",
  },
  active: {
    label: "Actif",
    classes: "bg-green-100 text-green-700 border-green-200",
  },
  suspended: {
    label: "Suspendu",
    classes: "bg-gray-100 text-gray-700 border-gray-200",
  },
  open: {
    label: "Ouvert",
    classes: "bg-orange-100 text-orange-700 border-orange-200",
  },
  in_progress: {
    label: "En traitement",
    classes: "bg-blue-100 text-blue-700 border-blue-200",
  },
  resolved: {
    label: "Résolu",
    classes: "bg-green-100 text-green-700 border-green-200",
  },
  closed: {
    label: "Clos",
    classes: "bg-gray-100 text-gray-700 border-gray-200",
  },
  published: {
    label: "Publiée",
    classes: "bg-green-100 text-green-700 border-green-200",
  },
  draft: {
    label: "Brouillon",
    classes: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.classes,
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "pending" || status === "open"
            ? "bg-orange-500"
            : status === "approved" ||
                status === "active" ||
                status === "resolved" ||
                status === "published"
              ? "bg-green-500"
              : status === "rejected"
                ? "bg-red-500"
                : status === "in_progress"
                  ? "bg-blue-500"
                  : "bg-gray-500"
        )}
      />
      {config.label}
    </span>
  );
}
