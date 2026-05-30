"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

// =============================================================================
// KAZA — Filtres du journal d'audit (client)
//
// Selects contrôlés qui poussent les filtres dans l'URL (?admin=&action=&target=).
// La page serveur relit ces searchParams et requête `listAuditLogs` en
// conséquence — filtrage réel côté base de données.
// =============================================================================

interface AdminOption {
  adminId: string;
  adminName: string;
}

interface AuditFiltersProps {
  admins: AdminOption[];
  actionLabels: Record<string, string>;
  selectedAdmin: string;
  selectedAction: string;
  selectedTarget: string;
}

const TARGET_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "USER", label: "Utilisateurs" },
  { value: "PROPERTY", label: "Annonces" },
  { value: "CONTRACT", label: "Contrats" },
  { value: "AGENCY", label: "Agences" },
  { value: "PAYMENT", label: "Paiements" },
  { value: "SYSTEM", label: "Système" },
];

export function AuditFilters({
  admins,
  actionLabels,
  selectedAdmin,
  selectedAction,
  selectedTarget,
}: AuditFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.push(query ? `?${query}` : "?");
  }

  const selectClass =
    "rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-kaza-navy outline-none focus:border-kaza-blue";

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-kaza-navy">Filtres</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select
          className={selectClass}
          value={selectedAdmin}
          aria-label="Filtrer par admin"
          onChange={(e) => updateParam("admin", e.target.value)}
        >
          <option value="">Tous les admins</option>
          {admins.map((a) => (
            <option key={a.adminId} value={a.adminId}>
              {a.adminName}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={selectedAction}
          aria-label="Filtrer par action"
          onChange={(e) => updateParam("action", e.target.value)}
        >
          <option value="">Toutes actions</option>
          {Object.entries(actionLabels).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={selectedTarget}
          aria-label="Filtrer par type de cible"
          onChange={(e) => updateParam("target", e.target.value)}
        >
          <option value="">Toutes cibles</option>
          {TARGET_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
