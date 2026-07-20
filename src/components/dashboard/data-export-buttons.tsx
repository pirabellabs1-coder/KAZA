"use client";

import { FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-helper";

// =============================================================================
// Kaabo — Boutons d'export de données réutilisables
// =============================================================================
// - « Excel » : génère un CSV (ouvrable dans Excel / Google Sheets / LibreOffice)
//   à partir de lignes d'objets, et le télécharge côté navigateur.
// - « PDF » : déclenche l'impression navigateur (Enregistrer au format PDF),
//   qui rend fidèlement la page courante — aucune dépendance externe.
// =============================================================================

type Row = Record<string, string | number | null | undefined>;

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ];
  // BOM UTF-8 pour qu'Excel lise correctement les accents.
  return "﻿" + lines.join("\r\n");
}

interface DataExportButtonsProps {
  /** Nom de fichier sans extension. */
  filename: string;
  /** Lignes à exporter en CSV. */
  rows: Row[];
  /** Afficher le bouton PDF (impression navigateur). Défaut : true. */
  pdf?: boolean;
  /** Afficher le bouton Excel/CSV. Défaut : true. */
  excel?: boolean;
  size?: "sm" | "default";
}

export function DataExportButtons({
  filename,
  rows,
  pdf = true,
  excel = true,
  size = "sm",
}: DataExportButtonsProps) {
  const downloadCsv = () => {
    if (!rows || rows.length === 0) {
      toast.info("Aucune donnée à exporter pour le moment.");
      return;
    }
    const blob = new Blob([toCsv(rows)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé.");
  };

  const printPdf = () => {
    toast.info("Choisissez « Enregistrer au format PDF » dans la boîte d'impression.");
    // Laisse le toast s'afficher avant d'ouvrir la boîte d'impression.
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      {pdf && (
        <Button variant="outline" size={size} onClick={printPdf}>
          <FileText className="mr-2 size-4" /> Exporter PDF
        </Button>
      )}
      {excel && (
        <Button variant="outline" size={size} onClick={downloadCsv}>
          <FileSpreadsheet className="mr-2 size-4" /> Exporter Excel
        </Button>
      )}
    </>
  );
}
