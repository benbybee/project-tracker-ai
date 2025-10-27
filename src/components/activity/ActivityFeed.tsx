'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { ActivityItem } from './ActivityItem';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  const [limit, setLimit] = useState(20);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

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

  const handleLoadMore = () => {
    setLimit((prev) => prev + 20);
  };

  const handleRefresh = () => {
    setHasNewUpdates(false);
    refetch();
  };

  // Smart grouping by time buckets
  const groupedActivities = useMemo(() => {
    if (!activities) return {};

    const now = new Date();
    const groups: Record<string, any[]> = {
      'Just now': [],
      'Earlier today': [],
      Yesterday: [],
      'This week': [],
      Older: [],
    };

    activities.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);
      const diffMinutes =
        (now.getTime() - activityDate.getTime()) / (1000 * 60);
      const diffHours = diffMinutes / 60;
      const diffDays = diffHours / 24;

      if (diffMinutes < 5) {
        groups['Just now'].push(activity);
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
  }, [activities]);

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
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <Filter className="h-4 w-4 text-gray-500" />

          <Select
            value={dateRange}
            onValueChange={(value: any) => setDateRange(value)}
          >
            <SelectTrigger className="w-32">
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
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
              <SelectItem value="sync">Syncs</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={actionType}
            onValueChange={(value: any) => setActionType(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="synced">Synced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center space-x-1"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </Button>
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
            <p>No activity yet</p>
            <p className="text-sm">Activity will appear here as you work</p>
          </div>
        ) : (
          Object.entries(groupedActivities).map(
            ([groupName, groupActivities]) => (
              <div key={groupName} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-600 px-3">
                  {groupName}
                </h3>
                <div className="space-y-1">
                  {groupActivities.map((activity: any) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      showProject={!projectId}
                    />
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
