import { cn } from "@/lib/utils";

type Partner = {
  name: string;
  logoLetters: string;
  brandColor: string;
  category?: string;
};

type PartnerBarProps = {
  partners: Partner[];
  title?: string;
  className?: string;
};

export function PartnerBar({
  partners,
  title = "Ils nous font confiance",
  className,
}: PartnerBarProps) {
  return (
    <section className={cn("w-full", className)}>
      {title && (
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      )}

      <div className="group relative w-full overflow-x-auto">
        <ul className="flex min-w-full items-center justify-start gap-6 px-4 py-2 sm:justify-center sm:gap-8 lg:gap-12">
          {partners.map((partner) => (
            <li
              key={partner.name}
              className="flex flex-col items-center gap-2 transition-all duration-300 group-hover:opacity-50 hover:!opacity-100"
            >
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ring-1 ring-black/5 grayscale transition-all duration-300 hover:grayscale-0 hover:scale-110"
                style={{ backgroundColor: partner.brandColor }}
                aria-hidden="true"
              >
                {partner.logoLetters}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {partner.name}
              </span>
              {partner.category && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {partner.category}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
