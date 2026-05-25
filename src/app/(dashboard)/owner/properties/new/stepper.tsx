"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDefinition {
  number: number;
  label: string;
}

interface StepperProps {
  steps: StepDefinition[];
  currentStep: number;
  /** Etape la plus avancee jamais atteinte. Sert a borner la nav cliquable. */
  maxReachedStep: number;
  onStepClick: (step: number) => void;
}

export function Stepper({
  steps,
  currentStep,
  maxReachedStep,
  onStepClick,
}: StepperProps) {
  const total = steps.length;
  const activeStep = steps.find((s) => s.number === currentStep);
  const progressPercent = Math.round((currentStep / total) * 100);

  return (
    <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:mx-0 sm:rounded-xl sm:border sm:bg-card sm:px-6 sm:py-4 sm:shadow-sm">
      {/* Vue mobile : numero + label + barre de progression */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-kaza-blue text-xs font-semibold text-white">
              {currentStep}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activeStep?.label}
              </p>
              <p className="text-xs text-muted-foreground">
                Etape {currentStep} sur {total}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-kaza-blue transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Vue desktop : tous les steps */}
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isClickable = step.number <= maxReachedStep && !isActive;

          return (
            <li key={step.number} className="flex flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable && !isActive}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors",
                  isClickable && "cursor-pointer hover:bg-muted",
                  !isClickable && !isActive && "cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isActive && "bg-kaza-blue text-white shadow-sm",
                    isCompleted && "bg-kaza-green text-white",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="size-4" /> : step.number}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    isActive && "font-semibold text-foreground",
                    isCompleted && "font-medium text-foreground",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors",
                    step.number < currentStep ? "bg-kaza-green" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
