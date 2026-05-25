import type { Metadata } from "next";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Mon Profil",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mon Profil
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez vos informations personnelles et votre vérification d&apos;identité
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
