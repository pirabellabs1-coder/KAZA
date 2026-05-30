"use client";

// =============================================================================
// KAZA — Formulaire public : devenir partenaire
// react-hook-form + zod. À la soumission, appelle la server action
// `submitPartnerApplication` (persistance + emails) puis affiche un toast.
// =============================================================================

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send } from "lucide-react";

import { submitPartnerApplication } from "@/actions/partners";
import {
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
} from "@/lib/partners/constants";
import { COUNTRIES } from "@/lib/geo/locations";
import { Button } from "@/components/ui/button";
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

const formSchema = z.object({
  partnerType: z.enum(PARTNER_TYPES, {
    message: "Sélectionnez une catégorie",
  }),
  companyName: z
    .string()
    .min(2, "Nom de la société requis")
    .max(150, "150 caractères maximum"),
  contactName: z
    .string()
    .min(2, "Nom du contact requis")
    .max(120, "120 caractères maximum"),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .max(40, "40 caractères maximum")
    .optional()
    .or(z.literal("")),
  countryCode: z.string().min(2, "Sélectionnez un pays"),
  city: z
    .string()
    .min(2, "Ville requise")
    .max(120, "120 caractères maximum"),
  rccm: z.string().max(60, "60 caractères maximum").optional().or(z.literal("")),
  website: z
    .string()
    .max(255, "255 caractères maximum")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .min(20, "Décrivez votre activité en au moins 20 caractères")
    .max(2000, "2000 caractères maximum"),
});

type FormValues = z.infer<typeof formSchema>;

// Pays triés : prioritaires d'abord, puis ordre alphabétique.
const SORTED_COUNTRIES = [...COUNTRIES].sort(
  (a, b) => a.priority - b.priority || a.name.localeCompare(b.name, "fr"),
);

export function PartnerApplicationForm() {
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partnerType: undefined,
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      countryCode: "",
      city: "",
      rccm: "",
      website: "",
      description: "",
    },
  });

  const partnerType = watch("partnerType");
  const countryCode = watch("countryCode");

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const res = await submitPartnerApplication({
        partnerType: values.partnerType,
        companyName: values.companyName.trim(),
        contactName: values.contactName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || "",
        countryCode: values.countryCode,
        city: values.city.trim(),
        rccm: values.rccm?.trim() || "",
        website: values.website?.trim() || "",
        description: values.description.trim(),
      });

      if (res.success) {
        toast.success(
          "Votre candidature a bien été envoyée. Notre équipe vous recontactera.",
        );
        reset();
      } else {
        toast.error(
          res.error ??
            "Une erreur est survenue. Veuillez réessayer dans un instant.",
        );
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 text-left"
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Catégorie de partenaire */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="partner-type">Catégorie de partenaire</Label>
          <Select
            value={partnerType ?? ""}
            onValueChange={(v) =>
              setValue("partnerType", v as FormValues["partnerType"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="partner-type" className="w-full">
              <SelectValue placeholder="Sélectionnez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {PARTNER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {PARTNER_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.partnerType && (
            <p className="text-sm text-red-600">{errors.partnerType.message}</p>
          )}
        </div>

        {/* Société */}
        <div className="space-y-2">
          <Label htmlFor="company-name">Société / Organisation</Label>
          <Input
            id="company-name"
            placeholder="Ex : Étude notariale Sodjinou"
            {...register("companyName")}
          />
          {errors.companyName && (
            <p className="text-sm text-red-600">{errors.companyName.message}</p>
          )}
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <Label htmlFor="contact-name">Nom du contact</Label>
          <Input
            id="contact-name"
            placeholder="Prénom Nom"
            {...register("contactName")}
          />
          {errors.contactName && (
            <p className="text-sm text-red-600">{errors.contactName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email professionnel</Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@societe.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            Téléphone{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+229 ..."
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Pays */}
        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <Select
            value={countryCode}
            onValueChange={(v) =>
              setValue("countryCode", v, { shouldValidate: true })
            }
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Sélectionnez un pays" />
            </SelectTrigger>
            <SelectContent>
              {SORTED_COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.countryCode && (
            <p className="text-sm text-red-600">{errors.countryCode.message}</p>
          )}
        </div>

        {/* Ville */}
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" placeholder="Ex : Cotonou" {...register("city")} />
          {errors.city && (
            <p className="text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        {/* RCCM */}
        <div className="space-y-2">
          <Label htmlFor="rccm">
            RCCM{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="rccm"
            placeholder="Ex : RB/COT/24 B 1234"
            {...register("rccm")}
          />
          {errors.rccm && (
            <p className="text-sm text-red-600">{errors.rccm.message}</p>
          )}
        </div>

        {/* Site web */}
        <div className="space-y-2">
          <Label htmlFor="website">
            Site web{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="website"
            placeholder="https://www.societe.com"
            {...register("website")}
          />
          {errors.website && (
            <p className="text-sm text-red-600">{errors.website.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Présentez votre activité</Label>
          <Textarea
            id="description"
            rows={5}
            placeholder="Décrivez votre activité, vos services et ce que vous souhaitez apporter à l'écosystème KAZA."
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full rounded-full bg-kaza-green px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-kaza-green/90 sm:w-auto"
      >
        {pending ? (
          <Loader2 className="mr-2 size-5 animate-spin" />
        ) : (
          <Send className="mr-2 size-5" />
        )}
        Envoyer ma candidature
      </Button>
    </form>
  );
}
