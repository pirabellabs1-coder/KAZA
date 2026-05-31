"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "@/components/ui/toast-helper";

import { createRoommateListing } from "@/actions/roommate-listings";

export function CreateListingForm({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    roomSize: "",
    bedroomsAvailable: "1",
    peopleLookingFor: "1",
    address: "",
    city: "",
    preferredGender: "mixte" as "mixte" | "femmes" | "hommes",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/student-living/new");
      return;
    }
    const price = Number(form.price);
    if (form.title.trim().length < 5) {
      toast.error("Le titre doit faire au moins 5 caractères.");
      return;
    }
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Indiquez un loyer valide.");
      return;
    }
    startTransition(async () => {
      const res = await createRoommateListing({
        title: form.title,
        description: form.description,
        price,
        roomSize: form.roomSize,
        bedroomsAvailable: Number(form.bedroomsAvailable) || 1,
        peopleLookingFor: Number(form.peopleLookingFor) || 1,
        address: form.address,
        city: form.city,
        preferredGender: form.preferredGender,
      });
      if (res.success && res.id) {
        toast.success("Annonce de colocation publiée 🎉");
        router.push(`/student-living/${res.id}`);
      } else {
        toast.error(res.error ?? "Échec de la publication.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5">
        <Link href="/student-living">
          <ArrowLeft className="size-4" /> Retour aux colocations
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-kaza-blue/10 text-kaza-blue">
          <Users className="size-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-kaza-navy">
            Publier une annonce de colocation
          </h1>
          <p className="text-sm text-muted-foreground">
            Décrivez le logement et le profil recherché pour trouver vos
            colocataires.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Le logement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre de l&apos;annonce *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex : Chambre dans appartement étudiant proche campus"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Ambiance, équipements, charges incluses, règles de vie…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Cotonou, Dakar, Abidjan…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Quartier / adresse</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Quartier, rue…"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conditions & profil recherché</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="price">Loyer par personne (FCFA/mois) *</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="Ex : 45000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roomSize">Surface de la chambre</Label>
              <Input
                id="roomSize"
                value={form.roomSize}
                onChange={(e) => set("roomSize", e.target.value)}
                placeholder="Ex : 12 m²"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bedrooms">Chambres disponibles</Label>
              <Input
                id="bedrooms"
                type="number"
                min={1}
                value={form.bedroomsAvailable}
                onChange={(e) => set("bedroomsAvailable", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="people">Colocataires recherchés</Label>
              <Input
                id="people"
                type="number"
                min={1}
                value={form.peopleLookingFor}
                onChange={(e) => set("peopleLookingFor", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Profil de colocataire souhaité</Label>
              <Select
                value={form.preferredGender}
                onValueChange={(v) =>
                  set("preferredGender", v as typeof form.preferredGender)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixte">Mixte (indifférent)</SelectItem>
                  <SelectItem value="femmes">Uniquement femmes</SelectItem>
                  <SelectItem value="hommes">Uniquement hommes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button asChild variant="ghost" disabled={isPending}>
            <Link href="/student-living">Annuler</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Publier l&apos;annonce
          </Button>
        </div>
      </div>
    </div>
  );
}
