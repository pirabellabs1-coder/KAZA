"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  Heart,
  Globe,
  ChevronDown,
  Home,
  Building2,
  Hotel,
  Castle,
  Users,
  Map,
  Search,
  GitCompare,
  Briefcase,
  Crown,
  Handshake,
  HelpCircle,
  LifeBuoy,
  ShieldCheck,
  Phone,
  Newspaper,
  Activity,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CountryFlag } from "@/components/shared/country-flag";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn, getInitials } from "@/lib/utils";
import { logout } from "@/actions/auth";

// ---------------------------------------------------------------------------
// Structure des sous-menus (mega-menu desktop, accordéon mobile)
// ---------------------------------------------------------------------------

interface SubItem {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  badge?: string;
}

interface MegaColumn {
  title: string;
  items: SubItem[];
}

interface MegaSection {
  label: string;
  href?: string;
  columns: MegaColumn[];
  cta?: { href: string; label: string; description: string };
}

const MEGA_MENU: MegaSection[] = [
  {
    label: "Découvrir",
    columns: [
      {
        title: "Trouver un logement",
        items: [
          {
            href: "/properties",
            label: "Toutes les propriétés",
            description: "Catalogue complet vérifié",
            icon: Building2,
          },
          {
            href: "/maisons",
            label: "Maisons",
            description: "Familles et grands espaces",
            icon: Home,
          },
          {
            href: "/appartements",
            label: "Appartements",
            description: "Studios, T2, T3 et plus",
            icon: Hotel,
          },
          {
            href: "/search?type=VILLA",
            label: "Villas",
            description: "Standing & prestige",
            icon: Castle,
          },
          {
            href: "/student-living",
            label: "Colocation étudiante",
            description: "Vivre à plusieurs",
            icon: Users,
            badge: "Étudiant",
          },
        ],
      },
      {
        title: "Outils & recherche",
        items: [
          {
            href: "/search",
            label: "Recherche avancée",
            description: "Filtres, carte, alertes",
            icon: Search,
          },
          {
            href: "/properties/compare",
            label: "Comparateur de biens",
            description: "Confrontez jusqu'à 4 biens",
            icon: GitCompare,
          },
          {
            href: "/neighborhoods/compare",
            label: "Comparateur de quartiers",
            description: "Sécurité, commerces, écoles",
            icon: Map,
          },
        ],
      },
    ],
    cta: {
      href: "/search",
      label: "Lancer une recherche",
      description: "Annonces vérifiées en Afrique de l'Ouest",
    },
  },
  {
    label: "Pour les pros",
    columns: [
      {
        title: "Solutions professionnelles",
        items: [
          {
            href: "/pro",
            label: "KAZA Pro",
            description: "Outils B2B pour agences immobilières",
            icon: Briefcase,
            badge: "B2B",
          },
          {
            href: "/plus",
            label: "KAZA Plus Premium",
            description: "Visibilité maximale et services prioritaires",
            icon: Crown,
            badge: "Premium",
          },
          {
            href: "/partners",
            label: "Devenir partenaire",
            description: "Notaires, courtiers, prestataires",
            icon: Handshake,
          },
        ],
      },
    ],
    cta: {
      href: "/pro",
      label: "Découvrir KAZA Pro",
      description: "Tableau de bord agence, leads qualifiés, équipe",
    },
  },
  {
    label: "Ressources",
    columns: [
      {
        title: "Aide & accompagnement",
        items: [
          {
            href: "/help",
            label: "Centre d'aide",
            description: "Tutoriels et démarches",
            icon: LifeBuoy,
          },
          {
            href: "/faq",
            label: "Questions fréquentes",
            description: "Toutes les réponses utiles",
            icon: HelpCircle,
          },
          {
            href: "/guide-proprietaire",
            label: "Guide propriétaire",
            description: "Réussir sa mise en location",
            icon: Sparkles,
          },
          {
            href: "/securite",
            label: "Sécurité & confiance",
            description: "Comment KAZA vous protège",
            icon: ShieldCheck,
          },
          {
            href: "/contact",
            label: "Nous contacter",
            description: "Email, téléphone, formulaire",
            icon: Phone,
          },
        ],
      },
      {
        title: "Découvrir l'écosystème",
        items: [
          {
            href: "/blog",
            label: "Blog & actualités",
            description: "Conseils, tendances, marché",
            icon: Newspaper,
          },
          {
            href: "/status",
            label: "Statut plateforme",
            description: "Disponibilité en temps réel",
            icon: Activity,
          },
          {
            href: "/how-it-works",
            label: "Comment ça marche",
            description: "Votre parcours étape par étape",
            icon: GraduationCap,
          },
        ],
      },
    ],
  },
  {
    label: "Entreprise",
    columns: [
      {
        title: "À propos de KAZA",
        items: [
          {
            href: "/about",
            label: "Notre histoire",
            description: "Mission, équipe, valeurs",
            icon: Sparkles,
          },
          {
            href: "/carrieres",
            label: "Carrières",
            description: "Rejoignez l'aventure",
            icon: Briefcase,
            badge: "On recrute",
          },
          {
            href: "/pricing",
            label: "Tarifs",
            description: "Toutes nos formules",
            icon: Crown,
          },
        ],
      },
    ],
  },
];

