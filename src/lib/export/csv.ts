import "server-only";

// =============================================================================
// KAZA - Sérialisation CSV serveur (sans dépendance externe)
// =============================================================================
// Implémentation minimale conforme RFC 4180 :
//   - séparateur : virgule
//   - guillemets doubles autour des champs qui contiennent `,`, `"`, `\n`
//   - échappement des guillemets en les doublant (`"` -> `""`)
//   - BOM UTF-8 en tête pour qu'Excel reconnaisse l'encodage
//
// Pour des exports XLSX natifs (formats, formules), il faudra ajouter `exceljs`
// au package.json — pour l'instant le CSV ouvert dans Excel suffit largement
// pour la comptabilité MVP.
// =============================================================================

export type CsvCell = string | number | boolean | null | undefined | Date;

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (value instanceof Date) {
    // ISO sans millisecondes — Excel comprend.
    str = Number.isNaN(value.getTime()) ? "" : value.toISOString();
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    str = String(value);
  } else if (typeof value === "boolean") {
    str = value ? "oui" : "non";
  } else {
    str = String(value);
  }
  // Forcer le `"` autour si présence d'un caractère spécial.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvOptions {
  /** Inclure le BOM UTF-8 en tête (true par défaut pour Excel FR). */
  bom?: boolean;
  /** Terminateur de ligne (CRLF par défaut, conforme RFC 4180). */
  eol?: "\r\n" | "\n";
}

export function toCsv(
  headers: string[],
  rows: CsvCell[][],
  opts: CsvOptions = {},
): string {
  const eol = opts.eol ?? "\r\n";
  const bom = opts.bom ?? true;
  const lines: string[] = [];
  lines.push(headers.map(escapeCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }
  return (bom ? "﻿" : "") + lines.join(eol);
}

/**
 * Construit une `Response` HTTP qui force le téléchargement du CSV.
 * `filename` ne doit pas contenir d'extension — elle est ajoutée
 * automatiquement.
 */
export function csvResponse(
  filename: string,
  csv: string,
  status = 200,
): Response {
  // Sanitize le filename pour Content-Disposition (RFC 5987).
  const safe = filename.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 80);
  return new Response(csv, {
    status,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${safe}.csv"`,
      "cache-control": "no-store, max-age=0",
    },
  });
}
