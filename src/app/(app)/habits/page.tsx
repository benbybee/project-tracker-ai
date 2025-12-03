'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { HabitList } from '@/components/habits/habit-list';
import { HabitStats } from '@/components/habits/habit-stats';
import { HabitFormModal } from '@/components/habits/habit-form-modal';
import { Button } from '@/components/ui/button';
import {
  Plus,
  CheckCircle,
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Habit } from '@/server/db/schema/habits';

export default function HabitsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [selectedDate] = useState(new Date());

  const { data: habits, isLoading: isLoadingHabits } =
    trpc.habits.list.useQuery();

  // Fetch logs for the selected date (and maybe surrounding for stats)
  // For now, just fetching selected date's logs for the list check status
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: logs, isLoading: isLoadingLogs } = trpc.habits.getLogs.useQuery(
    {
      startDate: dateStr,
      endDate: dateStr,
    }
  );

  const handleEdit = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setHabitToEdit(undefined);
  };

  const isLoading = isLoadingHabits || isLoadingLogs;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/50">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-transparent backdrop-blur-xl sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Daily Habits
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build consistency and track your daily success
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium">
              {format(selectedDate, 'MMMM d, yyyy')}
            </span>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Habit
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !habits || habits.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <CheckCircle className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              No habits defined
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Start building good habits today
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline">
              Create Habit
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <HabitStats habits={habits} logs={logs || []} />
            <HabitList
              habits={habits}
              logs={logs || []}
              date={selectedDate}
              onEdit={handleEdit}
            />
          </div>
        )}
      </main>

      <HabitFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        habitToEdit={habitToEdit}
      />
    </div>
  );
}
