import { redirect } from "next/navigation";

// L'overview propriétaire est rendu par le tableau de bord adaptatif `/dashboard`
// (selon le rôle). `/owner` redirige donc vers celui-ci.
export default function OwnerIndexPage() {
  redirect("/dashboard");
}
