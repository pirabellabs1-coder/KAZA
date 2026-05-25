import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { InstallPrompt } from "@/components/shared/install-prompt";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <InstallPrompt />
    </>
  );
}
