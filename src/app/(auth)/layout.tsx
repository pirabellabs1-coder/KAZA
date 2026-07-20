import Link from "next/link";
import Image from "next/image";

const AUTH_BG_IMAGE =
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1920&q=80";

const AUTH_QUOTE = {
  text: "La plus grande plateforme d'immobilier en Afrique. Annonces vérifiées, paiements sécurisés et contrats numériques — partout sur le continent.",
  author: "Kaabo",
  role: "Louez, en toute confiance",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Image gauche (desktop uniquement) */}
      <aside className="relative hidden lg:flex lg:w-1/2 xl:w-2/5">
        <Image
          src={AUTH_BG_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-kaza-navy/60 to-kaza-navy/90" />

        {/* Logo en haut à gauche */}
        <div className="absolute left-8 top-8 z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-lg">
            <span className="font-heading text-lg font-bold text-kaza-navy">
              K
            </span>
          </div>
          <Link
            href="/"
            className="font-heading text-2xl font-bold text-white transition-opacity hover:opacity-90"
          >
            Kaabo
          </Link>
        </div>

        {/* Citation en bas */}
        <div className="relative z-10 mt-auto flex w-full flex-col p-10 text-white">
          <div className="max-w-md space-y-4">
            <span
              aria-hidden
              className="block font-heading text-6xl leading-none text-white/40"
            >
              &ldquo;
            </span>
            <p className="font-heading text-2xl leading-snug">
              {AUTH_QUOTE.text}
            </p>
            <div className="border-l-2 border-kaza-green pl-3">
              <p className="font-semibold">{AUTH_QUOTE.author}</p>
              <p className="text-sm text-white/70">{AUTH_QUOTE.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Form droite */}
      <main className="flex flex-1 flex-col bg-white">
        {/* Mobile : bandeau image compact en haut */}
        <div className="relative h-32 w-full overflow-hidden lg:hidden">
          <Image
            src={AUTH_BG_IMAGE}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-kaza-navy/80" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white shadow">
              <span className="font-heading text-sm font-bold text-kaza-navy">
                K
              </span>
            </div>
            <Link
              href="/"
              className="font-heading text-lg font-bold text-white"
            >
              Kaabo
            </Link>
          </div>
        </div>

        {/* Lien retour discret */}
        <div className="flex justify-end px-6 pt-6 lg:px-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-kaza-blue"
          >
            ← Retour au site
          </Link>
        </div>

        {/* Form centré */}
        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Footer auth */}
        <footer className="border-t border-border bg-muted/30 px-6 py-4 text-center text-xs text-muted-foreground lg:px-12">
          © 2026 Kaabo — Tous droits réservés.{" "}
          <Link href="/legal/cgu" className="hover:underline">
            CGU
          </Link>{" "}
          ·{" "}
          <Link href="/legal/confidentialite" className="hover:underline">
            Confidentialité
          </Link>
        </footer>
      </main>
    </div>
  );
}
