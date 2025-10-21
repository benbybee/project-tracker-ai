import { create } from 'zustand';

interface PlannerState {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  viewMode: 'day' | 'week' | 'month';
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  viewMode: 'day',
  setViewMode: (mode) => set({ viewMode: mode }),
  showCompleted: false,
  setShowCompleted: (show) => set({ showCompleted: show }),
}));
