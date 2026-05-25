"use client";

import { Check } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/image-upload";
import { cn } from "@/lib/utils";
import type { PropertyWizardValues } from "../new-property-form";

export const AMENITIES_OPTIONS = [
  "WiFi",
  "Climatisation",
  "Eau courante",
  "Electricite",
  "Parking",
  "Securite 24/7",
  "Gardien",
  "Meuble",
  "Cuisine equipee",
  "Machine a laver",
  "Piscine",
  "Jardin",
  "Balcon",
  "Ascenseur",
  "Internet fibre",
  "TV",
];

export const step3Schema = z.object({
  amenities: z
    .array(z.string())
    .min(1, "Selectionnez au moins un equipement"),
  // Les photos sont stockees en File[] cote client; on valide juste le compte.
  photos: z
    .array(z.any())
    .min(3, "Ajoutez au moins 3 photos")
    .max(10, "Maximum 10 photos"),
});

export function Step3AmenitiesPhotos() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PropertyWizardValues>();

  const amenities = watch("amenities") ?? [];
  const photos = watch("photos") ?? [];

  const toggleAmenity = (amenity: string) => {
    const next = amenities.includes(amenity)
      ? amenities.filter((a) => a !== amenity)
      : [...amenities, amenity];
    setValue("amenities", next, { shouldValidate: true, shouldDirty: true });
  };

  const handlePhotosChange = (files: File[]) => {
    setValue("photos", files, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3">
          <Label className="text-base">
            Equipements et commodites{" "}
            <span className="text-destructive">*</span>
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Selectionnez tout ce qui s&apos;applique a votre bien.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES_OPTIONS.map((amenity) => {
            const isSelected = amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                  isSelected
                    ? "border-kaza-blue bg-kaza-blue/5 text-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "border-kaza-blue bg-kaza-blue text-white"
                      : "border-input bg-background"
                  )}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="leading-tight">{amenity}</span>
              </button>
            );
          })}
        </div>

        {errors.amenities && (
          <p className="mt-2 text-xs text-destructive">
            {errors.amenities.message as string}
          </p>
        )}
      </section>

      <section>
        <div className="mb-3">
          <Label className="text-base">
            Photos du bien <span className="text-destructive">*</span>
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajoutez de 3 a 10 photos. La premiere image sera la photo principale.
          </p>
        </div>

        <ImageUpload maxImages={10} onImagesChange={handlePhotosChange} />

        <p className="mt-2 text-xs text-muted-foreground">
          {photos.length} / 10 photo{photos.length > 1 ? "s" : ""} ajoutee
          {photos.length > 1 ? "s" : ""}
        </p>

        {errors.photos && (
          <p className="mt-1 text-xs text-destructive">
            {errors.photos.message as string}
          </p>
        )}
      </section>
    </div>
  );
}
