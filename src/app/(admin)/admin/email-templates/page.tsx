import { listEmailTemplates } from "@/lib/queries/email-templates";

import { TemplatesEditor } from "./templates-editor";

export const dynamic = "force-dynamic";

export default async function AdminEmailTemplatesPage() {
  const templates = await listEmailTemplates();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Templates d&apos;emails Resend
        </h1>
        <p className="text-sm text-muted-foreground">
          Consultez et modifiez le sujet et le corps HTML des emails
          transactionnels envoyés via Resend. Les modifications sont persistées
          en base et surchargent les modèles par défaut du code.
        </p>
      </div>

      <TemplatesEditor templates={templates} />
    </div>
  );
}
