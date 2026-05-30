"use client";

// =============================================================================
// KAZA — Admin / Nouvelle offre d'emploi
// Formulaire client (react-hook-form + Zod). Submit → server action
// `createJobOffer` puis redirect vers /admin/careers en cas de succès.
// =============================================================================

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { createJobOffer } from "@/actions/careers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";

const CONTRACTS = ["CDI", "CDD", "STAGE", "FREELANCE", "ALTERNANCE"] as const;

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères.")
    .max(120, "Le titre ne peut pas dépasser 120 caractères."),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug invalide : uniquement lettres minuscules, chiffres et tirets.",
    ),
  department: z.string().min(2, "Le département est obligatoire."),
  location: z.string().min(2, "La localisation est obligatoire."),
  contract: z.enum(CONTRACTS),
  level: z.string().optional(),
  summary: z
    .string()
    .min(20, "Le résumé doit contenir au moins 20 caractères.")
    .max(500, "Le résumé ne peut pas dépasser 500 caractères."),
  description: z
    .string()
    .min(50, "La description doit contenir au moins 50 caractères."),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salary_range: z.string().optional(),
  apply_email: z.string().email("Adresse email invalide."),
});

type FormValues = z.infer<typeof formSchema>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function NewCareerOfferPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      department: "",
      location: "",
      contract: "CDI",
      level: "",
      summary: "",
      description: "",
      requirements: "",
      benefits: "",
      salary_range: "",
      apply_email: "careers@kaza.africa",
    },
  });

  const titleValue = watch("title");
  const contractValue = watch("contract");
  const summaryValue = watch("summary");

  // Auto-génère le slug depuis le titre tant que l'utilisateur ne l'a pas
  // édité manuellement.
  useEffect(() => {
    if (!slugTouched) {
      setValue("slug", slugify(titleValue ?? ""), { shouldValidate: false });
    }
  }, [titleValue, slugTouched, setValue]);

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await createJobOffer({
        ...values,
        level: values.level || undefined,
        requirements: values.requirements || undefined,
        benefits: values.benefits || undefined,
        salary_range: values.salary_range || undefined,
      });
      if (result.success) {
        toast.success("Offre créée. Elle est en brouillon.");
        router.push("/admin/careers");
        router.refresh();
      } else {
        toast.error(result.error ?? "Impossible de créer l'offre.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground hover:text-kaza-navy"
        >
          <Link href="/admin/careers">
            <ArrowLeft className="mr-1 size-4" />
            Retour à la liste
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Nouvelle offre d&apos;emploi
        </h1>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de l&apos;offre. Elle sera enregistrée en
          brouillon et publiée d&apos;un seul clic depuis la liste.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre du poste *</Label>
              <Input
                id="title"
                placeholder="ex. Senior Frontend Engineer"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                placeholder="senior-frontend-engineer"
                {...register("slug")}
                onChange={(e) => {
                  setSlugTouched(true);
                  setValue("slug", e.target.value, { shouldValidate: true });
                }}
              />
              <p className="text-xs text-muted-foreground">
                Apparaîtra dans l&apos;URL :
                <span className="ml-1 font-mono">/carrieres/{watch("slug") || "..."}</span>
              </p>
              {errors.slug && (
                <p className="text-xs text-red-600">{errors.slug.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Département *</Label>
                <Input
                  id="department"
                  placeholder="Engineering, Marketing, Ops..."
                  {...register("department")}
                />
                {errors.department && (
                  <p className="text-xs text-red-600">
                    {errors.department.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation *</Label>
                <Input
                  id="location"
                  placeholder="Cotonou / Remote"
                  {...register("location")}
                />
                {errors.location && (
                  <p className="text-xs text-red-600">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contract">Type de contrat *</Label>
                <Select
                  value={contractValue}
                  onValueChange={(v) =>
                    setValue("contract", v as FormValues["contract"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="contract">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACTS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Niveau (optionnel)</Label>
                <Input
                  id="level"
                  placeholder="Junior, Mid, Senior, Lead..."
                  {...register("level")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_range">Fourchette salariale (optionnel)</Label>
              <Input
                id="salary_range"
                placeholder="800k - 1.2M FCFA / mois"
                {...register("salary_range")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apply_email">Email de candidature *</Label>
              <Input
                id="apply_email"
                type="email"
                placeholder="careers@kaza.africa"
                {...register("apply_email")}
              />
              {errors.apply_email && (
                <p className="text-xs text-red-600">
                  {errors.apply_email.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contenu de l&apos;offre</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Résumé (1-2 phrases) *</Label>
              <Textarea
                id="summary"
                rows={3}
                placeholder="Vous architecturez et faites évoluer notre application..."
                {...register("summary")}
              />
              <div className="flex items-center justify-between">
                {errors.summary ? (
                  <p className="text-xs text-red-600">
                    {errors.summary.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground">
                  {(summaryValue ?? "").length}/500
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description complète (markdown) *</Label>
              <Textarea
                id="description"
                rows={10}
                placeholder={"## À propos du poste\n\nVous rejoignez..."}
                className="font-mono text-sm"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Profil recherché (markdown, optionnel)</Label>
              <Textarea
                id="requirements"
                rows={6}
                placeholder={"- 5+ ans d'expérience\n- Maîtrise de TypeScript"}
                className="font-mono text-sm"
                {...register("requirements")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Avantages (markdown, optionnel)</Label>
              <Textarea
                id="benefits"
                rows={6}
                placeholder={"- BSPCE pour tous\n- Remote-first"}
                className="font-mono text-sm"
                {...register("benefits")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" disabled={isPending}>
            <Link href="/admin/careers">Annuler</Link>
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-kaza-navy text-white hover:bg-kaza-navy/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Créer l&apos;offre
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
