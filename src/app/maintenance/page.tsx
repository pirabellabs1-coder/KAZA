import type { Metadata } from "next";
import { Wrench } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Maintenance en cours — KAZA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DEFAULT_MESSAGE =
  "KAZA est temporairement en maintenance pour améliorer votre expérience. Nous revenons très vite. Merci de votre patience.";

export default async function MaintenancePage() {
  let message = DEFAULT_MESSAGE;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "maintenance")
      .maybeSingle();
    const value = (data?.value ?? {}) as {
      maintenanceMessage?: string;
      maintenanceMode?: boolean;
    };
    if (value.maintenanceMessage && value.maintenanceMessage.trim().length > 0) {
      message = value.maintenanceMessage;
    }
  } catch {
    // garde le message par défaut
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-kaza-navy via-[#1f4663] to-[#0f2638] px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
        <Wrench className="h-8 w-8 text-amber-300" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400">
          <span className="text-sm font-bold text-kaza-navy">K</span>
        </div>
        <span className="font-heading text-xl font-bold">KAZA</span>
      </div>
      <h1 className="mt-6 font-heading text-3xl font-bold sm:text-4xl">
        Maintenance en cours
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
        {message}
      </p>
      <p className="mt-8 text-xs text-white/50">
        Une question ? Écrivez-nous à{" "}
        <a
          href="mailto:contact@kaza.africa"
          className="underline underline-offset-2 hover:text-white"
        >
          contact@kaza.africa
        </a>
      </p>
    </main>
  );
}
