"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';
import { GlassCard } from "@/components/ui/glass-card";
import { SkeletonGlass } from "@/components/ui/skeleton-glass";
import { ProjectTile } from "@/components/dashboard/ProjectTile";
import { RoleFilter } from "@/components/dashboard/RoleFilter";
import { EmptyProjects } from "@/components/dashboard/EmptyProjects";
import { TaskCard } from "@/components/tasks/task-card";
import { useRouter } from "next/navigation";


export default function DashboardPage() {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Fetch roles for filter
  const { data: roles = [] } = trpc.roles.list.useQuery();

  // Fetch dashboard data with role filter
  const { data: dashboardData, isLoading } = trpc.dashboard.get.useQuery({
    roleId: selectedRoleId || undefined,
  });

  const handleRoleChange = (roleId: string | null) => {
    setSelectedRoleId(roleId);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Dashboard Overview
            </h1>
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "k" }))}
              className="text-xs rounded-full px-3 py-1 border border-white/40 bg-white/50 backdrop-blur hover:bg-white/70 transition-colors"
            >
              Search tasks & projects (⌘K)
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            At-a-glance control center for your projects and tasks
          </p>
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                    {isLoading ? "..." : dashboardData?.today || 0}
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                    {isLoading ? "..." : dashboardData?.overdue || 0}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {dashboardData.projects.map((project, index) => (
                  <ProjectTile key={project.id} project={project} index={index} />
                ))}
              </div>
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
                  {selectedRoleId ? "No tasks for this role in the next 7 days" : "All caught up! 🎉"}
                </p>
              </GlassCard>
            )}
          </div>
        </motion.div>

        {/* Search Affordance */}
        <motion.div
          variants={itemVariants}
          className="fixed bottom-6 right-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Trigger the command palette
              document.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "k" }));
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
      </motion.div>
    </div>
  );
}