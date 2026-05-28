"use client";

import { MoreHorizontal, Ban, ArrowUpDown, CheckCircle2, Snowflake, PowerOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AgencyRowMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Actions agence</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Ban className="size-4 text-amber-600" /> Suspendre
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ArrowUpDown className="size-4" /> Changer de plan
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CheckCircle2 className="size-4 text-emerald-600" /> Approuver KYC
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Snowflake className="size-4 text-blue-600" /> Geler paiements
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <PowerOff className="size-4" /> Désactiver l’agence
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
