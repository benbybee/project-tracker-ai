'use client';

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, calculateROI } from '@/lib/pattern4-utils';

interface FinancialSummaryProps {
  actualCost?: string | null;
  revenue?: string | null;
  profit?: string | null;
  estimatedCost?: string | null;
  className?: string;
  showROI?: boolean;
}

export function FinancialSummary({
  actualCost,
  revenue,
  profit,
  estimatedCost,
  className,
  showROI = false,
}: FinancialSummaryProps) {
  const cost = actualCost || estimatedCost || '0';
  const rev = revenue || '0';
  const prof = profit || String(parseFloat(rev) - parseFloat(cost));
  const roi = showROI && revenue && actualCost ? calculateROI(revenue, actualCost) : null;
  const isProfitable = parseFloat(prof) >= 0;

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-red-400" />
          <span className="text-xs text-muted-foreground">
            {actualCost ? 'Actual Cost' : 'Estimated Cost'}
          </span>
        </div>
        <p className="text-xl font-bold text-foreground">
          {formatCurrency(cost)}
        </p>
      </div>

      {revenue && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Revenue</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {formatCurrency(rev)}
          </p>
        </div>
      )}

      {(revenue || profit) && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
            <span className="text-xs text-muted-foreground">Profit</span>
          </div>
          <p
            className={cn(
              'text-xl font-bold',
              isProfitable ? 'text-green-400' : 'text-red-400'
            )}
          >
            {formatCurrency(prof)}
          </p>
        </div>
      )}

      {roi !== null && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <span className="text-xs text-muted-foreground">ROI</span>
          </div>
          <p
            className={cn(
              'text-xl font-bold',
              roi >= 0 ? 'text-green-400' : 'text-red-400'
            )}
          >
            {roi}%
          </p>
        </div>
      )}
    </div>
  );
}

