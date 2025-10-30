'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/analytics-utils';

interface DataPoint {
  name: string;
  value: number; // minutes
  color: string;
}

interface TimeDistributionChartProps {
  data: DataPoint[];
  title?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function TimeDistributionChart({
  data,
  title = 'Time Distribution',
}: TimeDistributionChartProps) {
  const totalMinutes = React.useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  // Add colors to data if not provided
  const chartData = React.useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      color: d.color || COLORS[i % COLORS.length],
    }));
  }, [data]);

  if (data.length === 0 || totalMinutes === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <Clock className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No time tracking data available</p>
          <p className="text-xs mt-1">Complete tasks with tracked time to see distribution</p>
        </div>
      </div>
    );
  }

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Total: <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDuration(totalMinutes)}</span>
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => formatDuration(value)}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((entry, index) => {
          const percentage = ((entry.value / totalMinutes) * 100).toFixed(1);
          return (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-slate-700 dark:text-slate-300 truncate">
                {entry.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-auto">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

