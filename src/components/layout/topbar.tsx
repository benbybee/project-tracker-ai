'use client';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { GradientButton } from '@/components/ui/gradient-button';
import SyncIndicator from '@/components/sync/SyncIndicator';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ConflictReviewButton } from '@/components/sync/ConflictModal';

export function Topbar() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openMobileSidebar = () => {
    // Dispatch custom event to open mobile sidebar
    window.dispatchEvent(new CustomEvent('openMobileSidebar'));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto flex items-center gap-2 px-4 py-2">
        {/* Mobile menu button */}
        {isMobile && (
          <button
            onClick={openMobileSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        )}

        <input
          className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm"
          placeholder={isMobile ? 'Search...' : 'Search (Ctrl+K)'}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <SyncIndicator />
          <div className="hidden sm:block">
            <ConflictReviewButton />
          </div>
          <NotificationBell />
          <GradientButton
            onClick={() => {
              // TODO: Implement new task functionality
            }}
            className="hidden sm:block"
          >
            New Task
          </GradientButton>
          <GradientButton
            onClick={() => {
              // TODO: Implement new task functionality
            }}
            className="sm:hidden px-3"
          >
            +
          </GradientButton>
        </div>
      </div>
    </header>
  );
}
