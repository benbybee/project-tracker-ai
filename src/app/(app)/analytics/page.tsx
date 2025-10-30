'use client';

import React from 'react';
import { trpc } from '@/lib/trpc';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { DateRangePicker } from '@/components/analytics/date-range-picker';
import { ProductivityChart } from '@/components/analytics/productivity-chart';
import { CompletionRateChart } from '@/components/analytics/completion-rate-chart';
import { VelocityChart } from '@/components/analytics/velocity-chart';
import { TimeDistributionChart } from '@/components/analytics/time-distribution-chart';
import { ProductiveHoursHeatmap } from '@/components/analytics/productive-hours-heatmap';
import { CompletionStreakCalendar } from '@/components/analytics/completion-streak-calendar';
import { AiInsightsPanel } from '@/components/analytics/ai-insights-panel';
import { AiAnalyticsChat } from '@/components/analytics/ai-analytics-chat';
import {
  DATE_RANGE_PRESETS,
  calculateStreak,
  type DateRange,
} from '@/lib/analytics-utils';
import { format, eachDayOfInterval } from 'date-fns';

type TabType = 'charts' | 'ai-insights' | 'ai-chat';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>('charts');
  // State for date range
  const [dateRange, setDateRange] = React.useState<DateRange>(
    DATE_RANGE_PRESETS[2] // Last 30 Days
  );

  // Fetch analytics data
  const { data: dashboardData, isLoading } =
    trpc.analytics.getDashboardAnalytics.useQuery({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

  const { data: completionStats } = trpc.analytics.getCompletionStats.useQuery({
    days: Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) /
        (1000 * 60 * 60 * 24)
    ),
  });

  // Calculate streak data
  const streakData = React.useMemo(() => {
    if (!dashboardData?.dailyCounts) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        completionDates: [],
      };
    }

    const dates = dashboardData.dailyCounts.map((d) => new Date(d.date));
    const { currentStreak, longestStreak } = calculateStreak(dates);

    return {
      currentStreak,
      longestStreak,
      completionDates: dates,
    };
  }, [dashboardData]);

  // Prepare productivity chart data
  const productivityData = React.useMemo(() => {
    if (!dashboardData?.dailyCounts) return [];

    // Fill in missing dates with 0 counts
    const allDates = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    });

    const dataMap = new Map(
      dashboardData.dailyCounts.map((d) => [d.date, d.count])
    );

    return allDates.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: format(date, 'MMM d'),
        count: dataMap.get(dateStr) || 0,
      };
    });
  }, [dashboardData, dateRange]);

  // Prepare heatmap data
  const heatmapData = React.useMemo(() => {
    if (!dashboardData?.heatmapData) return [];

    // Calculate max count for level scaling
    const maxCount = Math.max(
      ...dashboardData.heatmapData.map((d) => d.count),
      1
    );

    return dashboardData.heatmapData.map((d) => {
      let level = 0;
      if (d.count > 0) {
        if (d.count >= maxCount * 0.75) level = 4;
        else if (d.count >= maxCount * 0.5) level = 3;
        else if (d.count >= maxCount * 0.25) level = 2;
        else level = 1;
      }

      return {
        day: d.day,
        hour: d.hour,
        count: d.count,
        level,
      };
    });
  }, [dashboardData]);

  // Mock data for completion rate chart (replace with actual project data)
  const completionRateData = [
    { name: 'Website Redesign', completed: 8, total: 10, rate: 80 },
    { name: 'Mobile App', completed: 5, total: 12, rate: 42 },
    { name: 'Marketing Campaign', completed: 15, total: 15, rate: 100 },
    { name: 'Backend API', completed: 3, total: 8, rate: 38 },
  ];

  // Mock data for velocity chart (replace with actual data)
  const velocityData = [
    { period: 'Week 1', tasksPerWeek: 5, movingAverage: 5 },
    { period: 'Week 2', tasksPerWeek: 8, movingAverage: 6.5 },
    { period: 'Week 3', tasksPerWeek: 12, movingAverage: 8.3 },
    { period: 'Week 4', tasksPerWeek: 10, movingAverage: 8.75 },
  ];

  // Mock data for time distribution (replace with actual data)
  const timeDistData = [
    { name: 'Development', value: 240, color: '#3b82f6' },
    { name: 'Design', value: 120, color: '#10b981' },
    { name: 'Meetings', value: 90, color: '#f59e0b' },
    { name: 'Planning', value: 60, color: '#8b5cf6' },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Analytics Dashboard
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Comprehensive insights into your productivity and performance
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('charts')}
            className={`
              px-4 py-3 font-medium text-sm transition-all flex items-center gap-2
              ${
                activeTab === 'charts'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }
            `}
          >
            <BarChart3 className="h-4 w-4" />
            Charts & Metrics
          </button>
          <button
            onClick={() => setActiveTab('ai-insights')}
            className={`
              px-4 py-3 font-medium text-sm transition-all flex items-center gap-2
              ${
                activeTab === 'ai-insights'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }
            `}
          >
            <Brain className="h-4 w-4" />
            AI Insights
          </button>
          <button
            onClick={() => setActiveTab('ai-chat')}
            className={`
              px-4 py-3 font-medium text-sm transition-all flex items-center gap-2
              ${
                activeTab === 'ai-chat'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }
            `}
          >
            <MessageSquare className="h-4 w-4" />
            AI Chat
          </button>
        </div>
      </div>

      {/* Date Range Selector - only for charts tab */}
      {activeTab === 'charts' && (
        <div className="mb-8">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'charts' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-6 w-6 opacity-80" />
                <span className="text-sm font-medium opacity-80">
                  Completed
                </span>
              </div>
              <div className="text-3xl font-bold">
                {dashboardData?.totalCompleted || 0}
              </div>
              <div className="text-sm opacity-80 mt-1">Total tasks</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-6 w-6 opacity-80" />
                <span className="text-sm font-medium opacity-80">
                  Avg Duration
                </span>
              </div>
              <div className="text-3xl font-bold">
                {completionStats?.avgDurationByPriority?.['2']?.toFixed(0) ||
                  '0'}
                m
              </div>
              <div className="text-sm opacity-80 mt-1">Per task</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-6 w-6 opacity-80" />
                <span className="text-sm font-medium opacity-80">Velocity</span>
              </div>
              <div className="text-3xl font-bold">
                {completionStats?.velocity?.toFixed(1) || '0'}
              </div>
              <div className="text-sm opacity-80 mt-1">Tasks/day</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Flame className="h-6 w-6 opacity-80" />
                <span className="text-sm font-medium opacity-80">Streak</span>
              </div>
              <div className="text-3xl font-bold">
                {streakData.currentStreak}
              </div>
              <div className="text-sm opacity-80 mt-1">Days</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="space-y-8">
            {/* Productivity Chart */}
            <ProductivityChart data={productivityData} />

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CompletionRateChart data={completionRateData} />
              <VelocityChart data={velocityData} />
            </div>

            {/* Time Distribution & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TimeDistributionChart data={timeDistData} />
              <ProductiveHoursHeatmap data={heatmapData} />
            </div>

            {/* Streak Calendar */}
            <CompletionStreakCalendar data={streakData} />
          </div>
        </>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai-insights' && <AiInsightsPanel />}

      {/* AI Chat Tab */}
      {activeTab === 'ai-chat' && <AiAnalyticsChat className="h-[800px]" />}
    </div>
  );
}
