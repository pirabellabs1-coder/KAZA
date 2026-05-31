"use client";

import { useState, useTransition } from "react";
import { Calendar, BookOpen, Loader2, Plus, Save, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
import {
  saveStudentAcademic,
  type CourseCell,
} from "@/actions/student-profile";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;
const SLOTS = [
  "08h-10h",
  "10h-12h",
  "12h-14h",
  "14h-16h",
  "16h-18h",
  "18h-20h",
] as const;

const YEARS = ["L1", "L2", "L3", "M1", "M2", "Doctorat"] as const;

// Palette déterministe par cours (couleur stable, jamais aléatoire) — choisie
// à partir du hash du titre pour qu'un même cours garde toujours sa couleur.
const COURSE_PALETTE = [
  "bg-kaza-blue/10 text-kaza-blue ring-kaza-blue/20",
  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  "bg-amber-100 text-amber-800 ring-amber-200",
  "bg-violet-100 text-violet-700 ring-violet-200",
  "bg-rose-100 text-rose-700 ring-rose-200",
  "bg-cyan-100 text-cyan-700 ring-cyan-200",
];

function colorForTitle(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) >>> 0;
  }
  return COURSE_PALETTE[h % COURSE_PALETTE.length];
}

type Grid = Record<string, Record<string, CourseCell>>;

export interface CoursesClientProps {
  initial: {
    university: string;
    faculty: string;
    studyYear: string;
    program: string;
    courses: Grid;
  };
}

export function CoursesClient({ initial }: CoursesClientProps) {
  const [university, setUniversity] = useState(initial.university);
  const [faculty, setFaculty] = useState(initial.faculty);
  const [studyYear, setStudyYear] = useState(initial.studyYear);
  const [program, setProgram] = useState(initial.program);
  const [grid, setGrid] = useState<Grid>(initial.courses ?? {});

  // Formulaire d'ajout de cours
  const [day, setDay] = useState<string>(DAYS[0]);
  const [slot, setSlot] = useState<string>(SLOTS[0]);
  const [title, setTitle] = useState("");
  const [prof, setProf] = useState("");

  const [isSaving, startSaving] = useTransition();

  function persist(nextGrid: Grid) {
    startSaving(async () => {
      const res = await saveStudentAcademic({
        university,
        faculty,
        studyYear,
        program,
        courses: nextGrid,
      });
      if (res.success) {
        toast.success("Enregistré.");
      } else {
        toast.error(res.error ?? "Échec de l'enregistrement.");
      }
    });
  }

  function handleSaveUniversity() {
    persist(grid);
  }

  function handleAddCourse() {
    if (!title.trim()) {
      toast.error("Indiquez l'intitulé du cours.");
      return;
    }
    const next: Grid = {
      ...grid,
      [day]: {
        ...(grid[day] ?? {}),
        [slot]: { title: title.trim(), prof: prof.trim() || undefined },
      },
    };
    setGrid(next);
    setTitle("");
    setProf("");
    persist(next);
  }

  function handleRemove(d: string, s: string) {
    const dayObj = { ...(grid[d] ?? {}) };
    delete dayObj[s];
    const next: Grid = { ...grid, [d]: dayObj };
    if (Object.keys(dayObj).length === 0) delete next[d];
    setGrid(next);
    persist(next);
  }

  return (
    <div className="space-y-6">
      {/* Université */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-kaza-blue" />
            Mon université
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="university">Université</Label>
              <Input
                id="university"
                placeholder="Nom de votre université"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty">Faculté / Département</Label>
              <Input
                id="faculty"
                placeholder="Ex. Faculté des sciences"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Select value={studyYear} onValueChange={setStudyYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">Programme</Label>
              <Input
                id="program"
                placeholder="Ex. Licence Informatique"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleSaveUniversity}
            disabled={isSaving}
            className="bg-kaza-navy hover:bg-kaza-navy/90"
          >
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* Ajouter un cours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4 text-kaza-blue" />
            Ajouter un cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <div className="space-y-1.5">
              <Label>Jour</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Créneau</Label>
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-title">Intitulé</Label>
              <Input
                id="c-title"
                placeholder="Ex. Algorithmique"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-prof">Enseignant (option.)</Label>
              <Input
                id="c-prof"
                placeholder="Ex. Pr. Diallo"
                value={prof}
                onChange={(e) => setProf(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddCourse}
              disabled={isSaving}
              className="bg-kaza-blue hover:bg-kaza-blue/90"
            >
              <Plus className="mr-2 size-4" />
              Ajouter
            </Button>
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
                {SLOTS.map((s) => (
                  <tr key={s}>
                    <td className="border-b border-r p-2 text-left text-[11px] font-semibold text-muted-foreground">
                      {s}
                    </td>
                    {DAYS.map((d) => {
                      const entry = grid[d]?.[s];
                      return (
                        <td
                          key={`${d}-${s}`}
                          className="border-b border-r p-1 align-top"
                        >
                          {entry ? (
                            <div
                              className={cn(
                                "group relative rounded-md p-1.5 ring-1",
                                colorForTitle(entry.title),
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => handleRemove(d, s)}
                                aria-label="Supprimer ce cours"
                                className="absolute right-0.5 top-0.5 hidden rounded-full bg-black/10 p-0.5 hover:bg-black/20 group-hover:block"
                              >
                                <X className="size-2.5" />
                              </button>
                              <p className="pr-3 font-semibold leading-tight">
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
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">
              {Object.values(grid).reduce(
                (n, day) => n + Object.keys(day).length,
                0,
              )}{" "}
              cours
            </Badge>
            Ajoutez vos cours ci-dessus ; ils sont enregistrés automatiquement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
