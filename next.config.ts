import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les uploads photo passent par une server action (FormData). Défaut Next =
  // 1 Mo ; on monte à 12 Mo pour accepter des photos jusqu'à 10 Mo.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  // Les types Supabase doivent être régénérés via `supabase gen types`
  // après chaque migration. En attendant la connexion live à un projet
  // Supabase, on n'échoue pas le build sur les erreurs de typage.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },
};

export default nextConfig;
