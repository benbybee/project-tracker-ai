'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { getDB } from '@/lib/db.client';
import { enqueueOp } from '@/lib/ops-helpers';
import { useTasksStore } from '@/lib/tasks-store';
import { useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  defaultStatus?: TaskStatus;
}

export function TaskCreateModal({ open, onClose, projectId, defaultStatus }: TaskCreateModalProps) {
  const { upsert } = useTasksStore();
  const params = useParams<{ id?: string }>();
  
  const [form, setForm] = useState<Partial<Task>>({
    projectId: projectId || params?.id,
    status: defaultStatus || 'not_started',
    title: '',
    description: '',
    dueDate: '',
    priorityScore: 2,
  });
  
  const [saving, setSaving] = useState(false);

  const updateForm = (updates: Partial<Task>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!form.title || form.title.trim().length === 0) {
      alert('Please enter a task title');
      return;
    }

    setSaving(true);
    
    try {
      const now = new Date().toISOString();
      const task: Task = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description || null,
        status: form.status || 'not_started',
        projectId: form.projectId || null,
        roleId: form.roleId || null,
        role: form.role || null,
        dueDate: form.dueDate || null,
        priorityScore: form.priorityScore || 2,
        updatedAt: now,
        createdAt: now,
        version: 0,
      };

      // Optimistic update
      upsert(task);

      // Write to Dexie
      const db = await getDB();
      await db.tasks.put(task);

      // Enqueue sync operation
      await enqueueOp({
        entityType: 'task',
        entityId: task.id,
        action: 'create',
        payload: task,
        baseVersion: 0,
        projectId: task.projectId || undefined,
      });

      // Reset form and close
      setForm({
        projectId: projectId || params?.id,
        status: defaultStatus || 'not_started',
        title: '',
        description: '',
        dueDate: '',
        priorityScore: 2,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
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
              onValueChange={(value) => updateForm({ status: value as TaskStatus })}
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
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="dev">Development</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
                <SelectItem value="launch">Launch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={form.dueDate || ''}
              onChange={(e) => updateForm({ dueDate: e.target.value })}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <Select
              value={form.priorityScore?.toString() || '2'}
              onValueChange={(value) => updateForm({ priorityScore: parseInt(value) as 1 | 2 | 3 | 4 })}
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

