"use client";

// =============================================================================
// KAZA - VisitRequestDialog (client component)
//
// Modal de demande de visite pour un locataire connecte. Appelle la server
// action `requestVisit()` (Supabase + email best-effort cote serveur) puis
// retourne un feedback toast. En mode demo (pas de Supabase), la server
// action retombe sur un succes simule + on conserve un mirror localStorage
// pour que la page /tenant/visits affiche immediatement la demande.
// =============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Loader2, MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { requestVisit } from "@/actions/visits";

// =============================================================================
// Créneaux de visite proposés au locataire. La persistance réelle est gérée
// côté serveur par `requestVisit()` (Supabase). Pas de mirror localStorage.
// =============================================================================
const VISIT_TIME_SLOTS: Array<{ value: string; label: string }> = [
  { value: "08:00", label: "08h00 - 09h00" },
  { value: "09:00", label: "09h00 - 10h00" },
  { value: "10:00", label: "10h00 - 11h00" },
  { value: "11:00", label: "11h00 - 12h00" },
  { value: "14:00", label: "14h00 - 15h00" },
  { value: "15:00", label: "15h00 - 16h00" },
  { value: "16:00", label: "16h00 - 17h00" },
  { value: "17:00", label: "17h00 - 18h00" },
];

interface VisitRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
}

function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const d = String(tomorrow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMaxDate(): string {
  const max = new Date();
  max.setDate(max.getDate() + 30);
  const y = max.getFullYear();
  const m = String(max.getMonth() + 1).padStart(2, "0");
  const d = String(max.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function VisitRequestDialog({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  propertyAddress,
}: VisitRequestDialogProps) {
  const router = useRouter();
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const minDate = getMinDate();
  const maxDate = getMaxDate();

  const reset = () => {
    setDate("");
    setTime("");
    setMessage("");
    setErrors({});
    setFormError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const nextErrors: typeof errors = {};
    if (!date) nextErrors.date = "Veuillez choisir une date.";
    if (!time) nextErrors.time = "Veuillez choisir un creneau.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      const result = await requestVisit({
        propertyId,
        requestedDate: date,
        requestedTime: time,
        message: message.trim() || undefined,
      });

      if (!result.success) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(
        "Demande de visite envoyee. Vous serez notifie des reponse du proprietaire.",
      );
      reset();
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-kaza-navy">
            Demander une visite
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{propertyTitle}</span>
            <br />
            <span className="text-xs">{propertyAddress}</span>
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="visit-date" className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-kaza-blue" />
              Date souhaitee
            </Label>
            <Input
              id="visit-date"
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full"
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Creneau */}
          <div className="space-y-1.5">
            <Label htmlFor="visit-time" className="flex items-center gap-1.5">
              <Clock className="size-4 text-kaza-blue" />
              Creneau
            </Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="visit-time" className="w-full">
                <SelectValue placeholder="Choisir un creneau" />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && (
              <p className="text-xs text-destructive">{errors.time}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label
              htmlFor="visit-message"
              className="flex items-center gap-1.5"
            >
              <MessageSquare className="size-4 text-kaza-blue" />
              Message au proprietaire{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optionnel)
              </span>
            </Label>
            <Textarea
              id="visit-message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="Precisez vos contraintes, vos questions..."
              rows={3}
              maxLength={500}
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {message.length}/500
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-kaza-blue hover:bg-kaza-blue/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer la demande"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
