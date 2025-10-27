'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState, useEffect, useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import KanbanFilters from './KanbanFilters';
import { getDB } from '@/lib/db.client';
import { enqueueOp } from '@/lib/ops-helpers';
import { getFreshBaseVersionForTask } from '@/lib/sync-manager';
import { useTasksStore } from '@/lib/tasks-store';
import { Task, TaskStatus } from '@/types/task';
import { useRealtime } from '@/app/providers';

type BoardVariant = 'default' | 'website';

interface KanbanBoardProps {
  projectId?: string;
  variant?: BoardVariant;
}

const DEFAULT_COLS: TaskStatus[] = [
  'not_started',
  'in_progress',
  'blocked',
  'completed',
];
const WEB_COLS: TaskStatus[] = [
  'not_started',
  'content',
  'design',
  'dev',
  'qa',
  'launch',
  'completed',
];

export function KanbanBoard({
  projectId,
  variant = 'default',
}: KanbanBoardProps) {
  const columns = variant === 'website' ? WEB_COLS : DEFAULT_COLS;

  // Improved sensor configuration for smoother drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px movement to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const { byId, bulkUpsert, upsert } = useTasksStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const realtime = useRealtime();

  // Load tasks from Dexie on mount
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const db = await getDB();
        const tasks = projectId
          ? await db.tasks.where('projectId').equals(projectId).toArray()
          : await db.tasks.toArray();
        bulkUpsert(tasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Listen for real-time updates
  useEffect(() => {
    const unsubscribeActivity = realtime.onActivity((activity) => {
      // Reload tasks when new tasks are created or updated
      if (
        activity.type === 'task_created' ||
        activity.type === 'task_updated'
      ) {
        (async () => {
          try {
            // First trigger sync to get latest data from server
            const { pullChanges } = await import('@/lib/sync-manager');
            await pullChanges();

            // Then reload tasks from local database
            const db = await getDB();
            const tasks = projectId
              ? await db.tasks.where('projectId').equals(projectId).toArray()
              : await db.tasks.toArray();
            bulkUpsert(tasks);
          } catch (error) {
            console.error('Failed to reload tasks:', error);
          }
        })();
      }
    });

    return () => {
      unsubscribeActivity();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Derive unique roles from tasks
  const uniqueRoles = useMemo(() => {
    const roleSet = new Set<string>();
    Object.values(byId).forEach((task) => {
      if (task.role) {
        const roleName =
          typeof task.role === 'string' ? task.role : task.role.name;
        if (roleName) roleSet.add(roleName);
      }
    });
    return ['All', ...Array.from(roleSet).sort()];
  }, [byId]);

  // Group tasks by column
  const tasksByCol = useMemo(() => {
    const allTasks = Object.values(byId);

    // Apply filters
    const filtered = allTasks
      .filter((t) => !projectId || t.projectId === projectId)
      .filter((t) => {
        if (!roleFilter) return true;
        const taskRole = t.role;
        if (!taskRole) return false;
        const roleName =
          typeof taskRole === 'string' ? taskRole : taskRole.name;
        return roleName === roleFilter;
      });

    // Group by status
    const bucket: Record<string, Task[]> = {};
    for (const col of columns) {
      bucket[col] = [];
    }

    for (const task of filtered) {
      if (bucket[task.status]) {
        bucket[task.status].push(task);
      } else {
        // If task status doesn't match columns, put in first column
        bucket[columns[0]].push(task);
      }
    }

    // Sort by updatedAt (most recent first)
    for (const col of columns) {
      bucket[col].sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return bucket;
  }, [byId, projectId, roleFilter, columns]);

  const onDragStart = (event: DragStartEvent) => {
    const task: Task | undefined = event.active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task: Task | undefined = active.data.current?.task;
    const toCol: TaskStatus | undefined = over.data.current?.col;

    if (!task || !toCol || task.status === toCol) return;

    try {
      const now = new Date().toISOString();
      const updatedTask: Task = {
        ...task,
        status: toCol,
        updatedAt: now,
        version: (task.version || 0) + 1,
      };

      // Optimistic update
      upsert(updatedTask);

      // Write to Dexie
      const db = await getDB();
      await db.tasks.put(updatedTask);

      // Get fresh baseVersion to avoid false conflicts
      const baseVersion = await getFreshBaseVersionForTask(task.id);

      // Enqueue sync operation
      await enqueueOp({
        entityType: 'task',
        entityId: task.id,
        action: 'update',
        payload: { status: toCol },
        baseVersion,
        projectId: task.projectId || undefined,
      });

      // Broadcast real-time update
      realtime.broadcastActivity({
        type: 'task_updated',
        entityType: 'task',
        entityId: task.id,
        data: {
          taskId: task.id,
          status: toCol,
          projectId: task.projectId,
          ticketId: task.ticketId, // Include ticketId so tickets page can update
        },
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update on error
      upsert(task);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column} className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Role Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <KanbanFilters
          roles={uniqueRoles}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((status) => {
            const items = tasksByCol[status] || [];
            return <KanbanColumn key={status} status={status} items={items} />;
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105 opacity-90">
              <KanbanTask task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
