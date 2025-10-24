'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import { EmptyState } from '@/components/ui/empty-state';
import { useOfflineOperations, useSync } from '@/hooks/useSync.client';
import { getDB } from '@/lib/db.client';
import { enqueueOp } from '@/lib/ops-helpers';

type BoardVariant = 'default' | 'website';

interface KanbanBoardProps {
  projectId: string;
  columns?: string[];
  fetchQuery?: {
    data?: any[];
    isLoading: boolean;
    error?: any;
  };
  onMove?: (params: { taskId: string; status: string; position: number }) => void;
  variant?: BoardVariant;
  role?: string;
}

export function KanbanBoard({ projectId, columns, fetchQuery, onMove, variant = 'default', role }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [itemsByCol, setItemsByCol] = useState<Record<string, any[]>>({});
  const { updateOffline } = useOfflineOperations();
  const { isOnline } = useSync();
  const sensors = useSensors(useSensor(PointerSensor));
  
  // Define columns based on variant
  const defaultColumns = variant === 'website'
    ? ['not_started', 'content', 'design', 'dev', 'qa', 'launch', 'completed']
    : ['not_started', 'in_progress', 'next_steps', 'blocked', 'completed'];
  
  const boardColumns = columns || defaultColumns;
  
  const { data: tasks = [], isLoading, error } = fetchQuery || { data: [], isLoading: false, error: null };

  // Filter tasks by role if specified
  const filtered = tasks.filter(t => !role || t.role === role);

  // Group tasks by status
  const tasksByStatus = filtered.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  // Initialize itemsByCol when tasks change
  useEffect(() => {
    setItemsByCol(tasksByStatus);
  }, [tasks]);

  const onDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t: any) => t.id === taskId);
    setActiveTask(task);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const fromCol = active.data.current?.col as string;
    const toCol = over.data.current?.col as string;
    if (!fromCol || !toCol || fromCol === toCol) {
      setActiveTask(null);
      return;
    }

    const task: any = active.data.current?.task;
    if (!task) {
      setActiveTask(null);
      return;
    }

    // Optimistic UI update
    setItemsByCol(prev => {
      const from = prev[fromCol]?.filter(t => t.id !== task.id) || [];
      const to = [{ ...task, status: toCol, updatedAt: new Date().toISOString() }, ...(prev[toCol] || [])];
      return { ...prev, [fromCol]: from, [toCol]: to };
    });

    try {
      const db = await getDB();
      await db.tasks.update(task.id, { 
        status: toCol, 
        updatedAt: new Date().toISOString() 
      });
      
      await enqueueOp({
        entityType: 'task',
        entityId: task.id,
        action: 'update',
        payload: { status: toCol },
        baseVersion: task.version || 0,
        projectId: task.projectId,
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update on error
      setItemsByCol(prev => {
        const from = [...(prev[fromCol] || []), task];
        const to = prev[toCol]?.filter(t => t.id !== task.id) || [];
        return { ...prev, [fromCol]: from, [toCol]: to };
      });
    }

    setActiveTask(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {boardColumns.map((column) => (
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
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {boardColumns.map((status) => (
          <SortableContext 
            key={status} 
            items={itemsByCol[status]?.map(t => t.id) || []} 
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              status={status}
              items={itemsByCol[status] || tasksByStatus[status] || []}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanTask task={activeTask} onEdit={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
