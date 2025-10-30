'use client';
import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { GradientButton } from '@/components/ui/gradient-button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TaskModal } from '@/components/tasks/TaskModal';
import { trpc } from '@/lib/trpc';
import { getModKey } from '@/lib/keyboard-utils';

export function Topbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [modKey, setModKey] = useState('Ctrl');

  // Fetch projects to get a default project ID
  const { data: projects } = trpc.projects.list.useQuery({});
  const defaultProjectId = projects?.[0]?.id || '';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    setModKey(getModKey());
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto flex items-center gap-2 px-4 py-2">
        {/* Mobile menu button removed - now in mobile footer navigation */}

        <input
          className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm"
          placeholder={isMobile ? 'Search...' : `Search (${modKey}+K)`}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Keyboard shortcuts hint - desktop only */}
          {!isMobile && (
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', {
                  key: '/',
                  ctrlKey: modKey === 'Ctrl',
                  metaKey: modKey === '⌘',
                  bubbles: true
                }));
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title={`Show keyboard shortcuts (${modKey}+/)`}
            >
              <Keyboard className="w-4 h-4" />
              <span className="font-medium">{modKey}+/</span>
            </button>
          )}
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
