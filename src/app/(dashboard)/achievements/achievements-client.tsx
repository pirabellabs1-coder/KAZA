"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarHeart,
  CheckCircle2,
  FileSignature,
  FlaskConical,
  Footprints,
  Gift,
  Globe,
  Lock,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Types redéfinis localement — alignés sur le shape Supabase (queries/achievements).
type AchievementCategory =
  | "getting_started"
  | "social"
  | "transactions"
  | "reviews"
  | "special";

type AchievementRarity = "common" | "rare" | "epic" | "legendary";

interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string | null;
  category: AchievementCategory | string | null;
  pointsReward: number;
  rarity: AchievementRarity;
  unlockedAt?: string | null;
  progress?: { current: number; target: number };
}

// Shape exact reçu depuis la page serveur (UserAchievementWithDefinition).
interface IncomingAchievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string | null;
  category: string | null;
  pointsReward: number;
  rarity: AchievementRarity;
  progress: number;
  target: number;
  unlockedAt: string | null;
}

interface AchievementsClientProps {
  userFirstName: string;
  achievements: IncomingAchievement[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  PartyPopper,
  ShieldCheck,
  UserCheck,
  Footprints,
  MapPin,
  Globe,
  Gift,
  Megaphone,
  Star,
  MessageSquareQuote,
  FileSignature,
  Wallet,
  CalendarHeart,
  Users,
  FlaskConical,
  Trophy,
};

const RARITY_STYLES: Record<
  AchievementRarity,
  { ring: string; bg: string; text: string; label: string; chip: string }
> = {
  common: {
    ring: "ring-slate-300",
    bg: "bg-slate-100",
    text: "text-slate-600",
    label: "Commun",
    chip: "bg-slate-100 text-slate-700 border-slate-200",
  },
  rare: {
    ring: "ring-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-600",
    label: "Rare",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
  },
  epic: {
    ring: "ring-violet-300",
    bg: "bg-violet-50",
    text: "text-violet-600",
    label: "Epique",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
  },
  legendary: {
    ring: "ring-amber-300",
    bg: "bg-amber-50",
    text: "text-amber-600",
    label: "Legendaire",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const CATEGORY_LABELS: Record<AchievementCategory | "all", string> = {
  all: "Tous",
  getting_started: "Demarrage",
  social: "Social",
  transactions: "Transactions",
  reviews: "Avis",
  special: "Special",
};

const CATEGORY_ORDER: Array<AchievementCategory | "all"> = [
  "all",
  "getting_started",
  "social",
  "transactions",
  "reviews",
  "special",
];

function mapIncoming(a: IncomingAchievement): Achievement {
  return {
    id: a.id,
    code: a.code,
    title: a.title,
    description: a.description,
    icon: a.icon,
    category: a.category,
    pointsReward: a.pointsReward,
    rarity: a.rarity,
    unlockedAt: a.unlockedAt ?? undefined,
    progress:
      a.target > 0
        ? { current: a.progress, target: a.target }
        : undefined,
  };
}

export function AchievementsClient({
  userFirstName,
  achievements: incoming,
}: AchievementsClientProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    incoming.map(mapIncoming),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAchievements(incoming.map(mapIncoming));
    setHydrated(true);
  }, [incoming]);

  const totalCount = achievements.length;
  const unlockedCount = useMemo(
    () => achievements.filter((a) => Boolean(a.unlockedAt)).length,
    [achievements],
  );
  const totalPoints = useMemo(
    () =>
      achievements
        .filter((a) => Boolean(a.unlockedAt))
        .reduce((sum, a) => sum + a.pointsReward, 0),
    [achievements],
  );
  const progressPct =
    totalCount === 0 ? 0 : Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#1976D2]">
          Bonjour {userFirstName}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#1A3A52]">
          Mes badges KAZA
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Chaque action sur KAZA vous rapporte des badges et des KAZA Points.
          Debloquez la collection complete pour devenir une legende de la
          plateforme.
        </p>
      </div>

      {/* Stats */}
      <Card className="border-[#1A3A52]/10 bg-gradient-to-br from-[#1A3A52] to-[#1976D2] text-white">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/80">Progression de votre collection</p>
              <p className="mt-1 text-3xl font-bold">
                {unlockedCount}
                <span className="text-xl font-normal text-white/70"> / {totalCount} badges</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Points cumules</p>
              <p className="mt-1 flex items-center justify-end gap-2 text-2xl font-bold">
                <Sparkles className="size-5 text-amber-300" aria-hidden />
                {totalPoints.toLocaleString("fr-FR")} pts
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <Progress
              value={progressPct}
              className="h-2 bg-white/20 [&>div]:bg-amber-300"
            />
            <p className="text-xs text-white/70">{progressPct}% complete</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs categories */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {CATEGORY_ORDER.map((cat) => {
            const count =
              cat === "all"
                ? achievements.length
                : achievements.filter((a) => a.category === cat).length;
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-sm data-[state=active]:border-[#1976D2] data-[state=active]:bg-[#1976D2] data-[state=active]:text-white"
              >
                {CATEGORY_LABELS[cat]}
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORY_ORDER.map((cat) => {
          const list =
            cat === "all"
              ? achievements
              : achievements.filter((a) => a.category === cat);
          return (
            <TabsContent key={cat} value={cat} className="mt-0">
              <div
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                aria-busy={!hydrated}
              >
                {list.map((a) => (
                  <AchievementCard key={a.id} achievement={a} />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon: LucideIcon =
    (achievement.icon ? ICON_MAP[achievement.icon] : undefined) ?? Trophy;
  const rarity = RARITY_STYLES[achievement.rarity];
  const unlocked = Boolean(achievement.unlockedAt);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-transform hover:scale-[1.02]",
        unlocked ? "border-[#1A3A52]/10" : "border-slate-200/80 bg-slate-50/40",
      )}
    >
      <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
        {/* Icon circle */}
        <div className="relative">
          <div
            className={cn(
              "flex size-20 items-center justify-center rounded-full ring-4 ring-offset-2 transition",
              rarity.ring,
              unlocked ? rarity.bg : "bg-slate-100",
            )}
            aria-hidden
          >
            <Icon
              className={cn(
                "size-10",
                unlocked ? rarity.text : "text-slate-300",
              )}
              strokeWidth={1.75}
            />
            {!unlocked && (
              <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-slate-400">
                <Lock className="size-3.5 text-white" aria-hidden />
              </div>
            )}
            {unlocked && (
              <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-green-500">
                <CheckCircle2 className="size-4 text-white" aria-hidden />
              </div>
            )}
          </div>
        </div>

        {/* Title + rarity chip */}
        <div className="space-y-1">
          <h3
            className={cn(
              "text-sm font-semibold leading-tight",
              unlocked ? "text-[#1A3A52]" : "text-slate-500",
            )}
          >
            {achievement.title}
          </h3>
          <Badge
            variant="outline"
            className={cn("text-[10px] uppercase tracking-wide", rarity.chip)}
          >
            {rarity.label}
          </Badge>
        </div>

        {/* Description */}
        <p className="line-clamp-3 text-xs text-muted-foreground">
          {achievement.description}
        </p>

        {/* Progress bar (only when defined and not unlocked) */}
        {achievement.progress && !unlocked && (
          <div className="w-full space-y-1">
            <Progress
              value={Math.min(
                100,
                Math.round(
                  (achievement.progress.current / achievement.progress.target) *
                    100,
                ),
              )}
              className="h-1.5"
            />
            <p className="text-[10px] text-muted-foreground">
              {achievement.progress.current} / {achievement.progress.target}
            </p>
          </div>
        )}

        {/* Points */}
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            unlocked ? "text-[#4CAF50]" : "text-slate-400",
          )}
        >
          <Sparkles className="size-3.5" aria-hidden />
          +{achievement.pointsReward} points
        </div>
      </CardContent>
    </Card>
  );
}