const QUICK_LINKS: SubItem[] = [
  { href: "/search", label: "Rechercher", icon: Search },
  { href: "/student-living", label: "Colocation", icon: Users, badge: "Étudiant" },
];

// ---------------------------------------------------------------------------
// Composant Navbar
// ---------------------------------------------------------------------------

export interface NavbarUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

function dashboardHref(role: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENCY") return "/agency";
  return "/dashboard";
}

export function Navbar({ user = null }: { user?: NavbarUser | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>(null);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // logout() effectue une redirection serveur ; en cas d'échec on force.
    }
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kaza-navy">
            <span className="text-sm font-bold text-white">K</span>
          </div>
          <span className="font-heading text-xl font-bold text-kaza-navy">
            KAZA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          onMouseLeave={() => setOpenSection(null)}
        >
          {/* Liens directs rapides */}
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-kaza-navy"
            >
              {link.label}
              {link.badge && (
                <span className="rounded-full bg-kaza-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-kaza-green">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Mega-menus */}
          {MEGA_MENU.map((section) => {
            const isActive = openSection === section.label;
            return (
              <div
                key={section.label}
                className="relative"
                onMouseEnter={() => setOpenSection(section.label)}
              >
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-muted text-kaza-navy"
                      : "text-muted-foreground hover:bg-muted hover:text-kaza-navy"
                  )}
                  onClick={() =>
                    setOpenSection(isActive ? null : section.label)
                  }
                  aria-expanded={isActive}
                >
                  {section.label}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 transition-transform",
                      isActive && "rotate-180"
                    )}
                  />
                </button>

                {isActive && (
                  <div
                    className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2"
                    style={{ minWidth: section.columns.length > 1 ? 720 : 380 }}
                  >
                    <div className="rounded-2xl border border-border bg-white p-6 shadow-2xl ring-1 ring-black/5">
                      <div
                        className={cn(
                          "grid gap-8",
                          section.columns.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-1"
                        )}
                      >
                        {section.columns.map((col) => (
                          <div key={col.title}>
                            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {col.title}
                            </h3>
                            <ul className="space-y-1">
                              {col.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <li key={item.href}>
                                    <Link
                                      href={item.href}
                                      onClick={() => setOpenSection(null)}
                                      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-kaza-blue/5"
                                    >
                                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-kaza-navy/5 text-kaza-navy transition-colors group-hover:bg-kaza-blue group-hover:text-white">
                                        <Icon className="size-4" />
                                      </span>
                                      <span className="flex flex-1 flex-col">
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-kaza-navy">
                                          {item.label}
                                          {item.badge && (
                                            <span className="rounded-full bg-kaza-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-kaza-green">
                                              {item.badge}
                                            </span>
                                          )}
                                        </span>
                                        {item.description && (
                                          <span className="text-xs text-muted-foreground">
                                            {item.description}
                                          </span>
                                        )}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {section.cta && (
                        <div className="mt-5 border-t pt-4">
                          <Link
                            href={section.cta.href}
                            onClick={() => setOpenSection(null)}
                            className="flex items-center justify-between rounded-lg bg-gradient-to-r from-kaza-navy to-[#0F2A40] p-4 text-white transition-transform hover:scale-[1.02]"
                          >
                            <div>
                              <div className="text-sm font-semibold">
                                {section.cta.label}
                              </div>
                              <div className="text-xs text-white/70">
                                {section.cta.description}
                              </div>
                            </div>
                            <ChevronDown
                              aria-hidden="true"
                              className="size-4 -rotate-90"
                            />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="icon-sm" aria-label="Langue">
            <Globe className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={user ? "/tenant/saved" : "/login"} aria-label="Favoris">
              <Heart className="size-4" />
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-kaza-navy text-[11px] text-white">
                      {getInitials(user.firstName, user.lastName || " ")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate text-sm font-medium">
                    {user.firstName}
                  </span>
                  <ChevronDown aria-hidden="true" className="size-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardHref(user.role)}>Mon espace</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Mon profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleLogout();
                  }}
                >
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Connexion</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Inscription</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu aria-hidden="true" className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[88vw] max-w-sm overflow-y-auto p-0"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="border-b bg-gradient-to-br from-kaza-navy to-[#0F2A40] px-5 py-6 text-white">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                    <span className="text-sm font-bold text-kaza-navy">K</span>
                  </div>
                  <span className="font-heading text-xl font-bold">KAZA</span>
                </Link>
                <p className="mt-3 text-xs text-white/70">
                  La plateforme immobilière de référence en Afrique de l'Ouest.
                </p>
              </div>

              {/* Liens rapides */}
              <nav className="flex-1 space-y-1 px-3 py-4">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-kaza-navy hover:bg-muted"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="size-4 text-muted-foreground" />
                        {link.label}
                      </span>
                      {link.badge && (
                        <span className="rounded-full bg-kaza-green/10 px-2 py-0.5 text-[10px] font-semibold text-kaza-green">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Accordéons mega-menus */}
                <div className="my-2 h-px bg-border" />
                {MEGA_MENU.map((section) => {
                  const isExpanded = mobileOpenSection === section.label;
                  return (
                    <div
                      key={section.label}
                      className="rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setMobileOpenSection(isExpanded ? null : section.label)
                        }
                        className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-kaza-navy hover:bg-muted"
                        aria-expanded={isExpanded}
                      >
                        {section.label}
                        <ChevronDown
                          aria-hidden="true"
                          className={cn(
                            "size-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                      {isExpanded && (
                        <div className="ml-2 mt-1 space-y-3 border-l-2 border-kaza-blue/20 pl-3 pb-2">
                          {section.columns.map((col) => (
                            <div key={col.title}>
                              <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {col.title}
                              </div>
                              {col.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => {
                                      setIsOpen(false);
                                      setMobileOpenSection(null);
                                    }}
                                    className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground hover:bg-kaza-blue/5"
                                  >
                                    <Icon className="size-4 shrink-0 text-kaza-blue" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                      <span className="rounded-full bg-kaza-green/10 px-1.5 py-0.5 text-[10px] font-semibold text-kaza-green">
                                        {item.badge}
                                      </span>
                                    )}
                                  </Link>
                                );
                              })}
                            </div>
                          ))}
                          {section.cta && (
                            <Link
                              href={section.cta.href}
                              onClick={() => {
                                setIsOpen(false);
                                setMobileOpenSection(null);
                              }}
                              className="mx-2 mt-2 flex items-center justify-between rounded-lg bg-kaza-navy px-3 py-2.5 text-xs font-semibold text-white"
                            >
                              {section.cta.label}
                              <ChevronDown
                                aria-hidden="true"
                                className="size-3.5 -rotate-90"
                              />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Footer du menu mobile */}
              <div className="space-y-2 border-t bg-muted/30 px-4 py-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    Créer mon compte
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-muted-foreground">
                  <CountryFlag code="BJ" className="h-3 w-4" />
                  Made in Bénin · FR
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
