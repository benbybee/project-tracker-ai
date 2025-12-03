'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  User,
  CheckSquare,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface ActivityItemProps {
  activity: {
    id: string;
    actorId: string;
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
    createdAt: Date;
    actor?: {
      name: string;
      email: string;
    };
    project?: {
      name: string;
    };
    task?: {
      title: string;
    };
  };
  showProject?: boolean;
}

export function ActivityItem({
  activity,
  showProject = true,
}: ActivityItemProps) {
  const getActionIcon = () => {
    switch (activity.action) {
      case 'created':
        return <CheckSquare className="h-4 w-4 text-green-500" />;
      case 'updated':
        return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'assigned':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'commented':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'mentioned':
        return <User className="h-4 w-4 text-yellow-500" />;
      case 'synced':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'conflict_resolved':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionText = () => {
    const actorName = activity.actor?.name || 'Someone';
    const targetName = activity.task?.title || activity.project?.name || 'item';

    // Special handling for sync activities
    if (activity.targetType === 'sync' && activity.action === 'synced') {
      const payload = activity.payload || {};
      const tasksCount = payload.tasksCount || 0;
      const projectsCount = payload.projectsCount || 0;
      const conflictsCount = payload.conflictsCount || 0;
      const direction = payload.direction || 'sync';

      let message = `Sync ${direction === 'push' ? 'uploaded' : 'downloaded'}`;

      const parts = [];
      if (tasksCount > 0)
        parts.push(`${tasksCount} task${tasksCount > 1 ? 's' : ''}`);
      if (projectsCount > 0)
        parts.push(`${projectsCount} project${projectsCount > 1 ? 's' : ''}`);

      if (parts.length > 0) {
        message += `: ${parts.join(', ')}`;
      }

      if (conflictsCount > 0) {
        message += ` (${conflictsCount} conflict${conflictsCount > 1 ? 's' : ''})`;
      }

      return message;
    }

    switch (activity.action) {
      case 'created':
        return `${actorName} created ${targetName}`;
      case 'updated':
        return `${actorName} updated ${targetName}`;
      case 'completed':
        return `${actorName} completed ${targetName}`;
      case 'assigned':
        return `${actorName} assigned ${targetName}`;
      case 'commented':
        return `${actorName} commented on ${targetName}`;
      case 'mentioned':
        return `${actorName} mentioned you in ${targetName}`;
      case 'synced':
        return `${actorName} synced changes`;
      case 'conflict_resolved':
        return `${actorName} resolved a conflict in ${targetName}`;
      default:
        return `${actorName} performed an action on ${targetName}`;
    }
  };

  const getTimeAgo = () => {
    try {
      return formatDistanceToNow(new Date(activity.createdAt), {
        addSuffix: true,
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-shrink-0">{getActionIcon()}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-900">{getActionText()}</p>
          <time className="text-xs text-gray-500">{getTimeAgo()}</time>
        </div>

        {activity.payload?.message && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {activity.payload.message}
          </p>
        )}

        {showProject && activity.project && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activity.project.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
