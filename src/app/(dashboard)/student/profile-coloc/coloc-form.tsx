"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Heart,
  Save,
  Sparkles,
  User,
  Users2,
  Utensils,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "kaza-coloc-profile";

const DISCIPLINES = [
  "Médecine",
  "Informatique",
  "Droit",
  "Économie",
  "Lettres",
  "Génie civil",
  "Architecture",
  "Sciences politiques",
  "Marketing & Commerce",
  "Autre",
] as const;

const ANNEES = ["L1", "L2", "L3", "M1", "M2", "Doctorat"] as const;

const HOBBIES_SUGGESTIONS = [
  "Lecture",
  "Football",
  "Musique",
  "Cinéma",
  "Cuisine",
  "Voyage",
  "Photo",
  "Jeux vidéo",
  "Yoga",
  "Danse",
  "Code",
  "Art",
];

const FOOD_HABITS = [
  "Végétarien",
  "Végan",
  "Halal",
  "Sans gluten",
  "Sans porc",
  "Pescetarien",
  "Sans lactose",
  "Omnivore",
];

type ColocProfile = {
  age: string;
  gender: string;
  discipline: string;
  university: string;
  year: string;

  sleepHabit: "early" | "late" | "flexible";
  smoker: boolean;
  sportif: boolean;
  religieux: boolean;
  pets: boolean;
  noiseTolerance: number;
  cleanliness: number;

  preferredGender: "mixte" | "femmes" | "hommes";
  ageMin: string;
  ageMax: string;
  budgetMax: string;

  bio: string;
  hobbies: string[];
  foodHabits: string[];

  hasAvatar: boolean;
  lifestylePhotos: number;
};

const INITIAL: ColocProfile = {
  age: "",
  gender: "",
  discipline: "",
  university: "",
  year: "",
  sleepHabit: "flexible",
  smoker: false,
  sportif: false,
  religieux: false,
  pets: false,
  noiseTolerance: 3,
  cleanliness: 4,
  preferredGender: "mixte",
  ageMin: "18",
  ageMax: "30",
  budgetMax: "",
  bio: "",
  hobbies: [],
  foodHabits: [],
  hasAvatar: false,
  lifestylePhotos: 0,
};

