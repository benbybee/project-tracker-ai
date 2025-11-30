'use client';

import { useState } from 'react';
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
import type { Habit } from '@/server/db/schema/habits';

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  habitToEdit?: Habit;
}

export function HabitFormModal({ open, onClose, habitToEdit }: HabitFormModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    timeOfDay: 'anytime',
  });

  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();
  const createHabit = trpc.habits.create.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      onClose();
      resetForm();
    },
  });

  // Update not implemented in UI yet for simplicity as per plan, but router supports it.
  // Ideally we should support editing. I'll stick to create for now to be fast or add update if simple.
  // I'll add update support since I have the router.
  const updateHabit = trpc.habits.update.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      frequency: 'daily',
      timeOfDay: 'anytime',
    });
  };

  const handleSave = async () => {
    if (!form.title) return;

    setSaving(true);
    try {
      if (habitToEdit) {
        await updateHabit.mutateAsync({
          id: habitToEdit.id,
          title: form.title,
          description: form.description || undefined,
          frequency: form.frequency as any,
          timeOfDay: form.timeOfDay as any,
        });
      } else {
        await createHabit.mutateAsync({
          title: form.title,
          description: form.description || undefined,
          frequency: form.frequency as any,
          timeOfDay: form.timeOfDay as any,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habitToEdit ? 'Edit Habit' : 'New Habit'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Morning Jog"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Frequency</label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Time of Day</label>
              <Select
                value={form.timeOfDay}
                onValueChange={(v) => setForm({ ...form, timeOfDay: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

