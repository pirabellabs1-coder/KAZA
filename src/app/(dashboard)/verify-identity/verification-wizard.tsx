"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  FileText,
  Loader2,
  Mail,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  resendEmailConfirmation,
  uploadIdentityFile,
  submitIdentityVerification,
  type ExtraDocument,
  type ExtraDocumentKind,
} from "@/actions/verification";
import { toast } from "@/components/ui/toast-helper";

type Step = 1 | 2 | 3;
type DocType = "national_id" | "passport" | "driver_license" | "voter_card";
type Role = "OWNER" | "TENANT" | "STUDENT" | "AGENCY" | "BUYER" | "ADMIN";

const DOC_LABELS: Record<DocType, string> = {
  national_id: "Carte nationale d'identité",
  passport: "Passeport",
  driver_license: "Permis de conduire",
  voter_card: "Carte d'électeur",
};

const STEPS: Array<{ id: Step; label: string; icon: typeof Mail }> = [
  { id: 1, label: "Email", icon: Mail },
  { id: 2, label: "Documents", icon: FileText },
  { id: 3, label: "Selfie & justificatifs", icon: Camera },
];

const ACCEPT = "image/*,application/pdf";

// ---------------------------------------------------------------------------
// Documents administratifs selon le rôle
// ---------------------------------------------------------------------------

interface ExtraDocSpec {
  kind: ExtraDocumentKind;
  label: string;
  hint: string;
  required: boolean;
}

function getExtraDocSpecs(role: Role): ExtraDocSpec[] {
  switch (role) {
    case "STUDENT":
      return [
        {
          kind: "student_proof",
          label: "Justificatif de statut étudiant",
          hint: "Carte étudiante ou certificat de scolarité (image ou PDF). Obligatoire.",
          required: true,
        },
      ];
    case "TENANT":
      return [
        {
          kind: "address_proof",
          label: "Justificatif de domicile",
          hint: "Facture récente, attestation d'hébergement, etc. (recommandé).",
          required: false,
        },
      ];
    case "OWNER":
    case "AGENCY":
      return [
        {
          kind: "property_title",
          label: "Titre de propriété ou justificatif",
          hint: "Acte de propriété, mandat de gestion, etc. (recommandé).",
          required: false,
        },
        {
          kind: "business_doc",
          label: "Document d'entreprise",
          hint: "Registre du commerce, NIF/IFU, statuts (recommandé pour les agences).",
          required: false,
        },
      ];
    default:
      return [];
  }
}

