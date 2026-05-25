"use client";

import { useFormContext } from "react-hook-form";
import { z } from "zod";
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
import { formatPrice } from "@/lib/utils";
import type { PropertyWizardValues } from "../new-property-form";

export const step4Schema = z.object({
  price: z
    .number({ message: "Le prix est requis" })
    .min(5000, "Le prix minimum est de 5 000 FCFA")
    .max(10_000_000, "Le prix ne peut pas depasser 10 000 000 FCFA"),
  price_period: z.enum(["MONTHLY", "WEEKLY", "DAILY"], {
    message: "Selectionnez une periode",
  }),
  deposit_months: z
    .number({ message: "La caution est requise" })
    .int("Doit etre un nombre entier")
    .min(0, "Ne peut pas etre negatif")
    .max(6, "Maximum 6 mois"),
  available_from: z
    .string()
    .min(1, "La date de disponibilite est requise"),
  min_rental_duration_months: z
    .number({ message: "La duree minimale est requise" })
    .int("Doit etre un nombre entier")
    .min(1, "Minimum 1 mois")
    .max(36, "Maximum 36 mois"),
});

const PERIOD_LABELS: Record<string, string> = {
  MONTHLY: "par mois",
  WEEKLY: "par semaine",
  DAILY: "par jour",
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "Maison",
  APARTMENT: "Appartement",
  STUDIO: "Studio",
  ROOM: "Chambre",
  VILLA: "Villa",
  OFFICE: "Bureau",
};

export function Step4PricingAvailability() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PropertyWizardValues>();

  const values = watch();
  const price = values.price;
  const pricePeriod = values.price_period;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">
            Prix (FCFA) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            placeholder="150000"
            min={5000}
            className="mt-1.5"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="mt-1 text-xs text-destructive">
              {errors.price.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="price_period">
            Periode <span className="text-destructive">*</span>
          </Label>
          <Select
            value={pricePeriod ?? "MONTHLY"}
            onValueChange={(value) =>
              setValue(
                "price_period",
                value as PropertyWizardValues["price_period"],
                { shouldValidate: true, shouldDirty: true }
              )
            }
          >
            <SelectTrigger id="price_period" className="mt-1.5 w-full">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Mensuel</SelectItem>
              <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
              <SelectItem value="DAILY">Journalier</SelectItem>
            </SelectContent>
          </Select>
          {errors.price_period && (
            <p className="mt-1 text-xs text-destructive">
              {errors.price_period.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="deposit_months">
          Caution en mois de loyer <span className="text-destructive">*</span>
        </Label>
        <Input
          id="deposit_months"
          type="number"
          inputMode="numeric"
          placeholder="2"
          min={0}
          max={6}
          className="mt-1.5 max-w-[200px]"
          {...register("deposit_months", { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Combien de mois de loyer demandez-vous en caution ? (max 6)
        </p>
        {errors.deposit_months && (
          <p className="mt-1 text-xs text-destructive">
            {errors.deposit_months.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="available_from">
            Disponible a partir du <span className="text-destructive">*</span>
          </Label>
          <Input
            id="available_from"
            type="date"
            className="mt-1.5"
            {...register("available_from")}
          />
          {errors.available_from && (
            <p className="mt-1 text-xs text-destructive">
              {errors.available_from.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="min_rental_duration_months">
            Duree minimale (mois){" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="min_rental_duration_months"
            type="number"
            inputMode="numeric"
            placeholder="12"
            min={1}
            max={36}
            className="mt-1.5"
            {...register("min_rental_duration_months", { valueAsNumber: true })}
          />
          {errors.min_rental_duration_months && (
            <p className="mt-1 text-xs text-destructive">
              {errors.min_rental_duration_months.message}
            </p>
          )}
        </div>
      </div>

      {/* Recapitulatif */}
      <Card className="border-kaza-blue/20 bg-kaza-blue/5">
        <CardHeader>
          <CardTitle className="text-base">Recapitulatif de l&apos;annonce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <RecapRow label="Titre" value={values.title} />
          <RecapRow
            label="Type"
            value={
              values.property_type
                ? PROPERTY_TYPE_LABELS[values.property_type]
                : undefined
            }
          />
          <RecapRow
            label="Caracteristiques"
            value={
              values.bedrooms !== undefined &&
              values.bathrooms !== undefined &&
              values.square_meters !== undefined
                ? `${values.bedrooms} ch. · ${values.bathrooms} sdb · ${values.square_meters} m²`
                : undefined
            }
          />
          <RecapRow
            label="Localisation"
            value={
              values.neighborhood && values.city
                ? `${values.neighborhood}, ${values.city}${values.country ? `, ${values.country}` : ""}`
                : undefined
            }
          />
          <RecapRow
            label="Equipements"
            value={
              values.amenities && values.amenities.length > 0
                ? `${values.amenities.length} selectionne${values.amenities.length > 1 ? "s" : ""}`
                : undefined
            }
          />
          <RecapRow
            label="Photos"
            value={
              values.photos && values.photos.length > 0
                ? `${values.photos.length} photo${values.photos.length > 1 ? "s" : ""}`
                : undefined
            }
          />
          <RecapRow
            label="Prix"
            value={
              price && pricePeriod
                ? `${formatPrice(price)} ${PERIOD_LABELS[pricePeriod]}`
                : undefined
            }
          />
          <RecapRow
            label="Caution"
            value={
              values.deposit_months !== undefined
                ? `${values.deposit_months} mois de loyer`
                : undefined
            }
          />
          <RecapRow
            label="Duree minimale"
            value={
              values.min_rental_duration_months
                ? `${values.min_rental_duration_months} mois`
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function RecapRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">
        {value ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}
