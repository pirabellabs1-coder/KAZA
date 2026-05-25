// =============================================================================
// KAZA - Conversation 1-1 (server component)
//
// Convention wave 1 : `conversationId` route param = id de l'autre utilisateur.
// On recupere l'utilisateur courant + le profil public de l'autre utilisateur,
// puis on rend `<ConversationView />` (client) qui branche Realtime.
// =============================================================================

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { getCurrentUser, getUserById } from '@/lib/supabase/queries';

import { ConversationView } from './conversation-view';

export const metadata: Metadata = {
  title: 'Conversation',
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?redirect=/messages/${conversationId}`);
    return null;
  }

  if (conversationId === currentUser.id) {
    // Pas de conversation avec soi-meme.
    redirect('/messages');
    return null;
  }

  const other = await getUserById(conversationId);
  if (!other) {
    notFound();
    return null;
  }

  const otherName =
    `${other.first_name} ${other.last_name}`.trim() || 'Utilisateur';

  return (
    <ConversationView
      currentUserId={currentUser.id}
      otherUserId={other.id}
      otherUserName={otherName}
      otherUserAvatarUrl={other.profile_photo_url}
    />
  );
}
