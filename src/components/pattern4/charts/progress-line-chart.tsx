'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ProgressLineChartProps {
  data: Array<{
    name: string;
    actual: number;
    planned: number;
  }>;
  className?: string;
  title?: string;
}

export function ProgressLineChart({
  data,
  className,
  title,
}: ProgressLineChartProps) {
  return (
    <div className={cn('w-full h-64', className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="name"
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
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="planned"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="Planned"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#10b981"
            strokeWidth={2}
            activeDot={{ r: 4 }}
            name="Actual"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
