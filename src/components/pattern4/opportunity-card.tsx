'use client';

import Link from 'next/link';
import { Lightbulb, DollarSign, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  getOpportunityStatusColor,
} from '@/lib/pattern4-utils';

interface OpportunityCardProps {
  opportunity: {
    id: string;
    name: string;
    type: 'MAJOR' | 'MICRO';
    lane?: string | null;
    summary?: string | null;
    status: 'IDEA' | 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'KILLED';
    estimatedCost?: string | null;
    priority?: number | null;
  };
  progress?: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    totalBudgetSpent?: string;
  };
  className?: string;
  href?: string;
}

export function OpportunityCard({
  opportunity,
  progress,
  className,
  href,
}: OpportunityCardProps) {
  const linkHref = href || `/pattern4/opportunities/${opportunity.id}`;

  return (
    <Link
      href={linkHref}
      className={cn(
        'group block p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full text-white font-medium',
                getOpportunityStatusColor(opportunity.status)
              )}
            >
              {opportunity.status}
            </span>
            {opportunity.type === 'MAJOR' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                MAJOR
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            {opportunity.name}
          </h3>
          {opportunity.lane && (
            <p className="text-xs text-muted-foreground mb-2">
              Lane: {opportunity.lane}
            </p>
          )}
          {opportunity.summary && (
            <p className="text-sm text-foreground/70 line-clamp-2">
              {opportunity.summary}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>

      {/* Financial & Progress Info */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        {opportunity.estimatedCost && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>{formatCurrency(opportunity.estimatedCost)}</span>
          </div>
        )}
        {progress && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {progress.completedTasks}/{progress.totalTasks} tasks
            </span>
            {progress.completionPercentage > 0 && (
              <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${progress.completionPercentage}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
