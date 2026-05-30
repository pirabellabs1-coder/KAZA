import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listAgencyMandates,
  listAgencyPropertyOptions,
} from "@/lib/queries/agency-b2b";

import { MandatesView } from "./mandates-view";

export const metadata: Metadata = {
  title: "Mandats propriétaires — KAZA Pro",
  description:
    "Gérez vos contrats de mandat avec les propriétaires mandants et leurs commissions.",
};

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["AGENCY", "ADMIN"]);

export default async function AgencyMandatesPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login");
  if (!ALLOWED.has(user.role)) redirect("/dashboard");

  const [mandates, properties] = await Promise.all([
    listAgencyMandates(user.id),
    listAgencyPropertyOptions(user.id),
  ]);

  return <MandatesView mandates={mandates} properties={properties} />;
}
