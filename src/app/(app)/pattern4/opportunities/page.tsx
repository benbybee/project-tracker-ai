'use client';

import { useState } from 'react';
import { Plus, Lightbulb, Filter } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { OpportunityCard } from '@/components/pattern4/opportunity-card';
import { OpportunityForm } from '@/components/pattern4/opportunity-form';

export default function OpportunitiesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IDEA' | 'PLANNING' | 'ACTIVE' | 'ON_HOLD'>('ALL');
  const utils = trpc.useContext();

  // Fetch active sprint
  const { data: activeSprint } = trpc.pattern4.sprints.getActive.useQuery();

  // Fetch opportunities
  const { data: opportunities = [], isLoading } = trpc.pattern4.opportunities.list.useQuery({
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
      setShowCreateForm(false);
    },
  });

  const handleCreateOpportunity = async (data: any) => {
    await createOpportunity.mutateAsync({
      ...data,
      sprintId: activeSprint?.id,
    });
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
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-5 w-5" />
          New Opportunity
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Create New Opportunity
          </h2>
          <OpportunityForm
            onSubmit={handleCreateOpportunity}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2">
          {(['ALL', 'IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD'] as const).map((status) => (
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
          ))}
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
            Create your first opportunity to start tracking your business ideas and
            initiatives.
          </p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity mx-auto"
            >
              <Plus className="h-5 w-5" />
              Create First Opportunity
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['IDEA', 'PLANNING', 'ACTIVE', 'ON_HOLD'] as const).map((status) => {
          const count = opportunities.filter((opp) => opp.status === status).length;
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

