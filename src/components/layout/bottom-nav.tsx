'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  Home,
  MessageCircle,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Préfixes de chemins considérés comme "actifs" pour cet item
   * (en plus du match exact sur `href`).
   */
  matchPrefixes?: string[];
}

const ITEMS: NavItem[] = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/search', label: 'Rechercher', icon: Search, matchPrefixes: ['/search'] },
  { href: '/tenant/saved', label: 'Favoris', icon: Heart, matchPrefixes: ['/tenant/saved'] },
  { href: '/messages', label: 'Messages', icon: MessageCircle, matchPrefixes: ['/messages'] },
  { href: '/profile', label: 'Profil', icon: User, matchPrefixes: ['/profile'] },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/') return pathname === '/';
  if (pathname === item.href) return true;
  return Boolean(item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)));
}

/**
 * Barre de navigation fixe en bas, visible uniquement sur mobile (`md:hidden`).
 * Hauteur 64px, respecte la safe-area-inset-bottom pour les écrans à encoche.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.04)] md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  active ? 'text-kaza-blue' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-kaza-blue"
                  />
                )}
                <Icon className="size-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
