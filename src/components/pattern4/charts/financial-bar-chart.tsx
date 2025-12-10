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
            cursor={{ fill: '#ffffff05' }}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #ffffff20',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [formatCurrency(value), '']}
            itemStyle={{ color: '#fff' }}
          />
          <Legend />
          <Bar
            dataKey="cost"
            fill="#f87171"
            name="Cost"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="revenue"
            fill="#10b981"
            name="Revenue"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="profit"
            fill="#8b5cf6"
            name="Profit"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
