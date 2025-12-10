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
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pattern4-utils';

interface FinancialBarChartProps {
  data: Array<{
    name: string;
    cost: number;
    revenue: number;
    profit: number;
  }>;
  title?: string;
  className?: string;
}

export function FinancialBarChart({
  data,
  title,
  className,
}: FinancialBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 bg-white/5 rounded-xl border border-white/10', className)}>
        <p className="text-muted-foreground">No financial data available</p>
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
              dataKey="name"
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
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend />
            <Bar dataKey="cost" name="Cost" fill="#f87171" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" name="Revenue" fill="#4ade80" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="Profit" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

