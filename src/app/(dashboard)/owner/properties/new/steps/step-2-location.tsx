"use client";

import { Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyWizardValues } from "../new-property-form";

export const step2Schema = z.object({
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caracteres")
    .max(255, "Trop long"),
  city: z.enum(
    ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Bohicon", "Autre"],
    { message: "Veuillez selectionner une ville" }
  ),
  neighborhood: z
    .string()
    .min(2, "Le quartier doit contenir au moins 2 caracteres")
    .max(100, "Trop long"),
  country: z.enum(["Benin", "Togo", "Cote d'Ivoire", "Senegal"], {
    message: "Veuillez selectionner un pays",
  }),
});

const CITY_OPTIONS = [
  "Cotonou",
  "Porto-Novo",
  "Parakou",
  "Abomey-Calavi",
  "Bohicon",
  "Autre",
];

const COUNTRY_OPTIONS = ["Benin", "Togo", "Cote d'Ivoire", "Senegal"];

export function Step2Location() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<PropertyWizardValues>();

  const city = watch("city");
  const country = watch("country");

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="address">
          Adresse <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          placeholder="Ex: Rue 142, Carre 318, Fidjrosse"
          className="mt-1.5"
          {...register("address")}
        />
        {errors.address && (
          <p className="mt-1 text-xs text-destructive">
            {errors.address.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">
            Ville <span className="text-destructive">*</span>
          </Label>
          <Select
            value={city ?? ""}
            onValueChange={(value) =>
              setValue("city", value as PropertyWizardValues["city"], {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger id="city" className="mt-1.5 w-full">
              <SelectValue placeholder="Selectionner une ville" />
            </SelectTrigger>
            <SelectContent>
              {CITY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country">
            Pays <span className="text-destructive">*</span>
          </Label>
          <Select
            value={country ?? "Benin"}
            onValueChange={(value) =>
              setValue("country", value as PropertyWizardValues["country"], {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger id="country" className="mt-1.5 w-full">
              <SelectValue placeholder="Selectionner un pays" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="mt-1 text-xs text-destructive">
              {errors.country.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="neighborhood">
          Quartier <span className="text-destructive">*</span>
        </Label>
        <Input
          id="neighborhood"
          placeholder="Ex: Fidjrosse Plage, Haie Vive, Cadjehoun..."
          className="mt-1.5"
          {...register("neighborhood")}
        />
        {errors.neighborhood && (
          <p className="mt-1 text-xs text-destructive">
            {errors.neighborhood.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-kaza-blue/20 bg-kaza-blue/5 p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-kaza-blue" />
        <p className="text-sm text-foreground">
          La carte precise sera confirmee a la prochaine etape de moderation.
        </p>
      </div>
    </div>
  );
}
