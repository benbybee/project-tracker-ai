'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Shield, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { EditProjectModal } from './edit-project-modal';
import { useRealtime } from '@/app/providers';

type Role = { id: string; name: string; color: string };
type Project = {
  id: string;
  name: string;
  type: 'general' | 'website';
  description?: string | null;
  roleId?: string | null;
  role?: Role | null;
};

interface ProjectHeaderCompactProps {
  project: Project;
}

export function ProjectHeaderCompact({ project }: ProjectHeaderCompactProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const utils = trpc.useUtils();
  const { onlineUsers, isConnected } = useRealtime();

  const deleteProjectMutation = trpc.projects.remove.useMutation({
    onSuccess: () => {
      window.location.href = '/projects';
    },
  });

  const handleDeleteProject = () => {
    if (
      confirm(
        `Are you sure you want to delete the project "${project.name}"? This action cannot be undone and will delete all associated tasks.`
      )
    ) {
      deleteProjectMutation.mutate({ id: project.id });
    }
    setIsDeleteModalOpen(false);
  };

  const isWebsite = project.type === 'website';

  return (
    <>
      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title and Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {project.name}
                </h1>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0',
                    isWebsite
                      ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                      : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                  )}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {project.type === 'website' ? 'Website' : 'General'}
                </span>
                {project.role && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: `${project.role.color}22`,
                      color: project.role.color,
                    }}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    {project.role.name}
                  </span>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                  {project.description}
                </p>
              )}

              {/* Presence Indicator */}
              {isConnected && onlineUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <div className="flex -space-x-2">
                    {onlineUsers.slice(0, 3).map((user, index) => (
                      <motion.div
                        key={user.userId}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                        style={{ zIndex: onlineUsers.length - index }}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-slate-800 shadow-sm">
                          {user.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                      </motion.div>
                    ))}
                    {onlineUsers.length > 3 && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs font-medium border-2 border-white dark:border-slate-800">
                        +{onlineUsers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {onlineUsers.length}{' '}
                    {onlineUsers.length === 1 ? 'person' : 'people'} online
                  </span>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="h-9 bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
              >
                <Edit className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Edit</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="h-9 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
          type: project.type,
          roleId: project.roleId,
        }}
        onSuccess={() => {
          utils.projects.get.invalidate({ id: project.id });
        }}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <GlassCard className="p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Delete Project
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete "{project.name}"? This action
                cannot be undone and will delete all associated tasks.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProject}
                  disabled={deleteProjectMutation.isPending}
                >
                  {deleteProjectMutation.isPending
                    ? 'Deleting...'
                    : 'Delete Project'}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </>
  );
}
