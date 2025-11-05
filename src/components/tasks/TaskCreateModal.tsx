'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { trpc } from '@/lib/trpc';
import { useParams } from 'next/navigation';
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
import { RecurringTaskModal } from '@/components/tasks/recurring-task-modal';
import { TaskTemplateModal } from '@/components/tasks/task-template-modal';
import { type RecurrenceConfig } from '@/lib/recurrence-parser';
import { Repeat, FileText } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
  defaultStatus?: TaskStatus;
  defaultDueDate?: string;
}

export function TaskCreateModal({
  open,
  onClose,
  projectId,
  defaultStatus,
  defaultDueDate,
}: TaskCreateModalProps) {
  const params = useParams<{ id?: string }>();

  const [form, setForm] = useState<Partial<Task>>({
    projectId: projectId || params?.id,
    status: defaultStatus || 'not_started',
    title: '',
    description: '',
    dueDate: defaultDueDate || '',
    priorityScore: 2,
  });

  const [saving, setSaving] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [recurrenceConfig, setRecurrenceConfig] =
    useState<RecurrenceConfig | null>(null);

  const utils = trpc.useUtils();
  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
    },
  });
  const createRecurringTask = trpc.recurring.createRecurringTask.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.get.invalidate();
      utils.recurring.listRecurringTasks.invalidate();
    },
  });

  const updateForm = (updates: Partial<Task>) => {
    setForm((prev) => ({ ...prev, ...updates }));
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
      // If recurrence is set, create recurring task
      if (recurrenceConfig) {
        await createRecurringTask.mutateAsync({
          projectId: form.projectId,
          title: form.title.trim(),
          description: form.description || undefined,
          priorityScore: form.priorityScore?.toString() as
            | '1'
            | '2'
            | '3'
            | '4',
          startDate: form.dueDate || new Date().toISOString().split('T')[0],
          recurrenceConfig: {
            ...recurrenceConfig,
            endDate: recurrenceConfig.endDate
              ? recurrenceConfig.endDate.toISOString().split('T')[0]
              : undefined,
          },
        });
      } else {
        // Regular task
        await createTask.mutateAsync({
          projectId: form.projectId,
          title: form.title.trim(),
          description: form.description || undefined,
          status: form.status || 'not_started',
          dueDate: form.dueDate || undefined,
          priorityScore: form.priorityScore?.toString() as
            | '1'
            | '2'
            | '3'
            | '4'
            | undefined,
        });
      }

      // Reset form and close
      setForm({
        projectId: projectId || params?.id,
        status: defaultStatus || 'not_started',
        title: '',
        description: '',
        dueDate: '',
        priorityScore: 2,
      });
      setRecurrenceConfig(null);
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelected = (templateData: any) => {
    // Populate form with template data
    setForm((prev) => ({
      ...prev,
      title: templateData.title,
      description: templateData.description,
      priorityScore: templateData.priorityScore || 2,
    }));
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
              value={form.dueDate || null}
              onChange={(date) => {
                console.log('📅 TaskCreateModal - Date changed:', date);
                updateForm({ dueDate: date || '' });
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

          {/* Recurrence & Template Options */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecurringModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Repeat className="h-4 w-4" />
              {recurrenceConfig ? 'Edit Recurrence' : 'Make Recurring'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTemplateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Use Template
            </Button>
          </div>

          {recurrenceConfig && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                🔁 Recurring task configured
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRecurrenceConfig(null)}
                className="mt-1 text-xs"
              >
                Remove recurrence
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Recurring Task Modal */}
      <RecurringTaskModal
        open={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        onSave={(config) => setRecurrenceConfig(config)}
        initialConfig={recurrenceConfig || undefined}
      />

      {/* Template Modal */}
      <TaskTemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        mode="use"
        onUseTemplate={handleTemplateSelected}
      />
    </Dialog>
  );
}
