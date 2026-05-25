import "server-only";

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, FileText, Home } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ContractStatusBadge,
  type ContractStatus,
} from "@/components/contracts/contract-status-badge";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes Contrats",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fullAddress(p: any): string {
  return [p?.address_line, p?.city, p?.country].filter(Boolean).join(", ");
}

export default async function ContractsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS limite déjà aux contrats où l'user est tenant OU owner du rental.
  const { data: contracts, error } = await supabase
    .from("contracts")
    .select(
      `id, status, created_at, signed_at, contract_type,
       rental:rentals!contracts_rental_id_fkey(
         id, monthly_rent, start_date, end_date,
         property:properties!rentals_property_id_fkey(
           id, title, address_line, city, country
         )
       )`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[contracts/page] fetch échec:", error);
  }

  const list = contracts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes Contrats
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez ici tous vos baux générés par KAZA et leur statut de
          signature.
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun contrat pour le moment"
          description="Lorsqu'une location sera confirmée, le contrat correspondant apparaîtra ici."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const r: any = c.rental;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p: any = r?.property;
            const rent = Number(r?.monthly_rent ?? 0);

            return (
              <Card key={c.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        Contrat #{c.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-1">
                        {p?.title ?? "Bien immobilier"}
                      </CardDescription>
                    </div>
                    <ContractStatusBadge
                      status={c.status as ContractStatus}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Home className="mt-0.5 size-4 shrink-0 text-kaza-blue" />
                    <span className="line-clamp-2">{fullAddress(p)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0 text-kaza-blue" />
                    <span>
                      Créé le{" "}
                      {new Date(c.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {rent > 0 && (
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-kaza-blue" />
                      <span>{formatPrice(rent)} / mois</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant="default">
                    <Link href={`/contracts/${c.id}`}>Voir le contrat</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
