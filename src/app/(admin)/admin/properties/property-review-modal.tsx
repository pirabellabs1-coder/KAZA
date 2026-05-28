"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatFcfa } from "@/lib/mock/admin-platform-data";

interface PropertyReviewModalProps {
  listing: {
    id: string;
    title: string;
    ownerName: string;
    city: string;
    priceFcfa: number;
  };
}

const CHECKS = [
  { id: "photos", label: "Photos conformes (≥ 5, qualité OK)" },
  { id: "price", label: "Prix cohérent avec le marché" },
  { id: "desc", label: "Description complète et fidèle" },
  { id: "geo", label: "Localisation vérifiée (GPS)" },
  { id: "owner", label: "Propriétaire vérifié (KYC complet)" },
];

export function PropertyReviewModal({ listing }: PropertyReviewModalProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const allChecked = CHECKS.every((c) => checked[c.id]);

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-xs font-medium text-kaza-blue hover:underline"
        >
          Voir détail complet
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-kaza-navy">
            Vérification d&apos;annonce
          </DialogTitle>
          <DialogDescription>
            {listing.title} — {listing.city} · {formatFcfa(listing.priceFcfa)}
            /mois · par {listing.ownerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {CHECKS.map((c) => (
            <Label
              key={c.id}
              htmlFor={`chk-${listing.id}-${c.id}`}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/40"
            >
              <input
                id={`chk-${listing.id}-${c.id}`}
                type="checkbox"
                checked={!!checked[c.id]}
                onChange={() => toggle(c.id)}
                className="size-4 rounded border-input accent-kaza-blue"
              />
              <span className="text-sm">{c.label}</span>
              {checked[c.id] && (
                <CheckCircle2 className="ml-auto size-4 text-kaza-green" />
              )}
            </Label>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <ShieldCheck className="size-4" />
          <span>
            Toutes les vérifications doivent être cochées avant publication.
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline">Demander des modifications</Button>
          <Button
            disabled={!allChecked}
            className="bg-kaza-green text-white hover:bg-kaza-green/90"
          >
            Approuver et publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
