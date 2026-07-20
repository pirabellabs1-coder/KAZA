import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";

import {
  getAdminUserById,
  listAllProperties,
} from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

// =============================================================================
// Kaabo — Fiche utilisateur (espace admin / centre de contrôle)
// =============================================================================

const ROLE_LABELS: Record<string, string> = {
  TENANT: "Locataire",
  OWNER: "Propriétaire",
  STUDENT: "Étudiant",
  ADMIN: "Administrateur",
  AGENCY: "Agence",
};

const VERIF_BADGE: Record<string, { label: string; className: string }> = {
  APPROVED: {
    label: "Vérifié",
    className: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },
  PENDING: {
    label: "En attente",
    className: "border-amber-200 bg-amber-100 text-amber-800",
  },
  REJECTED: {
    label: "Rejeté",
    className: "border-red-200 bg-red-100 text-red-800",
  },
  UNVERIFIED: {
    label: "Non vérifié",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserById(id);
  if (!user) notFound();

  const allProps = await listAllProperties({ limit: 500 });
  const userProps = allProps.filter((p) => p.owner?.id === id);

  const verif = VERIF_BADGE[user.verificationStatus] ?? VERIF_BADGE.UNVERIFIED;
  const fullName = `${user.firstName} ${user.lastName}`.trim() || "Utilisateur";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/users">
          <ArrowLeft className="mr-1 size-4" />
          Retour aux utilisateurs
        </Link>
      </Button>

      {/* En-tête profil */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-5">
        <div className="flex size-16 items-center justify-center rounded-full bg-kaza-navy text-xl font-bold text-white">
          {(user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase() ||
            "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-kaza-navy">
              {fullName}
            </h1>
            <Badge variant="secondary">
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            <Badge className={verif.className}>
              <ShieldCheck className="mr-1 size-3" />
              {verif.label}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ID #{user.id.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Info icon={Mail} label="Email" value={user.email || "—"} />
        <Info icon={Phone} label="Téléphone" value={user.phone || "—"} />
        <Info icon={MapPin} label="Adresse" value={user.address || "—"} />
        <Info
          icon={Star}
          label="Note moyenne"
          value={
            user.ratingAverage != null
              ? `${user.ratingAverage.toFixed(1)} / 5`
              : "—"
          }
        />
        <Info
          icon={Calendar}
          label="Inscrit le"
          value={formatDate(user.createdAt)}
        />
      </div>

      {/* Annonces de l'utilisateur */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-kaza-navy">
          <Building2 className="size-5" />
          Annonces ({userProps.length})
        </h2>
        {userProps.length === 0 ? (
          <p className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Cet utilisateur n&apos;a publié aucune annonce.
          </p>
        ) : (
          <div className="space-y-2">
            {userProps.map((p) => (
              <Link
                key={p.id}
                href={`/admin/properties/${p.id}`}
                className="flex items-center gap-3 rounded-xl border bg-white p-2 transition-colors hover:bg-muted/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.primaryPhotoUrl}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(p.price)} · {p.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-white p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-kaza-blue" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-kaza-navy">{value}</p>
      </div>
    </div>
  );
}
