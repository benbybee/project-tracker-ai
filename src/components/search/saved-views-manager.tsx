'use client';

/**
 * Saved Views Manager Component
 * Save, load, and manage custom filtered views
 */

import { useState } from 'react';
import { Save, Trash2, Star, Eye } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { FilterGroup } from '@/lib/search-utils';

export interface SavedViewsManagerProps {
  viewType: 'board' | 'dashboard' | 'calendar' | 'list';
  currentFilters?: FilterGroup;
  onViewSelect: (
    filters: FilterGroup,
    viewId: string,
    viewName: string
  ) => void;
  currentViewId?: string | null;
  className?: string;
}

export function SavedViewsManager({
  viewType,
  currentFilters,
  onViewSelect,
  currentViewId,
  className,
}: SavedViewsManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const utils = trpc.useUtils();

  // Query saved views
  const { data: views = [] } = trpc.views.list.useQuery();
  const filteredViews = views.filter((v) => v.viewType === viewType);

  // Mutations
  const createMutation = trpc.views.create.useMutation({
    onSuccess: () => {
      utils.views.list.invalidate();
      toast.success('View saved successfully');
      setSaveDialogOpen(false);
      setViewName('');
      setIsDefault(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save view');
    },
  });

  const deleteMutation = trpc.views.delete.useMutation({
    onSuccess: () => {
      utils.views.list.invalidate();
      toast.success('View deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete view');
    },
  });

  const setDefaultMutation = trpc.views.setDefault.useMutation({
    onSuccess: () => {
      utils.views.list.invalidate();
      toast.success('Default view updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to set default view');
    },
  });

  // Handle save
  const handleSave = () => {
    if (!viewName.trim()) {
      toast.error('Please enter a view name');
      return;
    }

    if (!currentFilters) {
      toast.error('No filters to save');
      return;
    }

    createMutation.mutate({
      name: viewName.trim(),
      viewType,
      filters: currentFilters,
      isDefault,
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this view?')) {
      deleteMutation.mutate({ id });
    }
  };

  // Handle set default
  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate({ id });
  };

  // Handle view select
  const handleViewSelect = (view: any) => {
    onViewSelect(view.filters, view.id, view.name);
  };

  const currentView = filteredViews.find((v) => v.id === currentViewId);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Save button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!currentFilters}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save your current filters and sorting as a custom view for quick
              access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="viewName">View Name</Label>
              <Input
                id="viewName"
                placeholder="My Custom View"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default view for this page
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Saving...' : 'Save View'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load views dropdown */}
      {filteredViews.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              {currentView ? currentView.name : 'My Views'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {filteredViews.map((view) => (
              <DropdownMenuItem
                key={view.id}
                onClick={() => handleViewSelect(view)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {view.isDefault && (
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  )}
                  <span className="truncate">{view.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(view.id);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Set as default"
                  >
                    <Star
                      className={cn(
                        'w-3 h-3',
                        view.isDefault
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-400'
                      )}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(view.id);
                    }}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Delete view"
                  >
                    <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
