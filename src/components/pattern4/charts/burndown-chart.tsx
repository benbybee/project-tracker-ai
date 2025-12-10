'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface BurndownChartProps {
  data: Array<{
    day: string;
    ideal: number;
    actual: number;
  }>;
  className?: string;
  title?: string;
}

export function BurndownChart({
  data,
  className,
  title,
}: BurndownChartProps) {
  return (
    <div className={cn('w-full h-64', className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="day"
            stroke="#ffffff50"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#ffffff50"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Area
            type="monotone"
            dataKey="ideal"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
            name="Ideal Trend"
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorActual)"
            strokeWidth={2}
            name="Remaining Tasks"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
