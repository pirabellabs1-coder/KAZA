import { CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationBadgeProps {
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  if (status === "APPROVED") {
    return (
      <Badge className="gap-1 bg-kaza-green text-white hover:bg-kaza-green/90">
        <CheckCircle className="size-3" />
        Vérifié
      </Badge>
    );
  }

  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="gap-1 border-kaza-warning text-kaza-warning">
        <Clock className="size-3" />
        En attente
      </Badge>
    );
  }

  return null;
}
