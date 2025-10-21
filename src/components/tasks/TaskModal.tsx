'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { useOfflineOperations } from '@/hooks/useSync.client';
import { getDB } from '@/lib/db.client';

const TaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(), // ISO date or null if "Add to Daily"
  priorityScore: z.enum(['1', '2', '3', '4']).default('2'),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'completed', 'next_steps']),
  isDaily: z.boolean().optional(),
  roleId: z.string().optional(),
  projectId: z.string(),
  subtasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Subtask title is required'),
    completed: z.boolean().default(false),
  })).optional(),
});

type TaskForm = z.infer<typeof TaskSchema>;

interface TaskModalProps {
  projectId: string;
  defaultValues?: Partial<TaskForm> & { id?: string };
  onClose: () => void;
  isOpen: boolean;
}

export function TaskModal({ projectId, defaultValues, onClose, isOpen }: TaskModalProps) {
  const [addToDaily, setAddToDaily] = useState(defaultValues?.isDaily || false);
  const { createOffline, updateOffline, isOnline } = useOfflineOperations();
  
  const createTask = trpc.tasks.create.useMutation();
  const updateTask = trpc.tasks.update.useMutation();
  const { data: roles } = trpc.roles.list.useQuery();

  const { 
    register, 
    handleSubmit, 
    control,
    watch,
    setValue,
    formState: { isSubmitting, errors } 
  } = useForm<TaskForm>({
    resolver: zodResolver(TaskSchema),
    defaultValues: { 
      projectId, 
      status: 'not_started', 
      priorityScore: '2',
      isDaily: false,
      subtasks: [],
      ...defaultValues 
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'subtasks',
  });

  const onSubmit = async (data: TaskForm) => {
    try {
      const taskData = {
        ...data,
        dueDate: addToDaily ? null : data.dueDate,
        isDaily: addToDaily,
      };

      if (isOnline) {
        // Online: use tRPC mutations
        if (defaultValues?.id) {
          await updateTask.mutateAsync({
            id: defaultValues.id,
            ...taskData
          });
        } else {
          await createTask.mutateAsync(taskData);
        }
      } else {
        // Offline: save to local database
        if (defaultValues?.id) {
          await updateOffline('task', defaultValues.id, taskData);
        } else {
          await createOffline('task', taskData);
        }
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const addSubtask = () => {
    append({ title: '', completed: false });
  };

  const removeSubtask = (index: number) => {
    remove(index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

          {/* Due Date and Daily Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Input
                type="date"
                {...register('dueDate')}
                disabled={addToDaily}
                className={addToDaily ? 'bg-gray-100' : ''}
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="isDaily"
                checked={addToDaily}
                onChange={(e) => setAddToDaily(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isDaily" className="text-sm font-medium text-gray-700">
                Add to Daily (no due date)
              </label>
            </div>
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

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Subtasks
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubtask}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Subtask
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <input
                    {...register(`subtasks.${index}.title` as const)}
                    placeholder="Enter subtask"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="checkbox"
                    {...register(`subtasks.${index}.completed` as const)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSubtask(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {fields.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No subtasks added yet. Click "Add Subtask" to get started.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (defaultValues?.id ? 'Update Task' : 'Create Task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
