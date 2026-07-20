"use client";

// =============================================================================
// Kaabo — Trackers analytics côté client (fire-and-forget)
//
// Composants invisibles qui envoient un évènement vers /api/track au mount.
// Best-effort : aucun throw, aucune erreur affichée, aucun blocage du rendu.
// =============================================================================

import { useEffect } from "react";

interface PageTrackerProps {
  path: string;
}

/**
 * Track une vue de page générique (PAGE_VIEW).
 * À monter dans les Server Components des pages publiques importantes.
 */
export function PageTracker({ path }: PageTrackerProps) {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "PAGE_VIEW", path }),
      keepalive: true,
    }).catch(() => {
      // best-effort : on ignore les erreurs réseau
    });
  }, [path]);
  return null;
}

interface PropertyViewTrackerProps {
  propertyId: string;
}

/**
 * Track une vue de propriété (PROPERTY_VIEW).
 * Le trigger Postgres incrémente automatiquement `properties.views_count`
 * grâce à la metadata `property_id`.
 */
export function PropertyViewTracker({ propertyId }: PropertyViewTrackerProps) {
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "PROPERTY_VIEW",
        metadata: { property_id: propertyId },
      }),
      keepalive: true,
    }).catch(() => {
      // best-effort
    });
  }, [propertyId]);
  return null;
}
