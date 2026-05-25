"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Trash2, X } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePropertyDraft } from "@/hooks/use-property-draft";

import { Stepper, type StepDefinition } from "./stepper";
import { Step1General, step1Schema } from "./steps/step-1-general";
import { Step2Location, step2Schema } from "./steps/step-2-location";
import {
  Step3AmenitiesPhotos,
  step3Schema,
} from "./steps/step-3-amenities-photos";
import {
  Step4PricingAvailability,
  step4Schema,
} from "./steps/step-4-pricing-availability";

// TODO Aminata: hook server action — l'import ci-dessous est commente tant
// que `@/actions/properties` n'existe pas (en cours de creation par Aminata).
// import { createProperty } from "@/actions/properties";

// ---------------------------------------------------------------------------
// Schema global du wizard — union des 4 etapes.
// ---------------------------------------------------------------------------

export const propertyWizardSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

export type PropertyWizardValues = z.infer<typeof propertyWizardSchema>;

// Defaults utilises au montage et au reset apres publication.
const DEFAULT_VALUES: Partial<PropertyWizardValues> = {
  title: "",
  description: "",
  property_type: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  square_meters: undefined,
  address: "",
  city: undefined,
  neighborhood: "",
  country: "Benin",
  amenities: [],
  photos: [],
  price: undefined,
  price_period: "MONTHLY",
  deposit_months: undefined,
  available_from: "",
  min_rental_duration_months: undefined,
};

// Liste des cles validees par etape — utilise par form.trigger().
const STEP_FIELD_KEYS: Record<number, (keyof PropertyWizardValues)[]> = {
  1: [
    "title",
    "description",
    "property_type",
    "bedrooms",
    "bathrooms",
    "square_meters",
  ],
  2: ["address", "city", "neighborhood", "country"],
  3: ["amenities", "photos"],
  4: [
    "price",
    "price_period",
    "deposit_months",
    "available_from",
    "min_rental_duration_months",
  ],
};

const STEPS: StepDefinition[] = [
  { number: 1, label: "Infos generales" },
  { number: 2, label: "Localisation" },
  { number: 3, label: "Equipements & photos" },
  { number: 4, label: "Prix & disponibilite" },
];

// ---------------------------------------------------------------------------
// Toast minimal (pas de lib de toast installee — UI legere inline).
// ---------------------------------------------------------------------------

type ToastVariant = "info" | "success" | "error";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed left-1/2 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
        toast.variant === "info" &&
          "border-kaza-blue/30 bg-kaza-blue/10 text-foreground",
        toast.variant === "success" &&
          "border-kaza-green/30 bg-kaza-green/10 text-foreground",
        toast.variant === "error" &&
          "border-destructive/30 bg-destructive/10 text-foreground"
      )}
    >
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Fermer"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function NewPropertyForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const {
    loadDraft,
    saveDraft,
    clearDraft,
    hasRestoredDraft,
    acknowledgeRestore,
  } = usePropertyDraft();

  const form = useForm<PropertyWizardValues>({
    defaultValues: DEFAULT_VALUES as PropertyWizardValues,
    mode: "onTouched",
  });

  // Restauration du brouillon au montage (hors photos).
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    for (const [key, value] of Object.entries(draft)) {
      if (key === "photos") continue;
      form.setValue(
        key as keyof PropertyWizardValues,
        value as never,
        { shouldDirty: false }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast quand le brouillon a ete detecte / restaure.
  useEffect(() => {
    if (hasRestoredDraft) {
      showToast("Brouillon restaure", "info");
      acknowledgeRestore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRestoredDraft]);

  // Sauvegarde automatique du brouillon a chaque changement de valeur.
  useEffect(() => {
    const subscription = form.watch((values) => {
      saveDraft(values as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  // Auto-dismiss du toast apres 3.5s.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function showToast(message: string, variant: ToastVariant = "info") {
    setToast({ id: Date.now(), message, variant });
  }

  async function goToNextStep() {
    const fields = STEP_FIELD_KEYS[currentStep];
    const isValid = await form.trigger(fields, { shouldFocus: true });
    if (!isValid) {
      showToast(
        "Veuillez corriger les erreurs avant de continuer",
        "error"
      );
      return;
    }
    const next = Math.min(currentStep + 1, STEPS.length);
    setCurrentStep(next);
    setMaxReachedStep((prev) => Math.max(prev, next));
  }

  function goToPrevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function handleStepClick(step: number) {
    // Recul autorise uniquement; saut en avant interdit (gere dans Stepper).
    if (step < currentStep) {
      setCurrentStep(step);
    }
  }

  function handleClearDraft() {
    clearDraft();
    form.reset(DEFAULT_VALUES as PropertyWizardValues);
    setCurrentStep(1);
    setMaxReachedStep(1);
    showToast("Brouillon efface", "info");
  }

  async function handleFinalSubmit() {
    const isValid = await form.trigger(STEP_FIELD_KEYS[4], {
      shouldFocus: true,
    });
    if (!isValid) {
      showToast("Veuillez completer les champs requis", "error");
      return;
    }

    const values = form.getValues();
    startSubmit(async () => {
      try {
        // TODO Aminata: hook server action — remplacer le placeholder par
        // un appel a `createProperty(values)` une fois l'action disponible.
        console.log("[NewPropertyForm] submit placeholder", values);
        await new Promise((r) => setTimeout(r, 600));

        clearDraft();
        form.reset(DEFAULT_VALUES as PropertyWizardValues);
        setCurrentStep(1);
        setMaxReachedStep(1);
        showToast("Annonce publiee avec succes", "success");
      } catch (error) {
        console.error("[NewPropertyForm] submit error", error);
        showToast("Une erreur est survenue. Reessayez.", "error");
      }
    });
  }

  return (
    <FormProvider {...form}>
      {toast && (
        <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
      )}

      <div className="space-y-6">
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          maxReachedStep={maxReachedStep}
          onStepClick={handleStepClick}
        />

        <form
          onSubmit={(e) => e.preventDefault()}
          className="rounded-xl border bg-card p-5 shadow-sm sm:p-6"
        >
          {currentStep === 1 && <Step1General />}
          {currentStep === 2 && <Step2Location />}
          {currentStep === 3 && <Step3AmenitiesPhotos />}
          {currentStep === 4 && <Step4PricingAvailability />}

          {/* Navigation */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {currentStep === 1 ? (
                <Button variant="outline" asChild>
                  <Link href="/owner/properties">
                    <ArrowLeft className="mr-1 size-4" />
                    Annuler
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPrevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-1 size-4" />
                  Precedent
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="bg-kaza-blue hover:bg-kaza-blue/90"
                >
                  Suivant
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="bg-kaza-green hover:bg-kaza-green/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    "Publier l'annonce"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Effacer brouillon */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearDraft}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Effacer brouillon
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}
