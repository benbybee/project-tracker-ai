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
    label?: string;
  }>;
  title?: string;
  className?: string;
}

export function ProgressLineChart({
  data,
  title,
  className,
}: ProgressLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 bg-white/5 rounded-xl border border-white/10', className)}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-white/5 rounded-xl border border-white/10', className)}>
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              name="Total Tasks"
              stroke="#64748b"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke="#818cf8"
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

