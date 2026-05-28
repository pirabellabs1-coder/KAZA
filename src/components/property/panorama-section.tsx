// =============================================================================
// KAZA - PanoramaSection (server component)
//
// Section de page detail propriete qui presente la visite 360° immersive.
// Utilise <Panorama360Viewer> (client) avec drag, zoom, rotation auto et
// fullscreen, encadre d'un header avec le badge "Exclusivite KAZA Pro" et
// d'un hint d'utilisation sous le viewer.
// =============================================================================

import { Panorama360Viewer } from "@/components/property/panorama-360-viewer";

interface PanoramaSectionProps {
  propertyTitle: string;
  /** URL optionnelle d'une image équirectangulaire. Fallback démo si absent. */
  src?: string;
}

export function PanoramaSection({ propertyTitle, src }: PanoramaSectionProps) {
  return (
    <section className="mx-auto mt-6 max-w-7xl px-4 lg:px-8">
      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-kaza-navy">
              Visite virtuelle 360°
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explorez {propertyTitle} comme si vous y étiez.
            </p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-kaza-green/10 px-3 py-1 text-xs font-semibold text-kaza-green">
            Exclusivité KAZA Pro
          </span>
        </div>

        <Panorama360Viewer
          src={src ?? "https://pannellum.org/images/cerro-toco-0.jpg"}
          alt={`Vue panoramique du bien — ${propertyTitle}`}
          height={460}
          autoRotate={false}
        />

        <p className="mt-3 text-sm text-muted-foreground">
          Glissez pour explorer · Utilisez les boutons pour zoomer ou activer la
          rotation automatique
        </p>
      </div>
    </section>
  );
}
