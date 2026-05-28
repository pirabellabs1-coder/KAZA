// =============================================================================
// KAZA - Admin / Analytics — graphiques SVG natifs (mode démo)
// Wave 9 - Yaw Boateng
// Pas de dépendance graphique externe : SVG calculé à la main.
// =============================================================================

"use client";

import { formatPrice } from "@/lib/utils";

const months = [
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
];

// Inscriptions sur 12 mois
const signups = [
  280, 340, 420, 510, 605, 720, 880, 1020, 1180, 1350, 1520, 1730,
];

// Revenus mensuels (FCFA, en millions pour lisibilité)
const monthlyRevenue = [
  12_500_000, 14_200_000, 16_800_000, 19_400_000, 22_100_000, 25_300_000,
  28_900_000, 31_500_000, 34_600_000, 38_200_000, 41_700_000, 45_200_000,
];

// Répartition par rôle
const roles = [
  { label: "TENANT", value: 7480, color: "#1976D2" }, // accent blue
  { label: "OWNER", value: 3145, color: "#1A3A52" }, // navy
  { label: "STUDENT", value: 1825, color: "#4CAF50" }, // green
];

// Cohort retention (lignes = mois d'inscription, colonnes = M1..M5)
const cohorts = [
  { cohort: "Déc. 2025", size: 1180, retention: [100, 78, 64, 55, 48] },
  { cohort: "Janv. 2026", size: 1350, retention: [100, 81, 67, 58, 51] },
  { cohort: "Févr. 2026", size: 1520, retention: [100, 83, 69, 60] },
  { cohort: "Mars 2026", size: 1730, retention: [100, 84, 71] },
  { cohort: "Avr. 2026", size: 1890, retention: [100, 85] },
  { cohort: "Mai 2026", size: 2110, retention: [100] },
];

function buildLinePath(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number) {
  const linePath = buildLinePath(values, width, height);
  return `${linePath} L${width},${height} L0,${height} Z`;
}

