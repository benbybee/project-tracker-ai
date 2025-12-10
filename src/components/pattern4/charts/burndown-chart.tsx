'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface BurndownChartProps {
  data: Array<{
    day: string;
    ideal: number;
    actual: number;
  }>;
  title?: string;
  className?: string;
}

export function BurndownChart({ data, title, className }: BurndownChartProps) {
  return (
    <div className={cn('w-full h-[300px]', className)}>
      {title && (
        <h3 className="text-sm font-medium text-foreground mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="day"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #ffffff20',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="ideal"
            stroke="#64748b"
            strokeDasharray="5 5"
            fill="transparent"
            strokeWidth={2}
            name="Ideal Burndown"
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.1}
            strokeWidth={2}
            name="Actual Remaining"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
