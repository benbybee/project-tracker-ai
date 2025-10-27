'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Coffee,
  CheckCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { DailyPlan } from '@/lib/ai/planning-engine';

interface DailyPlanSuggestionsProps {
  onAcceptPlan?: (plan: DailyPlan) => Promise<void>;
  onRejectPlan?: (plan: DailyPlan) => void;
  triggerGenerate?: boolean;
  onGenerateComplete?: () => void;
}

export function DailyPlanSuggestions({
  onAcceptPlan,
  onRejectPlan,
  triggerGenerate = false,
  onGenerateComplete,
}: DailyPlanSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(false);

  // Watch for trigger from parent
  useEffect(() => {
    if (triggerGenerate && triggerGenerate !== lastTrigger) {
      setLastTrigger(triggerGenerate);
      generatePlan();
      if (onGenerateComplete) {
        onGenerateComplete();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerGenerate]);

  const generatePlan = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      setPlan(data.plan);
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Failed to generate daily plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!plan) return;

    setIsAccepting(true);
    try {
      if (onAcceptPlan) {
        await onAcceptPlan(plan);
      }

      // Call the accept endpoint
      await fetch('/api/ai/daily-plan/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      // Reset after acceptance
      setPlan(null);
    } catch (err: any) {
      console.error('Error accepting plan:', err);
      setError('Failed to accept plan');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectPlan = () => {
    if (!plan) return;
    if (onRejectPlan) {
      onRejectPlan(plan);
    }
    setPlan(null);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Generate Plan Button - Removed duplicate, use PlanActionBar instead */}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-700 font-medium">
              Analyzing your tasks and patterns...
            </p>
            <p className="text-xs text-gray-500">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={generatePlan}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Display */}
      <AnimatePresence>
        {plan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl border-2 border-blue-200 shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  <h3 className="text-lg font-bold">
                    Your AI-Optimized Daily Plan
                  </h3>
                </div>
                <button
                  onClick={generatePlan}
                  disabled={isLoading}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Regenerate plan"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-blue-100 mt-1">{plan.summary}</p>
            </div>

            {/* Plan Content */}
            <div className="p-6 space-y-6">
              {/* Task Schedule */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Recommended Schedule
                </h4>
                <div className="space-y-2">
                  {plan.plan.map((item, index) => (
                    <div
                      key={item.taskId}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            Task {item.order}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(item.estimatedDuration)}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Start: {item.suggestedStartTime}
                        </p>
                        {item.reasoning && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            {item.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breaks */}
              {plan.breaks && plan.breaks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-green-600" />
                    Recommended Breaks
                  </h4>
                  <div className="space-y-2">
                    {plan.breaks.map((breakItem, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-200 text-sm"
                      >
                        <Coffee className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">
                          {formatTime(breakItem.duration)}{' '}
                          {breakItem.type.replace('_', ' ')} after task
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {plan.risks && plan.risks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Potential Issues
                  </h4>
                  <div className="space-y-2">
                    {plan.risks.map((risk, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          risk.severity === 'high'
                            ? 'bg-red-50 border-red-200'
                            : risk.severity === 'medium'
                              ? 'bg-orange-50 border-orange-200'
                              : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <p className="text-sm text-gray-900 font-medium">
                          {risk.type}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">
                          {risk.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-xs text-gray-600">Total Time Commitment</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatTime(plan.totalEstimatedMinutes)}
                  </p>
                </div>
                {plan.deferredTasks && plan.deferredTasks.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600">Tasks Deferred</p>
                    <p className="text-lg font-bold text-orange-600">
                      {plan.deferredTasks.length}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Confidence</p>
                  <p className="text-lg font-bold text-green-600">
                    {Math.round((plan.confidence || 0) * 100)}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAcceptPlan}
                  disabled={isAccepting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all font-medium"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Accept Plan
                    </>
                  )}
                </button>
                <button
                  onClick={handleRejectPlan}
                  disabled={isAccepting}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
