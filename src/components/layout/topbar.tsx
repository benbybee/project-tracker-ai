'use client';
import { useState, useEffect } from 'react';
import { Keyboard, CheckSquare, FolderPlus, FileText } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TaskModal } from '@/components/tasks/TaskModal';
import { NoteModal } from '@/components/notes/NoteModal';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { trpc } from '@/lib/trpc';
import { getModKey } from '@/lib/keyboard-utils';

export function Topbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
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
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b">
      <div className="mx-auto flex items-center justify-end gap-2 px-4 py-2">
        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Add Task */}
          <button
            onClick={() => setTaskModalOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Add Task"
          >
            <CheckSquare className="w-5 h-5" />
          </button>

          {/* Add Project */}
          <button
            onClick={() => setProjectModalOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Add Project"
          >
            <FolderPlus className="w-5 h-5" />
          </button>

          {/* Add Note */}
          <button
            onClick={() => setNoteModalOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Add Note"
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-300" />

          {/* Keyboard shortcuts hint - desktop only */}
          {!isMobile && (
            <button
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent('keydown', {
                    key: '/',
                    ctrlKey: modKey === 'Ctrl',
                    metaKey: modKey === '⌘',
                    bubbles: true,
                  })
                );
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title={`Show keyboard shortcuts (${modKey}+/)`}
            >
              <Keyboard className="w-4 h-4" />
              <span className="font-medium">{modKey}+/</span>
            </button>
          )}

          {/* Notifications */}
          <NotificationBell />
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

      {/* Project Creation Modal */}
      <CreateProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />

      {/* Note Creation Modal */}
      {noteModalOpen && (
        <NoteModal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          onSaved={() => {
            // Optionally refresh notes or show success message
          }}
        />
      )}
    </header>
  );
}
