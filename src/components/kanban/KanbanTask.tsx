"use client";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard, Task } from "@/components/tasks/task-card";
import { trpc } from "@/lib/trpc";

export function KanbanTask({ task, onEdit }:{ task: Task; onEdit: (t:Task)=>void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const utils = trpc.useUtils();
  const complete = trpc.tasks.complete.useMutation({ onSuccess: () => utils.tasks.invalidate() });
  const snooze = trpc.tasks.snoozeDays.useMutation({ onSuccess: () => utils.tasks.invalidate() });
  const remove = trpc.tasks.remove.useMutation({ onSuccess: () => utils.tasks.invalidate() });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
      {...attributes}
    >
      <TaskCard
        task={task}
        onOpen={onEdit}
        onComplete={(id)=>complete.mutate({ id })}
        onSnooze={(id,days)=>snooze.mutate({ id, days })}
        onDelete={(id)=>remove.mutate({ id })}
        className="cursor-grab active:cursor-grabbing"
        draggable
      />
    </div>
  );
}
