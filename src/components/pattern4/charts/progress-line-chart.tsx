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
    date: string;
    completed: number;
    total: number;
    planned?: number;
  }>;
  title?: string;
  className?: string;
}

export function ProgressLineChart({
  data,
  title,
  className,
}: ProgressLineChartProps) {
  return (
    <div className={cn('w-full h-[300px]', className)}>
      {title && (
        <h3 className="text-sm font-medium text-foreground mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="date"
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
          <Line
            type="monotone"
            dataKey="total"
            stroke="#64748b"
            strokeWidth={2}
            dot={false}
            name="Total Tasks"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#8b5cf6"
            strokeWidth={2}
            activeDot={{ r: 6 }}
            name="Completed"
          />
          {data[0]?.planned !== undefined && (
            <Line
              type="monotone"
              dataKey="planned"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Planned"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
