import Link from "next/link";
import { ArrowRight, MapPin, Briefcase, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type JobCardProps = {
  slug: string;
  title: string;
  location: string;
  contract: string;
  team: string;
  description: string;
};

export function JobCard({
  slug,
  title,
  location,
  contract,
  team,
  description,
}: JobCardProps) {
  return (
    <Link href={`/carrieres/${slug}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md hover:border-kaza-blue/40">
        <CardContent className="flex h-full flex-col gap-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-kaza-navy group-hover:text-kaza-blue">
              {title}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                <MapPin className="size-3" />
                {location}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Briefcase className="size-3" />
                {contract}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Users className="size-3" />
                {team}
              </Badge>
            </div>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
          <div className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-kaza-blue">
            Voir le poste
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
