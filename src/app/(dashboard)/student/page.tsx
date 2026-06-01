import { redirect } from "next/navigation";

// L'overview étudiant est rendu par le tableau de bord adaptatif `/dashboard`
// (selon le rôle). `/student` redirige donc vers celui-ci.
export default function StudentIndexPage() {
  redirect("/dashboard");
}
