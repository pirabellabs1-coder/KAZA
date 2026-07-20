"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, MessageSquare, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/cms/rich-text-editor";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";
import { createAndSendCampaign, sendTestCampaign } from "@/actions/campaigns";
import type { AudienceSegment } from "@/lib/queries/campaigns";

const CHANNELS = [
  { value: "IN_APP", label: "In-App (notification)" },
  { value: "EMAIL", label: "Email" },
  { value: "PUSH", label: "Push" },
  { value: "SMS", label: "SMS" },
] as const;

export function CampaignComposer({ segments }: { segments: AudienceSegment[] }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<string>("IN_APP");
  // Multi-audience : plusieurs segments cochés à la fois.
  const [selected, setSelected] = useState<string[]>(["ALL"]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  const allCount = segments.find((s) => s.key === "ALL")?.count ?? 0;

  // Estimation du nombre de destinataires (rôles mutuellement exclusifs).
  const audienceCount = useMemo(() => {
    if (selected.includes("ALL")) return allCount;
    return segments
      .filter((s) => selected.includes(s.key))
      .reduce((sum, s) => sum + s.count, 0);
  }, [selected, segments, allCount]);

  function toggleSegment(key: string) {
    setSelected((prev) => {
      if (key === "ALL") return ["ALL"];
      const withoutAll = prev.filter((k) => k !== "ALL");
      const next = withoutAll.includes(key)
        ? withoutAll.filter((k) => k !== key)
        : [...withoutAll, key];
      return next.length === 0 ? ["ALL"] : next;
    });
  }

  function isEmptyContent(html: string) {
    return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
  }

  function handleSend() {
    if (!name.trim() || isEmptyContent(content)) {
      toast.error("Renseignez au moins le nom et le contenu de la campagne.");
      return;
    }
    if (selected.length === 0) {
      toast.error("Sélectionnez au moins une audience.");
      return;
    }
    startTransition(async () => {
      const res = await createAndSendCampaign({
        name,
        channel,
        segments: selected,
        subject,
        content,
      });
      if (res.success) {
        toast.success(
          `Campagne « ${name} » envoyée à ${res.sentCount} destinataire${res.sentCount > 1 ? "s" : ""}.`,
        );
        setName("");
        setSubject("");
        setContent("");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleTest() {
    if (isEmptyContent(content)) {
      toast.error("Saisissez un contenu avant d'envoyer un test.");
      return;
    }
    startTransition(async () => {
      const res = await sendTestCampaign({ name: name || "Test", subject, content });
      if (res.success) {
        toast.success("Test envoyé : consultez vos notifications.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-kaza-navy via-[#1f4663] to-[#0f2638] p-6 text-white shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-amber-300" />
        <h2 className="font-heading text-xl font-bold">Créer une nouvelle campagne</h2>
      </div>
      <p className="mb-6 text-sm text-white/70">
        Composez et envoyez en quelques minutes · test possible avant envoi
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">
              Nom de la campagne
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Annonce nouvelle fonctionnalité"
              className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">
              Canal
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none [&>option]:text-kaza-navy"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-audience */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">
              Audience{" "}
              <span className="font-normal normal-case text-white/50">
                (plusieurs possibles)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {segments.map((s) => {
                const active = selected.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSegment(s.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      active
                        ? "border-amber-300 bg-amber-400 text-kaza-navy"
                        : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10",
                    )}
                  >
                    {active && <Check className="size-3" />}
                    {s.name}
                    <span className={active ? "text-kaza-navy/70" : "text-white/40"}>
                      ({s.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {channel === "EMAIL" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">
                Objet (email)
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email"
                className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
          )}
        </div>

        {/* Éditeur riche (comme le blog) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Contenu
          </label>
          <div className="rounded-xl bg-white p-1 text-foreground">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Rédigez votre message… (titres, gras, listes, liens)"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/60">
          Cible : <span className="font-semibold text-white">{audienceCount}</span> destinataire
          {audienceCount > 1 ? "s" : ""}
          {channel === "IN_APP" ? " · envoi immédiat" : " · brouillon (provider à configurer)"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={pending}
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <MessageSquare className="mr-2 size-4" />
            Envoyer un test à moi
          </Button>
          <Button
            onClick={handleSend}
            disabled={pending}
            className="bg-amber-400 text-kaza-navy hover:bg-amber-300"
          >
            <Send className="mr-2 size-4" />
            {pending ? "Envoi…" : "Envoyer la campagne"}
          </Button>
        </div>
      </div>
    </div>
  );
}
