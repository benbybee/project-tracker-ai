'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

interface ProjectMetrics {
  progress: {
    completed: number;
    total: number;
    percentage: number;
    trend?: 'up' | 'down' | 'stable';
  };
  velocity: {
    tasksPerWeek: number;
    trend?: number; // percentage change
    sparklineData?: number[];
  };
  health: {
    status: 'on-track' | 'at-risk' | 'behind';
    blockers: number;
    overdue: number;
  };
}

interface ProjectMetricsGridProps {
  metrics: ProjectMetrics;
  projectId: string;
  onAiChatOpen: () => void;
}

export function ProjectMetricsGrid({
  metrics,
  projectId: _projectId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAiChatOpen,
}: ProjectMetricsGridProps) {
  const { progress, velocity, health } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
      {/* Progress Card */}
      <GlassCard className="p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-shadow min-w-0">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Progress
            </h3>
            {progress.trend && (
              <span
                className={cn(
                  'text-xs flex items-center gap-1',
                  progress.trend === 'up'
                    ? 'text-green-600'
                    : progress.trend === 'down'
                      ? 'text-red-600'
                      : 'text-slate-500'
                )}
              >
                {progress.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : progress.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
              </span>
            )}
          </div>

          <div className="mb-2">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {progress.percentage}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {progress.completed} of {progress.total} tasks
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full blur-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </GlassCard>

      {/* Velocity Card */}
      <GlassCard className="p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-shadow min-w-0">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Velocity
            </h3>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>

          <div className="mb-2">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {velocity.tasksPerWeek.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500 mt-1">tasks per week</div>
          </div>

          {/* Trend Indicator */}
          {velocity.trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                velocity.trend > 0
                  ? 'text-green-600'
                  : velocity.trend < 0
                    ? 'text-red-600'
                    : 'text-slate-500'
              )}
            >
              {velocity.trend > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : velocity.trend < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {velocity.trend !== 0 && (
                <span>
                  {Math.abs(velocity.trend).toFixed(0)}% vs last period
                </span>
              )}
            </div>
          )}

          {/* Mini Sparkline */}
          {velocity.sparklineData && velocity.sparklineData.length > 0 && (
            <div className="mt-3 flex items-end gap-1 h-8">
              {velocity.sparklineData.slice(-7).map((value, i) => {
                const maxValue = Math.max(...velocity.sparklineData!);
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-amber-500 to-orange-500 rounded-sm"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </GlassCard>

      {/* Health Card */}
      <GlassCard className="p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-shadow min-w-0">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Health
            </h3>
            {health.status === 'on-track' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle
                className={cn(
                  'h-4 w-4',
                  health.status === 'at-risk'
                    ? 'text-yellow-500'
                    : 'text-red-500'
                )}
              />
            )}
          </div>

          <div className="mb-2">
            <div
              className={cn(
                'text-2xl font-bold',
                health.status === 'on-track'
                  ? 'text-green-600 dark:text-green-400'
                  : health.status === 'at-risk'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              )}
            >
              {health.status === 'on-track'
                ? 'On Track'
                : health.status === 'at-risk'
                  ? 'At Risk'
                  : 'Behind'}
            </div>
            <div className="text-xs text-slate-500 mt-1 space-y-1">
              <div>{health.blockers} blockers</div>
              <div>{health.overdue} overdue</div>
            </div>
          </div>

          {/* Health Status Bar */}
          <div className="flex gap-1 mt-3">
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full',
                health.status === 'on-track'
                  ? 'bg-green-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full',
                health.status !== 'behind'
                  ? 'bg-green-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full',
                health.status === 'on-track'
                  ? 'bg-green-500'
                  : health.status === 'at-risk'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              )}
            />
          </div>
        </div>

        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity',
            health.status === 'on-track'
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10'
              : health.status === 'at-risk'
                ? 'bg-gradient-to-br from-yellow-500/10 to-orange-600/10'
                : 'bg-gradient-to-br from-red-500/10 to-rose-600/10'
          )}
        />
      </GlassCard>

      {/* AI Quick Access Card */}
      <GlassCard
        className="p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 min-w-0"
        onClick={onAiChatOpen}
      >
        <div className="relative z-10 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400">
              AI Assistant
            </h3>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>

          <div className="mb-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Get Help
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ask about this project
            </div>
          </div>

          {/* Call to Action */}
          <motion.div
            className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 mt-3"
            whileHover={{ x: 4 }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Open AI Chat →</span>
          </motion.div>
        </div>

        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </GlassCard>
    </div>
  );
}
