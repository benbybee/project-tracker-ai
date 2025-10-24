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
  'blocked': 'Blocked',
  'completed': 'Completed',
  'content': 'Content',
  'design': 'Design',
  'dev': 'Development',
  'qa': 'QA',
  'launch': 'Launch',
};

const STATUS_COLORS = {
  'not_started': 'bg-gray-100',
  'in_progress': 'bg-blue-100',
  'blocked': 'bg-red-100',
  'completed': 'bg-green-100',
  'content': 'bg-purple-100',
  'design': 'bg-pink-100',
  'dev': 'bg-cyan-100',
  'qa': 'bg-yellow-100',
  'launch': 'bg-orange-100',
};

export function KanbanColumn({ status, items, title, onEditTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      col: status, // This matches what onDragEnd looks for
    },
  });

  const columnTitle = title || STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
  const columnColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100';

  return (
    <div 
      ref={setNodeRef}
      className={`rounded-xl bg-white/70 backdrop-blur p-3 border border-gray-200 min-h-[500px] transition-all ${isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm capitalize text-gray-700">
          {columnTitle.replace('_', ' ')}
        </h3>
        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          {items.map((task) => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
