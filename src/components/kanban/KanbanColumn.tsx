'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanTask } from './KanbanTask';

interface KanbanColumnProps {
  status: string;
  items: any[];
  title?: string;
  onEditTask?: (task: any) => void;
}

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
  content: 'Content',
  design: 'Design',
  dev: 'Development',
  qa: 'QA',
  launch: 'Launch',
};

export function KanbanColumn({ status, items, title }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      col: status, // This matches what onDragEnd looks for
    },
  });

  const columnTitle =
    title || STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl bg-white/80 backdrop-blur-sm p-4 border border-gray-200 min-h-[500px] transition-all ${isOver ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' : 'shadow-sm'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-800">
          {columnTitle.replace('_', ' ')}
        </h3>
        <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
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
