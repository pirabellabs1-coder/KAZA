import {
  Bus,
  ExternalLink,
  GraduationCap,
  Hospital,
  MapPin,
  ShoppingBasket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyMapPlaceholderProps {
  city: string;
  address: string;
  className?: string;
}

interface NearbyPoint {
  icon: typeof MapPin;
  label: string;
  distance: string;
  tone: "blue" | "green" | "navy" | "amber";
}

const NEARBY: NearbyPoint[] = [
  { icon: GraduationCap, label: "Écoles & campus", distance: "≈ 600 m", tone: "blue" },
  { icon: Hospital, label: "Hôpital / clinique", distance: "≈ 1,2 km", tone: "green" },
  { icon: ShoppingBasket, label: "Marché & commerces", distance: "≈ 350 m", tone: "amber" },
  { icon: Bus, label: "Transports / zem", distance: "≈ 150 m", tone: "navy" },
];

const TONE_CLASSES: Record<NearbyPoint["tone"], string> = {
  blue: "bg-kaza-blue/10 text-kaza-blue",
  green: "bg-kaza-green/10 text-kaza-green",
  navy: "bg-kaza-navy/10 text-kaza-navy",
  amber: "bg-amber-100 text-amber-700",
};

export function PropertyMapPlaceholder({
  city,
  address,
  className,
}: PropertyMapPlaceholderProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Carte placeholder premium */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-blue shadow-xl">
        {/* Pattern de points subtil */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Halos décoratifs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-kaza-blue/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 size-80 rounded-full bg-kaza-green/20 blur-3xl"
        />

        {/* Faux tracé de rues */}
        <svg
          aria-hidden
          className="absolute inset-0 size-full opacity-20"
          viewBox="0 0 800 450"
          preserveAspectRatio="none"
        >
          <path
            d="M0 220 Q200 180 400 230 T800 200"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M120 0 L260 450"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 6"
          />
          <path
            d="M580 0 L520 450"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="4 6"
          />
        </svg>

        {/* Contenu central */}
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-kaza-green/40" />
            <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-kaza-green to-emerald-500 shadow-2xl ring-4 ring-white/20">
              <MapPin className="size-8 text-white" aria-hidden />
            </div>
          </div>
          <h3 className="mt-5 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {city}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-white/80 sm:text-base">
            {address}
          </p>
          <p className="mt-3 text-xs text-white/60">
            Carte interactive disponible avec Mapbox
          </p>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-kaza-navy shadow-lg transition-all hover:scale-[1.03] hover:bg-white"
          >
            Voir sur Google Maps
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
      </div>

      {/* À proximité */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          À proximité
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {NEARBY.map((point) => (
            <div
              key={point.label}
              className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-kaza-blue/30 hover:shadow-md"
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                  TONE_CLASSES[point.tone]
                )}
              >
                <point.icon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-kaza-navy">
                  {point.label}
                </p>
                <p className="text-xs text-muted-foreground">{point.distance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
