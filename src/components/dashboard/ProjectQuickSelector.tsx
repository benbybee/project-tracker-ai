'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderKanban, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export function ProjectQuickSelector() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading } = trpc.projects.list.useQuery({});

  const filteredProjects = useMemo(() => {
    if (!search) return projects;
    const searchLower = search.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(searchLower));
  }, [projects, search]);

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    setOpen(false);
    setSearch('');
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'border border-gray-300 bg-white hover:bg-gray-50',
            'text-sm font-medium text-gray-700',
            'transition-colors whitespace-nowrap'
          )}
        >
          <FolderKanban className="h-4 w-4" />
          Quick Project Access
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {search ? 'No projects found' : 'No projects yet'}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="px-4 py-2 cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  {/* Role color indicator */}
                  {project.role && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.role.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {project.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          project.type === 'website'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {project.type}
                      </span>
                      {project.role && (
                        <span className="text-xs text-gray-500">
                          {project.role.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
