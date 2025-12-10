'use client';

import { Archive, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency, getDecisionColor } from '@/lib/pattern4-utils';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CompletedOpportunitiesPage() {
  // Fetch completed opportunities
  const { data: opportunities = [], isLoading } =
    trpc.pattern4.opportunities.list.useQuery({
      status: 'COMPLETED',
    });

  // Calculate totals
  const totals = opportunities.reduce(
    (acc, opp) => {
      const cost = parseFloat(opp.actualCost || '0');
      const revenue = parseFloat(opp.revenue || '0');
      const profit = parseFloat(opp.profit || '0');

      return {
        totalCost: acc.totalCost + cost,
        totalRevenue: acc.totalRevenue + revenue,
        totalProfit: acc.totalProfit + profit,
      };
    },
    { totalCost: 0, totalRevenue: 0, totalProfit: 0 }
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Completed Opportunities
        </h1>
        <p className="text-muted-foreground">
          Performance archive of your completed business opportunities
        </p>
      </div>

      {/* Summary Stats */}
      {opportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <span className="text-sm text-muted-foreground">Total Cost</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totals.totalCost)}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totals.totalRevenue)}
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              {totals.totalProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
              <span className="text-sm text-muted-foreground">Total Profit</span>
            </div>
            <p
              className={cn(
                'text-2xl font-bold',
                totals.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {formatCurrency(totals.totalProfit)}
            </p>
          </div>
        </div>
      )}

      {/* Opportunities List */}
      {opportunities.length > 0 ? (
        <div className="space-y-4">
          {opportunities.map((opportunity) => {
            const profit = parseFloat(opportunity.profit || '0');
            const isProfitable = profit >= 0;

            return (
              <Link
                key={opportunity.id}
                href={`/pattern4/opportunities/${opportunity.id}`}
                className="block p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-indigo-400 transition-colors">
                        {opportunity.name}
                      </h3>
                      {opportunity.decision && (
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full text-white font-medium',
                            getDecisionColor(opportunity.decision)
                          )}
                        >
                          {opportunity.decision}
                        </span>
                      )}
                    </div>
                    {opportunity.lane && (
                      <p className="text-sm text-muted-foreground">
                        {opportunity.lane}
                      </p>
                    )}
                    {opportunity.completedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed:{' '}
                        {format(new Date(opportunity.completedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>

                  {/* Financial Summary */}
                  <div className="flex items-center gap-6 text-sm">
                    {opportunity.actualCost && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Cost</p>
                        <p className="text-foreground font-semibold">
                          {formatCurrency(opportunity.actualCost)}
                        </p>
                      </div>
                    )}
                    {opportunity.revenue && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">
                          Revenue
                        </p>
                        <p className="text-foreground font-semibold">
                          {formatCurrency(opportunity.revenue)}
                        </p>
                      </div>
                    )}
                    {opportunity.profit && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Profit</p>
                        <p
                          className={cn(
                            'font-bold',
                            isProfitable ? 'text-green-400' : 'text-red-400'
                          )}
                        >
                          {formatCurrency(opportunity.profit)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {opportunity.outcomeNotes && (
                  <p className="text-sm text-foreground/70 line-clamp-2">
                    {opportunity.outcomeNotes}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white/5 border border-white/10">
          <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Completed Opportunities Yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Complete your first opportunity to start building your performance
            archive.
          </p>
          <Link
            href="/pattern4/opportunities"
            className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            View Opportunities
          </Link>
        </div>
      )}
    </div>
  );
}

