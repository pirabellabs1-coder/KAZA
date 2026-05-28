import { cn } from "@/lib/utils";

type GradientVariant = "navy" | "blue" | "green" | "sunset";

type GradientCardProps = {
  variant?: GradientVariant;
  children: React.ReactNode;
  className?: string;
};

const VARIANT_CLASSES: Record<GradientVariant, string> = {
  navy: "bg-gradient-to-br from-kaza-navy via-[#0F2A40] to-kaza-navy",
  blue: "bg-gradient-to-br from-kaza-blue via-[#0F62B5] to-kaza-navy",
  green: "bg-gradient-to-br from-kaza-green via-[#3FA040] to-[#2D7030]",
  sunset: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500",
};

export function GradientCard({
  variant = "navy",
  children,
  className,
}: GradientCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 p-6 text-white shadow-lg",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/5 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
