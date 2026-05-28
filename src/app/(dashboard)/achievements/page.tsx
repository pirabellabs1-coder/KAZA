import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import {
  listAchievementCatalog,
  listUserAchievements,
} from "@/lib/queries/achievements";
import { AchievementsClient } from "./achievements-client";

export const metadata: Metadata = {
  title: "Mes badges KAZA",
  description:
    "Découvrez l'ensemble des badges KAZA, suivez votre progression et collectionnez les récompenses.",
};

export default async function AchievementsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) {
    redirect("/login?redirect=/achievements");
  }

  // Fallback : si la table user_achievements est vide pour ce user, on
  // renvoie quand même tout le catalogue avec unlockedAt = null.
  const [catalog, userAchievements] = await Promise.all([
    listAchievementCatalog(),
    listUserAchievements(user.id),
  ]);

  // Si listUserAchievements renvoie vide (catalog vide), on retombe sur
  // le catalogue brut converti en items "non débloqués".
  const items =
    userAchievements.length > 0
      ? userAchievements
      : catalog.map((c) => ({
          ...c,
          progress: 0,
          target: 1,
          unlockedAt: null as string | null,
        }));

  return (
    <AchievementsClient
      userFirstName={user.firstName}
      achievements={items}
    />
  );
}
