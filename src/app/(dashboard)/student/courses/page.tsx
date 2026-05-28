import type { Metadata } from "next";
import { Bike, BookOpen, Bus, Calendar, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mon université & emploi du temps",
};

const UNIVERSITES = [
  "UAC (Abomey-Calavi)",
  "IRGIB Africa",
  "EPAC",
  "ESGIS Bénin",
  "Bénin Excellence",
  "ENEAM",
  "Autre",
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
const SLOTS = [
  "08h-10h",
  "10h-12h",
  "12h-14h",
  "14h-16h",
  "16h-18h",
  "18h-20h",
] as const;

type DayKey = (typeof DAYS)[number];
type SlotKey = (typeof SLOTS)[number];

type CourseEntry = {
  title: string;
  prof?: string;
  color: string;
};

const COURSE_GRID: Partial<Record<DayKey, Partial<Record<SlotKey, CourseEntry>>>> = {
  Lun: {
    "08h-10h": { title: "Algorithmique", prof: "Dr. Adékambi", color: "bg-kaza-blue/15 text-kaza-blue ring-kaza-blue/30" },
    "10h-12h": { title: "Anglais technique", prof: "Mme Diop", color: "bg-violet-100 text-violet-700 ring-violet-300" },
    "14h-16h": { title: "Base de données", prof: "M. Houessou", color: "bg-amber-100 text-amber-800 ring-amber-300" },
  },
  Mar: {
    "08h-10h": { title: "Mathématiques", prof: "Dr. Kpodar", color: "bg-rose-100 text-rose-700 ring-rose-300" },
    "10h-12h": { title: "Algorithmique TD", prof: "Tuteur L2", color: "bg-kaza-blue/15 text-kaza-blue ring-kaza-blue/30" },
    "16h-18h": { title: "Réseaux", prof: "M. Tossou", color: "bg-emerald-100 text-emerald-700 ring-emerald-300" },
  },
  Mer: {
    "10h-12h": { title: "Système Linux", prof: "M. Adjovi", color: "bg-sky-100 text-sky-700 ring-sky-300" },
    "14h-16h": { title: "Projet équipe", color: "bg-kaza-green/15 text-kaza-green ring-kaza-green/30" },
  },
  Jeu: {
    "08h-10h": { title: "Base de données TP", prof: "M. Houessou", color: "bg-amber-100 text-amber-800 ring-amber-300" },
    "14h-16h": { title: "Réseaux TP", prof: "M. Tossou", color: "bg-emerald-100 text-emerald-700 ring-emerald-300" },
  },
  Ven: {
    "10h-12h": { title: "Anglais oral", prof: "Mme Diop", color: "bg-violet-100 text-violet-700 ring-violet-300" },
    "14h-16h": { title: "Génie logiciel", prof: "Dr. Allagbé", color: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-300" },
  },
  Sam: {
    "08h-10h": { title: "Stat. & probas", prof: "Dr. Kpodar", color: "bg-rose-100 text-rose-700 ring-rose-300" },
  },
};

const DISTANCES = [
  {
    name: "UAC Calavi",
    distance: "5 min en voiture",
    badge: "Très proche",
    badgeClass: "bg-kaza-green/10 text-kaza-green",
    icon: Bike,
  },
  {
    name: "IRGIB Akpakpa",
    distance: "12 min en taxi",
    badge: "Proche",
    badgeClass: "bg-kaza-blue/10 text-kaza-blue",
    icon: Bus,
  },
  {
    name: "EPAC Calavi",
    distance: "8 min en zem",
    badge: "Très proche",
    badgeClass: "bg-kaza-green/10 text-kaza-green",
    icon: Bike,
  },
];

export default function StudentCoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mon université & emploi du temps
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Centralisez votre cursus pour mieux organiser cours et colocation.
        </p>
      </div>

      {/* Université */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-kaza-blue" />
            Mon université
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Université</Label>
              <Select defaultValue="UAC (Abomey-Calavi)">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIVERSITES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculté / Département</Label>
              <Input id="faculty" defaultValue="FAST — Informatique" />
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Select defaultValue="L2">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["L1", "L2", "L3", "M1", "M2", "Doctorat"].map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Programme</Label>
              <Input id="program" defaultValue="Licence Informatique" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emploi du temps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4 text-kaza-blue" />
            Mon emploi du temps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-20 border-b p-2 text-left font-medium text-muted-foreground">
                    Créneau
                  </th>
                  {DAYS.map((d) => (
                    <th
                      key={d}
                      className="border-b p-2 text-center font-medium text-muted-foreground"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((slot) => (
                  <tr key={slot}>
                    <td className="border-b border-r p-2 text-left text-[11px] font-semibold text-muted-foreground">
                      {slot}
                    </td>
                    {DAYS.map((day) => {
                      const entry = COURSE_GRID[day]?.[slot];
                      return (
                        <td
                          key={`${day}-${slot}`}
                          className="border-b border-r p-1 align-top"
                        >
                          {entry ? (
                            <div
                              className={cn(
                                "rounded-md p-1.5 ring-1",
                                entry.color
                              )}
                            >
                              <p className="font-semibold leading-tight">
                                {entry.title}
                              </p>
                              {entry.prof && (
                                <p className="mt-0.5 text-[10px] opacity-80">
                                  {entry.prof}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="h-full min-h-[44px] rounded-md bg-muted/20" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            12 cours pré-remplis. Cliquez sur un créneau (bientôt) pour modifier
            ou ajouter un cours.
          </p>
        </CardContent>
      </Card>

      {/* Distances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-kaza-blue" />
            Distance aux logements KAZA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {DISTANCES.map((d) => {
              const Icon = d.icon;
              return (
                <div
                  key={d.name}
                  className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                      <Icon className="size-5" />
                    </div>
                    <Badge className={cn("text-[10px]", d.badgeClass)}>
                      {d.badge}
                    </Badge>
                  </div>
                  <p className="mt-3 font-semibold">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.distance}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