export function VerificationWizard({
  role,
  email,
  emailConfirmed,
}: {
  role: Role;
  email: string;
  emailConfirmed: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const extraSpecs = getExtraDocSpecs(role);

  // Step 1 — Email
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Step 2 — Pièce d'identité
  const [docType, setDocType] = useState<DocType>("national_id");
  const [docNumber, setDocNumber] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPath, setFrontPath] = useState<string | null>(null);
  const [backPath, setBackPath] = useState<string | null>(null);

  // Step 3 — Selfie + documents administratifs
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<
    Partial<Record<ExtraDocumentKind, File | null>>
  >({});

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleResendEmail = async () => {
    setError(null);
    setResending(true);
    const res = await resendEmailConfirmation();
    setResending(false);
    if (!res.success) {
      reportError(res.error);
      return;
    }
    setResent(true);
    toast.success("Email de confirmation envoyé. Pensez à vérifier vos spams.");
  };

  const handleUploadDocs = async () => {
    setError(null);
    if (!frontFile) {
      reportError("Veuillez ajouter le recto de la pièce.");
      return;
    }
    if (docType !== "passport" && !backFile) {
      reportError("Veuillez ajouter le verso de la pièce.");
      return;
    }
    setLoading(true);
    const frontRes = await uploadIdentityFile(frontFile, "front");
    if (!frontRes.success) {
      setLoading(false);
      reportError(frontRes.error);
      return;
    }
    setFrontPath(frontRes.data!.path);
    if (backFile) {
      const backRes = await uploadIdentityFile(backFile, "back");
      if (!backRes.success) {
        setLoading(false);
        reportError(backRes.error);
        return;
      }
      setBackPath(backRes.data!.path);
    }
    setLoading(false);
    setStep(3);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!selfieFile) {
      reportError("Veuillez ajouter votre selfie.");
      return;
    }

    // Vérifie les justificatifs administratifs obligatoires (ex. étudiant).
    for (const spec of extraSpecs) {
      if (spec.required && !extraFiles[spec.kind]) {
        reportError(`${spec.label} est obligatoire.`);
        return;
      }
    }

    setLoading(true);

    // 1) Upload du selfie.
    const selfieRes = await uploadIdentityFile(selfieFile, "selfie");
    if (!selfieRes.success) {
      setLoading(false);
      reportError(selfieRes.error);
      return;
    }

    // 2) Upload des documents administratifs additionnels.
    const extraDocuments: ExtraDocument[] = [];
    for (const spec of extraSpecs) {
      const file = extraFiles[spec.kind];
      if (!file) continue;
      const up = await uploadIdentityFile(file, spec.kind);
      if (!up.success) {
        setLoading(false);
        reportError(`${spec.label} : ${up.error}`);
        return;
      }
      extraDocuments.push({
        kind: spec.kind,
        label: spec.label,
        url: up.data!.path,
      });
    }

    // 3) Soumission.
    const submitRes = await submitIdentityVerification({
      documentType: docType,
      documentNumber: docNumber || undefined,
      documentFrontPath: frontPath!,
      documentBackPath: backPath || undefined,
      selfiePath: selfieRes.data!.path,
      emailVerified: emailConfirmed,
      extraDocuments,
    });
    setLoading(false);
    if (!submitRes.success) {
      reportError(submitRes.error);
      return;
    }
    toast.success("Vérification soumise. Vous serez notifié sous 48 h.");
    router.push("/verify-identity");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <Stepper current={step} />
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {step === 1 && (
          <Step1Email
            email={email}
            emailConfirmed={emailConfirmed}
            resending={resending}
            resent={resent}
            onResend={handleResendEmail}
          />
        )}

        {step === 2 && (
          <Step2Documents
            docType={docType}
            setDocType={setDocType}
            docNumber={docNumber}
            setDocNumber={setDocNumber}
            frontFile={frontFile}
            setFrontFile={setFrontFile}
            backFile={backFile}
            setBackFile={setBackFile}
          />
        )}

        {step === 3 && (
          <Step3SelfieAndExtras
            selfieFile={selfieFile}
            setSelfieFile={setSelfieFile}
            extraSpecs={extraSpecs}
            extraFiles={extraFiles}
            setExtraFile={(kind, file) =>
              setExtraFiles((prev) => ({ ...prev, [kind]: file }))
            }
            recap={{
              email,
              emailConfirmed,
              docLabel: DOC_LABELS[docType],
            }}
          />
        )}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex justify-between gap-2 pt-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            disabled={step === 1 || loading}
          >
            Précédent
          </Button>

          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              className="bg-kaza-blue hover:bg-kaza-blue/90"
            >
              Continuer
            </Button>
          ) : step === 2 ? (
            <Button
              onClick={handleUploadDocs}
              disabled={loading}
              className="bg-kaza-blue hover:bg-kaza-blue/90"
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Continuer
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !selfieFile}
              className="bg-kaza-green hover:bg-kaza-green/90"
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Soumettre pour vérification
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        const Icon = s.icon;
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
                  done && "border-kaza-green bg-kaza-green text-white",
                  active && "border-kaza-blue bg-kaza-blue text-white",
                  !done && !active && "border-muted bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-4" />}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active && "text-foreground",
                  !active && "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition",
                  done ? "bg-kaza-green" : "bg-muted",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Step1Email({
  email,
  emailConfirmed,
  resending,
  resent,
  onResend,
}: {
  email: string;
  emailConfirmed: boolean;
  resending: boolean;
  resent: boolean;
  onResend: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Votre adresse email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Votre identité est rattachée à l&apos;email de votre compte KAZA.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email du compte</Label>
        <Input id="email" type="email" value={email} disabled readOnly />
      </div>

      {emailConfirmed ? (
        <div className="flex items-center gap-2 rounded-lg border border-kaza-green/30 bg-kaza-green/5 px-3 py-2.5 text-sm font-medium text-kaza-green">
          <Check className="size-4" />
          Email vérifié
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-sm text-amber-800">
            Votre email n&apos;est pas encore confirmé. Confirmez-le pour
            renforcer la sécurité de votre compte. Vous pouvez tout de même
            poursuivre la vérification de vos documents.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResend}
            disabled={resending}
          >
            {resending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Mail className="mr-2 size-4" />
            )}
            {resent
              ? "Renvoyer à nouveau"
              : "Renvoyer l'email de confirmation"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Step2Documents({
  docType,
  setDocType,
  docNumber,
  setDocNumber,
  frontFile,
  setFrontFile,
  backFile,
  setBackFile,
}: {
  docType: DocType;
  setDocType: (d: DocType) => void;
  docNumber: string;
  setDocNumber: (s: string) => void;
  frontFile: File | null;
  setFrontFile: (f: File | null) => void;
  backFile: File | null;
  setBackFile: (f: File | null) => void;
}) {
  const needsBack = docType !== "passport";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Vos documents officiels</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pièces acceptées : carte nationale, passeport, permis ou carte d&apos;électeur.
          Images (JPG/PNG) ou PDF, 5 Mo max. Vous pouvez choisir un fichier
          depuis votre galerie ou votre appareil.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="doc-type">Type de pièce</Label>
          <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
            <SelectTrigger id="doc-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOC_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc-number">Numéro (optionnel)</Label>
          <Input
            id="doc-number"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder="Ex : A1234567"
          />
        </div>
      </div>

      <FileDrop
        label="Recto de la pièce"
        file={frontFile}
        onChange={setFrontFile}
        required
      />

      {needsBack ? (
        <FileDrop
          label="Verso de la pièce"
          file={backFile}
          onChange={setBackFile}
          required
        />
      ) : null}
    </div>
  );
}

function Step3SelfieAndExtras({
  selfieFile,
  setSelfieFile,
  extraSpecs,
  extraFiles,
  setExtraFile,
  recap,
}: {
  selfieFile: File | null;
  setSelfieFile: (f: File | null) => void;
  extraSpecs: ExtraDocSpec[];
  extraFiles: Partial<Record<ExtraDocumentKind, File | null>>;
  setExtraFile: (kind: ExtraDocumentKind, file: File | null) => void;
  recap: { email: string; emailConfirmed: boolean; docLabel: string };
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Selfie de confirmation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Prenez ou choisissez un selfie en tenant votre pièce d&apos;identité
          visible à côté de votre visage. Cela nous aide à confirmer que vous
          êtes bien la personne sur la pièce.
        </p>
      </div>

      <FileDrop
        label="Votre selfie avec la pièce"
        file={selfieFile}
        onChange={setSelfieFile}
        required
      />

      {extraSpecs.length > 0 ? (
        <div className="space-y-4 border-t pt-4">
          <div>
            <h3 className="text-base font-semibold">Documents administratifs</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Selon votre profil, ces justificatifs accélèrent la validation de
              votre dossier.
            </p>
          </div>
          {extraSpecs.map((spec) => (
            <FileDrop
              key={spec.kind}
              label={spec.label}
              hint={spec.hint}
              file={extraFiles[spec.kind] ?? null}
              onChange={(f) => setExtraFile(spec.kind, f)}
              required={spec.required}
            />
          ))}
        </div>
      ) : null}

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-2 text-sm font-medium">Récapitulatif</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            Email : <span className="font-medium text-foreground">{recap.email}</span>
            {recap.emailConfirmed ? (
              <Check className="ml-1 inline size-3.5 text-kaza-green" />
            ) : (
              <span className="ml-1 text-xs text-amber-600">(non confirmé)</span>
            )}
          </li>
          <li>
            Type de pièce : <span className="font-medium text-foreground">{recap.docLabel}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function FileDrop({
  label,
  hint,
  file,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg border-2 border-dashed p-4 text-left transition",
          file
            ? "border-kaza-green/40 bg-kaza-green/5"
            : "border-muted-foreground/30 hover:border-kaza-blue hover:bg-kaza-blue/5",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Upload className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          {file ? (
            <>
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} Mo — cliquez pour remplacer
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">
                Choisir un fichier (galerie ou appareil)
              </p>
              <p className="text-xs text-muted-foreground">
                {hint ?? "Image (JPG, PNG) ou PDF, 5 Mo max"}
              </p>
            </>
          )}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
