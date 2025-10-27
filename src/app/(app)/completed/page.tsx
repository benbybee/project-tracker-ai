'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Calendar,
  FolderOpen,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/layout/page-header';

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
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={CheckCircle2}
          title="Completed Tasks"
          subtitle="Archive of completed tasks (last 6 months)"
          actions={
            <button
              onClick={exportCSV}
              disabled={tasks.length === 0}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 p-4 bg-white/80 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-initial"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="180">Last 6 months</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <FolderOpen className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-initial"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-initial"
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
            {/* Mobile View */}
            <div className="block sm:hidden space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white/80 backdrop-blur hover:bg-gray-50 transition-colors"
                >
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {task.project && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {task.project.name}
                      </span>
                    )}
                    {task.archived ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    {task.role ? (
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: task.role.color }}
                        ></div>
                        <span className="text-gray-600">{task.role.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No role</span>
                    )}
                    <span className="text-gray-500">
                      {task.archivedAt
                        ? format(new Date(task.archivedAt), 'MMM d, yyyy')
                        : format(new Date(task.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block rounded-xl border bg-white/80 backdrop-blur overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {task.project ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {task.project.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {task.role ? (
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: task.role.color }}
                              ></div>
                              <span className="text-gray-600">
                                {task.role.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {task.archived ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Archived
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {task.archivedAt
                            ? format(new Date(task.archivedAt), 'MMM d, yyyy')
                            : format(new Date(task.updatedAt), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {hasMore && (
              <div className="text-center mt-6">
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
    </div>
  );
}
