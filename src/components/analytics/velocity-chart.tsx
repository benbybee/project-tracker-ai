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
  Area,
  ComposedChart,
} from 'recharts';
import { Activity } from 'lucide-react';

interface DataPoint {
  period: string; // e.g., "Week 1", "Week 2"
  tasksPerWeek: number;
  movingAverage: number;
}

interface VelocityChartProps {
  data: DataPoint[];
  title?: string;
}

export function VelocityChart({
  data,
  title = 'Velocity Trend',
}: VelocityChartProps) {
  const averageVelocity = React.useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + d.tasksPerWeek, 0);
    return Math.round((sum / data.length) * 10) / 10;
  }, [data]);

  const trend = React.useMemo(() => {
    if (data.length < 2) return 'stable';
    const recent = data[data.length - 1].tasksPerWeek;
    const previous = data[0].tasksPerWeek;
    
    if (recent > previous * 1.1) return 'increasing';
    if (recent < previous * 0.9) return 'decreasing';
    return 'stable';
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <Activity className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Not enough data to calculate velocity</p>
          <p className="text-xs mt-1">Complete tasks over several weeks to see trends</p>
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
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Average: <span className="font-semibold text-slate-900 dark:text-slate-100">{averageVelocity}</span> tasks/week
          </p>
        </div>

        {/* Trend Badge */}
        <div
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium capitalize
            ${
              trend === 'increasing'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : trend === 'decreasing'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
            }
          `}
        >
          {trend}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200 dark:stroke-slate-700"
          />
          <XAxis
            dataKey="period"
            className="text-xs"
            tick={{ fill: 'currentColor', className: 'fill-slate-600 dark:fill-slate-400' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor', className: 'fill-slate-600 dark:fill-slate-400' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
          <Area
            type="monotone"
            dataKey="tasksPerWeek"
            fill="url(#velocityGradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="tasksPerWeek"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Tasks per Week"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="4-Week Average"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