function computeCompleteness(p: ColocProfile): number {
  const checks: boolean[] = [
    p.age.length > 0,
    p.gender.length > 0,
    p.discipline.length > 0,
    p.university.length > 0,
    p.year.length > 0,
    p.budgetMax.length > 0,
    p.bio.length >= 30,
    p.hobbies.length >= 3,
    p.foodHabits.length >= 1,
    p.hasAvatar,
    p.lifestylePhotos >= 2,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function ColocForm() {
  const [profile, setProfile] = useState<ColocProfile>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ColocProfile>;
        setProfile((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore corrupt JSON
    } finally {
      setLoaded(true);
    }
  }, []);

  const completeness = useMemo(() => computeCompleteness(profile), [profile]);

  const update = <K extends keyof ColocProfile>(key: K, value: ColocProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const toggleHobby = (hobby: string) => {
    setProfile((prev) => {
      const has = prev.hobbies.includes(hobby);
      if (has) return { ...prev, hobbies: prev.hobbies.filter((h) => h !== hobby) };
      if (prev.hobbies.length >= 3) {
        toast.info("Vous pouvez sélectionner 3 hobbies maximum.");
        return prev;
      }
      return { ...prev, hobbies: [...prev.hobbies, hobby] };
    });
  };

  const toggleFood = (food: string) => {
    setProfile((prev) => {
      const has = prev.foodHabits.includes(food);
      if (has) return { ...prev, foodHabits: prev.foodHabits.filter((h) => h !== food) };
      if (prev.foodHabits.length >= 3) {
        toast.info("3 habitudes alimentaires maximum.");
        return prev;
      }
      return { ...prev, foodHabits: [...prev.foodHabits, food] };
    });
  };

  const handleAvatarMock = () => {
    update("hasAvatar", !profile.hasAvatar);
  };

  const handleLifestyleMock = () => {
    update("lifestylePhotos", Math.min(2, profile.lifestylePhotos + 1));
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      toast.success("Profil colocataire enregistré ✓");
    } catch {
      toast.error("Impossible d'enregistrer (stockage indisponible).");
    }
  };

  if (!loaded) {
    return (
      <div className="h-64 animate-pulse rounded-xl border border-dashed bg-muted/30" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Complétude */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-kaza-blue" />
              <span className="text-sm font-medium">Complétude du profil</span>
            </div>
            <span className="font-heading text-xl font-bold text-kaza-navy tabular-nums">
              {completeness}%
            </span>
          </div>
          <Progress value={completeness} />
          <p className="mt-2 text-xs text-muted-foreground">
            Un profil complet augmente vos chances de match de 3x.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Accordion type="multiple" defaultValue={["base"]} className="w-full">
            {/* Section 1 — Profil de base */}
            <AccordionItem value="base">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <User className="size-4 text-kaza-blue" />
                  Profil de base
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Âge</Label>
                    <Input
                      id="age"
                      type="number"
                      min={16}
                      max={60}
                      placeholder="22"
                      value={profile.age}
                      onChange={(e) => update("age", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sexe</Label>
                    <Select
                      value={profile.gender}
                      onValueChange={(v) => update("gender", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="femme">Femme</SelectItem>
                        <SelectItem value="homme">Homme</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Discipline d&apos;étude</Label>
                    <Select
                      value={profile.discipline}
                      onValueChange={(v) => update("discipline", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir votre filière" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCIPLINES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">Université</Label>
                    <Input
                      id="university"
                      type="text"
                      placeholder="Nom de votre université"
                      value={profile.university}
                      onChange={(e) => update("university", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Année</Label>
                    <Select
                      value={profile.year}
                      onValueChange={(v) => update("year", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANNEES.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2 — Habitudes de vie */}
            <AccordionItem value="habits">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Heart className="size-4 text-kaza-blue" />
                  Habitudes de vie
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pt-2">
                <div className="space-y-2">
                  <Label>Rythme de sommeil</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "early", label: "Couche-tôt" },
                        { value: "late", label: "Couche-tard" },
                        { value: "flexible", label: "Flexible" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("sleepHabit", opt.value)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm transition-colors",
                          profile.sleepHabit === opt.value
                            ? "border-kaza-blue bg-kaza-blue text-white"
                            : "border-border bg-background hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SwitchRow
                    label="Fumeur"
                    checked={profile.smoker}
                    onChange={(v) => update("smoker", v)}
                  />
                  <SwitchRow
                    label="Sportif"
                    checked={profile.sportif}
                    onChange={(v) => update("sportif", v)}
                  />
                  <SwitchRow
                    label="Pratiquant religieux"
                    checked={profile.religieux}
                    onChange={(v) => update("religieux", v)}
                  />
                  <SwitchRow
                    label="Animaux de compagnie"
                    checked={profile.pets}
                    onChange={(v) => update("pets", v)}
                  />
                </div>

                <SliderRow
                  label="Niveau de bruit toléré"
                  value={profile.noiseTolerance}
                  onChange={(v) => update("noiseTolerance", v)}
                  hintLow="Silencieux"
                  hintHigh="Festif"
                />
                <SliderRow
                  label="Importance du ménage"
                  value={profile.cleanliness}
                  onChange={(v) => update("cleanliness", v)}
                  hintLow="Souple"
                  hintHigh="Impeccable"
                />
              </AccordionContent>
            </AccordionItem>

            {/* Section 3 — Préférences */}
            <AccordionItem value="prefs">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Users2 className="size-4 text-kaza-blue" />
                  Préférences colocataires
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Type de colocataire recherché</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { value: "mixte", label: "Mixte" },
                        { value: "femmes", label: "Uniquement femmes" },
                        { value: "hommes", label: "Uniquement hommes" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("preferredGender", opt.value)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm transition-colors",
                          profile.preferredGender === opt.value
                            ? "border-kaza-blue bg-kaza-blue text-white"
                            : "border-border bg-background hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="ageMin">Âge min.</Label>
                    <Input
                      id="ageMin"
                      type="number"
                      min={16}
                      value={profile.ageMin}
                      onChange={(e) => update("ageMin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageMax">Âge max.</Label>
                    <Input
                      id="ageMax"
                      type="number"
                      min={16}
                      value={profile.ageMax}
                      onChange={(e) => update("ageMax", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget max. (FCFA/mois)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min={0}
                      step={5000}
                      placeholder="80 000"
                      value={profile.budgetMax}
                      onChange={(e) => update("budgetMax", e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4 — À propos de moi */}
            <AccordionItem value="about">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Utensils className="size-4 text-kaza-blue" />
                  À propos de moi
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">Bio</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {profile.bio.length} / 500
                    </span>
                  </div>
                  <Textarea
                    id="bio"
                    rows={4}
                    maxLength={500}
                    placeholder="Présentez-vous en quelques lignes : ce que vous aimez, ce que vous recherchez en colocation…"
                    value={profile.bio}
                    onChange={(e) => update("bio", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hobbies (3 max)</Label>
                  <div className="flex flex-wrap gap-2">
                    {HOBBIES_SUGGESTIONS.map((h) => {
                      const active = profile.hobbies.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHobby(h)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            active
                              ? "border-kaza-blue bg-kaza-blue text-white"
                              : "border-border bg-background hover:bg-muted"
                          )}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Habitudes alimentaires (3 max)</Label>
                  <div className="flex flex-wrap gap-2">
                    {FOOD_HABITS.map((f) => {
                      const active = profile.foodHabits.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => toggleFood(f)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            active
                              ? "border-kaza-green bg-kaza-green text-white"
                              : "border-border bg-background hover:bg-muted"
                          )}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5 — Photos */}
            <AccordionItem value="photos">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <Camera className="size-4 text-kaza-blue" />
                  Photos
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-3">
                  <PhotoSlot
                    label="Photo de profil"
                    filled={profile.hasAvatar}
                    onToggle={handleAvatarMock}
                  />
                  {[0, 1].map((i) => (
                    <PhotoSlot
                      key={i}
                      label={`Lifestyle ${i + 1}`}
                      filled={profile.lifestylePhotos > i}
                      onToggle={handleLifestyleMock}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload mock pour le MVP — le stockage Supabase sera branché en V1.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Aperçu tags */}
      {(profile.hobbies.length > 0 || profile.foodHabits.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-2 text-sm font-medium">Aperçu de votre profil</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.hobbies.map((h) => (
                <Badge key={h} variant="secondary">
                  {h}
                </Badge>
              ))}
              {profile.foodHabits.map((f) => (
                <Badge
                  key={f}
                  className="bg-kaza-green/10 text-kaza-green hover:bg-kaza-green/15"
                >
                  {f}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 size-4" />
          Enregistrer mon profil
        </Button>
      </div>
    </div>
  );
}

// --- helpers ----------------------------------------------------------------

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  hintLow,
  hintHigh,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hintLow: string;
  hintHigh: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="rounded-full bg-kaza-blue/10 px-2 py-0.5 text-xs font-semibold text-kaza-blue tabular-nums">
          {value} / 5
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-kaza-blue"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{hintLow}</span>
        <span>{hintHigh}</span>
      </div>
    </div>
  );
}

function PhotoSlot({
  label,
  filled,
  onToggle,
}: {
  label: string;
  filled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition-colors",
        filled
          ? "border-kaza-green bg-kaza-green/5 text-kaza-green"
          : "border-border bg-muted/20 text-muted-foreground hover:border-kaza-blue hover:text-kaza-blue"
      )}
    >
      <Camera className="size-6" />
      <span className="font-medium">{label}</span>
      <span className="text-xs">{filled ? "Ajoutée ✓" : "Cliquer pour ajouter"}</span>
    </button>
  );
}
