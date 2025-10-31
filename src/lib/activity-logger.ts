import { db } from '@/server/db';
import { activityLog, notifications } from '@/server/db/schema';

interface LogActivityParams {
  userId: string;
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
}

interface CreateNotificationParams {
  userId: string;
  type:
    | 'task_assigned'
    | 'task_updated'
    | 'task_completed'
    | 'project_updated'
    | 'comment_added'
    | 'mention'
    | 'sync_conflict'
    | 'collaboration';
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

/**
 * Centralized helper for logging activities and creating notifications
 * This ensures all changes are tracked and broadcast in real-time
 */
export class ActivityLogger {
  /**
   * Log an activity to the activity_log table
   */
  async logActivity(params: LogActivityParams) {
    try {
      const [activity] = await db
        .insert(activityLog)
        .values({
          actorId: params.userId,
          targetType: params.targetType,
          targetId: params.targetId,
          action: params.action,
          payload: params.payload,
          projectId: params.projectId,
          taskId: params.taskId,
        })
        .returning();

      return activity;
    } catch (error) {
      console.error('[ActivityLogger] Failed to log activity:', error);
      // Don't throw - logging should not break the main operation
      return null;
    }
  }

  /**
   * Create a notification for a user
   */
  async createNotification(params: CreateNotificationParams) {
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          link: params.link,
          metadata: params.metadata,
          read: false,
        })
        .returning();

      return notification;
    } catch (error) {
      console.error('[ActivityLogger] Failed to create notification:', error);
      // Don't throw - notification should not break the main operation
      return null;
    }
  }

  /**
   * Combined helper: Log activity AND create notification
   * Useful for actions that need both tracking and user notification
   */
  async logActivityAndNotify(
    activityParams: LogActivityParams,
    notificationParams: CreateNotificationParams
  ) {
    const activity = await this.logActivity(activityParams);
    const notification = await this.createNotification(notificationParams);

    return { activity, notification };
  }

  /**
   * Helper to generate human-readable notification messages
   */
  generateNotificationMessage(params: {
    action: string;
    entityType: string;
    entityName: string;
    actorName?: string;
  }): { title: string; message: string } {
    const { action, entityType, entityName, actorName = 'Someone' } = params;

    const actionMap: Record<string, { title: string; template: string }> = {
      created: {
        title: `New ${entityType}`,
        template: `${actorName} created ${entityType} "${entityName}"`,
      },
      updated: {
        title: `${entityType} updated`,
        template: `${actorName} updated ${entityType} "${entityName}"`,
      },
      completed: {
        title: `${entityType} completed`,
        template: `${actorName} completed ${entityType} "${entityName}"`,
      },
      assigned: {
        title: `${entityType} assigned`,
        template: `${actorName} assigned ${entityType} "${entityName}" to you`,
      },
      deleted: {
        title: `${entityType} deleted`,
        template: `${actorName} deleted ${entityType} "${entityName}"`,
      },
      blocked: {
        title: `${entityType} blocked`,
        template: `${actorName} marked ${entityType} "${entityName}" as blocked`,
      },
    };

    const mapping = actionMap[action] || {
      title: `${entityType} changed`,
      template: `${actorName} modified ${entityType} "${entityName}"`,
    };

    return {
      title: mapping.title,
      message: mapping.template,
    };
  }
}

// Singleton instance for server-side usage
export const activityLogger = new ActivityLogger();

/**
 * Helper for task-related logging
 */
export async function logTaskActivity(params: {
  userId: string;
  taskId: string;
  taskTitle: string;
  action: LogActivityParams['action'];
  projectId?: string;
  payload?: any;
  notifyUser?: string; // Optional: userId to notify
  actorName?: string;
}) {
  const activity = await activityLogger.logActivity({
    userId: params.userId,
    targetType: 'task',
    targetId: params.taskId,
    action: params.action,
    payload: params.payload,
    projectId: params.projectId,
    taskId: params.taskId,
  });

  // Create notification if specified
  if (params.notifyUser && params.notifyUser !== params.userId) {
    const { title, message } = activityLogger.generateNotificationMessage({
      action: params.action,
      entityType: 'task',
      entityName: params.taskTitle,
      actorName: params.actorName,
    });

    const typeMap: Record<string, CreateNotificationParams['type']> = {
      created: 'task_updated',
      updated: 'task_updated',
      completed: 'task_completed',
      assigned: 'task_assigned',
    };

    await activityLogger.createNotification({
      userId: params.notifyUser,
      type: typeMap[params.action] || 'task_updated',
      title,
      message,
      link: `/projects/${params.projectId}`,
      metadata: {
        taskId: params.taskId,
        action: params.action,
      },
    });
  }

  return activity;
}

/**
 * Helper for project-related logging
 */
export async function logProjectActivity(params: {
  userId: string;
  projectId: string;
  projectName: string;
  action: LogActivityParams['action'];
  payload?: any;
  notifyUsers?: string[]; // Optional: userIds to notify
  actorName?: string;
}) {
  const activity = await activityLogger.logActivity({
    userId: params.userId,
    targetType: 'project',
    targetId: params.projectId,
    action: params.action,
    payload: params.payload,
    projectId: params.projectId,
  });

  // Create notifications if specified
  if (params.notifyUsers && params.notifyUsers.length > 0) {
    const { title, message } = activityLogger.generateNotificationMessage({
      action: params.action,
      entityType: 'project',
      entityName: params.projectName,
      actorName: params.actorName,
    });

    for (const userId of params.notifyUsers) {
      if (userId !== params.userId) {
        await activityLogger.createNotification({
          userId,
          type: 'project_updated',
          title,
          message,
          link: `/projects/${params.projectId}`,
          metadata: {
            projectId: params.projectId,
            action: params.action,
          },
        });
      }
    }
  }

  return activity;
}

/**
 * Helper for sync-related logging
 */
export async function logSyncActivity(params: {
  userId: string;
  tasksCount: number;
  projectsCount: number;
  conflictsCount: number;
  payload?: any;
}) {
  return activityLogger.logActivity({
    userId: params.userId,
    targetType: 'sync',
    action: 'synced',
    payload: {
      tasksCount: params.tasksCount,
      projectsCount: params.projectsCount,
      conflictsCount: params.conflictsCount,
      ...params.payload,
    },
  });
}
