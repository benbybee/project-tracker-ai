'use client';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { GradientButton } from '@/components/ui/gradient-button';
import SyncIndicator from '@/components/sync/SyncIndicator';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ConflictReviewButton } from '@/components/sync/ConflictModal';
import { TaskModal } from '@/components/tasks/TaskModal';
import { trpc } from '@/lib/trpc';

export function Topbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Fetch projects to get a default project ID
  const { data: projects } = trpc.projects.list.useQuery({});
  const defaultProjectId = projects?.[0]?.id || '';

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
            onClick={() => setTaskModalOpen(true)}
            className="hidden sm:block"
          >
            New Task
          </GradientButton>
          <GradientButton
            onClick={() => setTaskModalOpen(true)}
            className="sm:hidden px-3"
          >
            +
          </GradientButton>
        </div>
      </div>

      {/* Task Creation Modal */}
      {taskModalOpen && defaultProjectId && (
        <TaskModal
          projectId={defaultProjectId}
          isOpen={taskModalOpen}
          onClose={() => setTaskModalOpen(false)}
        />
      )}
    </header>
  );
}
