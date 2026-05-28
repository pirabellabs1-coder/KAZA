import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { TemplatesEditor } from "./templates-editor";

export default async function AdminEmailTemplatesPage() {
  const admin = await getCurrentDisplayUser();
  const adminEmail = admin?.email ?? "admin@kaza.africa";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Templates d&apos;emails Resend
        </h1>
        <p className="text-sm text-muted-foreground">
          Éditez le sujet et le corps HTML des emails transactionnels envoyés
          via Resend.
        </p>
      </div>

      <TemplatesEditor adminEmail={adminEmail} />
    </div>
  );
}
