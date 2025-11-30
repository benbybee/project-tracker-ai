'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import type { Goal, NewGoal } from '@/server/db/schema/goals';

interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  goalToEdit?: Goal;
}

export function GoalFormModal({ open, onClose, goalToEdit }: GoalFormModalProps) {
  const [form, setForm] = useState<Partial<NewGoal>>({
    title: '',
    description: '',
    category: 'personal',
    targetDate: '',
    status: 'not_started',
    progress: 0,
  });

  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();
  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      onClose();
      resetForm();
    },
  });
  const updateGoal = trpc.goals.update.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
      onClose();
      resetForm();
    },
  });

  useEffect(() => {
    if (goalToEdit) {
      setForm({
        title: goalToEdit.title,
        description: goalToEdit.description || '',
        category: goalToEdit.category,
        targetDate: goalToEdit.targetDate || '',
        status: goalToEdit.status,
        progress: goalToEdit.progress || 0,
        projectId: goalToEdit.projectId,
      });
    } else {
      resetForm();
    }
  }, [goalToEdit, open]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'personal',
      targetDate: '',
      status: 'not_started',
      progress: 0,
      projectId: null,
    });
  };

  const updateField = (updates: Partial<NewGoal>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    if (!form.title || form.title.trim().length === 0) {
      return; // Add toast here ideally
    }

    setSaving(true);

    try {
      if (goalToEdit) {
        await updateGoal.mutateAsync({
          id: goalToEdit.id,
          ...form,
          // Ensure types match what mutation expects
          category: form.category as any,
          status: form.status as any,
        });
      } else {
        await createGoal.mutateAsync({
          title: form.title!,
          description: form.description || undefined,
          category: form.category as any,
          targetDate: form.targetDate || undefined,
          projectId: form.projectId || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{goalToEdit ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Goal Title *
            </label>
            <Input
              value={form.title || ''}
              onChange={(e) => updateField({ title: e.target.value })}
              placeholder="e.g., Learn Spanish"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder="What do you want to achieve?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <Select
                value={form.category}
                onValueChange={(value) => updateField({ category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Date
              </label>
              <DatePicker
                value={form.targetDate || null}
                onChange={(date) => updateField({ targetDate: date || '' })}
                placeholder="Pick a date"
              />
            </div>
          </div>

          {goalToEdit && (
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <Select
                  value={form.status}
                  onValueChange={(value) => updateField({ status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Progress ({form.progress}%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress || 0}
                  onChange={(e) => updateField({ progress: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : goalToEdit ? 'Update Goal' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

