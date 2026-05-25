import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <span className="text-4xl font-bold text-muted-foreground">404</span>
      </div>
      <h1 className="font-heading text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">
          <Home className="mr-2 size-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>
    </div>
  );
}
