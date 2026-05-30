import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";

import { OfflineBanner } from "@/components/shared/offline-banner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CookieBanner } from "@/components/shared/cookie-banner";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";
import "@/styles/animations.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KAZA - Immobilier en Afrique",
    template: "%s | KAZA",
  },
  description:
    "La plus grande plateforme d'immobilier en Afrique. Trouvez votre logement idéal partout sur le continent africain.",
  keywords: [
    "immobilier",
    "Afrique",
    "Bénin",
    "location",
    "appartement",
    "maison",
    "colocation",
    "étudiant",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KAZA",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "KAZA",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A3A52",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <OfflineBanner />
        <div className="pb-16 md:pb-0">{children}</div>
        <BottomNav />
        <CookieBanner />
        <Toaster />
      </body>
    </html>
  );
}
