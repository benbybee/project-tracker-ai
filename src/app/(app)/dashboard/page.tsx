'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  Search,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonGlass } from '@/components/ui/skeleton-glass';
import { ProjectTile } from '@/components/dashboard/ProjectTile';
import { RoleFilter } from '@/components/dashboard/RoleFilter';
import { EmptyProjects } from '@/components/dashboard/EmptyProjects';
import { TaskCard } from '@/components/tasks/task-card';
import { useRouter } from 'next/navigation';
import { togglePin } from '@/lib/projects-client';
import { PageHeader } from '@/components/layout/page-header';
import { ProjectDetailsModal } from '@/components/projects/project-details-modal';

export default function DashboardPage() {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  // Fetch roles for filter
  const { data: roles = [] } = trpc.roles.list.useQuery();

  // Fetch dashboard data with role filter
  const { data: dashboardData, isLoading } = trpc.dashboard.get.useQuery({
    roleId: selectedRoleId || undefined,
  });

  const utils = trpc.useUtils();

  const handleRoleChange = (roleId: string | null) => {
    setSelectedRoleId(roleId);
  };

  const handleTogglePin = async (projectId: string, pinned: boolean) => {
    try {
      // Optimistic update
      utils.dashboard.get.setData(
        { roleId: selectedRoleId || undefined },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            projects: old.projects.map((p) =>
              p.id === projectId ? { ...p, pinned } : p
            ),
          };
        }
      );

      await togglePin(projectId, pinned);

      // Invalidate to refetch with proper sorting
      await utils.dashboard.get.invalidate();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      // Revert on error
      await utils.dashboard.get.invalidate();
    }
  };

  const convertToWebsiteMutation = trpc.projects.convertToWebsite.useMutation({
    onSuccess: () => {
      utils.dashboard.get.invalidate();
    },
  });

  const handleConvertToWebsite = async (projectId: string) => {
    try {
      // Optimistic update
      utils.dashboard.get.setData(
        { roleId: selectedRoleId || undefined },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            projects: old.projects.map((p) =>
              p.id === projectId ? { ...p, type: 'website' as const } : p
            ),
          };
        }
      );

      // Direct conversion without modal
      await convertToWebsiteMutation.mutateAsync({
        id: projectId,
        website: {}, // No additional data needed
      });

      // Invalidate to refetch
      await utils.dashboard.get.invalidate();
    } catch (error) {
      console.error('Failed to convert to website:', error);
      // Revert on error
      await utils.dashboard.get.invalidate();
    }
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectModalOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <PageHeader
            icon={LayoutDashboard}
            title="Dashboard"
            subtitle="At-a-glance control center for your projects and tasks"
            actions={
              <button
                onClick={() =>
                  document.dispatchEvent(
                    new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' })
                  )
                }
                className="text-xs rounded-full px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Search (⌘K)
              </button>
            }
          />
        </motion.div>

        {/* Role Filter */}
        <motion.div variants={itemVariants} className="mb-8">
          <RoleFilter
            roles={roles}
            selectedRoleId={selectedRoleId}
            onRoleChange={handleRoleChange}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Stats Cards Row */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {/* Today's Tasks */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <GlassCard
              className="cursor-pointer group"
              onClick={() => router.push('/daily')}
              aria-busy={isLoading}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Today's Tasks
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {isLoading ? '...' : dashboardData?.today || 0}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Due today
                  </p>
                </div>
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: 4 }}
                >
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Overdue Tasks */}
          <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <GlassCard
              className="cursor-pointer group"
              onClick={() => router.push('/board?filter=overdue')}
              aria-busy={isLoading}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Overdue Tasks
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                    {isLoading ? '...' : dashboardData?.overdue || 0}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Need attention
                  </p>
                </div>
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: 4 }}
                >
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Projects Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Project Progress
            </h2>
            <Link
              href="/projects"
              prefetch
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View All Projects →
            </Link>
          </div>

          <div className="min-h-[160px]" aria-busy={isLoading}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <SkeletonGlass key={i} className="p-6">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto" />
                  </SkeletonGlass>
                ))}
              </div>
            ) : dashboardData?.projects && dashboardData.projects.length > 0 ? (
              <>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  💡 Pinned projects appear first
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {dashboardData.projects.map((project, index) => (
                    <ProjectTile
                      key={project.id}
                      project={project}
                      index={index}
                      onTogglePin={handleTogglePin}
                      onConvertToWebsite={handleConvertToWebsite}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyProjects />
            )}
          </div>
        </motion.div>

        {/* Upcoming Tasks Section */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Upcoming Tasks
            </h2>
            <Link
              href="/board"
              prefetch
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View All Tasks →
            </Link>
          </div>

          <div className="min-h-[160px]" aria-busy={isLoading}>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <SkeletonGlass key={i} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      </div>
                    </div>
                  </SkeletonGlass>
                ))}
              </div>
            ) : dashboardData?.upcoming && dashboardData.upcoming.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcoming.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpen={(task) => router.push(`/tasks/${task.id}`)}
                    className="hover:shadow-softer transition-shadow"
                  />
                ))}
                <div className="mt-4 text-right">
                  <Link
                    href="/board"
                    prefetch
                    className="text-xs underline underline-offset-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    View all
                  </Link>
                </div>
              </div>
            ) : (
              <GlassCard className="text-center py-12">
                <div className="text-slate-400 dark:text-slate-500 mb-2">
                  <Clock className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="font-medium text-slate-600 dark:text-slate-400 mb-1">
                  No upcoming tasks
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {selectedRoleId
                    ? 'No tasks for this role in the next 7 days'
                    : 'All caught up! 🎉'}
                </p>
              </GlassCard>
            )}
          </div>
        </motion.div>

        {/* Search Affordance - Hidden on mobile */}
        <motion.div variants={itemVariants} className="hidden md:block fixed bottom-6 right-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Trigger the command palette
              document.dispatchEvent(
                new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' })
              );
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all"
          >
            <Search className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Search tasks/projects
            </span>
            <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
              ⌘K
            </kbd>
          </motion.button>
        </motion.div>

        {/* Project Details Modal */}
        <ProjectDetailsModal
          projectId={selectedProjectId}
          isOpen={projectModalOpen}
          onClose={() => {
            setProjectModalOpen(false);
            setSelectedProjectId(null);
          }}
        />
      </motion.div>
    </div>
  );
}
