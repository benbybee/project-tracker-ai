'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { GoalCard } from '@/components/goals/goal-card';
import { GoalFormModal } from '@/components/goals/goal-form-modal';
import { Button } from '@/components/ui/button';
import { Plus, Target, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal } from '@/server/db/schema/goals';

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | undefined>(undefined);

  const { data: goals, isLoading } = trpc.goals.list.useQuery();
  const deleteGoal = trpc.goals.delete.useMutation({
    onSuccess: () => {
      utils.goals.list.invalidate();
    },
  });
  const utils = trpc.useUtils();

  const handleEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal.mutateAsync({ id: goalId });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGoalToEdit(undefined);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900/50">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-transparent backdrop-blur-xl sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Target className="h-6 w-6 text-indigo-500" />
            Goals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track your long-term aspirations and milestones
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !goals || goals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Target className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
              No goals set yet
            </p>
            <p className="text-sm text-slate-400 mb-6">
              Create your first goal to start tracking your progress
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline">
              Create Goal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GoalCard
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <GoalFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        goalToEdit={goalToEdit}
      />
    </div>
  );
}

