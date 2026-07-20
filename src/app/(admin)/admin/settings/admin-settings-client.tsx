"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Save } from "lucide-react";

import { updatePlatformSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types des groupes de réglages (alignés sur le seed SQL 00026).
// ---------------------------------------------------------------------------

export interface GeneralSettings {
  platformName: string;
  contactEmail: string;
  languages: { fr: boolean; en: boolean; fon: boolean };
  currency: string;
}
export interface PaymentsSettings {
  commission: number;
  minPayment: number;
  escrowDays: number;
}
export interface ModerationSettings {
  autoApprove: boolean;
  reportThreshold: number;
}
export interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface PlatformSettingsInitial {
  general: GeneralSettings;
  payments: PaymentsSettings;
  moderation: ModerationSettings;
  maintenance: MaintenanceSettings;
}

/**
 * Lightweight toggle since shadcn/ui Switch isn't available in this project yet.
 */
function Toggle({
  checked,
  onChange,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-kaza-green" : "bg-gray-300"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

function FormRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr] sm:items-start sm:gap-6">
      <div className="flex flex-col">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function AdminSettingsClient({
  initial,
}: {
  initial: PlatformSettingsInitial;
}) {
  // === General ===
  const [platformName, setPlatformName] = useState(initial.general.platformName);
  const [contactEmail, setContactEmail] = useState(initial.general.contactEmail);
  const [languages, setLanguages] = useState(initial.general.languages);
  const [currency, setCurrency] = useState(initial.general.currency);

  // === Payments ===
  const [commission, setCommission] = useState(String(initial.payments.commission));
  const [minPayment, setMinPayment] = useState(String(initial.payments.minPayment));
  const [escrowDays, setEscrowDays] = useState(String(initial.payments.escrowDays));

  // === Moderation ===
  const [autoApprove, setAutoApprove] = useState(initial.moderation.autoApprove);
  const [reportThreshold, setReportThreshold] = useState(
    String(initial.moderation.reportThreshold)
  );

  // === Maintenance ===
  const [maintenanceMode, setMaintenanceMode] = useState(
    initial.maintenance.maintenanceMode
  );
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    initial.maintenance.maintenanceMessage
  );

  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const save = (key: string, value: Record<string, unknown>) => {
    setPending(key);
    startTransition(async () => {
      const result = await updatePlatformSettings(key, value);
      setPending(null);
      if (result.success) {
        toast.success("Paramètres enregistrés");
      } else {
        toast.error(result.error ?? "Impossible d'enregistrer les paramètres");
      }
    });
  };

  const handleSubmit = (tab: string) => (e: FormEvent) => {
    e.preventDefault();
    if (tab === "general") {
      save("general", { platformName, contactEmail, languages, currency });
    } else if (tab === "payments") {
      save("payments", {
        commission: Number(commission),
        minPayment: Number(minPayment),
        escrowDays: Number(escrowDays),
      });
    } else if (tab === "moderation") {
      save("moderation", {
        autoApprove,
        reportThreshold: Number(reportThreshold),
      });
    } else if (tab === "maintenance") {
      save("maintenance", { maintenanceMode, maintenanceMessage });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Paramètres de la plateforme
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez le comportement global de Kaabo — toutes les modifications
          impactent l&apos;ensemble des utilisateurs.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4">
          <form onSubmit={handleSubmit("general")}>
            <SettingsSection
              title="Informations générales"
              description="Identité et préférences globales de la plateforme."
            >
              <FormRow label="Nom de la plateforme" htmlFor="platform-name">
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </FormRow>
              <FormRow label="Email de contact" htmlFor="contact-email">
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </FormRow>
              <FormRow
                label="Langues activées"
                hint="Langues proposées aux utilisateurs"
              >
                <div className="flex flex-col gap-2">
                  {(
                    [
                      { key: "fr", label: "Français" },
                      { key: "en", label: "Anglais" },
                      { key: "fon", label: "Fon" },
                    ] as const
                  ).map((lang) => (
                    <label
                      key={lang.key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="text-sm">{lang.label}</span>
                      <Toggle
                        checked={languages[lang.key]}
                        onChange={(v) =>
                          setLanguages({ ...languages, [lang.key]: v })
                        }
                      />
                    </label>
                  ))}
                </div>
              </FormRow>
              <FormRow label="Devise par défaut" htmlFor="currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="w-full sm:w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">FCFA (Franc CFA)</SelectItem>
                    <SelectItem value="EUR">Euro</SelectItem>
                    <SelectItem value="USD">Dollar US</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
            </SettingsSection>
            <SaveBar loading={pending === "general"} />
          </form>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="mt-4">
          <form onSubmit={handleSubmit("payments")}>
            <SettingsSection
              title="Configuration des paiements"
              description="Commissions, seuils et délais de l'escrow Kaabo."
            >
              <FormRow
                label="Commission Kaabo (%)"
                htmlFor="commission"
                hint="Pourcentage prélevé sur chaque transaction"
              >
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="w-full sm:w-[160px]"
                />
              </FormRow>
              <FormRow
                label="Seuil minimum (FCFA)"
                htmlFor="min-payment"
                hint="Montant minimum accepté pour un paiement"
              >
                <Input
                  id="min-payment"
                  type="number"
                  min="0"
                  value={minPayment}
                  onChange={(e) => setMinPayment(e.target.value)}
                  className="w-full sm:w-[200px]"
                />
              </FormRow>
              <FormRow
                label="Délai escrow (jours)"
                htmlFor="escrow-days"
                hint="Période avant libération automatique des fonds au propriétaire"
              >
                <Input
                  id="escrow-days"
                  type="number"
                  min="0"
                  max="60"
                  value={escrowDays}
                  onChange={(e) => setEscrowDays(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
              </FormRow>
            </SettingsSection>
            <SaveBar loading={pending === "payments"} />
          </form>
        </TabsContent>

        {/* Moderation */}
        <TabsContent value="moderation" className="mt-4">
          <form onSubmit={handleSubmit("moderation")}>
            <SettingsSection
              title="Règles de modération"
              description="Automatisation et seuils de tolérance pour la modération."
            >
              <FormRow
                label="Auto-approbation des annonces"
                htmlFor="auto-approve"
                hint="Les annonces des propriétaires vérifiés sont publiées sans revue manuelle"
              >
                <div className="flex items-center gap-3">
                  <Toggle
                    id="auto-approve"
                    checked={autoApprove}
                    onChange={setAutoApprove}
                  />
                  <span className="text-sm text-muted-foreground">
                    {autoApprove ? "Activée" : "Désactivée"}
                  </span>
                </div>
              </FormRow>
              <FormRow
                label="Seuil de signalements"
                htmlFor="report-threshold"
                hint="Nombre de signalements avant suspension automatique"
              >
                <Input
                  id="report-threshold"
                  type="number"
                  min="1"
                  value={reportThreshold}
                  onChange={(e) => setReportThreshold(e.target.value)}
                  className="w-full sm:w-[140px]"
                />
              </FormRow>
            </SettingsSection>
            <SaveBar loading={pending === "moderation"} />
          </form>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="mt-4">
          <form onSubmit={handleSubmit("maintenance")}>
            <SettingsSection
              title="Mode maintenance"
              description="Coupez l'accès public à la plateforme pour effectuer des opérations critiques."
            >
              <FormRow
                label="Mode maintenance"
                htmlFor="maintenance-mode"
                hint="Lorsque activé, seuls les administrateurs peuvent se connecter"
              >
                <div className="flex items-center gap-3">
                  <Toggle
                    id="maintenance-mode"
                    checked={maintenanceMode}
                    onChange={setMaintenanceMode}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      maintenanceMode ? "text-kaza-error" : "text-muted-foreground"
                    )}
                  >
                    {maintenanceMode ? "ACTIF" : "Inactif"}
                  </span>
                </div>
              </FormRow>
              <FormRow
                label="Message affiché"
                htmlFor="maintenance-message"
                hint="Visible par tous les visiteurs"
              >
                <Textarea
                  id="maintenance-message"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={3}
                />
              </FormRow>
            </SettingsSection>
            <SaveBar loading={pending === "maintenance"} />
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SaveBar({ loading }: { loading: boolean }) {
  return (
    <div className="mt-4 flex justify-end">
      <Button type="submit" className="gap-2" disabled={loading}>
        <Save className="size-4" />
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
