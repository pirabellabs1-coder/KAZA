import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat Colocataires",
};

export default function StudentChatPage() {
  redirect("/messages");
}
