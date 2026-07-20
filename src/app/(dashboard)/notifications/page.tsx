import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentDisplayUser } from "@/lib/auth/current-user";
import { listNotifications } from "@/lib/queries/notifications";

import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const user = await getCurrentDisplayUser();
  if (!user) redirect("/login?redirect=/notifications");

  const notifications = await listNotifications(user.id, 100);

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suivez l&apos;activité de votre compte Kaabo en temps réel.
          </p>
        </div>
      </header>

      <NotificationsList
        initialNotifications={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          isRead: n.isRead,
          createdAt: n.createdAt,
        }))}
      />
    </div>
  );
}
