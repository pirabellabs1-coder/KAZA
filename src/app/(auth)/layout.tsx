import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kaza-navy">
          <span className="text-lg font-bold text-white">K</span>
        </div>
        <span className="font-heading text-2xl font-bold text-kaza-navy">
          KAZA
        </span>
      </Link>

      {/* Page Content */}
      <div className="w-full max-w-md">{children}</div>

      {/* Back to home */}
      <p className="mt-8 text-sm text-muted-foreground">
        <Link
          href="/"
          className="text-kaza-blue transition-colors hover:underline"
        >
          Retour a l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
