'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface TaskEditModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export function TaskEditModal({ task, open, onClose }: TaskEditModalProps) {
  const [form, setForm] = useState<Task>({
    ...task,
    dueDate: task.dueDate ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const utils = trpc.useUtils();
  const { data: projects } = trpc.projects.list.useQuery({});
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });
  const deleteTask = trpc.tasks.remove.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });

  // Initialize form ONLY when task.id changes (new task opened)
  useEffect(() => {
    console.log('🔍 TaskEditModal - Task changed:', {
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      dueDateType: typeof task.dueDate,
    });

    setForm({
      ...task,
      dueDate: task.dueDate ?? null,
    });

    console.log('📝 Form initialized with dueDate:', task.dueDate);
  }, [task.id]); // ONLY re-initialize when task.id changes

  const updateForm = (updates: Partial<Task>) => {
    console.log('📝 Form updating with:', updates);
    setForm((prev) => {
      const newForm = { ...prev, ...updates };
      console.log('📝 New form state:', { dueDate: newForm.dueDate });
      return newForm;
    });
  };

  const handleSave = async () => {
    if (!form.title || form.title.trim().length === 0) {
      alert('Please enter a task title');
      return;
    }

    if (!form.projectId) {
      alert('Please select a project');
      return;
    }

    setSaving(true);

    try {
      const updatedTask = await updateTask.mutateAsync({
        id: task.id,
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        dueDate: form.dueDate,
        priorityScore: form.priorityScore?.toString() as '1' | '2' | '3' | '4',
        projectId: form.projectId,
      });

      console.log('✅ Task updated successfully:', {
        sent: { dueDate: form.dueDate },
        received: { dueDate: updatedTask.dueDate },
      });

      // Wait for cache to invalidate and refetch
      await utils.tasks.list.invalidate();
      await utils.dashboard.get.invalidate();

      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await deleteTask.mutateAsync({ id: task.id });
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <Input
              value={form.title || ''}
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder="Enter task title"
              autoFocus
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <Select
              value={form.projectId || undefined}
              onValueChange={(value) => updateForm({ projectId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder="Enter task description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                updateForm({ status: value as TaskStatus })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
                <SelectItem value="launch">Launch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* REBUILT - Phase 4: New DatePicker Component */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <DatePicker
              value={form.dueDate}
              onChange={(date) => {
                console.log('📅 TaskEditModal - Date changed:', date);
                updateForm({ dueDate: date });
              }}
              placeholder="Select due date (optional)"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Select
              value={form.priorityScore?.toString() || '2'}
              onValueChange={(value) =>
                updateForm({ priorityScore: parseInt(value) as 1 | 2 | 3 | 4 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Low</SelectItem>
                <SelectItem value="2">2 - Medium</SelectItem>
                <SelectItem value="3">3 - High</SelectItem>
                <SelectItem value="4">4 - Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Task'}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving || deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || deleting}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
