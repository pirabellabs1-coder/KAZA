import { StaffTable, type StaffMember } from "./staff-table";

const staffMembers: StaffMember[] = [
  {
    id: "s-001",
    firstName: "Adjowa",
    lastName: "Mensah",
    email: "adjowa.mensah@kaza.africa",
    role: "SUPER_ADMIN",
    jobTitle: "CEO & Co-fondatrice",
    lastLogin: "2026-05-27T08:42:00Z",
    status: "active",
  },
  {
    id: "s-002",
    firstName: "Kossi",
    lastName: "Adebayo",
    email: "kossi.adebayo@kaza.africa",
    role: "SUPER_ADMIN",
    jobTitle: "VP Engineering",
    lastLogin: "2026-05-27T07:15:00Z",
    status: "active",
  },
  {
    id: "s-003",
    firstName: "Kwame",
    lastName: "Asante",
    email: "kwame.asante@kaza.africa",
    role: "ADMIN",
    jobTitle: "Head of Operations",
    lastLogin: "2026-05-26T22:01:00Z",
    status: "active",
  },
  {
    id: "s-004",
    firstName: "Aminata",
    lastName: "Diallo",
    email: "aminata.diallo@kaza.africa",
    role: "ADMIN",
    jobTitle: "Head of Trust & Safety",
    lastLogin: "2026-05-27T09:10:00Z",
    status: "active",
  },
  {
    id: "s-005",
    firstName: "Ibrahima",
    lastName: "Sow",
    email: "ibrahima.sow@kaza.africa",
    role: "ADMIN",
    jobTitle: "Senior UI/UX Designer",
    lastLogin: "2026-05-27T09:55:00Z",
    status: "active",
  },
  {
    id: "s-006",
    firstName: "Nia",
    lastName: "Okafor",
    email: "nia.okafor@kaza.africa",
    role: "MODERATOR",
    jobTitle: "Modératrice senior",
    lastLogin: "2026-05-26T18:30:00Z",
    status: "active",
  },
  {
    id: "s-007",
    firstName: "Yaw",
    lastName: "Mensah",
    email: "yaw.mensah@kaza.africa",
    role: "MODERATOR",
    jobTitle: "Modérateur annonces",
    lastLogin: "2026-05-25T16:42:00Z",
    status: "inactive",
  },
  {
    id: "s-008",
    firstName: "Olamide",
    lastName: "Adeyemi",
    email: "olamide.adeyemi@kaza.africa",
    role: "SUPPORT",
    jobTitle: "Support client Lagos",
    lastLogin: "2026-05-27T06:20:00Z",
    status: "active",
  },
];

export default function AdminStaffPage() {
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
