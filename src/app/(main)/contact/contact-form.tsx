"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
import { sendContactMessage } from "@/actions/contact";
import { toast } from "@/components/ui/toast-helper";

const SUBJECTS = [
  { value: "general", label: "Question générale" },
  { value: "support", label: "Support technique" },
  { value: "partnership", label: "Partenariat" },
  { value: "press", label: "Presse" },
  { value: "other", label: "Autre" },
] as const;

const formSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom est trop long."),
  email: z.string().email("Veuillez saisir une adresse email valide."),
  subject: z.enum(["general", "support", "partnership", "press", "other"]),
  message: z
    .string()
    .min(20, "Le message doit contenir au moins 20 caractères.")
    .max(2000, "Le message est trop long (2000 caractères max)."),
  consent: z.literal(true, {
    message: "Vous devez accepter le traitement de vos données.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "general",
      message: "",
      consent: undefined as unknown as true,
    },
  });

  const subjectValue = watch("subject");
  const consentValue = watch("consent");

  const onSubmit = (values: FormValues) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await sendContactMessage(values);
      if (result.success) {
        const message = result.message ?? "Message envoyé avec succès.";
        setFeedback({ type: "success", message });
        toast.success(message);
        reset();
      } else {
        const message = result.error ?? "Une erreur est survenue. Réessayez.";
        setFeedback({ type: "error", message });
        toast.error(message);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
      noValidate
    >
      <div className="space-y-5">
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Nom complet <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Votre nom complet"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="mb-2 block">
            Adresse email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="subject" className="mb-2 block">
            Sujet <span className="text-destructive">*</span>
          </Label>
          <Select
            value={subjectValue}
            onValueChange={(v) =>
              setValue("subject", v as FormValues["subject"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="subject" className="w-full">
              <SelectValue placeholder="Choisissez un sujet" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subject && (
            <p className="mt-1 text-xs text-destructive">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="message" className="mb-2 block">
            Message <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="message"
            rows={6}
            placeholder="Décrivez votre demande en quelques lignes…"
            aria-invalid={!!errors.message}
            {...register("message")}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-destructive">
              {errors.message.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            className="mt-1 size-4 cursor-pointer rounded border-gray-300 text-kaza-blue focus:ring-kaza-blue"
            checked={consentValue === true}
            onChange={(e) =>
              setValue("consent", e.target.checked as true, {
                shouldValidate: true,
              })
            }
          />
          <label
            htmlFor="consent"
            className="text-sm text-muted-foreground"
          >
            J&apos;accepte que mes données soient traitées par KAZA pour
            répondre à ma demande, conformément à la{" "}
            <a href="/legal/confidentialite" className="text-kaza-blue hover:underline">
              politique de confidentialité
            </a>
            .
          </label>
        </div>
        {errors.consent && (
          <p className="-mt-3 text-xs text-destructive">
            {errors.consent.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-kaza-navy hover:bg-kaza-navy/90 sm:w-auto"
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <Send className="mr-2 size-4" />
              Envoyer le message
            </>
          )}
        </Button>

        {feedback && (
          <div
            role="status"
            className={
              "flex items-start gap-3 rounded-lg p-4 text-sm " +
              (feedback.type === "success"
                ? "border border-kaza-green/30 bg-kaza-green/5 text-kaza-green"
                : "border border-destructive/30 bg-destructive/5 text-destructive")
            }
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
            )}
            <p>{feedback.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}
