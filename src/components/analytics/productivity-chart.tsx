'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateMovingAverage } from '@/lib/analytics-utils';

interface DataPoint {
  date: string;
  count: number;
  movingAvg?: number;
}

interface ProductivityChartProps {
  data: DataPoint[];
  title?: string;
  showMovingAverage?: boolean;
}

export function ProductivityChart({
  data,
  title = 'Tasks Completed Over Time',
  showMovingAverage = true,
}: ProductivityChartProps) {
  // Calculate moving average if enabled
  const chartData = React.useMemo(() => {
    if (!showMovingAverage || data.length < 3) return data;

    const counts = data.map((d) => d.count);
    const movingAvg = calculateMovingAverage(counts, 7);

    return data.map((d, i) => ({
      ...d,
      movingAvg: movingAvg[i],
    }));
  }, [data, showMovingAverage]);

  // Calculate trend
  const trend = React.useMemo(() => {
    if (data.length < 2) return 'stable';

    const recent = data.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);

    if (recent > previous * 1.1) return 'increasing';
    if (recent < previous * 0.9) return 'decreasing';
    return 'stable';
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const average = data.length > 0 ? Math.round(total / data.length) : 0;

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No completed tasks in this time period</p>
          <p className="text-xs mt-1">
            Complete some tasks to see productivity trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
            <span>
              Total:{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {total}
              </span>
            </span>
            <span>•</span>
            <span>
              Avg:{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {average}/day
              </span>
            </span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            ${
              trend === 'increasing'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : trend === 'decreasing'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
            }
          `}
        >
          {trend === 'increasing' && <TrendingUp className="h-4 w-4" />}
          {trend === 'decreasing' && <TrendingDown className="h-4 w-4" />}
          {trend === 'stable' && <Minus className="h-4 w-4" />}
          <span className="capitalize">{trend}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200 dark:stroke-slate-700"
          />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{
              fill: 'currentColor',
              className: 'fill-slate-600 dark:fill-slate-400',
            }}
          />
          <YAxis
            className="text-xs"
            tick={{
              fill: 'currentColor',
              className: 'fill-slate-600 dark:fill-slate-400',
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Tasks Completed"
            dot={{ fill: '#3b82f6', r: 3 }}
            activeDot={{ r: 5 }}
          />
          {showMovingAverage && chartData[0]?.movingAvg !== undefined && (
            <Line
              type="monotone"
              dataKey="movingAvg"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="7-Day Average"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
