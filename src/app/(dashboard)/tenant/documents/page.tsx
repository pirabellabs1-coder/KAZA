"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IdCard,
  FileText,
  Upload,
  User,
  FileCheck,
  FilePlus,
  Sparkles,
  Trash2,
  Download,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VerificationBadge } from "@/components/shared/verification-badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast-helper";

const MOTIVATION_STORAGE_KEY = "kaza.tenant.motivation_letter";

interface Payslip {
  id: string;
  month: string;
  amount: string;
  uploadedAt: string;
}

interface ExtraDoc {
  id: string;
  name: string;
  uploadedAt: string;
}

interface Guarantor {
  fullName: string;
  relation: string;
  email: string;
  phone: string;
  monthlyIncome: string;
}

// Pas de documents fictifs au chargement : le locataire téléverse ses propres
// pièces (bulletins, justificatifs). Listes vides par défaut.
const INITIAL_PAYSLIPS: Payslip[] = [];

const INITIAL_EXTRA: ExtraDoc[] = [];

export default function TenantDocumentsPage() {
  const [motivation, setMotivation] = useState("");
  const [motivationLoaded, setMotivationLoaded] = useState(false);
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [guarantor, setGuarantor] = useState<Guarantor>({
    fullName: "",
    relation: "",
    email: "",
    phone: "",
    monthlyIncome: "",
  });
  const [payslips, setPayslips] = useState<Payslip[]>(INITIAL_PAYSLIPS);
  const [extraDocs, setExtraDocs] = useState<ExtraDoc[]>(INITIAL_EXTRA);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MOTIVATION_STORAGE_KEY);
      if (stored) setMotivation(stored);
    } catch {
      // ignore (SSR / private mode)
    }
    setMotivationLoaded(true);
  }, []);

  // Auto-save motivation letter
  useEffect(() => {
    if (!motivationLoaded) return;
    try {
      window.localStorage.setItem(MOTIVATION_STORAGE_KEY, motivation);
    } catch {
      // ignore
    }
  }, [motivation, motivationLoaded]);

  const completion = useMemo(() => {
    let score = 0;
    // pièce d'identité = vérifiée
    score += 25;
    // bulletins
    if (payslips.length >= 3) score += 25;
    else if (payslips.length > 0) score += 15;
    // garant
    if (hasGuarantor && guarantor.fullName && guarantor.phone) score += 20;
    // lettre
    if (motivation.trim().length >= 80) score += 20;
    else if (motivation.trim().length > 0) score += 10;
    // extras
    if (extraDocs.length >= 1) score += 10;
    return Math.min(100, score);
  }, [payslips.length, hasGuarantor, guarantor, motivation, extraDocs.length]);

  const handleSaveMotivation = () => {
    try {
      window.localStorage.setItem(MOTIVATION_STORAGE_KEY, motivation);
      toast.success("Lettre de motivation enregistrée");
    } catch {
      toast.error("Impossible d'enregistrer la lettre");
    }
  };

  const handleAddPayslip = () => {
    const next: Payslip = {
      id: `slip-${Date.now()}`,
      month: new Date().toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
      amount: "—",
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setPayslips((prev) => [next, ...prev].slice(0, 6));
    toast.success("Bulletin téléversé");
  };

  const handleDeletePayslip = (id: string) => {
    setPayslips((prev) => prev.filter((p) => p.id !== id));
    toast.info("Bulletin supprimé");
  };

  const handleAddExtra = () => {
    const next: ExtraDoc = {
      id: `doc-${Date.now()}`,
      name: `Document-${Math.floor(Math.random() * 9999)}.pdf`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setExtraDocs((prev) => [next, ...prev]);
    toast.success("Document ajouté");
  };

  const handleDeleteExtra = (id: string) => {
    setExtraDocs((prev) => prev.filter((d) => d.id !== id));
    toast.info("Document supprimé");
  };

  const handleSaveGuarantor = () => {
    if (!guarantor.fullName || !guarantor.phone) {
      toast.error("Nom et téléphone du garant requis");
      return;
    }
    toast.success("Garant enregistré");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Mon dossier locatif
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Préparez les pièces nécessaires pour postuler en un clic.
          </p>
        </div>
        <Card className="w-full shrink-0 sm:w-72">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Complétion
              </span>
              <span className="text-lg font-bold text-kaza-blue">
                {completion}%
              </span>
            </div>
            <Progress value={completion} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Conseil */}
      <Card className="border-kaza-blue/20 bg-kaza-blue/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-kaza-blue/15 text-kaza-blue">
            <Sparkles className="size-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-kaza-navy">
              Astuce KAZA
            </p>
            <p className="text-sm text-muted-foreground">
              Un dossier complet augmente vos chances d&apos;être retenu de{" "}
              <span className="font-semibold text-kaza-navy">70 %</span>. Pensez
              à joindre vos derniers bulletins et une lettre de motivation
              personnalisée.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Pièce d'identité */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-kaza-navy/10 text-kaza-navy">
                  <IdCard className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Pièce d&apos;identité
                  </CardTitle>
                  <CardDescription>CNI recto/verso vérifiée</CardDescription>
                </div>
              </div>
              <VerificationBadge status="APPROVED" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <p className="font-medium">Carte Nationale d&apos;Identité</p>
              <p className="text-muted-foreground">Pièce d&apos;identité vérifiée</p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Upload className="mr-1.5 size-3.5" />
              Mettre à jour la pièce
            </Button>
          </CardContent>
        </Card>

        {/* 2. Justificatifs de revenus */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-kaza-green/10 text-kaza-green">
                <FileCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Justificatifs de revenus
                </CardTitle>
                <CardDescription>
                  3 derniers bulletins de salaire
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {payslips.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Aucun bulletin téléversé.
              </p>
            ) : (
              <ul className="space-y-2">
                {payslips.slice(0, 3).map((slip) => (
                  <li
                    key={slip.id}
                    className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium capitalize">
                          {slip.month}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {slip.amount}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-rose-600"
                      onClick={() => handleDeletePayslip(slip.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddPayslip}
            >
              <Upload className="mr-1.5 size-3.5" />
              Téléverser un bulletin
            </Button>
          </CardContent>
        </Card>

        {/* 3. Garant */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <User className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">Garant</CardTitle>
                <CardDescription>
                  Personne qui se porte caution pour vous
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasGuarantor ? (
              <div className="space-y-3">
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Pas de garant déclaré pour le moment.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setHasGuarantor(true)}
                >
                  Ajouter un garant
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="g-name" className="text-xs">
                      Nom complet
                    </Label>
                    <Input
                      id="g-name"
                      placeholder="Ex. Aminata Mensah"
                      value={guarantor.fullName}
                      onChange={(e) =>
                        setGuarantor((g) => ({
                          ...g,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="g-rel" className="text-xs">
                        Lien
                      </Label>
                      <Input
                        id="g-rel"
                        placeholder="Parent, ami..."
                        value={guarantor.relation}
                        onChange={(e) =>
                          setGuarantor((g) => ({
                            ...g,
                            relation: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="g-phone" className="text-xs">
                        Téléphone
                      </Label>
                      <Input
                        id="g-phone"
                        placeholder="+229..."
                        value={guarantor.phone}
                        onChange={(e) =>
                          setGuarantor((g) => ({
                            ...g,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="g-email" className="text-xs">
                        Email
                      </Label>
                      <Input
                        id="g-email"
                        type="email"
                        placeholder="email@..."
                        value={guarantor.email}
                        onChange={(e) =>
                          setGuarantor((g) => ({
                            ...g,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="g-income" className="text-xs">
                        Revenu mensuel (FCFA)
                      </Label>
                      <Input
                        id="g-income"
                        placeholder="750 000"
                        value={guarantor.monthlyIncome}
                        onChange={(e) =>
                          setGuarantor((g) => ({
                            ...g,
                            monthlyIncome: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-kaza-blue hover:bg-kaza-blue/90"
                    onClick={handleSaveGuarantor}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setHasGuarantor(false);
                      setGuarantor({
                        fullName: "",
                        relation: "",
                        email: "",
                        phone: "",
                        monthlyIncome: "",
                      });
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Lettre de motivation */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-kaza-blue/10 text-kaza-blue">
                <FileText className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Lettre de motivation
                </CardTitle>
                <CardDescription>
                  Sauvegardée automatiquement dans votre navigateur
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={6}
              placeholder="Présentez-vous au propriétaire : votre situation, votre projet, pourquoi ce bien vous intéresse..."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {motivation.length} caractère{motivation.length > 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveMotivation}
              >
                Sauvegarder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Documents complémentaires */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <FilePlus className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Documents complémentaires
                </CardTitle>
                <CardDescription>
                  Attestations, RIB, références... (PDF, JPG, PNG)
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {extraDocs.length} fichier{extraDocs.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={handleAddExtra}
            className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-6 transition hover:border-kaza-blue/40 hover:bg-kaza-blue/5"
          >
            <Upload className="mb-2 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Cliquez pour téléverser</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              PDF, JPG ou PNG · 10 Mo max par fichier
            </p>
          </button>

          {extraDocs.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {extraDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border bg-muted/30 p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Ajouté le {doc.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      aria-label="Télécharger"
                    >
                      <Download className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-rose-600"
                      aria-label="Supprimer"
                      onClick={() => handleDeleteExtra(doc.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
