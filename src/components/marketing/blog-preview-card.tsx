import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BlogPreviewCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: number;
  publishedAt: string | Date;
  imageUrl: string;
  className?: string;
};

function formatRelativeDate(date: string | Date): string {
  const target = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays)) {
    return "";
  }

  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return rtf.format(-diffHours, "hour");
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(-diffDays, "day");
  }
  if (Math.abs(diffDays) < 365) {
    const diffMonths = Math.round(diffDays / 30);
    return rtf.format(-diffMonths, "month");
  }
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(-diffYears, "year");
}

export function BlogPreviewCard({
  slug,
  title,
  excerpt,
  category,
  readingTime,
  publishedAt,
  imageUrl,
  className,
}: BlogPreviewCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kaza-blue focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={`Illustration de l'article : ${title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <Badge
          className="absolute left-3 top-3 bg-white/95 text-kaza-navy backdrop-blur-sm hover:bg-white"
          variant="secondary"
        >
          {category}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-heading text-lg font-semibold leading-snug text-kaza-navy transition-colors group-hover:text-kaza-blue">
          {title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {readingTime} min de lecture
          </span>
          <time dateTime={new Date(publishedAt).toISOString()}>
            {formatRelativeDate(publishedAt)}
          </time>
        </div>
      </div>
    </Link>
  );
}
