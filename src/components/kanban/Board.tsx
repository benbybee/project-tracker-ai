'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
} from '@dnd-kit/core';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';

const COLUMNS = ['not_started', 'in_progress', 'blocked', 'completed'] as const;

interface BoardProps {
  initial: Record<string, any[]>;
  projectId?: string;
  onEditTask?: (task: any) => void;
}

export default function Board({ initial, projectId, onEditTask }: BoardProps) {
  const [columns, setColumns] = useState(initial);
  const [activeTask, setActiveTask] = useState<any>(null);

  const reorder = trpc.tasks.reorder.useMutation();

  const onDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = Object.values(columns)
      .flat()
      .find((t: any) => t.id === taskId);
    setActiveTask(task);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const taskId = event.active.id as string;
    const toColumn = event.over?.data.current?.column as
      | (typeof COLUMNS)[number]
      | undefined;

    if (!toColumn) {
      setActiveTask(null);
      return;
    }

    // Find the current column for this task
    let fromColumn: string | null = null;
    for (const [status, tasks] of Object.entries(columns)) {
      if (tasks.some((t: any) => t.id === taskId)) {
        fromColumn = status;
        break;
      }
    }

    if (!fromColumn || fromColumn === toColumn) {
      setActiveTask(null);
      return;
    }

    // Update local state immediately
    setColumns((prev) => {
      const newColumns = { ...prev };

      // Remove from old column
      newColumns[fromColumn!] = newColumns[fromColumn!].filter(
        (t: any) => t.id !== taskId
      );

      // Add to new column
      const task = Object.values(prev)
        .flat()
        .find((t: any) => t.id === taskId);
      if (task) {
        newColumns[toColumn] = [
          ...(newColumns[toColumn] || []),
          { ...task, status: toColumn },
        ];
      }

      return newColumns;
    });

    // Persist changes to server
    const orderedIdsByStatus: Record<string, string[]> = {};
    COLUMNS.forEach((status) => {
      orderedIdsByStatus[status] = (columns[status] || []).map(
        (t: any) => t.id
      );
    });

    reorder.mutate({
      projectId: projectId || '',
      orderedIdsByStatus,
    });

    setActiveTask(null);
  };

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={columns[status] || []}
            onEditTask={onEditTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanTask task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
