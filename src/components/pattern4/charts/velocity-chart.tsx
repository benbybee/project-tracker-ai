'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface VelocityChartProps {
  data: Array<{
    week: string;
    completed: number;
  }>;
  averageVelocity: number;
  className?: string;
  title?: string;
}

export function VelocityChart({
  data,
  averageVelocity,
  className,
  title,
}: VelocityChartProps) {
  return (
    <div className={cn('w-full h-64', className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#ffffff10"
            vertical={false}
          />
          <XAxis
            dataKey="week"
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
            cursor={{ fill: '#ffffff05' }}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <ReferenceLine
            y={averageVelocity}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{
              value: 'Avg Velocity',
              fill: '#10b981',
              fontSize: 10,
              position: 'right',
            }}
          />
          <Bar
            dataKey="completed"
            fill="#6366f1"
            name="Tasks Completed"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
