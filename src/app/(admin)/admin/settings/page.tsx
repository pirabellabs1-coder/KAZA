"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Lightweight toggle since shadcn/ui Switch isn't available in this project yet.
 */
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

export default function AdminSettingsPage() {
  // === General ===
  const [platformName, setPlatformName] = useState("KAZA");
  const [contactEmail, setContactEmail] = useState("contact@kaza.africa");
  const [languages, setLanguages] = useState({ fr: true, en: false, fon: false });
  const [currency, setCurrency] = useState("XOF");

  // === Payments ===
  const [commission, setCommission] = useState("5");
  const [minPayment, setMinPayment] = useState("5000");
  const [escrowDays, setEscrowDays] = useState("7");

  // === Notifications ===
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);

  // === Moderation ===
  const [autoApprove, setAutoApprove] = useState(false);
  const [reportThreshold, setReportThreshold] = useState("5");

  // === Maintenance ===
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "Plateforme en cours de maintenance. Nous serons de retour très bientôt."
  );

  const handleSubmit = (tab: string) => (e: FormEvent) => {
    e.preventDefault();
    const payloads = {
      general: { platformName, contactEmail, languages, currency },
      payments: { commission, minPayment, escrowDays },
      notifications: { emailNotifs, smsNotifs, pushNotifs },
      moderation: { autoApprove, reportThreshold },
      maintenance: { maintenanceMode, maintenanceMessage },
    };
    console.log(
      `[admin settings] Enregistrement ${tab}:`,
      payloads[tab as keyof typeof payloads]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Paramètres de la plateforme
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez le comportement global de KAZA — toutes les modifications
          impactent l&apos;ensemble des utilisateurs.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
            <SaveBar />
          </form>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="mt-4">
          <form onSubmit={handleSubmit("payments")}>
            <SettingsSection
              title="Configuration des paiements"
              description="Commissions, seuils et délais de l'escrow KAZA."
            >
              <FormRow
                label="Commission KAZA (%)"
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
            <SaveBar />
          </form>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <form onSubmit={handleSubmit("notifications")}>
            <SettingsSection
              title="Canaux de notification"
              description="Activez ou désactivez les canaux de communication système."
            >
              <FormRow label="Emails (Resend)" htmlFor="notif-email">
                <div className="flex items-center gap-3">
                  <Toggle
                    id="notif-email"
                    checked={emailNotifs}
                    onChange={setEmailNotifs}
                  />
                  <span className="text-sm text-muted-foreground">
                    Confirmations, reçus, alertes
                  </span>
                </div>
              </FormRow>
              <FormRow label="SMS (Twilio)" htmlFor="notif-sms">
                <div className="flex items-center gap-3">
                  <Toggle
                    id="notif-sms"
                    checked={smsNotifs}
                    onChange={setSmsNotifs}
                  />
                  <span className="text-sm text-muted-foreground">
                    Codes OTP, rappels urgents
                  </span>
                </div>
              </FormRow>
              <FormRow label="Push (Firebase)" htmlFor="notif-push">
                <div className="flex items-center gap-3">
                  <Toggle
                    id="notif-push"
                    checked={pushNotifs}
                    onChange={setPushNotifs}
                  />
                  <span className="text-sm text-muted-foreground">
                    Notifications mobiles temps réel
                  </span>
                </div>
              </FormRow>
            </SettingsSection>
            <SaveBar />
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
            <SaveBar />
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
            <SaveBar />
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SaveBar() {
  return (
    <div className="mt-4 flex justify-end">
      <Button type="submit" className="gap-2">
        <Save className="size-4" />
        Enregistrer
      </Button>
    </div>
  );
}
