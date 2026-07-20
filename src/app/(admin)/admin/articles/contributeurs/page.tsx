import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { listUsersForContributors } from "@/lib/queries/contributors";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { ContributorToggle } from "./contributor-toggle";

export const metadata: Metadata = { title: "Contributeurs — Admin Kaabo" };
export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  AGENCY: "Agence",
  OWNER: "Propriétaire",
  TENANT: "Locataire",
  STUDENT: "Étudiant",
};

export default async function ContributorsPage() {
  const users = await listUsersForContributors();
  const contributors = users.filter((u) => u.isContributor).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Retour aux articles
        </Link>
        <h1 className="mt-2 flex items-center gap-2 font-heading text-2xl font-bold text-kaza-navy">
          <Users className="size-6 text-kaza-blue" />
          Contributeurs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accordez le droit de rédiger des articles. Un contributeur gère ses
          propres articles depuis l&apos;espace rédaction.{" "}
          {contributors} contributeur{contributors > 1 ? "s" : ""} actif
          {contributors > 1 ? "s" : ""}.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3 text-right">Contributeur</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => {
                  const isAdmin = u.role === "ADMIN";
                  return (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-kaza-navy">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin ? (
                          <Badge className="border-0 bg-kaza-blue/10 text-kaza-blue">
                            Tous droits
                          </Badge>
                        ) : (
                          <ContributorToggle
                            userId={u.id}
                            initial={u.isContributor}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
