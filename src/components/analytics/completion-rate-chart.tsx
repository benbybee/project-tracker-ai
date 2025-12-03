'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { FolderKanban } from 'lucide-react';

interface DataPoint {
  name: string;
  completed: number;
  total: number;
  rate: number; // percentage
}

interface CompletionRateChartProps {
  data: DataPoint[];
  title?: string;
}

export function CompletionRateChart({
  data,
  title = 'Completion Rate by Project',
}: CompletionRateChartProps) {
  // Sort by completion rate descending
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => b.rate - a.rate);
  }, [data]);

  // Get color based on completion rate
  const getBarColor = (rate: number): string => {
    if (rate >= 80) return '#10b981'; // green
    if (rate >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <FolderKanban className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No projects with tasks</p>
          <p className="text-xs mt-1">
            Create projects and tasks to see completion rates
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Percentage of completed tasks per project
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer
        width="100%"
        height={Math.max(300, data.length * 50)}
      >
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-slate-200 dark:stroke-slate-700"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            className="text-xs"
            tick={{
              fill: 'currentColor',
              className: 'fill-slate-600 dark:fill-slate-400',
            }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            className="text-xs"
            tick={{
              fill: 'currentColor',
              className: 'fill-slate-600 dark:fill-slate-400',
            }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string, props: any) => {
              const { completed, total } = props.payload;
              return [
                `${value}% (${completed}/${total} tasks)`,
                'Completion Rate',
              ];
            }}
          />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          <span className="text-slate-600 dark:text-slate-400">≥80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
          <span className="text-slate-600 dark:text-slate-400">50-79%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500"></div>
          <span className="text-slate-600 dark:text-slate-400">&lt;50%</span>
        </div>
      </div>
    </div>
  );
}
