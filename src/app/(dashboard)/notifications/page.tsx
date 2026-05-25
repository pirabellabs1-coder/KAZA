import type { Metadata } from "next";
import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return <NotificationsList />;
}
