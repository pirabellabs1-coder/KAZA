// =============================================================================
// Kaabo - MessageReadIndicator (server component)
//
// Indicateur de statut d'un message envoye, type WhatsApp :
//   - sent       : 1 coche grise
//   - delivered  : 2 coches grises
//   - read       : 2 coches kaza-blue
// =============================================================================

import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageReadStatus = 'sent' | 'delivered' | 'read';

interface MessageReadIndicatorProps {
  status: MessageReadStatus;
  className?: string;
}

const STATUS_LABEL: Record<MessageReadStatus, string> = {
  sent: 'Envoye',
  delivered: 'Distribue',
  read: 'Lu',
};

export function MessageReadIndicator({
  status,
  className,
}: MessageReadIndicatorProps) {
  const Icon = status === 'sent' ? Check : CheckCheck;
  const color =
    status === 'read' ? 'text-kaza-blue' : 'text-muted-foreground/70';

  return (
    <span
      role="status"
      aria-label={`Statut du message : ${STATUS_LABEL[status]}`}
      title={STATUS_LABEL[status]}
      className={cn('inline-flex items-center', className)}
    >
      <Icon className={cn('size-3.5', color)} aria-hidden />
    </span>
  );
}
