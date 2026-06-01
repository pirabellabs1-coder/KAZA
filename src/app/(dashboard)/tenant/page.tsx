import { redirect } from "next/navigation";

// L'overview locataire est rendu par le tableau de bord adaptatif `/dashboard`
// (selon le rôle). `/tenant` redirige donc vers celui-ci.
export default function TenantIndexPage() {
  redirect("/dashboard");
}
