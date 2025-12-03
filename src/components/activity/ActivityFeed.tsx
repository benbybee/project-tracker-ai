'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { ActivityItem } from './ActivityItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Filter, Search, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityFeedProps {
  projectId?: string;
  taskId?: string;
  className?: string;
}

type DateRange = 'today' | 'week' | 'month' | 'all';
type ActionType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'assigned'
  | 'completed'
  | 'commented'
  | 'mentioned'
  | 'synced'
  | 'conflict_resolved';
type TargetType = 'task' | 'project' | 'comment' | 'sync' | 'system';

export function ActivityFeed({
  projectId,
  taskId,
  className = '',
}: ActivityFeedProps) {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [actionType, setActionType] = useState<ActionType | 'all'>('all');
  const [targetType, setTargetType] = useState<TargetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(20);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  const utils = trpc.useUtils();

  const {
    data: activities,
    isLoading,
    refetch,
  } = trpc.activity.getActivityFeed.useQuery({
    projectId,
    taskId,
    actionType: actionType !== 'all' ? actionType : undefined,
    targetType: targetType !== 'all' ? targetType : undefined,
    dateRange,
    limit,
  });

  const undoActionMutation = trpc.activity.undoAction.useMutation({
    onSuccess: () => {
      toast.success('Action undone successfully');
      refetch();
      utils.tasks.list.invalidate();
      utils.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  const handleRefresh = () => {
    setHasNewUpdates(false);
    refetch();
  };

  const handleUndo = async (activityId: string) => {
    await undoActionMutation.mutateAsync({ activityId });
  };

  const handleClearFilters = () => {
    setDateRange('all');
    setActionType('all');
    setTargetType('all');
    setSearchQuery('');
  };

  const isFiltered =
    dateRange !== 'all' ||
    actionType !== 'all' ||
    targetType !== 'all' ||
    searchQuery !== '';

  // Filter activities by search query
  const filteredActivities = useMemo(() => {
    if (!activities || !searchQuery) return activities || [];

    const query = searchQuery.toLowerCase();
    return activities.filter((activity) => {
      const payload = JSON.stringify(activity.payload || {}).toLowerCase();
      const targetType = activity.targetType?.toLowerCase() || '';
      const action = activity.action?.toLowerCase() || '';

      return (
        payload.includes(query) ||
        targetType.includes(query) ||
        action.includes(query)
      );
    });
  }, [activities, searchQuery]);

  // Smart grouping by time buckets
  const groupedActivities = useMemo(() => {
    if (!filteredActivities) return {};

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const groups: Record<string, any[]> = {
      'Recent (Undo available)': [],
      'Earlier today': [],
      Yesterday: [],
      'This week': [],
      Older: [],
    };

    filteredActivities.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);
      const diffMinutes =
        (now.getTime() - activityDate.getTime()) / (1000 * 60);
      const diffHours = diffMinutes / 60;
      const diffDays = diffHours / 24;

      // Within 5 minutes - undo available
      if (activityDate >= fiveMinutesAgo) {
        groups['Recent (Undo available)'].push(activity);
      } else if (diffHours < 24 && activityDate.getDate() === now.getDate()) {
        groups['Earlier today'].push(activity);
      } else if (diffDays < 2 && activityDate.getDate() === now.getDate() - 1) {
        groups['Yesterday'].push(activity);
      } else if (diffDays < 7) {
        groups['This week'].push(activity);
      } else {
        groups['Older'].push(activity);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([, items]) => items.length > 0)
    );
  }, [filteredActivities]);

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 p-3">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search and filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Filter className="h-4 w-4 text-gray-500" />

            <Select
              value={dateRange}
              onValueChange={(value: any) => setDateRange(value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={targetType}
              onValueChange={(value: any) => setTargetType(value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="sync">Syncs</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={actionType}
              onValueChange={(value: any) => setActionType(value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="commented">Commented</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
              </SelectContent>
            </Select>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center space-x-1 h-8"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Results count */}
        {isFiltered && (
          <div className="text-sm text-gray-600">
            Found {filteredActivities?.length || 0} matching{' '}
            {filteredActivities?.length === 1 ? 'activity' : 'activities'}
          </div>
        )}
      </div>

      {/* New updates banner */}
      {hasNewUpdates && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-blue-700">
                New updates available
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Activity list with smart grouping */}
      <div className="space-y-6">
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isFiltered ? (
              <>
                <p className="font-medium">No matching activity found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="mt-3"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium">No activity yet</p>
                <p className="text-sm mt-1">
                  Activity will appear here as you work
                </p>
              </>
            )}
          </div>
        ) : (
          Object.entries(groupedActivities).map(
            ([groupName, groupActivities]) => (
              <div key={groupName} className="space-y-2">
                <div className="flex items-center justify-between px-3">
                  <h3 className="text-sm font-semibold text-gray-600">
                    {groupName}
                  </h3>
                  {groupName === 'Recent (Undo available)' && (
                    <span className="text-xs text-gray-500">
                      {groupActivities.length}{' '}
                      {groupActivities.length === 1 ? 'action' : 'actions'}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {groupActivities.map((activity: any) => (
                    <div key={activity.id} className="group relative">
                      <ActivityItem
                        activity={activity}
                        showProject={!projectId}
                      />
                      {/* Undo button for recent actions */}
                      {groupName === 'Recent (Undo available)' &&
                        (activity.action === 'deleted' ||
                          activity.action === 'updated' ||
                          activity.action === 'completed') && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUndo(activity.id)}
                              disabled={undoActionMutation.isPending}
                              className="h-7 text-xs"
                            >
                              <Undo2 className="h-3 w-3 mr-1" />
                              Undo
                            </Button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* Load more button */}
      {activities && activities.length >= limit && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={handleLoadMore} className="w-full">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
