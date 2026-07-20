import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";

import { OfflineBanner } from "@/components/shared/offline-banner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CookieBanner } from "@/components/shared/cookie-banner";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/json-ld";

import "./globals.css";
import "@/styles/animations.css";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://kaza-jade.vercel.app";

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
  metadataBase: new URL(APP_URL),
  title: {
    default: "Kaabo - Immobilier en Afrique",
    template: "%s | Kaabo",
  },
  description:
    "La plus grande plateforme d'immobilier panafricaine. Louez appartements, maisons et colocations dans 54 pays : Côte d'Ivoire, Nigeria, Sénégal, Ghana, Togo, Kenya, Maroc, Bénin et partout en Afrique.",
  keywords: [
    "immobilier panafricain",
    "immobilier Afrique",
    "location Afrique",
    "Afrique",
    "Côte d'Ivoire",
    "Nigeria",
    "Sénégal",
    "Ghana",
    "Togo",
    "Kenya",
    "Maroc",
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
    title: "Kaabo",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Kaabo",
    url: "/",
    title: "Kaabo - Immobilier en Afrique",
    description:
      "La plus grande plateforme d'immobilier panafricaine. Louez partout en Afrique : appartements, maisons et colocations dans 54 pays.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaabo - Immobilier en Afrique",
    description:
      "La plus grande plateforme d'immobilier panafricaine. Louez partout en Afrique dans 54 pays.",
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
    <html
      lang="fr"
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        <JsonLd baseUrl={APP_URL} />
        <OfflineBanner />
        <div className="pb-16 md:pb-0">{children}</div>
        <BottomNav />
        <CookieBanner />
        <Toaster />
      </body>
    </html>
  );
}
