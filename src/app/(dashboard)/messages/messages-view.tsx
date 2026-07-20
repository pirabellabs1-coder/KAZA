"use client";

// =============================================================================
// Kaabo — Vue messagerie (legacy placeholder, non plus utilisée)
//
// La page Messages utilise maintenant `listConversations` côté serveur
// (cf. ./page.tsx). Ce composant reste comme empty state au cas où il
// serait importé ailleurs ; il n'embarque plus de données factices.
// À supprimer lorsque plus aucune référence ne pointe ici.
// =============================================================================

import { MessageSquare } from "lucide-react";

export function MessagesView() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center rounded-xl border bg-card p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-kaza-blue/10">
          <MessageSquare className="size-7 text-kaza-blue" />
        </div>
        <p className="mt-4 font-heading text-base font-semibold text-kaza-navy">
          Aucune conversation
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos échanges avec propriétaires, locataires ou colocataires
          apparaîtront ici dès qu&apos;un premier message sera envoyé.
        </p>
      </div>
    </div>
  );
}
