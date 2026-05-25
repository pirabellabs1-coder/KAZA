"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, FileText, Loader2, Phone, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OtpInput } from "@/components/shared/otp-input";
import { cn } from "@/lib/utils";
import {
  requestPhoneOtp,
  verifyPhoneOtp,
  uploadIdentityFile,
  submitIdentityVerification,
} from "@/actions/verification";
import { toast } from "@/components/ui/toast-helper";

type Step = 1 | 2 | 3;
type DocType = "national_id" | "passport" | "driver_license" | "voter_card";

const DOC_LABELS: Record<DocType, string> = {
  national_id: "Carte nationale d'identité",
  passport: "Passeport",
  driver_license: "Permis de conduire",
  voter_card: "Carte d'électeur",
};

const STEPS: Array<{ id: Step; label: string; icon: typeof Phone }> = [
  { id: 1, label: "Téléphone", icon: Phone },
  { id: 2, label: "Documents", icon: FileText },
  { id: 3, label: "Selfie", icon: Camera },
];

export function VerificationWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [phone, setPhone] = useState("+229 ");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);

  // Step 2 state
  const [docType, setDocType] = useState<DocType>("national_id");
  const [docNumber, setDocNumber] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPath, setFrontPath] = useState<string | null>(null);
  const [backPath, setBackPath] = useState<string | null>(null);

  // Step 3 state
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Resend timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const reportError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const handleRequestOtp = async () => {
    setError(null);
    setLoading(true);
    const res = await requestPhoneOtp(phone);
    setLoading(false);
    if (!res.success) {
      reportError(res.error);
      return;
    }
    setOtpSent(true);
    setResendIn(60);
    toast.success("Code SMS envoyé.");
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setLoading(true);
    const res = await verifyPhoneOtp(phone, otp);
    setLoading(false);
    if (!res.success) {
      reportError(res.error);
      return;
    }
    setPhoneVerified(true);
    toast.success("Numéro vérifié.");
    setStep(2);
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
    setLoading(true);
    const selfieRes = await uploadIdentityFile(selfieFile, "selfie");
    if (!selfieRes.success) {
      setLoading(false);
      reportError(selfieRes.error);
      return;
    }
    setSelfiePath(selfieRes.data!.path);

    const submitRes = await submitIdentityVerification({
      documentType: docType,
      documentNumber: docNumber || undefined,
      documentFrontPath: frontPath!,
      documentBackPath: backPath || undefined,
      selfiePath: selfieRes.data!.path,
      phone,
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
          <Step1Phone
            phone={phone}
            setPhone={setPhone}
            otpSent={otpSent}
            otp={otp}
            setOtp={setOtp}
            resendIn={resendIn}
            loading={loading}
            onRequest={handleRequestOtp}
            onVerify={handleVerifyOtp}
            onResend={() => {
              setOtp("");
              setOtpSent(false);
              handleRequestOtp();
            }}
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
          <Step3Selfie
            selfieFile={selfieFile}
            setSelfieFile={setSelfieFile}
            recap={{
              phone,
              docLabel: DOC_LABELS[docType],
              phoneVerified,
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
            otpSent ? (
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
                className="bg-kaza-blue hover:bg-kaza-blue/90"
              >
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Vérifier le code
              </Button>
            ) : (
              <Button
                onClick={handleRequestOtp}
                disabled={loading || phone.length < 8}
                className="bg-kaza-blue hover:bg-kaza-blue/90"
              >
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Envoyer le code
              </Button>
            )
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

function Step1Phone({
  phone,
  setPhone,
  otpSent,
  otp,
  setOtp,
  resendIn,
  loading,
  onRequest,
  onVerify,
  onResend,
}: {
  phone: string;
  setPhone: (s: string) => void;
  otpSent: boolean;
  otp: string;
  setOtp: (s: string) => void;
  resendIn: number;
  loading: boolean;
  onRequest: () => void;
  onVerify: () => void;
  onResend: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Confirmez votre numéro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nous envoyons un code à 6 chiffres par SMS pour valider votre numéro.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+229 ..."
          disabled={otpSent}
        />
      </div>

      {otpSent ? (
        <div className="space-y-3">
          <Label>Code reçu par SMS</Label>
          <OtpInput value={otp} onChange={setOtp} />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Code envoyé à {phone}.
            </span>
            <button
              type="button"
              onClick={onResend}
              disabled={resendIn > 0 || loading}
              className="font-medium text-kaza-blue hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {resendIn > 0 ? `Renvoyer dans ${resendIn}s` : "Renvoyer le code"}
            </button>
          </div>
        </div>
      ) : null}
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
          Formats JPG/PNG, 5 Mo max.
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

function Step3Selfie({
  selfieFile,
  setSelfieFile,
  recap,
}: {
  selfieFile: File | null;
  setSelfieFile: (f: File | null) => void;
  recap: { phone: string; docLabel: string; phoneVerified: boolean };
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Selfie de confirmation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Prenez un selfie en tenant votre pièce d&apos;identité visible à côté de
          votre visage. Cela nous aide à confirmer que vous êtes bien la personne
          sur la pièce.
        </p>
      </div>

      <FileDrop
        label="Votre selfie avec la pièce"
        file={selfieFile}
        onChange={setSelfieFile}
        required
      />

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-2 text-sm font-medium">Récapitulatif</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            Téléphone vérifié : <span className="font-medium text-foreground">{recap.phone}</span>
            {recap.phoneVerified ? (
              <Check className="ml-1 inline size-3.5 text-kaza-green" />
            ) : null}
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
  file,
  onChange,
  required,
}: {
  label: string;
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
              <p className="text-sm font-medium">Cliquez pour téléverser</p>
              <p className="text-xs text-muted-foreground">JPG ou PNG, 5 Mo max</p>
            </>
          )}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
