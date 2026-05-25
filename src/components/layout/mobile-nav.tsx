"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useState } from "react";

interface MobileNavProps {
  role?: string;
}

export function MobileNav({ role = "OWNER" }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Menu navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-16 items-center border-b px-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kaza-navy">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <span className="font-heading text-xl font-bold text-kaza-navy">
              KAZA
            </span>
          </Link>
        </div>
        <Sidebar role={role} className="w-full border-r-0" />
      </SheetContent>
    </Sheet>
  );
}
