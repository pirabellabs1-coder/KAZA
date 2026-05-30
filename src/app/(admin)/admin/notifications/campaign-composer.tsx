"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast-helper";
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
  const [segment, setSegment] = useState<string>("ALL");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedSegment = segments.find((s) => s.key === segment);
  const audienceCount = selectedSegment?.count ?? 0;

  function handleSend() {
    if (!name.trim() || !content.trim()) {
      toast.error("Renseignez au moins le nom et le contenu de la campagne.");
      return;
    }
    startTransition(async () => {
      const res = await createAndSendCampaign({ name, channel, segment, subject, content });
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
    if (!content.trim()) {
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

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">
                Audience
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none [&>option]:text-kaza-navy"
              >
                {segments.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name} ({s.count})
                  </option>
                ))}
              </select>
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

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Contenu
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Rédigez votre message…"
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none"
          />
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
