'use client';

import { create } from 'zustand';
import { Task } from '@/types/task';

type TasksStore = {
  byId: Record<string, Task>;
  upsert: (task: Task) => void;
  bulkUpsert: (tasks: Task[]) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useTasksStore = create<TasksStore>((set) => ({
  byId: {},

  upsert: (task: Task) =>
    set((state) => ({
      byId: { ...state.byId, [task.id]: task },
    })),

  bulkUpsert: (tasks: Task[]) =>
    set((state) => {
      const byId = { ...state.byId };
      for (const task of tasks) {
        byId[task.id] = task;
      }
      return { byId };
    }),

  remove: (id: string) =>
    set((state) => {
      const byId = { ...state.byId };
      delete byId[id];
      return { byId };
    }),

  clear: () => set({ byId: {} }),
}));
