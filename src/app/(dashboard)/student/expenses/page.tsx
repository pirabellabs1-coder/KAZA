import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listStudentGroups,
  getGroupExpenses,
} from "@/lib/queries/student-expenses";

import { ExpensesView } from "./expenses-view";

export const metadata: Metadata = {
  title: "Frais Partagés — KAZA",
  description:
    "Suivez et répartissez les dépenses de votre colocation entre colocataires.",
};

export const dynamic = "force-dynamic";

export default async function StudentExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/student/expenses");

  const groups = await listStudentGroups(user.id);
  const params = await searchParams;
  const selected =
    groups.find((g) => g.id === params.group) ?? groups[0] ?? null;

  const data = selected
    ? await getGroupExpenses(selected.id, user.id, selected.members)
    : null;

  return (
    <ExpensesView
      userId={user.id}
      groups={groups}
      selectedGroupId={selected?.id ?? ""}
      data={data}
    />
  );
}
