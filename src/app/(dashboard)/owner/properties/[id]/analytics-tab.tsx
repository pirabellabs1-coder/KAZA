"use client";

import { Eye, CalendarCheck, TrendingUp, Star } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnalyticsTabProps {
  propertyId: string;
  totalViews: number;
}

// Genere une serie pseudo-aleatoire mais stable sur 30 jours a partir d'une seed
function generateViewsSeries(seed: string, total: number): number[] {
  const points: number[] = [];
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 30; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    const base = (s % 100) / 100; // 0..1
    points.push(Math.round(5 + base * (total / 15)));
  }
  return points;
}

export function AnalyticsTab({ propertyId, totalViews }: AnalyticsTabProps) {
  const views30 = Math.max(20, Math.round(totalViews * 0.4));
  const visitRequests = Math.max(3, Math.round(views30 / 8));
  const conversionRate = Math.min(
    100,
    Math.round((visitRequests / Math.max(1, views30)) * 100 * 10) / 10,
  );
  const rating = 4.6;

  const series = generateViewsSeries(propertyId, views30);
  const max = Math.max(...series);
  const min = Math.min(...series);

  // SVG path
  const width = 600;
  const height = 140;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = innerW / (series.length - 1);
  const range = max - min || 1;
  const path = series
    .map((v, i) => {
      const x = padX + i * stepX;
      const y = padY + innerH - ((v - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const areaPath = `${path} L${padX + innerW},${padY + innerH} L${padX},${padY + innerH} Z`;

  // Weekly performance: aggregate by week (last 4 weeks)
  const weeks = [4, 3, 2, 1].map((weekFromEnd, idx) => {
    const start = series.length - weekFromEnd * 7;
    const end = start + 7;
    const slice = series.slice(Math.max(0, start), Math.min(series.length, end));
    const views = slice.reduce((a, b) => a + b, 0);
    const visits = Math.max(1, Math.round(views / 9));
    const requests = Math.max(0, Math.round(visits * 0.7));
    return {
      label: `Semaine ${idx + 1}`,
      views,
      visits,
      requests,
      conversion: `${Math.round((requests / Math.max(1, views)) * 100 * 10) / 10}%`,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Vues (30 jours)"
          value={views30}
          icon={Eye}
          trend={{ label: "+12% vs mois precedent", type: "positive" }}
        />
        <StatsCard
          title="Demandes de visite"
          value={visitRequests}
          icon={CalendarCheck}
          trend={{ label: "+3 cette semaine", type: "positive" }}
        />
        <StatsCard
          title="Taux de conversion"
          value={`${conversionRate}%`}
          subtitle="Vues vers demande"
          icon={TrendingUp}
          trend={{ label: "Stable", type: "neutral" }}
        />
        <StatsCard
          title="Note moyenne"
          value={rating.toFixed(1)}
          subtitle="Sur 24 avis"
          icon={Star}
          trend={{ label: "+0.2 ce mois", type: "positive" }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution des vues (30 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-40 w-full min-w-[480px]"
              role="img"
              aria-label="Graphique des vues sur 30 jours"
            >
              <defs>
                <linearGradient id="viewsArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#1976D2" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1976D2" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                const y = padY + p * innerH;
                return (
                  <line
                    key={p}
                    x1={padX}
                    x2={padX + innerW}
                    y1={y}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                );
              })}
              <path d={areaPath} fill="url(#viewsArea)" />
              <path d={path} fill="none" stroke="#1976D2" strokeWidth={2} />
              {series.map((v, i) => {
                const x = padX + i * stepX;
                const y = padY + innerH - ((v - min) / range) * innerH;
                return (
                  <circle key={i} cx={x} cy={y} r={2} fill="#1976D2" />
                );
              })}
            </svg>
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>J-30</span>
            <span>J-20</span>
            <span>J-10</span>
            <span>Aujourd&apos;hui</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance hebdomadaire</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semaine</TableHead>
                <TableHead className="text-right">Vues</TableHead>
                <TableHead className="text-right">Visites</TableHead>
                <TableHead className="text-right">Demandes</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((w) => (
                <TableRow key={w.label}>
                  <TableCell className="font-medium">{w.label}</TableCell>
                  <TableCell className="text-right">{w.views}</TableCell>
                  <TableCell className="text-right">{w.visits}</TableCell>
                  <TableCell className="text-right">{w.requests}</TableCell>
                  <TableCell className="text-right font-medium text-kaza-green">
                    {w.conversion}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
