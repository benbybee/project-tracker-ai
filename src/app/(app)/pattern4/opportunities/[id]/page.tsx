'use client';

import { use, useState } from 'react';
import { ArrowLeft, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { FinancialSummary } from '@/components/pattern4/financial-summary';
import { CompleteOpportunityDialog } from '@/components/pattern4/complete-opportunity-dialog';
import { OpportunityForm } from '@/components/pattern4/opportunity-form';
import { getOpportunityStatusColor } from '@/lib/pattern4-utils';
import { cn } from '@/lib/utils';

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [isEditing, setIsEditing] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const utils = trpc.useContext();

  // Fetch opportunity
  const { data: opportunity, isLoading } =
    trpc.pattern4.opportunities.getById.useQuery({
      id: resolvedParams.id,
    });

  // Fetch progress
  const { data: progress } = trpc.pattern4.stats.opportunityProgress.useQuery({
    opportunityId: resolvedParams.id,
  });

  // Update mutation
  const updateOpportunity = trpc.pattern4.opportunities.update.useMutation({
    onSuccess: () => {
      utils.pattern4.opportunities.getById.invalidate({
        id: resolvedParams.id,
      });
      setIsEditing(false);
    },
  });

  // Complete mutation
  const completeOpportunity = trpc.pattern4.opportunities.complete.useMutation({
    onSuccess: () => {
      utils.pattern4.opportunities.getById.invalidate({
        id: resolvedParams.id,
      });
      utils.pattern4.opportunities.list.invalidate();
    },
  });

  // Kill mutation
  const killOpportunity = trpc.pattern4.opportunities.kill.useMutation({
    onSuccess: () => {
      utils.pattern4.opportunities.getById.invalidate({
        id: resolvedParams.id,
      });
      utils.pattern4.opportunities.list.invalidate();
    },
  });

  const handleUpdate = async (data: any) => {
    await updateOpportunity.mutateAsync({
      id: resolvedParams.id,
      ...data,
    });
  };

  const handleComplete = async (data: any) => {
    await completeOpportunity.mutateAsync({
      id: resolvedParams.id,
      ...data,
    });
  };

  const handleKill = async () => {
    if (confirm('Are you sure you want to kill this opportunity?')) {
      await killOpportunity.mutateAsync({
        id: resolvedParams.id,
        outcomeNotes: 'Opportunity killed',
      });
    }
  };

  if (isLoading || !opportunity) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-64 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const isCompleted =
    opportunity.status === 'COMPLETED' || opportunity.status === 'KILLED';

  return (
    <div className="p-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/pattern4/opportunities"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Opportunities
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={cn(
                'text-xs px-3 py-1 rounded-full text-white font-medium',
                getOpportunityStatusColor(opportunity.status)
              )}
            >
              {opportunity.status}
            </span>
            {opportunity.type === 'MAJOR' && (
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                MAJOR
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {opportunity.name}
          </h1>
          {opportunity.lane && (
            <p className="text-muted-foreground">Lane: {opportunity.lane}</p>
          )}
        </div>

        {!isCompleted && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowCompleteDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="h-4 w-4" />
              Complete
            </button>
            <button
              onClick={handleKill}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Kill
            </button>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Edit Opportunity
          </h2>
          <OpportunityForm
            defaultValues={{
              name: opportunity.name,
              type: opportunity.type,
              lane: opportunity.lane || undefined,
              summary: opportunity.summary || undefined,
              complexity: opportunity.complexity || undefined,
              estimatedCost: opportunity.estimatedCost || undefined,
              goToMarket: opportunity.goToMarket || undefined,
              details: opportunity.details || undefined,
              priority: opportunity.priority || undefined,
              notes: opportunity.notes || undefined,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            submitLabel="Update Opportunity"
          />
        </div>
      )}

      {/* Financial Summary */}
      <FinancialSummary
        estimatedCost={opportunity.estimatedCost}
        actualCost={opportunity.actualCost}
        revenue={opportunity.revenue}
        profit={opportunity.profit}
        showROI={isCompleted}
      />

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Summary
          </h2>
          <p className="text-foreground/80">
            {opportunity.summary || 'No summary provided'}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Details
          </h2>
          <div className="space-y-2 text-sm">
            {opportunity.complexity && (
              <p>
                <span className="text-muted-foreground">Complexity:</span>{' '}
                <span className="text-foreground font-medium">
                  {opportunity.complexity}
                </span>
              </p>
            )}
            {opportunity.priority && (
              <p>
                <span className="text-muted-foreground">Priority:</span>{' '}
                <span className="text-foreground font-medium">
                  {opportunity.priority}/4
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Go to Market */}
      {opportunity.goToMarket && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Go-to-Market Strategy
          </h2>
          <p className="text-foreground/80 whitespace-pre-wrap">
            {opportunity.goToMarket}
          </p>
        </div>
      )}

      {/* Full Details */}
      {opportunity.details && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Full Details
          </h2>
          <p className="text-foreground/80 whitespace-pre-wrap">
            {opportunity.details}
          </p>
        </div>
      )}

      {/* Progress */}
      {progress && progress.totalTasks > 0 && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Task Progress
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasks</span>
              <span className="font-semibold text-foreground">
                {progress.completedTasks} / {progress.totalTasks} (
                {progress.completionPercentage}%)
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                style={{ width: `${progress.completionPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="text-muted-foreground">Budget Planned</p>
                <p className="text-lg font-bold text-foreground">
                  ${progress.totalBudgetPlanned}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Budget Spent</p>
                <p className="text-lg font-bold text-foreground">
                  ${progress.totalBudgetSpent}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outcome (if completed) */}
      {opportunity.outcomeNotes && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Outcome Notes
          </h2>
          <p className="text-foreground/80 whitespace-pre-wrap">
            {opportunity.outcomeNotes}
          </p>
        </div>
      )}

      {/* Complete Dialog */}
      <CompleteOpportunityDialog
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        onComplete={handleComplete}
        opportunityName={opportunity.name}
        estimatedCost={opportunity.estimatedCost}
      />
    </div>
  );
}
