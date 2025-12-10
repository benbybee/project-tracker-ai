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
    remaining: number;
    ideal: number;
  }>;
  title?: string;
  className?: string;
}

export function BurndownChart({
  data,
  title,
  className,
}: BurndownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 bg-white/5 rounded-xl border border-white/10', className)}>
        <p className="text-muted-foreground">No burndown data available</p>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-white/5 rounded-xl border border-white/10', className)}>
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
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
            <Area
              type="monotone"
              dataKey="ideal"
              name="Ideal Burndown"
              stroke="#94a3b8"
              fill="transparent"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="remaining"
              name="Remaining Tasks"
              stroke="#818cf8"
              fillOpacity={1}
              fill="url(#colorRemaining)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

