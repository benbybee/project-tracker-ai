'use client';

import React from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Clock,
  Activity,
  Sparkles,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export function AiInsightsPanel() {
  const { data: insights, isLoading } = trpc.analytics.getAiInsights.useQuery();
  const [expandedRisk, setExpandedRisk] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Brain className="h-12 w-12 mb-3 opacity-30 text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No insights available yet
          </p>
          <p className="text-xs mt-1 text-slate-500 dark:text-slate-500">
            Complete more tasks to unlock AI-powered insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Forecast */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              Weekly Forecast
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              AI-powered predictions for the week ahead
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
              <Target className="h-4 w-4" />
              <span>Estimated Completions</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {insights.weeklyForecast.estimatedCompletions}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              tasks this week
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>At-Risk Tasks</span>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {insights.weeklyForecast.atRiskTasks}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              need attention
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1">
              <Activity className="h-4 w-4" />
              <span>Capacity</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {insights.weeklyForecast.capacityUtilization}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              utilized
            </p>
          </div>
        </div>

        {insights.weeklyForecast.recommendedDailyFocus.length > 0 && (
          <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-purple-100 dark:border-purple-800/50">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Recommended Daily Focus
            </h4>
            <ul className="space-y-1">
              {insights.weeklyForecast.recommendedDailyFocus.map(
                (focus, index) => (
                  <li
                    key={index}
                    className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">
                      •
                    </span>
                    <span>{focus}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Productivity Patterns */}
      {insights.patterns && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                Your Productivity Patterns
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Insights from your work habits (confidence:{' '}
                {Math.round(insights.patterns.confidenceScore * 100)}%)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Velocity */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Velocity
              </h4>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {insights.patterns.velocity.tasksPerDay.toFixed(1)}{' '}
                <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                  tasks/day
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Trend:{' '}
                <span
                  className={`font-semibold ${
                    insights.patterns.velocity.trend === 'increasing'
                      ? 'text-green-600 dark:text-green-400'
                      : insights.patterns.velocity.trend === 'decreasing'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {insights.patterns.velocity.trend}
                </span>
              </p>
            </div>

            {/* Productive Hours */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Most Productive Hours
              </h4>
              <div className="flex gap-2">
                {insights.patterns.productiveHours.slice(0, 3).map((hour) => (
                  <div
                    key={hour}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-semibold"
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                Schedule important tasks during these hours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Workload Analysis */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              Workload Analysis
            </h3>
            {insights.workload.overloadWarning && (
              <div className="mt-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-300 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Workload Warning
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {insights.workload.taskBreakdown.urgent}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Urgent
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {insights.workload.taskBreakdown.highPriority}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              High Priority
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {insights.workload.taskBreakdown.mediumPriority}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Medium
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">
              {insights.workload.taskBreakdown.lowPriority}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Low Priority
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Total Tasks
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {insights.workload.totalTasks}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Est. Hours
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {insights.workload.totalEstimatedHours}h
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Days to Complete
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {insights.workload.daysToComplete}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {insights.workload.recommendations.map((rec, index) => (
              <p
                key={index}
                className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <span className="text-orange-600 dark:text-orange-400 mt-0.5">
                  •
                </span>
                <span>{rec}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* High-Risk Tasks */}
      {insights.highRiskTasks && insights.highRiskTasks.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                High-Risk Tasks
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Tasks that need immediate attention
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {insights.highRiskTasks.map((riskTask) => (
              <div
                key={riskTask.taskId}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all
                  ${
                    riskTask.riskLevel === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  }
                  ${expandedRisk === riskTask.taskId ? 'ring-2 ring-red-500 dark:ring-red-400' : ''}
                `}
                onClick={() =>
                  setExpandedRisk(
                    expandedRisk === riskTask.taskId ? null : riskTask.taskId
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`
                          px-2 py-1 rounded text-xs font-bold uppercase
                          ${
                            riskTask.riskLevel === 'critical'
                              ? 'bg-red-600 dark:bg-red-700 text-white'
                              : 'bg-orange-600 dark:bg-orange-700 text-white'
                          }
                        `}
                      >
                        {riskTask.riskLevel}
                      </span>
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Risk Score: {riskTask.riskScore}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {riskTask.riskFactors.map((factor, index) => (
                        <span
                          key={index}
                          className={`
                            px-2 py-1 rounded-lg text-xs font-medium
                            ${
                              factor.severity === 'high'
                                ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                : factor.severity === 'medium'
                                  ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                            }
                          `}
                        >
                          {factor.factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {expandedRisk === riskTask.taskId && (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 space-y-3">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Risk Factors:
                      </h5>
                      {riskTask.riskFactors.map((factor, index) => (
                        <p
                          key={index}
                          className="text-sm text-slate-700 dark:text-slate-300 ml-2"
                        >
                          • {factor.description}
                        </p>
                      ))}
                    </div>

                    {riskTask.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          Recommendations:
                        </h5>
                        {riskTask.recommendations.map((rec, index) => (
                          <p
                            key={index}
                            className="text-sm text-slate-700 dark:text-slate-300 ml-2"
                          >
                            • {rec}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Learning Section (coming soon placeholder) */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
            <Brain className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              AI Learning System
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Help improve AI accuracy by providing feedback on suggestions
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          The AI continuously learns from your work patterns and feedback to
          provide better predictions and insights over time.
        </p>
      </div>
    </div>
  );
}
