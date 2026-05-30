'use client';

// =============================================================================
// KAZA - AttachmentButton (client component)
//
// Bouton trombone qui ouvre un menu dropdown : Photo / Document / Localisation
// / Annonce. Les types qui declenchent un upload (photo, document) ouvrent un
// input file cache et appellent `onAttach(file)`. Les autres (localisation,
// annonce) appellent `onAttach(null, kind)`. En demo, un toast confirme.
// =============================================================================

import {
  Camera,
  FileText,
  Home,
  MapPin,
  Paperclip,
} from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast-helper';
import { cn } from '@/lib/utils';

export type AttachmentKind = 'photo' | 'document' | 'location' | 'listing';

interface AttachmentButtonProps {
  /**
   * Si fourni, appele apres selection. `file` est non-null pour photo/document,
   * null pour localisation/annonce. Si absent, un toast demo est emis.
   */
  onAttach?: (file: File | null, kind: AttachmentKind) => void;
  disabled?: boolean;
  className?: string;
}

const KIND_LABEL: Record<AttachmentKind, string> = {
  photo: 'Photo',
  document: 'Document',
  location: 'Localisation',
  listing: 'Annonce',
};

export function AttachmentButton({
  onAttach,
  disabled,
  className,
}: AttachmentButtonProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const emitDemo = (kind: AttachmentKind, file?: File | null) => {
    if (onAttach) {
      onAttach(file ?? null, kind);
      return;
    }
    const label = file?.name ? ` : ${file.name}` : '';
    toast.success(`Pièce jointe sélectionnée — ${KIND_LABEL[kind]}${label}`);
  };

  const handleFile =
    (kind: Extract<AttachmentKind, 'photo' | 'document'>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      // Reset pour permettre une nouvelle selection identique.
      e.target.value = '';
      emitDemo(kind, file);
    };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="Ajouter une piece jointe"
            className={cn('shrink-0 text-muted-foreground hover:text-foreground', className)}
          >
            <Paperclip className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-52">
          <DropdownMenuItem onSelect={() => photoInputRef.current?.click()}>
            <Camera className="text-kaza-blue" />
            Photo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => docInputRef.current?.click()}>
            <FileText className="text-kaza-navy" />
            Document (PDF, DOC)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => emitDemo('location')}>
            <MapPin className="text-kaza-green" />
            Localisation
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => emitDemo('listing')}>
            <Home className="text-kaza-navy" />
            Annonce
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Inputs files caches */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        hidden
        aria-hidden
        tabIndex={-1}
        onChange={handleFile('photo')}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        aria-hidden
        tabIndex={-1}
        onChange={handleFile('document')}
      />
    </>
  );
}
