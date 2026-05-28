// =============================================================================
// KAZA - Admin / Modération de contenu (mode démo)
// Wave 9 - Yaw Boateng
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

const flaggedMessages: FlaggedMessage[] = [
  {
    id: "MSG-9821",
    author: "Karim Lawal",
    authorEmail: "karim.lawal@gmail.com",
    excerpt:
      "Si tu ne baisses pas ton prix, je vais signaler ton annonce partout sur les réseaux !",
    flagReason: "Menaces / harcèlement",
    flaggedBy: "Mariam Bio",
    flaggedAt: "2026-05-26T11:24:00Z",
  },
  {
    id: "MSG-9820",
    author: "Pierre Hounsou",
    authorEmail: "p.hounsou@yahoo.fr",
    excerpt:
      "Appelle-moi directement sur WhatsApp +229 97 XX XX XX, on évite KAZA pour les frais.",
    flagReason: "Contournement de la plateforme",
    flaggedBy: "Aminata Sow",
    flaggedAt: "2026-05-26T09:08:00Z",
  },
  {
    id: "MSG-9819",
    author: "Anonyme123",
    authorEmail: "anon123@temp-mail.org",
    excerpt: "Salut beauté, ton profil m'a plu, on peut se voir en privé ?",
    flagReason: "Contenu inapproprié / drague",
    flaggedBy: "Fatima Adjovi",
    flaggedAt: "2026-05-25T22:14:00Z",
  },
  {
    id: "MSG-9818",
    author: "Eric Tchégoun",
    authorEmail: "eric.t@orange.bj",
    excerpt:
      "Cette annonce est une arnaque, le proprio n'existe même pas, NE PAYEZ PAS !",
    flagReason: "Diffamation",
    flaggedBy: "Mariam Bio",
    flaggedAt: "2026-05-25T18:50:00Z",
  },
  {
    id: "MSG-9817",
    author: "Spam_user_42",
    authorEmail: "promo42@spam.com",
    excerpt:
      "🔥 PROMO crédit immobilier 0% — cliquez ici → http://bit.ly/xxx",
    flagReason: "Spam / publicité externe",
    flaggedBy: "Système anti-spam",
    flaggedAt: "2026-05-25T14:32:00Z",
  },
  {
    id: "MSG-9816",
    author: "Moussa Adékambi",
    authorEmail: "moussa.a@gmail.com",
    excerpt: "Les étudiants comme toi ne sont pas les bienvenus dans mon immeuble.",
    flagReason: "Discrimination",
    flaggedBy: "Lucie Houessou",
    flaggedAt: "2026-05-25T10:05:00Z",
  },
  {
    id: "MSG-9815",
    author: "Sébastien Aho",
    authorEmail: "seb.aho@gmail.com",
    excerpt: "Tu peux me prêter 50 000 CFA, je te rembourse à la fin du mois...",
    flagReason: "Sollicitation financière",
    flaggedBy: "Yvonne Dossou",
    flaggedAt: "2026-05-24T16:48:00Z",
  },
  {
    id: "MSG-9814",
    author: "JohnDoe",
    authorEmail: "j.doe@fake.com",
    excerpt:
      "Compte officiellement vérifié — payez 5 000 FCFA pour réserver maintenant.",
    flagReason: "Tentative d'escroquerie",
    flaggedBy: "Pascal Agbo",
    flaggedAt: "2026-05-24T13:21:00Z",
  },
  {
    id: "MSG-9813",
    author: "Rose Akpovi",
    authorEmail: "rose.akpovi@hotmail.com",
    excerpt:
      "Insulte explicite + insultes répétées sur le profil de l'utilisateur.",
    flagReason: "Langage insultant",
    flaggedBy: "Antoine Zinsou",
    flaggedAt: "2026-05-24T09:12:00Z",
  },
  {
    id: "MSG-9812",
    author: "Karim Lawal",
    authorEmail: "karim.lawal@gmail.com",
    excerpt:
      "Tu fais partie d'une mauvaise communauté, je ne te louerai jamais cet appart.",
    flagReason: "Discrimination ethnique",
    flaggedBy: "Béatrice Codjia",
    flaggedAt: "2026-05-23T20:38:00Z",
  },
];

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
            <span className="ml-1 rounded-full bg-kaza-error/10 px-1.5 text-[10px] font-bold text-kaza-error">
              {flaggedMessages.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Building2 className="size-4" />
            Annonces
            <span className="ml-1 rounded-full bg-orange-100 px-1.5 text-[10px] font-bold text-orange-700">
              4
            </span>
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="size-4" />
            Avis
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">
              2
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <FlaggedMessages messages={flaggedMessages} />
        </TabsContent>

        <TabsContent value="properties" className="mt-6">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Building2 className="size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              4 annonces signalées
            </p>
            <p className="text-xs text-muted-foreground">
              Module en cours de finalisation — consultez la liste depuis{" "}
              <span className="font-medium">/admin/properties</span> en
              attendant.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <Star className="size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              2 avis signalés
            </p>
            <p className="text-xs text-muted-foreground">
              Module en cours de finalisation.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
