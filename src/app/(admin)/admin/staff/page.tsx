import { listAllUsers } from "@/lib/queries/admin";
import { StaffTable, type StaffMember } from "./staff-table";

// Toujours afficher l'état réel de la base.
export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  // L'équipe KAZA = users avec role=ADMIN dans la base.
  // Quand des rôles plus fins seront introduits (SUPER_ADMIN / MODERATOR /
  // SUPPORT), il faudra mapper depuis le champ correspondant.
  const adminUsers = await listAllUsers({ role: "ADMIN", limit: 200 });

  const staffMembers: StaffMember[] = adminUsers.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: "ADMIN",
    jobTitle: "Administrateur KAZA",
    lastLogin: u.updatedAt,
    status: "active",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Équipe KAZA Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez les membres de l&apos;équipe, leurs rôles et leurs accès à
          l&apos;espace administrateur.
        </p>
      </div>

      <StaffTable rows={staffMembers} />
    </div>
  );
}
