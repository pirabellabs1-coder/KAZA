import { cn } from "@/lib/utils";

type SectionHeroProps = {
  title: string;
  subtitle?: string;
  variant?: "navy" | "light";
  eyebrow?: string;
  align?: "center" | "left";
  children?: React.ReactNode;
  className?: string;
};

export function SectionHero({
  title,
  subtitle,
  variant = "navy",
  eyebrow,
  align = "center",
  children,
  className,
}: SectionHeroProps) {
  const isNavy = variant === "navy";

  return (
    <section
      className={cn(
        "w-full",
        isNavy ? "bg-kaza-navy text-white" : "bg-gray-50 text-foreground",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-5xl px-4 py-16 sm:py-20 lg:px-8",
          align === "center" ? "text-center" : "text-left"
        )}
      >
        {eyebrow && (
          <p
            className={cn(
              "mb-3 text-xs font-semibold tracking-widest uppercase",
              isNavy ? "text-kaza-green" : "text-kaza-blue"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "mx-auto mt-4 max-w-2xl text-lg",
              isNavy ? "text-white/75" : "text-muted-foreground",
              align === "left" && "mx-0"
            )}
          >
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
