"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  Eye,
  MapPin,
  XCircle,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/toast-helper";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";

type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

interface Application {
  id: string;
  property: {
    id: string;
    title: string;
    address: string;
    monthly_rent: number;
    photo_url: string;
  };
  owner: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url?: string | null;
  };
  sentAt: string;
  status: ApplicationStatus;
  message: string;
}

const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app-001",
    property: {
      id: "p-002",
      title: "Villa 4 chambres avec jardin a Calavi",
      address: "Abomey-Calavi, Benin",
      monthly_rent: 300000,
      photo_url: "https://picsum.photos/seed/p2-facade/800/600",
    },
    owner: {
      id: "u-002-owner-jean",
      first_name: "Jean",
      last_name: "Dupont",
      profile_photo_url: null,
    },
    sentAt: "2026-05-15T10:00:00.000Z",
    status: "PENDING",
    message:
      "Bonjour, je suis tres interesse par votre villa pour une location longue duree avec ma famille. Je travaille en CDI depuis 4 ans dans une banque a Cotonou.",
  },
  {
    id: "app-002",
    property: {
      id: "p-004",
      title: "Appartement 3 chambres a Cadjehoun",
      address: "Cadjehoun, Cotonou, Benin",
      monthly_rent: 200000,
      photo_url: "https://picsum.photos/seed/p4-exterieur/800/600",
    },
    owner: {
      id: "u-003-owner-amina",
      first_name: "Amina",
      last_name: "Kone",
      profile_photo_url: null,
    },
    sentAt: "2026-05-12T14:30:00.000Z",
    status: "ACCEPTED",
    message:
      "Bonjour Mme Kone, votre annonce correspond parfaitement a ce que je recherche pour ma famille. Disponible pour une visite des cette semaine.",
  },
  {
    id: "app-003",
    property: {
      id: "p-006",
      title: "Appartement standing a Porto-Novo",
      address: "Ouando, Porto-Novo, Benin",
      monthly_rent: 120000,
      photo_url: "https://picsum.photos/seed/p6-salon/800/600",
    },
    owner: {
      id: "u-003-owner-amina",
      first_name: "Amina",
      last_name: "Kone",
      profile_photo_url: null,
    },
    sentAt: "2026-05-08T09:15:00.000Z",
    status: "REJECTED",
    message:
      "Bonjour, je suis interesse par votre bien. Je peux fournir toutes les garanties necessaires.",
  },
  {
    id: "app-004",
    property: {
      id: "p-005",
      title: "Chambre meublee a Ganhi",
      address: "Ganhi, Cotonou, Benin",
      monthly_rent: 65000,
      photo_url: "https://picsum.photos/seed/p5-facade/800/600",
    },
    owner: {
      id: "u-002-owner-jean",
      first_name: "Jean",
      last_name: "Dupont",
      profile_photo_url: null,
    },
    sentAt: "2026-05-20T16:00:00.000Z",
    status: "PENDING",
    message:
      "Bonjour, je suis etudiant en Master et je recherche une chambre proche du centre. Disponible immediatement.",
  },
  {
    id: "app-005",
    property: {
      id: "p-008",
      title: "Villa avec piscine a Calavi",
      address: "Abomey-Calavi, Benin",
      monthly_rent: 450000,
      photo_url: "https://picsum.photos/seed/p8-exterieur/800/600",
    },
    owner: {
      id: "u-002-owner-jean",
      first_name: "Jean",
      last_name: "Dupont",
      profile_photo_url: null,
    },
    sentAt: "2026-05-22T11:00:00.000Z",
    status: "PENDING",
    message:
      "Bonjour, votre villa nous a tout de suite seduits. Nous sommes une famille de 4 et cherchons une location pour 2 ans minimum.",
  },
];

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "En attente",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Acceptée",
    className: "bg-kaza-green text-white hover:bg-kaza-green/90",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Refusée",
    className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
    icon: XCircle,
  },
};

export default function TenantApplicationsPage() {
  const [applications, setApplications] =
    useState<Application[]>(MOCK_APPLICATIONS);
  const [tab, setTab] = useState<string>("PENDING");

  const counts = useMemo(
    () => ({
      PENDING: applications.filter((a) => a.status === "PENDING").length,
      ACCEPTED: applications.filter((a) => a.status === "ACCEPTED").length,
      REJECTED: applications.filter((a) => a.status === "REJECTED").length,
      ALL: applications.length,
    }),
    [applications],
  );

  const filtered = useMemo(() => {
    if (tab === "ALL") return applications;
    return applications.filter((a) => a.status === tab);
  }, [applications, tab]);

  const handleWithdraw = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    toast.success("Candidature retirée");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Mes candidatures
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez l&apos;état de vos demandes de location auprès des propriétaires.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="PENDING" className="px-4">
            En attente
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.PENDING}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ACCEPTED" className="px-4">
            Acceptées
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.ACCEPTED}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="px-4">
            Refusées
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.REJECTED}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ALL" className="px-4">
            Toutes
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {counts.ALL}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Aucune candidature"
              description="Vous n'avez aucune candidature dans cette catégorie. Parcourez nos annonces pour postuler à un nouveau bien."
              actionLabel="Découvrir des biens"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((app) => {
                const meta = STATUS_META[app.status];
                const StatusIcon = meta.icon;

                return (
                  <Card key={app.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
                          <Image
                            src={app.property.photo_url}
                            alt={app.property.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 176px"
                          />
                          <Badge
                            className={`absolute left-3 top-3 gap-1 ${meta.className}`}
                          >
                            <StatusIcon className="size-3" />
                            {meta.label}
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold leading-tight">
                                {app.property.title}
                              </h3>
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3" />
                                {app.property.address}
                              </div>
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-kaza-blue">
                              {formatPrice(app.property.monthly_rent)}
                              <span className="text-[10px] font-normal text-muted-foreground">
                                /mois
                              </span>
                            </p>
                          </div>

                          <div className="mt-3 flex items-center gap-2 border-t pt-3">
                            <Avatar size="sm">
                              <AvatarImage
                                src={app.owner.profile_photo_url || undefined}
                              />
                              <AvatarFallback className="bg-kaza-navy text-[10px] text-white">
                                {getInitials(
                                  app.owner.first_name,
                                  app.owner.last_name,
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-xs">
                              <p className="font-medium">
                                {app.owner.first_name} {app.owner.last_name}
                              </p>
                              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Send className="size-2.5" />
                                Envoyé le {formatDate(app.sentAt)}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 line-clamp-2 rounded-md bg-muted/40 p-2.5 text-xs italic text-muted-foreground">
                            &ldquo;{app.message}&rdquo;
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/properties/${app.property.id}`}>
                                <Eye className="mr-1.5 size-3.5" />
                                Voir le bien
                              </Link>
                            </Button>
                            {app.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                onClick={() => handleWithdraw(app.id)}
                              >
                                <XCircle className="mr-1.5 size-3.5" />
                                Retirer ma candidature
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
