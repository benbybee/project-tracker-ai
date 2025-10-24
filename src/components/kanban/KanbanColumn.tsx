'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanTask } from './KanbanTask';

interface KanbanColumnProps {
  status: string;
  items: any[];
  title?: string;
  onEditTask?: (task: any) => void;
}

const STATUS_LABELS = {
  'not_started': 'Not Started',
  'in_progress': 'In Progress',
  'next_steps': 'Next Steps',
  'blocked': 'Blocked',
  'completed': 'Completed',
};

const STATUS_COLORS = {
  'not_started': 'bg-gray-100',
  'in_progress': 'bg-blue-100',
  'next_steps': 'bg-yellow-100',
  'blocked': 'bg-red-100',
  'completed': 'bg-green-100',
};

export function KanbanColumn({ status, items, title, onEditTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      column: status,
    },
  });

  const columnTitle = title || STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
  const columnColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100';

  return (
    <div className={`rounded-lg p-4 ${columnColor} ${isOver ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{columnTitle}</h3>
        <span className="bg-white text-gray-600 text-sm px-2 py-1 rounded-full">
          {items.length}
        </span>
      </div>

      <div ref={setNodeRef} className="space-y-3 min-h-[200px]">
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          {items.map((task) => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No tasks in this column
          </div>
        )}
      </div>
    </div>
  );
}
