'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

interface VelocityChartProps {
  data: Array<{
    week: string;
    completed: number;
  }>;
  averageVelocity: number;
  title?: string;
  className?: string;
}

export function VelocityChart({
  data,
  averageVelocity,
  title,
  className,
}: VelocityChartProps) {
  return (
    <div className={cn('w-full h-[300px]', className)}>
      {title && (
        <h3 className="text-sm font-medium text-foreground mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="week"
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
            cursor={{ fill: '#ffffff05' }}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #ffffff20',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend />
          <Bar
            dataKey="completed"
            fill="#8b5cf6"
            name="Tasks Completed"
            radius={[4, 4, 0, 0]}
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
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
