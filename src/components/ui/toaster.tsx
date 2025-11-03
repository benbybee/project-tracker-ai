'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toasts: Toast[] = [];
let listeners: Set<() => void> = new Set();

export function showToast(toast: Omit<Toast, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random()}`;
  const newToast = { ...toast, id };
  toasts = [newToast, ...toasts].slice(0, 3); // Keep max 3 toasts
  listeners.forEach((listener) => listener());

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener());
  }, 5000);
}

export function Toaster() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto"
          >
            <div
              className={cn(
                'rounded-lg border shadow-lg p-4 max-w-md bg-white',
                toast.variant === 'destructive'
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              )}
            >
              <div className="flex gap-3">
                {toast.variant === 'destructive' ? (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'font-semibold text-sm',
                      toast.variant === 'destructive'
                        ? 'text-red-900'
                        : 'text-green-900'
                    )}
                  >
                    {toast.title}
                  </div>
                  {toast.description && (
                    <div
                      className={cn(
                        'text-sm mt-1',
                        toast.variant === 'destructive'
                          ? 'text-red-700'
                          : 'text-green-700'
                      )}
                    >
                      {toast.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    toasts = toasts.filter((t) => t.id !== toast.id);
                    listeners.forEach((listener) => listener());
                  }}
                  className={cn(
                    'flex-shrink-0',
                    toast.variant === 'destructive'
                      ? 'text-red-400 hover:text-red-600'
                      : 'text-green-400 hover:text-green-600'
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
