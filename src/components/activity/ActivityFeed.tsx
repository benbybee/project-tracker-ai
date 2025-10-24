'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ActivityItem } from './ActivityItem';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Filter } from 'lucide-react';

interface ActivityFeedProps {
  projectId?: string;
  className?: string;
}

export function ActivityFeed({ projectId, className = '' }: ActivityFeedProps) {
  const [filter, setFilter] = useState<'all' | 'project' | 'mentions'>('all');
  const [limit, setLimit] = useState(20);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  const { data: activities, isLoading, refetch } = trpc.activity.getActivityFeed.useQuery({
    projectId: filter === 'project' ? projectId : undefined,
    limit,
  });

  const handleLoadMore = () => {
    setLimit(prev => prev + 20);
  };

  const handleRefresh = () => {
    setHasNewUpdates(false);
    refetch();
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="mentions">Mentions</SelectItem>
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
              <span className="text-sm text-blue-700">New updates available</span>
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

      {/* Activity list */}
      <div className="space-y-1">
        {activities?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No activity yet</p>
            <p className="text-sm">Activity will appear here as you work</p>
          </div>
        ) : (
          activities?.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity as any}
              showProject={!projectId}
            />
          ))
        )}
      </div>

      {/* Load more button */}
      {activities && activities.length >= limit && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="w-full"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
