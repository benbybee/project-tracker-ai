'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface HeatmapData {
  day: string; // 'Mon', 'Tue', etc.
  hour: number; // 0-23
  count: number; // number of tasks completed
  level: number; // 0-4 intensity level
}

interface ProductiveHoursHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Color intensity levels (GitHub style)
const LEVEL_COLORS = {
  0: 'bg-slate-100 dark:bg-slate-800',
  1: 'bg-blue-200 dark:bg-blue-900',
  2: 'bg-blue-400 dark:bg-blue-700',
  3: 'bg-blue-600 dark:bg-blue-600',
  4: 'bg-blue-800 dark:bg-blue-500',
};

export function ProductiveHoursHeatmap({
  data,
  title = 'Productive Hours Heatmap',
}: ProductiveHoursHeatmapProps) {
  // Create a map for quick lookup
  const dataMap = React.useMemo(() => {
    const map = new Map<string, HeatmapData>();
    data.forEach(item => {
      const key = `${item.day}-${item.hour}`;
      map.set(key, item);
    });
    return map;
  }, [data]);

  // Get cell data
  const getCellData = (day: string, hour: number): HeatmapData => {
    const key = `${day}-${hour}`;
    return dataMap.get(key) || { day, hour, count: 0, level: 0 };
  };

  // Find peak productivity time
  const peakTime = React.useMemo(() => {
    if (data.length === 0) return null;
    const sorted = [...data].sort((a, b) => b.count - a.count);
    return sorted[0];
  }, [data]);

  const totalTasks = React.useMemo(() => {
    return data.reduce((sum, d) => sum + d.count, 0);
  }, [data]);

  if (data.length === 0 || totalTasks === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h3>
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          <Clock className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No productivity data available</p>
          <p className="text-xs mt-1">Complete tasks to discover your most productive hours</p>
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
        {peakTime && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Peak productivity: <span className="font-semibold text-slate-900 dark:text-slate-100">
              {peakTime.day} at {peakTime.hour}:00
            </span> ({peakTime.count} tasks)
          </p>
        )}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-12 flex-shrink-0"></div>
            <div className="flex gap-0.5">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="w-6 text-[10px] text-center text-slate-500 dark:text-slate-400"
                >
                  {hour % 4 === 0 ? hour : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          {DAYS.map(day => (
            <div key={day} className="flex items-center mb-0.5">
              <div className="w-12 text-xs text-slate-600 dark:text-slate-400 font-medium pr-2 text-right flex-shrink-0">
                {day}
              </div>
              <div className="flex gap-0.5">
                {HOURS.map(hour => {
                  const cellData = getCellData(day, hour);
                  const colorClass = LEVEL_COLORS[cellData.level as keyof typeof LEVEL_COLORS];
                  
                  return (
                    <div
                      key={hour}
                      className={`
                        w-6 h-6 rounded-sm border border-slate-200 dark:border-slate-700
                        ${colorClass}
                        hover:ring-2 hover:ring-blue-400 hover:ring-offset-1
                        transition-all cursor-pointer
                      `}
                      title={`${day} ${hour}:00 - ${cellData.count} tasks`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-xs text-slate-600 dark:text-slate-400">Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`w-4 h-4 rounded-sm border border-slate-200 dark:border-slate-700 ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`}
          />
        ))}
        <span className="text-xs text-slate-600 dark:text-slate-400">More</span>
      </div>
    </div>
  );
}

