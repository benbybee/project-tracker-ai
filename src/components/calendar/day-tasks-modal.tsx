'use client';

import { useState } from 'react';
import { type CalendarEvent } from '@/lib/calendar-utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { Plus, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { TaskModal } from '@/components/tasks/TaskModal';

interface DayTasksModalProps {
  date: Date | null;
  events: CalendarEvent[];
  open: boolean;
  onClose: () => void;
}

export function DayTasksModal({
  date,
  events,
  open,
  onClose,
}: DayTasksModalProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const utils = trpc.useUtils();
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  const { data: tasks } = trpc.tasks.list.useQuery({});

  if (!date) return null;

  const dateString = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus as any,
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskModalOpen(true);
  };

  const handleAddTask = () => {
    setCreateModalOpen(true);
  };

  const selectedTask = tasks?.find((t) => t.id === selectedTaskId);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Tasks for {dateString}</span>
              <Button
                size="sm"
                onClick={handleAddTask}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No tasks due on this day.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTask}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add a task
                </Button>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: event.color || '#6B7280',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="truncate">{event.projectName}</span>
                        {event.priority && (
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              event.priority === 1 &&
                                'bg-gray-100 text-gray-700',
                              event.priority === 2 &&
                                'bg-blue-100 text-blue-700',
                              event.priority === 3 &&
                                'bg-orange-100 text-orange-700',
                              event.priority === 4 && 'bg-red-100 text-red-700'
                            )}
                          >
                            P{event.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={event.status}
                        onValueChange={(value) =>
                          handleStatusChange(event.id, value)
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">
                            Not Started
                          </SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="dev">Development</SelectItem>
                          <SelectItem value="qa">QA</SelectItem>
                          <SelectItem value="launch">Launch</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTask(event.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Edit Modal */}
      {selectedTask && (
        <TaskModal
          projectId={selectedTask.projectId}
          defaultValues={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description || '',
            dueDate: selectedTask.dueDate || '',
            priorityScore: selectedTask.priorityScore || '2',
            status: selectedTask.status,
            isDaily: selectedTask.isDaily || false,
            roleId:
              typeof selectedTask.role === 'string'
                ? selectedTask.role
                : selectedTask.role?.id || '',
            projectId: selectedTask.projectId,
          }}
          onClose={() => {
            setTaskModalOpen(false);
            setSelectedTaskId(null);
          }}
          isOpen={taskModalOpen}
        />
      )}

      {/* Task Create Modal */}
      <TaskCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={undefined}
        defaultStatus="not_started"
        defaultDueDate={date.toISOString().split('T')[0]}
      />
    </>
  );
}
