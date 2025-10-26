'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { togglePin } from '@/lib/projects-client';
import { Pin, Eye } from 'lucide-react';

// Use auto dynamic rendering to avoid chunk loading issues
export const dynamic = 'force-dynamic';


export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'website'>('all');
  const router = useRouter();

  const { data: projects, isLoading } = trpc.projects.list.useQuery({
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
  });
  
  const utils = trpc.useUtils();

  const handleTogglePin = async (projectId: string, currentlyPinned: boolean) => {
    try {
      await togglePin(projectId, !currentlyPinned);
      await utils.projects.list.invalidate();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  return (
    <div className="px-6 py-4 max-w-none">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Button onClick={() => router.push('/projects/new')}>
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="general">General</option>
          <option value="website">Website</option>
        </select>
      </div>

      {/* Projects Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : projects && projects.length > 0 ? (
        <>
          <p className="text-xs text-gray-500 mb-4">💡 Pinned projects appear first</p>
          <div className="rounded-xl border bg-white/80 backdrop-blur overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            project.type === 'website'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {project.role && (
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: project.role.color }}
                            ></div>
                            <span className="text-gray-600">{project.role.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {project.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(project.id, project.pinned ?? false);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title={project.pinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin className={`h-4 w-4 ${project.pinned ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => router.push(`/projects/${project.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Project"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {search || typeFilter !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first project.'
            }
          </p>
          <Button onClick={() => router.push('/projects/new')}>
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
}
