"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Sparkles,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
import {
  SEED_SURVEYS,
  getCompletedSurveys,
  getPendingSurveys,
  submitSurvey,
  type PendingSurvey,
  type SurveyAnswer,
  type SurveyQuestion,
  type SurveyTrigger,
} from "@/lib/demo-surveys";

interface SurveysClientProps {
  userFirstName: string;
}

const POINTS_PER_SURVEY = 25;

const TRIGGER_LABELS: Record<SurveyTrigger, string> = {
  after_visit: "Apres une visite",
  after_first_month: "1 mois apres emmenagement",
  after_contract_sign: "Apres signature de contrat",
  after_payment: "Apres un paiement",
  monthly_nps: "Satisfaction trimestrielle",
};

const TRIGGER_TONES: Record<SurveyTrigger, string> = {
  after_visit: "bg-blue-50 text-blue-700 border-blue-200",
  after_first_month: "bg-violet-50 text-violet-700 border-violet-200",
  after_contract_sign: "bg-amber-50 text-amber-700 border-amber-200",
  after_payment: "bg-emerald-50 text-emerald-700 border-emerald-200",
  monthly_nps: "bg-rose-50 text-rose-700 border-rose-200",
};

export function SurveysClient({ userFirstName }: SurveysClientProps) {
  const [pending, setPending] = useState<PendingSurvey[]>(() => SEED_SURVEYS);
  const [completed, setCompleted] = useState<SurveyAnswer[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState<PendingSurvey | null>(null);

  useEffect(() => {
    setPending(getPendingSurveys());
    setCompleted(getCompletedSurveys());
    setHydrated(true);
  }, []);

  const refresh = () => {
    setPending(getPendingSurveys());
    setCompleted(getCompletedSurveys());
  };

  const totalEarnable = pending.length * POINTS_PER_SURVEY;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#1976D2]">
          Bonjour {userFirstName}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#1A3A52]">
          Vos avis comptent
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Votre retour nous aide a ameliorer KAZA chaque jour. Chaque sondage
          complete vous rapporte{" "}
          <span className="font-semibold text-[#4CAF50]">
            +{POINTS_PER_SURVEY} points
          </span>
          .
        </p>
      </div>

      {/* Pending */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1A3A52]">
            <ClipboardList className="size-5 text-[#1976D2]" aria-hidden />A
            completer
            <Badge variant="secondary" className="ml-1">
              {pending.length}
            </Badge>
          </h2>
          {totalEarnable > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalEarnable} points a gagner
            </p>
          )}
        </div>

        {pending.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="size-10 text-emerald-500" aria-hidden />
              <p className="font-medium text-[#1A3A52]">
                Aucun sondage en attente
              </p>
              <p className="text-sm text-muted-foreground">
                Vous etes a jour. Merci pour vos contributions !
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((s) => (
              <Card key={s.id} className="border-[#1A3A52]/10">
                <CardHeader className="pb-3">
                  <Badge
                    variant="outline"
                    className={cn("w-fit text-xs", TRIGGER_TONES[s.trigger])}
                  >
                    {TRIGGER_LABELS[s.trigger]}
                  </Badge>
                  <CardTitle className="mt-2 text-base text-[#1A3A52]">
                    {s.title}
                  </CardTitle>
                  <CardDescription>{s.contextLabel}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  <div className="text-xs text-muted-foreground">
                    {s.questions.length} question
                    {s.questions.length > 1 ? "s" : ""} ·{" "}
                    <span className="font-medium text-[#4CAF50]">
                      +{POINTS_PER_SURVEY} pts
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveSurvey(s)}
                    disabled={!hydrated}
                    className="bg-[#1976D2] hover:bg-[#1565C0]"
                  >
                    Repondre
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1A3A52]">
          <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
          Completes
          <Badge variant="secondary" className="ml-1">
            {completed.length}
          </Badge>
        </h2>

        {completed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Vos sondages completes apparaitront ici.
          </p>
        ) : (
          <div className="space-y-2">
            {completed
              .slice()
              .reverse()
              .map((c) => {
                const def = SEED_SURVEYS.find((s) => s.id === c.surveyId);
                return (
                  <Card key={c.surveyId} className="border-emerald-100">
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#1A3A52]">
                          {def?.title ?? c.surveyId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {def?.contextLabel ?? "Sondage"} ·{" "}
                          {new Date(c.completedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <Sparkles className="mr-1 size-3" aria-hidden />+
                        {POINTS_PER_SURVEY} pts
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </section>

      {/* Dialog runner */}
      <SurveyRunner
        survey={activeSurvey}
        onClose={() => setActiveSurvey(null)}
        onSubmit={(answers) => {
          if (!activeSurvey) return;
          submitSurvey({
            surveyId: activeSurvey.id,
            answers,
            completedAt: new Date().toISOString(),
          });
          toast.success(
            `Merci ! Vos reponses ont ete enregistrees. +${POINTS_PER_SURVEY} points`,
          );
          refresh();
          setActiveSurvey(null);
        }}
      />
    </div>
  );
}

// =============================================================================
// Runner inline (Dialog)
// =============================================================================

interface SurveyRunnerProps {
  survey: PendingSurvey | null;
  onClose: () => void;
  onSubmit: (answers: Record<string, string | number>) => void;
}

function SurveyRunner({ survey, onClose, onSubmit }: SurveyRunnerProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  // Reset state quand on change de sondage
  useEffect(() => {
    setStep(0);
    setAnswers({});
  }, [survey?.id]);

  const total = survey?.questions.length ?? 0;
  const question = survey?.questions[step];
  const isLast = step === total - 1;
  const progressPct = useMemo(
    () => (total === 0 ? 0 : Math.round(((step + 1) / total) * 100)),
    [step, total],
  );

  const canProceed = useMemo(() => {
    if (!question) return false;
    if (!question.required) return true;
    const v = answers[question.id];
    if (question.type === "text") return typeof v === "string" && v.trim().length > 0;
    return v !== undefined && v !== "";
  }, [question, answers]);

  const handleNext = () => {
    if (!survey) return;
    if (isLast) {
      onSubmit(answers);
      return;
    }
    setStep((s) => Math.min(s + 1, total - 1));
  };

  const handlePrev = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <Dialog
      open={Boolean(survey)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        {survey && question ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[#1A3A52]">
                {survey.title}
              </DialogTitle>
              <DialogDescription>{survey.contextLabel}</DialogDescription>
            </DialogHeader>

            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Question {step + 1} sur {total}
                </span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>

            <div className="space-y-4 py-4">
              <p className="text-sm font-medium text-[#1A3A52]">
                {question.question}
                {question.required && (
                  <span className="ml-1 text-rose-500" aria-label="requis">
                    *
                  </span>
                )}
              </p>

              <QuestionInput
                question={question}
                value={answers[question.id]}
                onChange={(v) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: v }))
                }
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrev}
                disabled={step === 0}
              >
                Precedent
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed}
                className={cn(
                  isLast
                    ? "bg-[#4CAF50] hover:bg-[#43A047]"
                    : "bg-[#1976D2] hover:bg-[#1565C0]",
                )}
              >
                {isLast ? "Soumettre" : "Suivant"}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface QuestionInputProps {
  question: SurveyQuestion;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  if (question.type === "rating") {
    const scale = question.scale ?? 5;
    if (scale <= 5) {
      return (
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label={question.question}
        >
          {Array.from({ length: scale }).map((_, i) => {
            const n = i + 1;
            const active = typeof value === "number" && value >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${n} etoile${n > 1 ? "s" : ""}`}
                onClick={() => onChange(n)}
                className="rounded p-1 transition hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-9",
                    active
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-slate-300",
                  )}
                  strokeWidth={1.5}
                />
              </button>
            );
          })}
        </div>
      );
    }
    // Scale > 5 : grille numerique (NPS 1..10)
    return (
      <div
        className="grid grid-cols-5 gap-2 sm:grid-cols-10"
        role="radiogroup"
        aria-label={question.question}
      >
        {Array.from({ length: scale }).map((_, i) => {
          const n = i + 1;
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              className={cn(
                "rounded-md border py-2 text-sm font-medium transition",
                active
                  ? "border-[#1976D2] bg-[#1976D2] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#1976D2]/40",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "choice") {
    return (
      <div className="space-y-2" role="radiogroup" aria-label={question.question}>
        {(question.options ?? []).map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition",
                active
                  ? "border-[#1976D2] bg-[#1976D2]/5 text-[#1A3A52]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#1976D2]/40",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-[#1976D2]" : "border-slate-300",
                )}
              >
                {active && (
                  <span className="size-2 rounded-full bg-[#1976D2]" />
                )}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  // text
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Votre reponse..."
        rows={4}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <MessageCircle className="size-3" aria-hidden />
        Vos commentaires restent confidentiels.
      </p>
    </div>
  );
}
