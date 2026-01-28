'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useEffect, useMemo, useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import KanbanFilters from './KanbanFilters';
import { Task, TaskStatus } from '@/types/task';
import { useRealtime } from '@/app/providers';
import { trpc } from '@/lib/trpc';
import { useTouchDevice } from '@/hooks/useTouchDevice';

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
  const isTouchDevice = useTouchDevice();

  // Improved sensor configuration for smoother drag and drop
  // Call all hooks unconditionally (Rules of Hooks requirement)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // 5px movement to start drag
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  // Always include pointer/mouse; add touch for touch-capable devices
  const sensors = useSensors(
    pointerSensor,
    mouseSensor,
    ...(isTouchDevice ? [touchSensor] : [])
  );

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [columnsState, setColumnsState] = useState<Record<string, Task[]>>({});
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const realtime = useRealtime();

  const utils = trpc.useUtils();
  const { data: tasks = [], isLoading } = trpc.tasks.list.useQuery(
    projectId ? { projectId } : {}
  );
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  // Derive unique roles from tasks
  const uniqueRoles = useMemo(() => {
    const roleSet = new Set<string>();
    tasks.forEach((task) => {
      if (task.role) {
        const roleName =
          typeof task.role === 'string' ? task.role : task.role.name;
        if (roleName) roleSet.add(roleName);
      }
    });
    return ['All', ...Array.from(roleSet).sort()];
  }, [tasks]);

  // Group tasks by column
  const tasksByCol = useMemo(() => {
    // Apply filters
    const filtered = tasks
      .filter((t) => !t.archived) // Exclude archived tasks
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
  }, [tasks, roleFilter, columns]);

  useEffect(() => {
    setColumnsState(tasksByCol);
  }, [tasksByCol]);

  const findColumnForTask = (
    taskId: string,
    source: Record<string, Task[]>
  ) => {
    return Object.keys(source).find((status) =>
      source[status]?.some((t) => t.id === taskId)
    );
  };

  const findTaskById = (taskId: string, source: Record<string, Task[]>) => {
    for (const status of Object.keys(source)) {
      const found = source[status]?.find((t) => t.id === taskId);
      if (found) return found;
    }
    return undefined;
  };

  const onDragStart = (event: DragStartEvent) => {
    const task: Task | undefined = event.active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setColumnsState((prev) => {
      const sourceCol = findColumnForTask(activeId, prev);
      const targetCol = columns.includes(overId as TaskStatus)
        ? (overId as TaskStatus)
        : findColumnForTask(overId, prev);

      if (!sourceCol || !targetCol) return prev;

      if (sourceCol === targetCol) {
        const items = prev[sourceCol] || [];
        const oldIndex = items.findIndex((t) => t.id === activeId);
        const newIndex = items.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return prev;
        }
        return {
          ...prev,
          [sourceCol]: arrayMove(items, oldIndex, newIndex),
        };
      }

      const sourceItems = prev[sourceCol] || [];
      const targetItems = prev[targetCol] || [];
      const moving = sourceItems.find((t) => t.id === activeId);
      if (!moving) return prev;

      const filteredSource = sourceItems.filter((t) => t.id !== activeId);
      const overIndex = targetItems.findIndex((t) => t.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : targetItems.length;
      const nextTarget = [
        ...targetItems.slice(0, insertIndex),
        { ...moving, status: targetCol as TaskStatus },
        ...targetItems.slice(insertIndex),
      ];

      return {
        ...prev,
        [sourceCol]: filteredSource,
        [targetCol]: nextTarget,
      };
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      setColumnsState(tasksByCol);
      return;
    }

    const activeId = String(active.id);
    const task: Task | undefined =
      active.data.current?.task || findTaskById(activeId, columnsState);
    const directCol =
      (over.data.current?.col as TaskStatus | undefined) ||
      (columns.includes(String(over.id) as TaskStatus)
        ? (String(over.id) as TaskStatus)
        : undefined);
    const inferredCol = task
      ? (findColumnForTask(task.id, columnsState) as TaskStatus | undefined)
      : undefined;
    const toCol = directCol ?? inferredCol;

    if (!task || !toCol || task.status === toCol) return;

    try {
      // Update via tRPC mutation
      await updateTask.mutateAsync({
        id: task.id,
        status: toCol,
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
      setColumnsState(tasksByCol);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
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
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0 overflow-x-auto">
          {columns.map((status) => {
            const items = columnsState[status] || [];
            return (
              <KanbanColumn
                key={status}
                status={status}
                items={items}
                isTouchDevice={isTouchDevice}
              />
            );
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
