'use client';

import { useState } from 'react';
import { Plus, Lightbulb, Filter, Upload } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { OpportunityCard } from '@/components/pattern4/opportunity-card';
import { OpportunityForm } from '@/components/pattern4/opportunity-form';
import { OpportunityBulkUpload } from '@/components/pattern4/opportunity-bulk-upload';

type CreateMode = 'none' | 'single' | 'bulk';

export default function OpportunitiesPage() {
  const [createMode, setCreateMode] = useState<CreateMode>('none');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'IDEA' | 'PLANNING' | 'ACTIVE' | 'ON_HOLD'
  >('ALL');
  const utils = trpc.useContext();

  // Fetch active sprint
  const { data: activeSprint } = trpc.pattern4.sprints.getActive.useQuery();

  // Fetch opportunities
  const { data: opportunities = [], isLoading } =
    trpc.pattern4.opportunities.list.useQuery({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    });

  // Filter out completed and killed opportunities
  const activeOpportunities = opportunities.filter(
    (opp) => opp.status !== 'COMPLETED' && opp.status !== 'KILLED'
  );

  // Create opportunity mutation
  const createOpportunity = trpc.pattern4.opportunities.create.useMutation({
    onSuccess: () => {
      utils.pattern4.opportunities.list.invalidate();
      setCreateMode('none');
    },
  });

  const handleCreateOpportunity = async (data: any) => {
    await createOpportunity.mutateAsync({
      ...data,
      sprintId: activeSprint?.id,
    });
  };

  const handleBulkUploadSuccess = (count: number) => {
    utils.pattern4.opportunities.list.invalidate();
    setCreateMode('none');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Opportunities
          </h1>
          <p className="text-muted-foreground">
            Track and manage your business opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateMode('bulk')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground font-medium hover:bg-white/10 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setCreateMode('single')}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-5 w-5" />
            New Opportunity
          </button>
        </div>
      </div>

      {/* Create Form */}
      {createMode === 'single' && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Create New Opportunity
          </h2>
          <OpportunityForm
            onSubmit={handleCreateOpportunity}
            onCancel={() => setCreateMode('none')}
          />
        </div>
      )}

      {/* Bulk Upload */}
      {createMode === 'bulk' && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Bulk Upload Opportunities
          </h2>
          <OpportunityBulkUpload
            sprintId={activeSprint?.id}
            onSuccess={handleBulkUploadSuccess}
            onCancel={() => setCreateMode('none')}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          {(['ALL', 'IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                    : 'bg-white/5 text-foreground hover:bg-white/10'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>
      </div>

      {/* Opportunities Grid */}
      {activeOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white/5 border border-white/10">
          <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Opportunities Yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Create your first opportunity to start tracking your business ideas
            and initiatives.
          </p>
          {createMode === 'none' && (
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => setCreateMode('single')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-5 w-5" />
                Create First Opportunity
              </button>
              <button
                onClick={() => setCreateMode('bulk')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-foreground font-medium hover:bg-white/10 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Or Bulk Upload
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD'] as const).map((status) => {
          const count = opportunities.filter(
            (opp) => opp.status === status
          ).length;
          return (
            <div
              key={status}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <p className="text-xs text-muted-foreground mb-1">{status}</p>
              <p className="text-2xl font-bold text-foreground">{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
