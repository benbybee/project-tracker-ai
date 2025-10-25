'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, FolderOpen, Users } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/lib/trpc';

// Use auto dynamic rendering
export const dynamic = 'force-dynamic';

interface CompletedTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
  archived: boolean | null;
  archivedAt?: Date | null;
  updatedAt: Date;
  createdAt: Date;
  projectId?: string | null;
  roleId?: string | null;
  project?: { id: string; name: string } | null;
  role?: { id: string; name: string; color: string } | null;
}

export default function CompletedTasksPage() {
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30');

  // Fetch projects and roles using tRPC
  const { data: projectsList = [] } = trpc.projects.list.useQuery({});
  const { data: rolesList = [] } = trpc.roles.list.useQuery();

  // Extract unique projects and roles for filters
  const projects = projectsList.map((p) => ({ id: p.id, name: p.name }));
  const roles = (rolesList || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    color: r.color,
  }));

  const fetchTasks = useCallback(
    async (resetPage = false) => {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '25',
        dateRange,
      });

      if (projectFilter) params.append('projectId', projectFilter);
      if (roleFilter) params.append('roleId', roleFilter);

      try {
        const res = await fetch(`/api/tasks/completed?${params}`);
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();

        if (resetPage) {
          setTasks(data.tasks || []);
          setPage(1);
        } else {
          setTasks((prev) => [...prev, ...(data.tasks || [])]);
        }

        setHasMore(data.hasMore || false);
      } catch (error) {
        console.error('Failed to fetch completed tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [page, projectFilter, roleFilter, dateRange]
  );

  // Fetch tasks on mount and when filters change
  useEffect(() => {
    fetchTasks(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter, roleFilter, dateRange]);

  const loadMore = () => {
    setPage((p) => p + 1);
    fetchTasks(false);
  };

  const exportCSV = () => {
    const headers = [
      'Title',
      'Description',
      'Status',
      'Project',
      'Role',
      'Due Date',
      'Completed At',
    ];
    const rows = tasks.map((t) => [
      t.title,
      t.description || '',
      t.status,
      t.project?.name || '',
      t.role?.name || '',
      t.dueDate || '',
      t.archivedAt
        ? format(new Date(t.archivedAt), 'yyyy-MM-dd')
        : format(new Date(t.updatedAt), 'yyyy-MM-dd'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `completed-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            🗂️ Completed Tasks
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Archive of completed tasks (last 6 months)
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={tasks.length === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white/80 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-gray-500" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {(projectFilter || roleFilter) && (
          <button
            onClick={() => {
              setProjectFilter('');
              setRoleFilter('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Tasks List */}
      {loading && tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading completed tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-gray-900 mb-2">
            No completed tasks found
          </p>
          <p className="text-gray-600 mb-4">
            Tasks are automatically archived weekly
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-gray-200 bg-white/80 p-4 hover:shadow-md transition-all"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {task.project && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700">
                      {task.project.name}
                    </span>
                  )}
                  {task.role && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${task.role.color}22`,
                        color: task.role.color,
                      }}
                    >
                      {task.role.name}
                    </span>
                  )}
                  {task.archived && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      Archived
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Completed{' '}
                  {task.archivedAt
                    ? format(new Date(task.archivedAt), 'MMM d, yyyy')
                    : format(new Date(task.updatedAt), 'MMM d, yyyy')}
                </p>
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
