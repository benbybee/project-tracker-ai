'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import { EmptyState } from '@/components/ui/empty-state';
import { useOfflineOperations } from '@/hooks/useSync';
import { db } from '@/lib/db';

interface KanbanBoardProps {
  projectId: string;
  columns: string[];
  fetchQuery: {
    data?: any[];
    isLoading: boolean;
    error?: any;
  };
  onMove: (params: { taskId: string; status: string; position: number }) => void;
}

export function KanbanBoard({ projectId, columns, fetchQuery, onMove }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<any>(null);
  const { updateOffline, isOnline } = useOfflineOperations();
  
  const { data: tasks = [], isLoading, error } = fetchQuery;

  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  const onDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t: any) => t.id === taskId);
    setActiveTask(task);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const taskId = event.active.id as string;
    const toColumn = event.over?.data.current?.column as string | undefined;
    
    if (!toColumn || !columns.includes(toColumn)) {
      setActiveTask(null);
      return;
    }

    // Find the current column for this task
    let fromColumn: string | null = null;
    for (const [status, taskList] of Object.entries(tasksByStatus)) {
      if ((taskList as any[]).some((t: any) => t.id === taskId)) {
        fromColumn = status;
        break;
      }
    }

    if (!fromColumn || fromColumn === toColumn) {
      setActiveTask(null);
      return;
    }

    const newPosition = tasksByStatus[toColumn]?.length || 0;

    if (isOnline) {
      // Online: use the provided onMove callback
      onMove({ 
        taskId, 
        status: toColumn, 
        position: newPosition 
      });
    } else {
      // Offline: update local database and add to sync queue
      try {
        await updateOffline('task', taskId, {
          status: toColumn,
          position: newPosition,
        });
        
        // Update local state optimistically
        const task = tasks.find((t: any) => t.id === taskId);
        if (task) {
          task.status = toColumn;
          task.position = newPosition;
        }
      } catch (error) {
        console.error('Failed to update task offline:', error);
      }
    }

    setActiveTask(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  if (error) {
    return (
      <EmptyState
        title="Failed to load tasks"
        subtitle="There was an error loading the tasks for this project."
      />
    );
  }

  return (
    <DndContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={tasksByStatus[status] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanTask task={activeTask} onEdit={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
