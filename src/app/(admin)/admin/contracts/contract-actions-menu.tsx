"use client";

import { Archive, CheckCircle2, FileDown, Flag, MoreHorizontal, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContractActionsMenuProps {
  contractNumber: string;
}

export function ContractActionsMenu({ contractNumber }: ContractActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" title="Actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {contractNumber}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <CheckCircle2 className="mr-2 size-4 text-kaza-green" />
          Valider
        </DropdownMenuItem>
        <DropdownMenuItem>
          <XCircle className="mr-2 size-4 text-red-600" />
          Forcer la résiliation
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Archive className="mr-2 size-4" />
          Archiver
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Flag className="mr-2 size-4 text-amber-600" />
          Marquer en litige
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <FileDown className="mr-2 size-4" />
          Export juridique (ZIP)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
