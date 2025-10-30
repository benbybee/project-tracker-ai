'use client';

/**
 * Advanced Search Builder Component
 * Multi-criteria search with filter builder UI
 */

import { useState } from 'react';
import { Search, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';

export interface SearchFilters {
  query?: string;
  statuses?: string[];
  priorities?: string[];
  roleIds?: string[];
  assigneeIds?: string[];
  projectIds?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  hasNoDueDate?: boolean;
}

export interface AdvancedSearchBuilderProps {
  onSearch: (filters: SearchFilters) => void;
  onReset?: () => void;
  initialFilters?: SearchFilters;
  className?: string;
}

export function AdvancedSearchBuilder({
  onSearch,
  onReset,
  initialFilters,
  className,
}: AdvancedSearchBuilderProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});
  const [expanded, setExpanded] = useState(false);

  // Load options for dropdowns
  const { data: roles = [] } = trpc.roles.list.useQuery(undefined, {
    staleTime: 60000,
  });

  const { data: projects = [] } = trpc.projects.list.useQuery(undefined, {
    staleTime: 60000,
  });

  // Status and priority options
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
    { value: 'blocked', label: 'Blocked' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  // Update filter value
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Add value to array filter
  const addToFilter = (
    key: 'statuses' | 'priorities' | 'roleIds' | 'projectIds',
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), value],
    }));
  };

  // Remove value from array filter
  const removeFromFilter = (
    key: 'statuses' | 'priorities' | 'roleIds' | 'projectIds',
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((v) => v !== value),
    }));
  };

  // Handle search
  const handleSearch = () => {
    onSearch(filters);
  };

  // Handle reset
  const handleReset = () => {
    setFilters({});
    onReset?.();
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query') return value && value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  }).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="outline"
          className="relative"
        >
          Advanced
          {activeFilterCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        <Button onClick={handleSearch}>Search</Button>
        {activeFilterCount > 0 && (
          <Button onClick={handleReset} variant="ghost">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {expanded && (
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={(value) => addToFilter('statuses', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions
                    .filter((opt) => !filters.statuses?.includes(opt.value))
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {filters.statuses && filters.statuses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.statuses.map((status) => (
                    <Badge key={status} variant="secondary" className="gap-1">
                      {statusOptions.find((s) => s.value === status)?.label}
                      <button
                        onClick={() => removeFromFilter('statuses', status)}
                        className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Priority filter */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(value) => addToFilter('priorities', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions
                    .filter((opt) => !filters.priorities?.includes(opt.value))
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {filters.priorities && filters.priorities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.priorities.map((priority) => (
                    <Badge key={priority} variant="secondary" className="gap-1">
                      {priorityOptions.find((p) => p.value === priority)?.label}
                      <button
                        onClick={() => removeFromFilter('priorities', priority)}
                        className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Role filter */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select onValueChange={(value) => addToFilter('roleIds', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => !filters.roleIds?.includes(role.id))
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {filters.roleIds && filters.roleIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.roleIds.map((roleId) => {
                    const role = roles.find((r) => r.id === roleId);
                    return (
                      <Badge key={roleId} variant="secondary" className="gap-1">
                        {role?.name}
                        <button
                          onClick={() => removeFromFilter('roleIds', roleId)}
                          className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Project filter */}
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                onValueChange={(value) => addToFilter('projectIds', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects
                    .filter(
                      (project) => !filters.projectIds?.includes(project.id)
                    )
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {filters.projectIds && filters.projectIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.projectIds.map((projectId) => {
                    const project = projects.find((p) => p.id === projectId);
                    return (
                      <Badge
                        key={projectId}
                        variant="secondary"
                        className="gap-1"
                      >
                        {project?.name}
                        <button
                          onClick={() =>
                            removeFromFilter('projectIds', projectId)
                          }
                          className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Due date from */}
            <div className="space-y-2">
              <Label>Due Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dueDateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dueDateFrom ? (
                      format(filters.dueDateFrom, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dueDateFrom}
                    onSelect={(date) => updateFilter('dueDateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Due date to */}
            <div className="space-y-2">
              <Label>Due Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !filters.dueDateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dueDateTo ? (
                      format(filters.dueDateTo, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dueDateTo}
                    onSelect={(date) => updateFilter('dueDateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* No due date checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasNoDueDate"
              checked={filters.hasNoDueDate || false}
              onChange={(e) => updateFilter('hasNoDueDate', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="hasNoDueDate" className="cursor-pointer">
              Include tasks with no due date
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
