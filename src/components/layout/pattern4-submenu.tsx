'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Calendar, Lightbulb, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Pattern4SubmenuProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

const pattern4NavItems = [
  {
    href: '/pattern4/sprint-overview',
    label: 'Sprint Overview',
    icon: Target,
  },
  {
    href: '/pattern4/weeks',
    label: 'Weeks',
    icon: Calendar,
  },
  {
    href: '/pattern4/opportunities',
    label: 'Opportunities',
    icon: Lightbulb,
  },
  {
    href: '/pattern4/completed',
    label: 'Completed Opportunities',
    icon: Archive,
  },
];

export function Pattern4Submenu({
  isOpen,
  onClose,
  isMobile = false,
}: Pattern4SubmenuProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Submenu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: isMobile ? -320 : -280 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? -320 : -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-0 z-50 h-dvh',
              'bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl',
              'border-r border-white/20 shadow-2xl',
              isMobile ? 'left-0 w-[320px]' : 'left-[256px] w-[280px]'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Pattern 4
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    90-Day Sprint System
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close Pattern 4 menu"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-1 p-4" aria-label="Pattern 4">
              {pattern4NavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={isMobile ? onClose : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                      'text-foreground hover:text-foreground',
                      'hover:bg-white/10 active:bg-white/20 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                      active &&
                        'bg-gradient-to-r from-indigo-500/60 to-violet-500/60 text-white shadow-lg'
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-muted-foreground">
                  Your personal operating system for planning, executing, and
                  tracking 90-day business sprints.
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

