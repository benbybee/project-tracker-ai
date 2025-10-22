'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    project.type === 'website'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {project.type}
                </span>
              </div>
              
              {project.description && (
                <p className="text-gray-600 text-sm mb-3">{project.description}</p>
              )}
              
              {project.role && (
                <div className="flex items-center mb-3">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: project.role.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{project.role.name}</span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
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
