import { redirect } from "next/navigation";

// =============================================================================
// KAZA — Le matching colocataires réel (données Supabase via getStudentMatches)
// vit sur /student/matches. Cette ancienne page était un doublon inerte
// (liste vide + filtres non branchés) → on redirige vers la vraie.
// =============================================================================

export default function RoommateMatchingPage() {
  redirect("/student/matches");
}
