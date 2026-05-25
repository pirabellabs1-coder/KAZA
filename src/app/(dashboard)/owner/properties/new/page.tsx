import type { Metadata } from "next";
import { NewPropertyForm } from "./new-property-form";

export const metadata: Metadata = {
  title: "Ajouter un bien",
};

export default function NewPropertyPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-6 px-0 sm:px-2">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Ajouter un bien
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publiez votre bien sur KAZA et trouvez des locataires qualifies.
        </p>
      </div>

      <NewPropertyForm />
    </div>
  );
}
