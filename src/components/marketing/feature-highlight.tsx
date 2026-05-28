import {
  Award,
  Bell,
  Clock,
  FileSignature,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  Star,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck,
  Wallet,
  FileSignature,
  MessagesSquare,
  Star,
  MapPin,
  Bell,
  Zap,
  Clock,
  Award,
};

type FeatureHighlightProps = {
  icon: string;
  title: string;
  description: string;
  metric?: string;
  className?: string;
};

export function FeatureHighlight({
  icon,
  title,
  description,
  metric,
  className,
}: FeatureHighlightProps) {
  const Icon = ICON_MAP[icon] ?? Star;

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-xl p-5 transition-colors hover:bg-gray-50",
        className
      )}
    >
      <div
        className="flex size-12 items-center justify-center rounded-full bg-kaza-blue/10 text-kaza-blue transition-transform group-hover:scale-110"
        aria-hidden="true"
      >
        <Icon className="size-6" />
      </div>
      <h3 className="font-heading text-base font-semibold text-kaza-navy">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {metric && (
        <p className="mt-1 text-sm font-medium text-kaza-green">{metric}</p>
      )}
    </div>
  );
}
