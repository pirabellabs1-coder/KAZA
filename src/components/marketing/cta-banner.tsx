import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type CtaAction = {
  label: string;
  href: string;
};

type CtaBannerProps = {
  title: string;
  description?: string;
  primaryAction: CtaAction;
  secondaryAction?: CtaAction;
};

export function CtaBanner({
  title,
  description,
  primaryAction,
  secondaryAction,
}: CtaBannerProps) {
  return (
    <section className="bg-kaza-navy py-16 text-white">
      <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/75 sm:text-lg">
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-kaza-green hover:bg-kaza-green/90">
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          {secondaryAction && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
            >
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