export function ChartsClient() {
  // === Line chart : inscriptions ===
  const lineWidth = 720;
  const lineHeight = 220;
  const linePadding = 32;
  const innerW = lineWidth - linePadding * 2;
  const innerH = lineHeight - linePadding * 2;
  const linePath = buildLinePath(signups, innerW, innerH);
  const areaPath = buildAreaPath(signups, innerW, innerH);
  const maxSignup = Math.max(...signups);

  // === Bar chart : revenus mensuels ===
  const barWidth = 720;
  const barHeight = 220;
  const barPadding = 32;
  const barInnerW = barWidth - barPadding * 2;
  const barInnerH = barHeight - barPadding * 2;
  const maxRevenue = Math.max(...monthlyRevenue);
  const barGap = 8;
  const barW = (barInnerW - barGap * (monthlyRevenue.length - 1)) /
    monthlyRevenue.length;

  // === Donut chart : répartition par rôle ===
  const donutSize = 220;
  const donutRadius = 80;
  const donutCx = donutSize / 2;
  const donutCy = donutSize / 2;
  const totalRoles = roles.reduce((s, r) => s + r.value, 0);

  let cumulativeAngle = -Math.PI / 2;
  const donutSegments = roles.map((role) => {
    const angle = (role.value / totalRoles) * Math.PI * 2;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = donutCx + donutRadius * Math.cos(startAngle);
    const y1 = donutCy + donutRadius * Math.sin(startAngle);
    const x2 = donutCx + donutRadius * Math.cos(endAngle);
    const y2 = donutCy + donutRadius * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M${donutCx},${donutCy} L${x1.toFixed(2)},${y1.toFixed(
      2,
    )} A${donutRadius},${donutRadius} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;

    return { ...role, path, pct: ((role.value / totalRoles) * 100).toFixed(1) };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Line chart : inscriptions */}
      <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Inscriptions (12 derniers mois)
          </h2>
          <p className="text-xs text-muted-foreground">
            {signups[0].toLocaleString("fr-FR")} →{" "}
            {signups[signups.length - 1].toLocaleString("fr-FR")} inscrits / mois
          </p>
        </div>
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${lineWidth} ${lineHeight}`}
            className="h-[220px] w-full min-w-[480px]"
            role="img"
            aria-label="Courbe d'inscriptions sur 12 mois"
          >
            <defs>
              <linearGradient id="signupArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1976D2" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#1976D2" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g transform={`translate(${linePadding},${linePadding})`}>
              {/* Grille horizontale */}
              {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                <line
                  key={r}
                  x1={0}
                  x2={innerW}
                  y1={innerH * r}
                  y2={innerH * r}
                  stroke="#e5e7eb"
                  strokeDasharray="2 4"
                />
              ))}
              <path d={areaPath} fill="url(#signupArea)" />
              <path
                d={linePath}
                fill="none"
                stroke="#1976D2"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {signups.map((v, i) => {
                const max = Math.max(...signups);
                const min = Math.min(...signups);
                const x = (i * innerW) / (signups.length - 1);
                const y = innerH - ((v - min) / (max - min || 1)) * innerH;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3}
                    fill="#1976D2"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                );
              })}
              {/* X labels */}
              {months.map((m, i) => {
                const x = (i * innerW) / (months.length - 1);
                return (
                  <text
                    key={m}
                    x={x}
                    y={innerH + 20}
                    fontSize={10}
                    textAnchor="middle"
                    fill="#6b7280"
                  >
                    {m}
                  </text>
                );
              })}
              {/* Y max label */}
              <text x={-8} y={4} fontSize={10} textAnchor="end" fill="#6b7280">
                {maxSignup}
              </text>
            </g>
          </svg>
        </div>
      </section>

      {/* Bar chart : revenus */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Revenus mensuels (12 mois)
          </h2>
          <p className="text-xs text-muted-foreground">
            Total annuel cumulé : {formatPrice(
              monthlyRevenue.reduce((s, v) => s + v, 0),
            )}
          </p>
        </div>
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${barWidth} ${barHeight}`}
            className="h-[220px] w-full min-w-[480px]"
            role="img"
            aria-label="Histogramme des revenus mensuels"
          >
            <g transform={`translate(${barPadding},${barPadding})`}>
              {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                <line
                  key={r}
                  x1={0}
                  x2={barInnerW}
                  y1={barInnerH * r}
                  y2={barInnerH * r}
                  stroke="#e5e7eb"
                  strokeDasharray="2 4"
                />
              ))}
              {monthlyRevenue.map((v, i) => {
                const h = (v / maxRevenue) * barInnerH;
                const x = i * (barW + barGap);
                const y = barInnerH - h;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx={3}
                      fill="#1A3A52"
                      opacity={0.85}
                    />
                    <text
                      x={x + barW / 2}
                      y={barInnerH + 16}
                      fontSize={9}
                      textAnchor="middle"
                      fill="#6b7280"
                    >
                      {months[i]}
                    </text>
                  </g>
                );
              })}
              <text x={-8} y={4} fontSize={10} textAnchor="end" fill="#6b7280">
                {Math.round(maxRevenue / 1_000_000)}M
              </text>
            </g>
          </svg>
        </div>
      </section>

      {/* Donut : répartition par rôle */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Répartition par rôle
          </h2>
          <p className="text-xs text-muted-foreground">
            Total : {totalRoles.toLocaleString("fr-FR")} utilisateurs
          </p>
        </div>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-around">
          <svg
            viewBox={`0 0 ${donutSize} ${donutSize}`}
            className="h-[220px] w-[220px] shrink-0"
            role="img"
            aria-label="Donut de répartition utilisateurs par rôle"
          >
            {donutSegments.map((seg) => (
              <path key={seg.label} d={seg.path} fill={seg.color} />
            ))}
            {/* Trou central */}
            <circle cx={donutCx} cy={donutCy} r={45} fill="white" />
            <text
              x={donutCx}
              y={donutCy - 4}
              textAnchor="middle"
              fontSize={14}
              fontWeight="700"
              fill="#1A3A52"
            >
              {totalRoles.toLocaleString("fr-FR")}
            </text>
            <text
              x={donutCx}
              y={donutCy + 12}
              textAnchor="middle"
              fontSize={9}
              fill="#6b7280"
            >
              Utilisateurs
            </text>
          </svg>
          <ul className="flex flex-col gap-2 text-sm">
            {donutSegments.map((seg) => (
              <li key={seg.label} className="flex items-center gap-2">
                <span
                  className="block size-3 rounded-sm"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="font-medium text-foreground">{seg.label}</span>
                <span className="text-muted-foreground">
                  {seg.value.toLocaleString("fr-FR")} ({seg.pct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cohort retention */}
      <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Cohort retention
          </h2>
          <p className="text-xs text-muted-foreground">
            % d&apos;utilisateurs encore actifs N mois après inscription
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cohorte
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Taille
                </th>
                {["M0", "M1", "M2", "M3", "M4"].map((m) => (
                  <th
                    key={m}
                    className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr
                  key={c.cohort}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {c.cohort}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.size.toLocaleString("fr-FR")}
                  </td>
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const value = c.retention[idx];
                    if (value === undefined) {
                      return (
                        <td
                          key={idx}
                          className="px-3 py-2 text-center text-muted-foreground/40"
                        >
                          —
                        </td>
                      );
                    }
                    // intensité couleur selon valeur
                    const alpha = Math.max(0.12, value / 100);
                    return (
                      <td key={idx} className="px-1 py-1 text-center">
                        <span
                          className="inline-block min-w-[42px] rounded-md px-2 py-1 text-xs font-semibold text-white"
                          style={{
                            backgroundColor: `rgba(25,118,210,${alpha})`,
                          }}
                        >
                          {value}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
