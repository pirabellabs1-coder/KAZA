import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listSurveysWithStatus,
  type SurveyWithStatus,
} from "@/lib/queries/surveys";
import { SurveysClient } from "./surveys-client";

export const metadata: Metadata = {
  title: "Vos avis comptent",
  description:
    "Repondez aux sondages KAZA et aidez-nous a ameliorer votre experience. Chaque sondage rapporte des KAZA Points.",
};

export default async function SurveysPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/surveys");
  }

  let surveys: SurveyWithStatus[] = [];
  try {
    surveys = await listSurveysWithStatus(user.id);
  } catch {
    surveys = [];
  }

  return <SurveysClient userFirstName={user.firstName} surveys={surveys} />;
}
