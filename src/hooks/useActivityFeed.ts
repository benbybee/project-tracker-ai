'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useRealtime } from '@/app/providers';

export function useActivityFeed(projectId?: string) {
  const [activities, setActivities] = useState<any[]>([]);
  const { onActivity, broadcastActivity } = useRealtime();

  const { data: activitiesData, refetch: refetchActivities } =
    trpc.activity.getActivityFeed.useQuery({
      projectId,
      limit: 20,
    });

  const logActivityMutation = trpc.activity.logActivity.useMutation({
    onSuccess: (activity) => {
      // Broadcast the activity to other clients
      broadcastActivity(activity);
      refetchActivities();
    },
  });

  // Update local state when data changes
  useEffect(() => {
    if (activitiesData) {
      setActivities(activitiesData);
    }
  }, [activitiesData]);

  // Listen for real-time activities
  useEffect(() => {
    const unsubscribe = onActivity((activity: any) => {
      setActivities((prev) => [activity, ...prev]);
    });

    return unsubscribe;
  }, [onActivity]);

  const logActivity = async (activity: {
    targetType: 'task' | 'project' | 'comment' | 'sync' | 'system';
    targetId?: string;
    action:
      | 'created'
      | 'updated'
      | 'deleted'
      | 'assigned'
      | 'completed'
      | 'commented'
      | 'mentioned'
      | 'synced'
      | 'conflict_resolved';
    payload?: any;
    projectId?: string;
    taskId?: string;
  }) => {
    return await logActivityMutation.mutateAsync(activity);
  };

  const loadMore = async () => {
    // In a real implementation, this would load more activities
    // For now, we'll just refetch with a higher limit
    await refetchActivities();
  };

  return {
    activities,
    logActivity,
    loadMore,
    refetchActivities,
    isLoading: logActivityMutation.isPending,
  };
}
