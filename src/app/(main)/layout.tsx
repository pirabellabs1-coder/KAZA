import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { getCurrentDisplayUser } from "@/lib/auth/current-user";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentDisplayUser();
  const navUser = user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    : null;

  return (
    <>
      <Navbar user={navUser} />
      <main className="flex-1">{children}</main>
      <Footer />
      <InstallPrompt />
    </>
  );
}
