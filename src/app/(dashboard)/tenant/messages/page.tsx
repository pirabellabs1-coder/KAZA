import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
};

export default function TenantMessagesPage() {
  redirect("/messages");
}
