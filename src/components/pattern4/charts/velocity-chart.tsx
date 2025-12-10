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
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 bg-white/5 rounded-xl border border-white/10', className)}>
        <p className="text-muted-foreground">No velocity data available</p>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-white/5 rounded-xl border border-white/10', className)}>
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend />
            <Bar dataKey="completed" name="Tasks Completed" fill="#818cf8" radius={[4, 4, 0, 0]} />
            {averageVelocity > 0 && (
              <ReferenceLine
                y={averageVelocity}
                label={{
                  value: 'Avg Velocity',
                  fill: '#94a3b8',
                  fontSize: 10,
                  position: 'right',
                }}
                stroke="#94a3b8"
                strokeDasharray="3 3"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

