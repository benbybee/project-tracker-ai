'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useOfflineOperations, useSync } from '@/hooks/useSync.client';
import { enqueueOp } from '@/lib/ops-helpers';

const TaskEditSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'completed', 'next_steps']),
  dueDate: z.string().nullable().optional(),
  priorityScore: z.enum(['1', '2', '3', '4']).default('2'),
  roleId: z.string().optional(),
  projectId: z.string(),
});

type TaskEditForm = z.infer<typeof TaskEditSchema>;

interface TaskEditModalProps {
  task: any; // Task type
  open: boolean;
  onClose: () => void;
}

export default function TaskEditModal({ task, open, onClose }: TaskEditModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const { updateOffline } = useOfflineOperations();
  const { isOnline } = useSync();
  
  const updateTask = trpc.tasks.update.useMutation();
  const { data: roles } = trpc.roles.list.useQuery();

  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    formState: { errors } 
  } = useForm<TaskEditForm>({
    resolver: zodResolver(TaskEditSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'not_started',
      dueDate: task?.dueDate || null,
      priorityScore: task?.priorityScore || '2',
      roleId: task?.roleId || '',
      projectId: task?.projectId || '',
    },
  });

  async function save() {
    if (!task) return;
    
    setSubmitting(true);
    try {
      const formData = watch();
      const patch = { 
        ...formData, 
        updatedAt: new Date().toISOString() 
      };

      if (isOnline) {
        await updateTask.mutateAsync({
          id: task.id,
          ...patch
        });
      } else {
        await updateOffline('task', task.id, patch);
        await enqueueOp({
          entityType: 'task',
          entityId: task.id,
          action: 'update',
          payload: patch,
          baseVersion: task.version || 0,
          projectId: task.projectId,
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(save)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <Input
              {...register('title')}
              placeholder="Enter task title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Enter task description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="next_steps">Next Steps</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="priorityScore" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select
                value={watch('priorityScore')?.toString()}
                onValueChange={(value) => setValue('priorityScore', parseInt(value) as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Critical</SelectItem>
                  <SelectItem value="2">2 - High</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <Input
              type="date"
              {...register('dueDate')}
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <Select
              value={watch('roleId')}
              onValueChange={(value) => setValue('roleId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role (optional)" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: role.color }}
                      ></div>
                      {role.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
