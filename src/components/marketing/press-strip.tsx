import { cn } from "@/lib/utils";

type PressItem = {
  name: string;
  letters: string;
  color: string;
};

type PressStripProps = {
  items: PressItem[];
  title?: string;
  className?: string;
};

export function PressStrip({
  items,
  title = "Vu dans la presse",
  className,
}: PressStripProps) {
  return (
    <section className={cn("w-full py-8", className)}>
      <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6">
        {items.map((item) => (
          <div
            key={item.name}
            className="group flex items-center gap-2 rounded-md px-3 py-2 transition-all hover:-translate-y-0.5"
            title={item.name}
          >
            <span
              className="inline-flex h-8 items-center justify-center rounded px-3 text-[11px] font-bold uppercase tracking-tighter text-white shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            >
              {item.letters}
            </span>
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-kaza-navy">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
