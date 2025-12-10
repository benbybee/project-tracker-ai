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
  className?: string;
  title?: string;
}

export function FinancialBarChart({
  data,
  className,
  title,
}: FinancialBarChartProps) {
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
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
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
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            cursor={{ fill: '#ffffff05' }}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Legend />
          <Bar dataKey="cost" fill="#ef4444" name="Cost" radius={[4, 4, 0, 0]} />
          <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" fill="#6366f1" name="Profit" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
