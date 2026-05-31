"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Calendar as CalendarIcon, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast-helper";

import { generateSpaceReport } from "@/actions/reports-generate";

export interface ReportTypeOption {
  value: string;
  label: string;
}

interface Props {
  space: "agency" | "owner" | "student";
  types: ReportTypeOption[];
}

export function ReportGenerator({ space, types }: Props) {
  const [type, setType] = useState(types[0]?.value ?? "financial");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const res = await generateSpaceReport({ space, type, from, to });
      if (!res.success || !res.content) {
        toast.error(res.error ?? "Échec de la génération du rapport.");
        return;
      }
      const blob = new Blob([res.content], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename ?? "kaza-rapport.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Rapport généré et téléchargé.");
    });
  };

  return (
    <Card className="rounded-2xl border-kaza-blue/20 bg-gradient-to-br from-kaza-blue/5 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          <Sparkles className="size-5 text-kaza-blue" /> Générer un rapport
        </CardTitle>
        <CardDescription>
          Choisissez le type et la période. Le rapport est généré à partir de vos
          données réelles et téléchargé au format CSV (compatible Excel).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-kaza-navy">
              Type de rapport
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-kaza-navy">Du</label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                className="pl-9"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="Date de début"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-kaza-navy">Au</label>
            <div className="relative">
              <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                className="pl-9"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="Date de fin"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            className="gap-2 bg-kaza-blue hover:bg-kaza-blue/90"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {isPending ? "Génération…" : "Générer & télécharger"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
