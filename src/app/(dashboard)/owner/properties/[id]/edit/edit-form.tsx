"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast-helper";
import { cn } from "@/lib/utils";

import {
  deleteProperty,
  updatePropertyFull,
  type OwnerPropertyStatus,
} from "@/actions/properties";

interface EditFormValues {
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareMeters: number;
  address: string;
  amenities: string[];
  status: OwnerPropertyStatus;
}

interface EditPropertyFormProps {
  propertyId: string;
  initialValues: EditFormValues;
}

const STATUS_LABELS: Record<OwnerPropertyStatus, string> = {
  DRAFT: "Brouillon (non publié)",
  AVAILABLE: "Disponible — publié",
  RENTED: "Loué",
  UNAVAILABLE: "Hors marché",
  ARCHIVED: "Archivé",
};

const AMENITIES_OPTIONS = [
  "WiFi",
  "Climatisation",
  "Parking",
  "Gardien",
  "Eau courante",
  "Électricité 24/7",
  "Groupe électrogène",
  "Cuisine équipée",
  "Meublé",
  "Balcon",
  "Terrasse",
  "Jardin",
  "Piscine",
  "Ascenseur",
];

export function EditPropertyForm({
  propertyId,
  initialValues,
}: EditPropertyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");

  const [values, setValues] = useState<EditFormValues>(initialValues);

  function update<K extends keyof EditFormValues>(
    key: K,
    value: EditFormValues[K],
  ): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(amenity: string): void {
    setValues((prev) => {
      const has = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: has
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  }

  function handleSave(): void {
    if (!values.title.trim() || values.title.length < 5) {
      toast.error("Le titre doit contenir au moins 5 caractères.");
      return;
    }
    if (!values.description.trim() || values.description.length < 20) {
      toast.error("La description doit contenir au moins 20 caractères.");
      return;
    }
    if (values.price <= 0) {
      toast.error("Le loyer doit être supérieur à 0.");
      return;
    }
    if (!values.address.trim() || values.address.length < 5) {
      toast.error("L'adresse doit contenir au moins 5 caractères.");
      return;
    }

    startTransition(async () => {
      const res = await updatePropertyFull({
        id: propertyId,
        title: values.title,
        description: values.description,
        price: values.price,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        squareMeters: values.squareMeters,
        address: values.address,
        amenities: values.amenities,
        status: values.status,
      });

      if (!res.success) {
        toast.error(res.error ?? "Impossible d'enregistrer les modifications.");
        return;
      }

      toast.success("Annonce mise à jour avec succès.");
      router.push(`/owner/properties/${propertyId}`);
      router.refresh();
    });
  }

  function handleCancel(): void {
    router.push(`/owner/properties/${propertyId}`);
  }

  function handleDelete(): void {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    if (confirmText.trim().toUpperCase() !== "SUPPRIMER") {
      toast.error("Veuillez saisir SUPPRIMER pour confirmer.");
      return;
    }

    startDeleteTransition(async () => {
      const res = await deleteProperty(propertyId);
      if (!res.success) {
        toast.error(res.error ?? "Impossible de supprimer l'annonce.");
        return;
      }
      toast.success("Annonce supprimée.");
      setDeleteOpen(false);
      router.push("/owner/properties");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="space-y-6"
    >
      {/* Section Infos générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de l&apos;annonce *</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={120}
              placeholder="Ex: Bel appartement T3 à Fidjrossè"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              rows={5}
              maxLength={3000}
              placeholder="Décrivez votre bien (équipements, voisinage, atouts...)"
            />
            <p className="text-xs text-muted-foreground">
              {values.description.length}/3000 caractères
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="square_meters">Surface (m²) *</Label>
              <Input
                id="square_meters"
                type="number"
                min={1}
                value={values.squareMeters || ""}
                onChange={(e) =>
                  update("squareMeters", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut de publication *</Label>
              <Select
                value={values.status}
                onValueChange={(v) =>
                  update("status", v as OwnerPropertyStatus)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(STATUS_LABELS) as OwnerPropertyStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Chambres *</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={values.bedrooms || ""}
                onChange={(e) =>
                  update("bedrooms", Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Salles de bain *</Label>
              <Input
                id="bathrooms"
                type="number"
                min={0}
                value={values.bathrooms || ""}
                onChange={(e) =>
                  update("bathrooms", Number(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Localisation */}
      <Card>
        <CardHeader>
          <CardTitle>Localisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse complète *</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Ex: Rue 234, Fidjrossè, Cotonou"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Prix */}
      <Card>
        <CardHeader>
          <CardTitle>Prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Loyer mensuel (FCFA) *</Label>
            <Input
              id="price"
              type="number"
              min={1000}
              step={1000}
              value={values.price || ""}
              onChange={(e) => update("price", Number(e.target.value) || 0)}
            />
            {values.price > 0 && (
              <p className="text-xs text-muted-foreground">
                Soit {new Intl.NumberFormat("fr-FR").format(values.price)} FCFA
                par mois
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Équipements */}
      <Card>
        <CardHeader>
          <CardTitle>Équipements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">
            Cochez les équipements présents dans le bien.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AMENITIES_OPTIONS.map((amenity) => {
              const checked = values.amenities.includes(amenity);
              return (
                <label
                  key={amenity}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition",
                    checked
                      ? "border-kaza-blue bg-kaza-blue/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(amenity)}
                    className="size-4 rounded border-input accent-[var(--color-kaza-blue)]"
                  />
                  <span>{amenity}</span>
                </label>
              );
            })}
          </div>
          {values.amenities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {values.amenities.map((a) => (
                <Badge key={a} variant="secondary" className="text-xs">
                  {a}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Photos — pointe vers la galerie séparée */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La gestion des photos (upload, ordre, suppression) se fait dans la
            galerie dédiée du bien.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => router.push(`/owner/properties/${propertyId}`)}
          >
            Ouvrir la galerie
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            setDeleteStep(1);
            setConfirmText("");
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="mr-2 size-4" />
          Supprimer cette annonce
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-kaza-blue hover:bg-kaza-blue/90"
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Dialog suppression 2 étapes */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              {deleteStep === 1
                ? "Supprimer cette annonce ?"
                : "Confirmation finale"}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1
                ? "Cette action est irréversible. L'annonce et ses photos seront définitivement supprimées de la base de données."
                : "Saisissez SUPPRIMER ci-dessous pour confirmer la suppression définitive."}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 2 && (
            <div className="space-y-2">
              <Label htmlFor="confirm-text">Confirmation</Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER"
                autoFocus
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              type="button"
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              type="button"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {deleteStep === 1 ? "Continuer" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
