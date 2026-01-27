'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompleteOpportunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    actualCost?: string;
    revenue?: string;
    profit?: string;
    decision: 'KEEP' | 'ADJUST' | 'CANCEL' | 'UNDECIDED';
    outcomeNotes?: string;
  }) => Promise<void>;
  opportunityName: string;
  estimatedCost?: string | null;
}

export function CompleteOpportunityDialog({
  isOpen,
  onClose,
  onComplete,
  opportunityName,
  estimatedCost,
}: CompleteOpportunityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actualCost, setActualCost] = useState(estimatedCost || '');
  const [revenue, setRevenue] = useState('');
  const [decision, setDecision] = useState<
    'KEEP' | 'ADJUST' | 'CANCEL' | 'UNDECIDED'
  >('UNDECIDED');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const calculateProfit = () => {
    const rev = parseFloat(revenue) || 0;
    const cost = parseFloat(actualCost) || 0;
    return (rev - cost).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onComplete({
        actualCost,
        revenue,
        profit: calculateProfit(),
        decision,
        outcomeNotes,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl border border-white/10 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-foreground">
                  Complete Opportunity
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Completing:{' '}
                    <span className="font-semibold text-foreground">
                      {opportunityName}
                    </span>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="actualCost"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Actual Cost ($)
                  </label>
                  <input
                    type="number"
                    id="actualCost"
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="5000.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label
                    htmlFor="revenue"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Revenue ($)
                  </label>
                  <input
                    type="number"
                    id="revenue"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="10000.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {revenue && actualCost && (
                  <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-sm text-muted-foreground">
                      Calculated Profit:{' '}
                      <span
                        className={cn(
                          'font-bold',
                          parseFloat(calculateProfit()) >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        )}
                      >
                        ${calculateProfit()}
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="decision"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Decision *
                  </label>
                  <select
                    id="decision"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="UNDECIDED">Undecided</option>
                    <option value="KEEP">Keep (Continue as-is)</option>
                    <option value="ADJUST">Adjust (Iterate/Improve)</option>
                    <option value="CANCEL">Cancel (Stop pursuing)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="outcomeNotes"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Outcome Notes
                  </label>
                  <textarea
                    id="outcomeNotes"
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="What did you learn? What worked? What didn't?"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Complete Opportunity
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
