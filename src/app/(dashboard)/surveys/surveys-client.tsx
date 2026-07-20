"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, Sparkles, Star } from "lucide-react";

import { submitSurveyResponse } from "@/actions/surveys";
import type {
  SurveyQuestion,
  SurveyWithStatus,
} from "@/lib/queries/surveys";
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

// =============================================================================
// Page Sondages — branchée sur les vraies données Supabase.
//   - `surveys` : liste des sondages actifs + statut "répondu" (server).
//   - Soumission via la Server Action `submitSurveyResponse`.
// =============================================================================

interface SurveysClientProps {
  userFirstName: string;
  surveys: SurveyWithStatus[];
}

const DEFAULT_SCALE_MIN = 1;
const DEFAULT_SCALE_MAX = 5;

export function SurveysClient({ userFirstName, surveys }: SurveysClientProps) {
  const router = useRouter();

  // State local initialisé depuis les props (pas de useEffect d'init). Il sert
  // uniquement à l'optimistic update après soumission ; `router.refresh()`
  // resynchronise ensuite depuis le serveur.
  const [items, setItems] = useState<SurveyWithStatus[]>(() => surveys);
  const [activeSurvey, setActiveSurvey] = useState<SurveyWithStatus | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const pending = useMemo(() => items.filter((s) => !s.answered), [items]);
  const completed = useMemo(() => items.filter((s) => s.answered), [items]);

  const totalEarnable = useMemo(
    () => pending.reduce((sum, s) => sum + s.rewardPoints, 0),
    [pending],
  );

  const handleSubmit = async (answers: Record<string, string | number>) => {
    if (!activeSurvey || submitting) return;
    const target = activeSurvey;
    setSubmitting(true);

    const result = await submitSurveyResponse({
      surveyId: target.id,
      answers,
    });

    if (!result.success) {
      toast.error(result.error ?? "Impossible d'enregistrer votre reponse.");
      setSubmitting(false);
      return;
    }

    const awarded = result.pointsAwarded ?? target.rewardPoints;
    toast.success(
      `Merci ! Vos reponses ont ete enregistrees.${
        awarded > 0 ? ` +${awarded} points` : ""
      }`,
    );

    // Optimistic update : marque le sondage comme répondu localement…
    const answeredAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((s) =>
        s.id === target.id ? { ...s, answered: true, answeredAt } : s,
      ),
    );
    setActiveSurvey(null);
    setSubmitting(false);

    // …puis resynchronise depuis le serveur.
    router.refresh();
  };

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
          Votre retour nous aide a ameliorer Kaabo chaque jour. Chaque sondage
          complete vous rapporte des{" "}
          <span className="font-semibold text-[#4CAF50]">Kaabo Points</span>.
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
                    className="w-fit border-blue-200 bg-blue-50 text-xs text-blue-700"
                  >
                    Sondage Kaabo
                  </Badge>
                  <CardTitle className="mt-2 text-base text-[#1A3A52]">
                    {s.title}
                  </CardTitle>
                  {s.description && (
                    <CardDescription>{s.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                  <div className="text-xs text-muted-foreground">
                    {s.questions.length} question
                    {s.questions.length > 1 ? "s" : ""}
                    {s.rewardPoints > 0 && (
                      <>
                        {" · "}
                        <span className="font-medium text-[#4CAF50]">
                          +{s.rewardPoints} pts
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveSurvey(s)}
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
            {completed.map((c) => (
              <Card key={c.id} className="border-emerald-100">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm font-medium text-[#1A3A52]">
                      {c.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.description ?? "Sondage"}
                      {c.answeredAt && (
                        <>
                          {" · "}
                          {new Date(c.answeredAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  {c.rewardPoints > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      <Sparkles className="mr-1 size-3" aria-hidden />+
                      {c.rewardPoints} pts
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Dialog runner */}
      <SurveyRunner
        survey={activeSurvey}
        submitting={submitting}
        onClose={() => {
          if (!submitting) setActiveSurvey(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// =============================================================================
// Runner inline (Dialog)
// =============================================================================

interface SurveyRunnerProps {
  survey: SurveyWithStatus | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, string | number>) => void;
}

function SurveyRunner({
  survey,
  submitting,
  onClose,
  onSubmit,
}: SurveyRunnerProps) {
  // `key` sur le DialogContent (via survey.id) réinitialise le composant
  // interne à chaque changement de sondage → pas de useEffect de reset.
  return (
    <Dialog
      open={Boolean(survey)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        {survey ? (
          <SurveyRunnerBody
            key={survey.id}
            survey={survey}
            submitting={submitting}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface SurveyRunnerBodyProps {
  survey: SurveyWithStatus;
  submitting: boolean;
  onSubmit: (answers: Record<string, string | number>) => void;
}

function SurveyRunnerBody({
  survey,
  submitting,
  onSubmit,
}: SurveyRunnerBodyProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  const total = survey.questions.length;
  const question = survey.questions[step];
  const isLast = step === total - 1;
  const progressPct = useMemo(
    () => (total === 0 ? 0 : Math.round(((step + 1) / total) * 100)),
    [step, total],
  );

  const handleNext = () => {
    if (isLast) {
      onSubmit(answers);
      return;
    }
    setStep((s) => Math.min(s + 1, total - 1));
  };

  const handlePrev = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  if (!question) return null;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-[#1A3A52]">{survey.title}</DialogTitle>
        {survey.description && (
          <DialogDescription>{survey.description}</DialogDescription>
        )}
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
          disabled={step === 0 || submitting}
        >
          Precedent
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className={cn(
            isLast
              ? "bg-[#4CAF50] hover:bg-[#43A047]"
              : "bg-[#1976D2] hover:bg-[#1565C0]",
          )}
        >
          {isLast ? (submitting ? "Envoi..." : "Soumettre") : "Suivant"}
        </Button>
      </div>
    </>
  );
}

interface QuestionInputProps {
  question: SurveyQuestion;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  if (question.type === "scale") {
    const min = question.min ?? DEFAULT_SCALE_MIN;
    const max = question.max ?? DEFAULT_SCALE_MAX;
    const count = Math.max(1, max - min + 1);
    const values = Array.from({ length: count }, (_, i) => min + i);

    // Échelle compacte (≤ 5 graduations) → étoiles cumulatives.
    if (count <= 5) {
      return (
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label={question.question}
        >
          {values.map((n) => {
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

    // Échelle large (ex. NPS 1..10) → grille numérique.
    return (
      <div
        className="grid grid-cols-5 gap-2 sm:grid-cols-10"
        role="radiogroup"
        aria-label={question.question}
      >
        {values.map((n) => {
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
    <Textarea
      placeholder="Votre reponse..."
      rows={4}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
