"use client";

// =============================================================================
// Kaabo — Éditeur de contrat (sections éditables, client)
// Wrapper client autour des sections du template pour gérer l'auto-save
// (brouillon localStorage) et afficher un indicateur visuel.
// =============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  PlusCircle,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";

import { AutosaveIndicator } from "@/components/shared/autosave-indicator";
import { useAutoSave } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";

import type { ContractSection } from "@/lib/contracts/templates";

const PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

function highlightPlaceholders(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = PLACEHOLDER_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`ph-${key++}`}
        className="rounded bg-kaza-blue/10 px-1.5 py-0.5 font-mono text-xs font-medium text-kaza-blue"
        title="Variable dynamique"
      >
        {`{{${match[1]}}}`}
      </span>,
    );
    lastIndex = PLACEHOLDER_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function getSectionCompleteness(
  body: string,
): "complete" | "partial" | "empty" {
  if (!body || body.trim().length === 0) return "empty";
  if (
    body.includes("[À PRÉCISER") ||
    body.includes("[À compléter") ||
    body.includes("[Colocataire n°")
  )
    return "partial";
  return "complete";
}

interface EditableSection {
  id: string;
  title: string;
  body: string;
  required: boolean;
  editable: boolean;
}

interface ContractEditorClientProps {
  contractId: string;
  initialTitle: string;
  initialSections: ContractSection[];
  previewHref: string;
}

interface ContractDraft {
  title?: string;
  sections?: Array<{ id: string; body: string; title: string }>;
}

function readDraft(key: string): ContractDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContractDraft & { __savedAt?: number };
    delete parsed.__savedAt;
    return parsed;
  } catch {
    return null;
  }
}

export function ContractEditorClient({
  contractId,
  initialTitle,
  initialSections,
  previewHref,
}: ContractEditorClientProps) {
  const autosaveKey = `kaza:contract-${contractId}`;

  // Lazy init : on lit le brouillon localStorage au premier rendu (évite un
  // setState dans un useEffect, conforme à react-hooks/set-state-in-effect).
  const [title, setTitle] = useState<string>(() => {
    const draft = readDraft(autosaveKey);
    return draft?.title ?? initialTitle;
  });
  const [sections, setSections] = useState<EditableSection[]>(() => {
    const draft = readDraft(autosaveKey);
    const byId = draft?.sections
      ? new Map(draft.sections.map((s) => [s.id, s]))
      : null;
    return initialSections.map((s) => {
      const d = byId?.get(s.id);
      return {
        id: s.id,
        title: d?.title ?? s.title,
        body: d?.body ?? s.body,
        required: s.required,
        editable: s.editable,
      };
    });
  });

  // Données surveillées par l'auto-save
  const watchedData = useMemo(
    () => ({
      title,
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        body: s.body,
      })),
    }),
    [title, sections],
  );

  const {
    status,
    statusLabel,
    clear,
    flush,
    hasRestoredDraft,
    acknowledgeRestore,
  } = useAutoSave({
    key: autosaveKey,
    data: watchedData,
  });

  // Flush au unmount
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  const updateSection = (id: string, patch: Partial<EditableSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const handleSave = () => {
    clear();
    toast.success("Contrat enregistré");
  };

  const handleDiscardDraft = () => {
    clear();
    setTitle(initialTitle);
    setSections(
      initialSections.map((s) => ({
        id: s.id,
        title: s.title,
        body: s.body,
        required: s.required,
        editable: s.editable,
      })),
    );
    toast.info("Brouillon supprimé");
  };

  return (
    <div className="space-y-4">
      {/* Header sticky avec titre + indicateur auto-save */}
      <div className="sticky top-0 z-20 -mx-2 flex flex-col gap-2 rounded-xl border bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between">
        <Input
          aria-label="Titre du contrat"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 min-w-[220px] border-0 bg-transparent text-sm font-semibold text-foreground shadow-none focus-visible:ring-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <AutosaveIndicator status={status} label={statusLabel} />
          <Button
            size="sm"
            variant="outline"
            className="bg-kaza-green/10 text-kaza-green hover:bg-kaza-green/20"
            onClick={handleSave}
          >
            <Save className="mr-1.5 size-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Bandeau brouillon restauré */}
      {hasRestoredDraft && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <strong>Brouillon restauré</strong> — vos modifications non
            enregistrées ont été récupérées.
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

      {/* Sections éditables */}
      <div className="space-y-4">
        {sections.map((section, idx) => {
          const completeness = getSectionCompleteness(section.body);
          return (
            <Card
              key={section.id}
              id={`section-${section.id}`}
              className="scroll-mt-4"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-kaza-navy text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        updateSection(section.id, { title: e.target.value })
                      }
                      className="h-9 min-w-[200px] border-0 bg-transparent text-base font-semibold shadow-none focus-visible:ring-1"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {completeness === "complete" && (
                      <Badge className="bg-kaza-green/10 text-kaza-green hover:bg-kaza-green/10">
                        <CheckCircle2 className="mr-1 size-3" />
                        OK
                      </Badge>
                    )}
                    {completeness === "partial" && (
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        <AlertTriangle className="mr-1 size-3" />
                        À compléter
                      </Badge>
                    )}
                    {section.required && (
                      <Badge
                        variant="secondary"
                        className="bg-kaza-blue/10 text-kaza-blue"
                      >
                        Obligatoire
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={section.body}
                  onChange={(e) =>
                    updateSection(section.id, { body: e.target.value })
                  }
                  rows={10}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Rédigez le contenu de la section…"
                />
                <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    Aperçu avec variables surlignées
                  </p>
                  <p className="line-clamp-4">
                    {highlightPlaceholders(section.body.slice(0, 280) + "…")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <PlusCircle className="mr-1.5 size-3.5" />
                    Insérer clause standard
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <FileText className="mr-1.5 size-3.5" />
                    Insérer variable
                  </Button>
                  {!section.required && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "ml-auto h-8 text-xs text-destructive hover:text-destructive",
                      )}
                    >
                      <Trash2 className="mr-1.5 size-3.5" />
                      Supprimer section
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer sticky */}
      <div className="sticky bottom-4 z-10 mt-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <AutosaveIndicator status={status} label={statusLabel} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSave}
          >
            <Save className="mr-1.5 size-4" />
            Enregistrer le brouillon
          </Button>
          <Button
            type="button"
            className="bg-kaza-navy hover:bg-kaza-navy/90"
            size="sm"
            asChild
          >
            <Link href={previewHref}>
              Continuer vers signatures
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
