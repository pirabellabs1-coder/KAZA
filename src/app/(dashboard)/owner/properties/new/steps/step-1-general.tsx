"use client";

import { useFormContext } from "react-hook-form";
import { z } from "zod";
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
import type { PropertyWizardValues } from "../new-property-form";

// Schema dedie a l'etape 1 — verifie avant passage a l'etape suivante.
export const step1Schema = z.object({
  title: z
    .string()
    .min(5, "Le titre doit contenir au moins 5 caracteres")
    .max(100, "Le titre ne peut pas depasser 100 caracteres"),
  description: z
    .string()
    .min(50, "La description doit contenir au moins 50 caracteres")
    .max(2000, "La description ne peut pas depasser 2000 caracteres"),
  property_type: z.enum(
    ["HOUSE", "APARTMENT", "STUDIO", "ROOM", "VILLA", "OFFICE"],
    { message: "Veuillez selectionner un type de bien" }
  ),
  bedrooms: z
    .number({ message: "Le nombre de chambres est requis" })
    .int("Doit etre un nombre entier")
    .min(0, "Ne peut pas etre negatif")
    .max(20, "Maximum 20"),
  bathrooms: z
    .number({ message: "Le nombre de salles de bain est requis" })
    .int("Doit etre un nombre entier")
    .min(1, "Au moins 1 salle de bain")
    .max(10, "Maximum 10"),
  square_meters: z
    .number({ message: "La superficie est requise" })
    .min(10, "Minimum 10 m2")
    .max(1000, "Maximum 1000 m2"),
});

const PROPERTY_TYPE_OPTIONS = [
  { value: "HOUSE", label: "Maison" },
  { value: "APARTMENT", label: "Appartement" },
  { value: "STUDIO", label: "Studio" },
  { value: "ROOM", label: "Chambre" },
  { value: "VILLA", label: "Villa" },
  { value: "OFFICE", label: "Bureau" },
];

export function Step1General() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<PropertyWizardValues>();

  const propertyType = watch("property_type");

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="title">
          Titre de l&apos;annonce <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Ex: Bel appartement meuble a Fidjrosse"
          className="mt-1.5"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Decrivez votre bien en detail : etat, voisinage, commodites a proximite..."
          className="mt-1.5 min-h-[140px]"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="property_type">
            Type de bien <span className="text-destructive">*</span>
          </Label>
          <Select
            value={propertyType ?? ""}
            onValueChange={(value) =>
              setValue(
                "property_type",
                value as PropertyWizardValues["property_type"],
                { shouldValidate: true, shouldDirty: true }
              )
            }
          >
            <SelectTrigger id="property_type" className="mt-1.5 w-full">
              <SelectValue placeholder="Selectionner" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.property_type && (
            <p className="mt-1 text-xs text-destructive">
              {errors.property_type.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="square_meters">
            Superficie (m<sup>2</sup>){" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="square_meters"
            type="number"
            inputMode="numeric"
            placeholder="75"
            min={10}
            max={1000}
            className="mt-1.5"
            {...register("square_meters", { valueAsNumber: true })}
          />
          {errors.square_meters && (
            <p className="mt-1 text-xs text-destructive">
              {errors.square_meters.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bedrooms">
            Nombre de chambres <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bedrooms"
            type="number"
            inputMode="numeric"
            placeholder="2"
            min={0}
            max={20}
            className="mt-1.5"
            {...register("bedrooms", { valueAsNumber: true })}
          />
          {errors.bedrooms && (
            <p className="mt-1 text-xs text-destructive">
              {errors.bedrooms.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="bathrooms">
            Salles de bain <span className="text-destructive">*</span>
          </Label>
          <Input
            id="bathrooms"
            type="number"
            inputMode="numeric"
            placeholder="1"
            min={1}
            max={10}
            className="mt-1.5"
            {...register("bathrooms", { valueAsNumber: true })}
          />
          {errors.bathrooms && (
            <p className="mt-1 text-xs text-destructive">
              {errors.bathrooms.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
