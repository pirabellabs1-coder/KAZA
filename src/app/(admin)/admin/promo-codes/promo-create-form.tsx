"use client";

// =============================================================================
// KAZA — Admin / Création d'un code promo
// Formulaire client (react-hook-form + Zod). Submit → server action
// `createPromoCode`, toast + router.refresh en cas de succès.
// =============================================================================

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";

import { createPromoCode } from "@/actions/promo";
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

const DISCOUNT_TYPES = ["PERCENT", "FIXED"] as const;
const APPLIES_TO = ["ALL", "BOOST", "SUBSCRIPTION", "RESERVATION"] as const;

const SCOPE_LABELS: Record<(typeof APPLIES_TO)[number], string> = {
  ALL: "Tout (boost, abonnement, réservation)",
  BOOST: "Boost d'annonce",
  SUBSCRIPTION: "Abonnement",
  RESERVATION: "Réservation",
};

const formSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Le code doit contenir au moins 3 caractères.")
      .max(40, "Le code ne peut pas dépasser 40 caractères.")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Lettres, chiffres, tirets et underscores uniquement.",
      ),
    description: z.string().max(280).optional(),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.coerce
      .number()
      .positive("La valeur doit être positive."),
    appliesTo: z.enum(APPLIES_TO),
    maxUses: z.string().optional(),
    perUserLimit: z.coerce
      .number()
      .int()
      .min(1, "Au moins 1.")
      .default(1),
    validUntil: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.discountType === "PERCENT" && val.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "Un pourcentage ne peut pas dépasser 100 %.",
      });
    }
  });

type FormValues = z.input<typeof formSchema>;

export function PromoCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "PERCENT",
      discountValue: 10,
      appliesTo: "ALL",
      maxUses: "",
      perUserLimit: 1,
      validUntil: "",
    },
  });

  const discountType = watch("discountType");
  const appliesTo = watch("appliesTo");

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const maxUsesRaw = String(values.maxUses ?? "").trim();
      const result = await createPromoCode({
        code: values.code,
        description: values.description?.trim() || undefined,
        discountType: values.discountType,
        discountValue: values.discountValue,
        appliesTo: values.appliesTo,
        maxUses: maxUsesRaw === "" ? undefined : Number(maxUsesRaw),
        perUserLimit: values.perUserLimit,
        validUntil: values.validUntil?.trim() || undefined,
      });

      if (result.success) {
        toast.success("Code promo créé et actif.");
        reset();
        router.refresh();
      } else {
        toast.error(result.error ?? "Impossible de créer le code promo.");
      }
    });
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-base">Nouveau code promo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              placeholder="BIENVENUE10"
              className="font-mono uppercase"
              autoCapitalize="characters"
              {...register("code")}
              onChange={(e) =>
                setValue("code", e.target.value.toUpperCase(), {
                  shouldValidate: true,
                })
              }
            />
            {errors.code && (
              <p className="text-xs text-red-600">{errors.code.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Réduction de bienvenue pour les nouveaux locataires."
              {...register("description")}
            />
          </div>

          {/* Type + valeur */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="discountType">Type *</Label>
              <Select
                value={discountType}
                onValueChange={(v) =>
                  setValue("discountType", v as (typeof DISCOUNT_TYPES)[number], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Pourcentage</SelectItem>
                  <SelectItem value="FIXED">Montant fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                Valeur * {discountType === "PERCENT" ? "(%)" : "(FCFA)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min={1}
                step={discountType === "PERCENT" ? 1 : 100}
                {...register("discountValue")}
              />
              {errors.discountValue && (
                <p className="text-xs text-red-600">
                  {errors.discountValue.message}
                </p>
              )}
            </div>
          </div>

          {/* Périmètre */}
          <div className="space-y-2">
            <Label htmlFor="appliesTo">Périmètre *</Label>
            <Select
              value={appliesTo}
              onValueChange={(v) =>
                setValue("appliesTo", v as (typeof APPLIES_TO)[number], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="appliesTo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLIES_TO.map((scope) => (
                  <SelectItem key={scope} value={scope}>
                    {SCOPE_LABELS[scope]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quotas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Utilisations max</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                placeholder="illimité"
                {...register("maxUses")}
              />
              <p className="text-xs text-muted-foreground">Vide = illimité</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="perUserLimit">Par utilisateur *</Label>
              <Input
                id="perUserLimit"
                type="number"
                min={1}
                {...register("perUserLimit")}
              />
              {errors.perUserLimit && (
                <p className="text-xs text-red-600">
                  {errors.perUserLimit.message}
                </p>
              )}
            </div>
          </div>

          {/* Validité */}
          <div className="space-y-2">
            <Label htmlFor="validUntil">Valable jusqu&apos;au (optionnel)</Label>
            <Input id="validUntil" type="date" {...register("validUntil")} />
            <p className="text-xs text-muted-foreground">
              Vide = pas de date d&apos;expiration.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-kaza-navy text-white hover:bg-kaza-navy/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Créer le code
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
