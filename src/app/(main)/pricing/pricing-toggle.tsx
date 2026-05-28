"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

export function PricingToggle() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 p-1.5 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={() => setBilling("monthly")}
        className={cn(
          "relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300",
          billing === "monthly"
            ? "bg-white text-kaza-navy shadow-md"
            : "text-white/80 hover:text-white",
        )}
        aria-pressed={billing === "monthly"}
      >
        Mensuel
      </button>
      <button
        type="button"
        onClick={() => setBilling("annual")}
        className={cn(
          "relative inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300",
          billing === "annual"
            ? "bg-white text-kaza-navy shadow-md"
            : "text-white/80 hover:text-white",
        )}
        aria-pressed={billing === "annual"}
      >
        Annuel
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
            billing === "annual"
              ? "bg-kaza-green text-white"
              : "bg-white/20 text-white",
          )}
        >
          –2 mois
        </span>
      </button>
    </div>
  );
}
