"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, Loader2, Plus, Search } from "lucide-react";

import {
  searchComparableProperties,
  type CompareItem,
} from "@/actions/compare";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

interface PropertyPickerProps {
  excludeIds: string[];
  onAdd: (item: CompareItem) => void;
  trigger: React.ReactNode;
}

export function PropertyPicker({
  excludeIds,
  onAdd,
  trigger,
}: PropertyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompareItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  const runSearch = (q: string) => {
    startTransition(async () => {
      const res = await searchComparableProperties(q, excludeIds);
      setResults(res);
      setLoaded(true);
    });
  };

  // Charge une première liste à l'ouverture.
  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v && !loaded) runSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sélectionner un bien à comparer</DialogTitle>
          <DialogDescription>
            Recherchez parmi les annonces disponibles et ajoutez-les à votre
            comparaison.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titre, ville, quartier…"
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Rechercher"
            )}
          </Button>
        </form>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {pending && results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {loaded
                ? "Aucun bien disponible ne correspond."
                : "Recherchez un bien à ajouter."}
            </p>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border bg-white p-2"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-kaza-navy">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[item.neighborhood, item.city].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-xs font-semibold text-kaza-blue">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onAdd(item);
                    setResults((prev) => prev.filter((r) => r.id !== item.id));
                  }}
                >
                  <Plus className="mr-1 size-3.5" />
                  Ajouter
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <Check className="mr-1.5 size-4" />
            Terminé
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
