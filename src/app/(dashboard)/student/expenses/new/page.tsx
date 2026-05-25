"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mêmes colocs que le tracker (à terme : récupéré depuis le profil coloc).
const ROOMMATES = [
  { id: "aicha", name: "Aïcha Diop" },
  { id: "kofi", name: "Kofi Mensah" },
  { id: "mariam", name: "Mariam Touré" },
  { id: "tome", name: "Tomé Da Silva" },
];

const CATEGORIES = [
  "Électricité",
  "Eau",
  "Internet",
  "Courses",
  "Loyer",
  "Autre",
] as const;

type Category = (typeof CATEGORIES)[number];

export default function NewExpensePage() {
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Électricité");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(today);
  const [payerId, setPayerId] = useState<string>(ROOMMATES[0].id);
  const [participants, setParticipants] = useState<string[]>(
    ROOMMATES.map((r) => r.id)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleParticipant(id: string) {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Le titre est obligatoire.";
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) {
      e.amount = "Le montant doit être supérieur à 0.";
    }
    if (!date) e.date = "La date est obligatoire.";
    if (!payerId) e.payerId = "Indiquez qui a payé.";
    if (participants.length === 0) {
      e.participants = "Sélectionnez au moins un participant.";
    }
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // Mock : pas d'API encore. Plus tard : Server Action vers Supabase.
    window.alert("Dépense enregistrée");
    router.push("/student/expenses");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/expenses" aria-label="Retour aux dépenses">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Nouvelle dépense
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez une dépense commune et choisissez comment la répartir
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de la dépense</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
                placeholder="Facture SBEE septembre"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-kaza-error">{errors.title}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  step={500}
                  value={amount}
                  onChange={(ev) => setAmount(ev.target.value)}
                  placeholder="15000"
                  aria-invalid={!!errors.amount}
                />
                {errors.amount && (
                  <p className="text-xs text-kaza-error">{errors.amount}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(ev) => setDate(ev.target.value)}
                  aria-invalid={!!errors.date}
                />
                {errors.date && (
                  <p className="text-xs text-kaza-error">{errors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payer">Payé par</Label>
                <Select value={payerId} onValueChange={setPayerId}>
                  <SelectTrigger id="payer" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOMMATES.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payerId && (
                  <p className="text-xs text-kaza-error">{errors.payerId}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Partagé entre</Label>
              <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                {ROOMMATES.map((r) => {
                  const checked = participants.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      htmlFor={`p-${r.id}`}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <input
                        id={`p-${r.id}`}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleParticipant(r.id)}
                        className="size-4 rounded border-input text-kaza-blue focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                      <span>{r.name}</span>
                    </label>
                  );
                })}
              </div>
              {errors.participants && (
                <p className="text-xs text-kaza-error">
                  {errors.participants}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {participants.length} participant
                {participants.length > 1 ? "s" : ""} sélectionné
                {participants.length > 1 ? "s" : ""} · part de{" "}
                {participants.length && amount
                  ? Math.round(Number(amount) / participants.length)
                  : 0}{" "}
                FCFA par personne
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/student/expenses">Annuler</Link>
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
