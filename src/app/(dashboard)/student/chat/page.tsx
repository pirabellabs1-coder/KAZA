import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Users, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listStudentColocations } from "@/lib/queries/tenant-activity";

export const metadata: Metadata = {
  title: "Chat Colocataires",
};

export const dynamic = "force-dynamic";

export default async function StudentChatPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/student/chat");

  const colocations = await listStudentColocations(user.id).catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Chat colocataires
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Échangez avec les membres de votre colocation.
        </p>
      </div>

      {colocations.length === 0 ? (
        <Card className="rounded-2xl border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Users className="size-10 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold text-kaza-navy">
              Aucune colocation pour le moment
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Rejoignez ou créez une colocation pour discuter avec vos
              colocataires. La messagerie de groupe s&apos;activera automatiquement.
            </p>
            <Button asChild className="mt-2 bg-kaza-blue hover:bg-kaza-blue/90">
              <Link href="/student/roommate-matching">Trouver une colocation</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare className="size-10 text-kaza-blue" />
            <p className="text-sm font-medium text-foreground">
              {colocations.length} colocation{colocations.length > 1 ? "s" : ""} active{colocations.length > 1 ? "s" : ""}
            </p>
            <p className="max-w-md text-xs text-muted-foreground">
              En attendant la messagerie de groupe dédiée, utilisez la
              messagerie KAZA pour contacter individuellement vos colocataires.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/messages">
                Ouvrir la messagerie <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
