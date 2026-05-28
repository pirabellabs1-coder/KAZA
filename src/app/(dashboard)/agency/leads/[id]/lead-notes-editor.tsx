"use client";

// =============================================================================
// KAZA — Éditeur de notes lead (client)
// Auto-save brouillon (localStorage) + persistence Supabase au clic "Enregistrer".
// =============================================================================

import { useEffect, useState, useTransition } from "react";
import { RotateCcw, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

import { AutosaveIndicator } from "@/components/shared/autosave-indicator";
import { useAutoSave } from "@/hooks/use-autosave";

import { setLeadNotes } from "@/actions/agency-leads";

interface LeadNotesEditorProps {
  leadId: string;
  initialNotes: string;
}

function readDraft(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { notes?: string };
    return typeof parsed.notes === "string" ? parsed.notes : null;
  } catch {
    return null;
  }
}

export function LeadNotesEditor({
  leadId,
  initialNotes,
}: LeadNotesEditorProps) {
  const autosaveKey = `kaza:lead-notes-${leadId}`;
  const [notes, setNotes] = useState<string>(
    () => readDraft(autosaveKey) ?? initialNotes,
  );
  const [pending, startTransition] = useTransition();

  const {
    status,
    statusLabel,
    clear,
    flush,
    hasRestoredDraft,
    acknowledgeRestore,
  } = useAutoSave({
    key: autosaveKey,
    data: { notes },
  });

  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const handleSave = () => {
    startTransition(async () => {
      const res = await setLeadNotes(leadId, notes);
      if (res.success) {
        clear();
        toast.success("Notes enregistrées");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDiscardDraft = () => {
    clear();
    setNotes(initialNotes);
    toast.info("Brouillon supprimé");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <AutosaveIndicator status={status} label={statusLabel} />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 size-4" />
          )}
          Enregistrer
        </Button>
      </div>

      {hasRestoredDraft && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <strong>Brouillon restauré</strong> — vos notes non enregistrées
            ont été récupérées.
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={acknowledgeRestore}
            >
              OK
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardDraft}
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Repartir de zéro
            </Button>
          </div>
        </div>
      )}

      <Textarea
        rows={8}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Ajoutez vos notes sur ce lead (contexte, suivi, prochaines actions…)"
        className="min-h-40 resize-y text-sm leading-relaxed"
        aria-label="Notes du lead"
      />
    </div>
  );
}
