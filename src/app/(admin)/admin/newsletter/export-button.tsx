"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";
import type { NewsletterSubscriber } from "@/lib/queries/newsletter-admin";

// =============================================================================
// ExportSubscribersButton — télécharge la liste des abonnés newsletter au
// format CSV (BOM UTF-8 pour Excel) côté navigateur.
// =============================================================================

function csvEscape(value: string): string {
  if (/[",;\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportSubscribersButton({
  subscribers,
}: {
  subscribers: NewsletterSubscriber[];
}) {
  const handleExport = () => {
    if (subscribers.length === 0) {
      toast.info("Aucun abonné à exporter.");
      return;
    }
    const header = ["Email", "Source", "Statut", "Inscrit le"];
    const lines = subscribers.map((s) =>
      [
        csvEscape(s.email),
        csvEscape(s.source ?? "—"),
        csvEscape(s.unsubscribed ? "Désabonné" : "Actif"),
        csvEscape(new Date(s.createdAt).toLocaleDateString("fr-FR")),
      ].join(";"),
    );
    const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaza-abonnes-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé.");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="size-4" />
      Exporter CSV
    </Button>
  );
}
