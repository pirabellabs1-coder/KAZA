// =============================================================================
// Kaabo - Admin / Modération de contenu
// =============================================================================

import { Building2, MessageSquare, Star } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  FlaggedMessages,
  type FlaggedMessage,
} from "./flagged-messages";

// Pas encore de table `message_reports` ni `review_reports` en base.
// Empty state propre en attendant le branchement Supabase.
const flaggedMessages: FlaggedMessage[] = [];
const flaggedPropertiesCount = 0;
const flaggedReviewsCount = 0;

export default function AdminContentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold text-kaza-navy lg:text-3xl">
          Modération de contenu
        </h1>
        <p className="text-sm text-muted-foreground">
          Examinez les contenus signalés et appliquez les sanctions
          appropriées.
        </p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList>
          <TabsTrigger value="messages">
            <MessageSquare className="size-4" />
            Messages
            {flaggedMessages.length > 0 && (
              <span className="ml-1 rounded-full bg-kaza-error/10 px-1.5 text-[10px] font-bold text-kaza-error">
                {flaggedMessages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Building2 className="size-4" />
            Annonces
            {flaggedPropertiesCount > 0 && (
              <span className="ml-1 rounded-full bg-orange-100 px-1.5 text-[10px] font-bold text-orange-700">
                {flaggedPropertiesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="size-4" />
            Avis
            {flaggedReviewsCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">
                {flaggedReviewsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <FlaggedMessages messages={flaggedMessages} />
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Building2 className="size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              Aucune annonce signalée
            </p>
            <p className="text-xs text-muted-foreground">
              Les signalements d&apos;annonces s&apos;afficheront ici dès qu&apos;un
              utilisateur en remontera.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Star className="size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              Aucun avis signalé
            </p>
            <p className="text-xs text-muted-foreground">
              Les avis signalés par la communauté apparaîtront ici.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
