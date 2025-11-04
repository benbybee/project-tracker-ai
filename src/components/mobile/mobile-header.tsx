'use client';

import { Menu } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function MobileHeader({
  onMenuClick,
  className = '',
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'lg:hidden fixed top-0 inset-x-0 z-50',
        'h-14 flex items-center justify-between px-4',
        'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
        'border-b border-white/20',
        'shadow-sm',
        className
      )}
    >
      {/* Hamburger Menu Button */}
      <button
        onClick={onMenuClick}
        className={cn(
          'p-2 rounded-lg',
          'text-slate-600 dark:text-slate-300',
          'hover:bg-slate-100 dark:hover:bg-slate-800',
          'active:scale-95 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50'
        )}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* App Logo (centered) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/app-icon.png"
          alt="App"
          width={32}
          height={32}
          priority
          className="rounded-lg"
        />
      </div>

      {/* Right side spacer to balance layout */}
      <div className="w-10" />
    </header>
  );
}
