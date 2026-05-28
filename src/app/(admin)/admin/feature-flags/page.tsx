import { FlagsList } from "./flags-list";

export default function AdminFeatureFlagsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Feature Flags
        </h1>
        <p className="text-sm text-muted-foreground">
          Activez ou désactivez des fonctionnalités en production et contrôlez
          le pourcentage de rollout par environnement.
        </p>
      </div>

      <FlagsList />
    </div>
  );
}
