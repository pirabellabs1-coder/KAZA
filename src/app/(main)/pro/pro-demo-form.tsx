"use client";

import { useState, type FormEvent } from "react";

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
import { submitProDemoRequest } from "@/actions/pro";

type AgencySize = "1-5" | "6-15" | "16-50" | "50+";

const initialState = {
  agencyName: "",
  contactName: "",
  email: "",
  phone: "",
  size: "" as AgencySize | "",
  message: "",
};

export function ProDemoForm() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.agencyName || !form.contactName || !form.email || !form.size) {
      toast.error("Merci de remplir tous les champs requis.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitProDemoRequest({
        agencyName: form.agencyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone || undefined,
        size: form.size || undefined,
        message: form.message || undefined,
      });
      if (!res.success) {
        toast.error(res.error ?? "Erreur");
        return;
      }
      toast.success(
        `Merci ${form.contactName} ! Notre équipe Pro vous recontacte sous 24h.`
      );
      setForm(initialState);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 text-foreground shadow-xl sm:p-8"
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="agency">Nom de l&apos;agence *</Label>
          <Input
            id="agency"
            required
            value={form.agencyName}
            onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
            placeholder="Nom de votre agence"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="contact">Contact *</Label>
            <Input
              id="contact"
              required
              value={form.contactName}
              onChange={(e) =>
                setForm({ ...form, contactName: e.target.value })
              }
              placeholder="Votre nom complet"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@agence.bj"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+229 90 00 00 00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="size">Taille de l&apos;agence *</Label>
            <Select
              value={form.size}
              onValueChange={(v) =>
                setForm({ ...form, size: v as AgencySize })
              }
            >
              <SelectTrigger id="size">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1 à 5 personnes</SelectItem>
                <SelectItem value="6-15">6 à 15 personnes</SelectItem>
                <SelectItem value="16-50">16 à 50 personnes</SelectItem>
                <SelectItem value="50+">Plus de 50 personnes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="message">Votre message</Label>
          <Textarea
            id="message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Parlez-nous de votre activité, vos objectifs, vos outils actuels…"
            rows={4}
          />
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-kaza-blue hover:bg-kaza-blue/90"
        >
          {submitting ? "Envoi en cours…" : "Demander une démo"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Réponse garantie sous 24h ouvrées.
        </p>
      </div>
    </form>
  );
}
