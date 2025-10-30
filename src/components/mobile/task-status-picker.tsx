'use client';

import { CheckCircle2, Circle, CircleDashed, Clock, Lock, Rocket, FileText, Palette, Code, Bug, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TaskStatus = 
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'content'
  | 'design'
  | 'dev'
  | 'qa'
  | 'launch';

interface TaskStatusPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { 
  label: string; 
  icon: React.ComponentType<any>; 
  color: string; 
  bgColor: string;
  description: string;
}> = {
  not_started: {
    label: 'Not Started',
    icon: Circle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100 hover:bg-slate-200',
    description: 'Task hasn\'t been started yet',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 hover:bg-blue-200',
    description: 'Currently working on this',
  },
  blocked: {
    label: 'Blocked',
    icon: Lock,
    color: 'text-red-600',
    bgColor: 'bg-red-100 hover:bg-red-200',
    description: 'Blocked by dependencies',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 hover:bg-green-200',
    description: 'Task is finished',
  },
  content: {
    label: 'Content',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 hover:bg-purple-200',
    description: 'Content creation phase',
  },
  design: {
    label: 'Design',
    icon: Palette,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 hover:bg-pink-200',
    description: 'Design phase',
  },
  dev: {
    label: 'Development',
    icon: Code,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 hover:bg-indigo-200',
    description: 'Development phase',
  },
  qa: {
    label: 'QA',
    icon: Bug,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 hover:bg-orange-200',
    description: 'Quality assurance phase',
  },
  launch: {
    label: 'Launch',
    icon: PartyPopper,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 hover:bg-emerald-200',
    description: 'Ready to launch',
  },
};

export function TaskStatusPicker({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
}: TaskStatusPickerProps) {
  const handleStatusClick = (status: TaskStatus) => {
    onStatusChange(status);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Change Status
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Select a new status for this task
              </p>
            </div>

            {/* Status Options */}
            <div className="p-4 space-y-2">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => {
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;
                const isActive = status === currentStatus;

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
                      'active:scale-98',
                      config.bgColor,
                      isActive && 'ring-2 ring-offset-2 ring-indigo-500'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('flex-shrink-0', config.color)}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Label and Description */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-medium', config.color)}>
                          {config.label}
                        </span>
                        {isActive && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {config.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cancel Button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

