'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, FolderKanban, Menu, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFooterNavProps {
  onMenuClick: () => void;
}

export function MobileFooterNav({ onMenuClick }: MobileFooterNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      icon: Menu,
      label: 'Menu',
      onClick: onMenuClick,
      active: false,
    },
    {
      icon: FolderKanban,
      label: 'Projects',
      href: '/projects',
      active: pathname === '/projects',
    },
    {
      icon: CalendarDays,
      label: 'Daily',
      href: '/daily',
      active: pathname === '/daily',
    },
    {
      icon: MessagesSquare,
      label: 'Tickets',
      href: '/tickets',
      active: pathname === '/tickets',
    },
  ];

  return (
    <footer className="lg:hidden fixed bottom-0 inset-x-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-white/20 z-40">
      <nav 
        className="flex justify-around items-center h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[60px] h-full gap-1',
                  'transition-colors duration-200',
                  'hover:bg-black/5 dark:hover:bg-white/5',
                  'active:scale-95 transition-transform',
                  item.active && 'text-indigo-600 dark:text-indigo-400'
                )}
                aria-label={item.label}
              >
                <Icon 
                  className={cn(
                    'w-6 h-6',
                    item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                  )} 
                />
                <span 
                  className={cn(
                    'text-xs font-medium',
                    item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={cn(
                'flex flex-col items-center justify-center min-w-[60px] h-full gap-1',
                'transition-colors duration-200',
                'hover:bg-black/5 dark:hover:bg-white/5',
                'active:scale-95 transition-transform',
                item.active && 'text-indigo-600 dark:text-indigo-400'
              )}
              aria-label={item.label}
            >
              <Icon 
                className={cn(
                  'w-6 h-6',
                  item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                )} 
              />
              <span 
                className={cn(
                  'text-xs font-medium',
                  item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}

