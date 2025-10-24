'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useEffect, useMemo } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import { EmptyState } from '@/components/ui/empty-state';
import { getDB } from '@/lib/db.client';
import { enqueueOp } from '@/lib/ops-helpers';
import { useTasksStore } from '@/lib/tasks-store';
import { Task, TaskStatus } from '@/types/task';

type BoardVariant = 'default' | 'website';

interface KanbanBoardProps {
  projectId?: string;
  variant?: BoardVariant;
  role?: string;
}

const DEFAULT_COLS: TaskStatus[] = ['not_started', 'in_progress', 'next_steps', 'blocked', 'completed'];
const WEB_COLS: TaskStatus[] = ['not_started', 'content', 'design', 'dev', 'qa', 'launch', 'completed'];

export function KanbanBoard({ projectId, variant = 'default', role }: KanbanBoardProps) {
  const columns = variant === 'website' ? WEB_COLS : DEFAULT_COLS;
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Require 8px movement before drag starts
    }
  }));
  
  const { byId, bulkUpsert, upsert } = useTasksStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [projectId, bulkUpsert]);

  // Group tasks by column
  const tasksByCol = useMemo(() => {
    const allTasks = Object.values(byId);
    
    // Apply filters
    const filtered = allTasks
      .filter(t => !projectId || t.projectId === projectId)
      .filter(t => !role || t.role === role);

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
  }, [byId, projectId, role, columns]);

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
        version: (task.version || 0) + 1
      };

      // Optimistic update
      upsert(updatedTask);

      // Write to Dexie
      const db = await getDB();
      await db.tasks.put(updatedTask);

      // Enqueue sync operation
      await enqueueOp({
        entityType: 'task',
        entityId: task.id,
        action: 'update',
        payload: { status: toCol },
        baseVersion: task.version || 0,
        projectId: task.projectId || undefined,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update on error
      upsert(task);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {columns.map((status) => {
          const items = tasksByCol[status] || [];
          return (
            <SortableContext
              key={status}
              items={items.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                data-col={status}
                className="rounded-xl bg-white/70 backdrop-blur p-3 border border-gray-200 min-h-[500px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm capitalize text-gray-700">
                    {status.replace('_', ' ')}
                  </h3>
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map(task => (
                    <KanbanTask key={task.id} task={task} />
                  ))}
                  {/* Droppable area indicator */}
                  <div 
                    data-droppable 
                    data-col={status}
                    className="min-h-[50px] rounded-lg border-2 border-dashed border-transparent"
                  />
                </div>
              </div>
            </SortableContext>
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
  );
}
