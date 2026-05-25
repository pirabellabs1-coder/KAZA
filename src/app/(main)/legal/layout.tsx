import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="border-b border-border bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-4 lg:px-8">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-foreground">
              Accueil
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground font-medium">Mentions légales</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:gap-12">
          {children}
        </div>
      </div>

      <footer className="border-t border-border bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground lg:px-8">
          Dernière mise à jour : 25 mai 2026
        </div>
      </footer>
    </div>
  );
}
