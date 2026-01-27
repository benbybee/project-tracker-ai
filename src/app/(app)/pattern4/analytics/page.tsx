'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ProgressLineChart } from '@/components/pattern4/charts/progress-line-chart';
import { FinancialBarChart } from '@/components/pattern4/charts/financial-bar-chart';
import { OpportunityPieChart } from '@/components/pattern4/charts/opportunity-pie-chart';
import { BurndownChart } from '@/components/pattern4/charts/burndown-chart';
import { VelocityChart } from '@/components/pattern4/charts/velocity-chart';
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Target,
  Activity,
} from 'lucide-react';
import { formatCurrency } from '@/lib/pattern4-utils';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'financial' | 'opportunities' | 'velocity'
  >('overview');

  // Fetch active sprint
  const { data: activeSprint } = trpc.pattern4.sprints.getActive.useQuery();

  // Fetch Analytics Data
  const { data: sprintTrends } =
    trpc.analyticsPattern4.getSprintTrends.useQuery(
      { sprintId: activeSprint?.id! },
      { enabled: !!activeSprint }
    );

  const { data: financialData } =
    trpc.analyticsPattern4.getFinancialSummary.useQuery(
      { sprintId: activeSprint?.id! },
      { enabled: !!activeSprint }
    );

  const { data: distributionData } =
    trpc.analyticsPattern4.getOpportunityDistribution.useQuery(
      { sprintId: activeSprint?.id! },
      { enabled: !!activeSprint }
    );

  const { data: burndownData } =
    trpc.analyticsPattern4.getBurndownData.useQuery(
      { sprintId: activeSprint?.id! },
      { enabled: !!activeSprint }
    );

  const { data: velocityData } =
    trpc.analyticsPattern4.getVelocityData.useQuery(
      { sprintId: activeSprint?.id! },
      { enabled: !!activeSprint }
    );

  if (!activeSprint) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Active Sprint</h1>
        <p className="text-muted-foreground">
          Start a sprint to view analytics.
        </p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <BurndownChart data={burndownData || []} title="Sprint Burndown" />
        </div>
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <ProgressLineChart
            data={sprintTrends || []}
            title="Completion Trends"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Velocity
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {velocityData?.averageVelocity || 0}
            </span>
            <span className="text-sm text-muted-foreground">tasks/week</span>
          </div>
        </div>
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Total Opportunities
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {distributionData?.statusData.reduce(
                (acc, curr) => acc + curr.value,
                0
              ) || 0}
            </span>
          </div>
        </div>
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Financial Impact
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-400">
              {formatCurrency(
                financialData?.reduce((acc, curr) => acc + curr.profit, 0) || 0
              )}
            </span>
            <span className="text-sm text-muted-foreground">profit</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <FinancialBarChart
          data={financialData || []}
          title="Opportunity Profitability"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-medium mb-4">Top Revenue Generators</h3>
          <div className="space-y-3">
            {[...(financialData || [])]
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)
              .map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-medium mb-4">Highest Costs</h3>
          <div className="space-y-3">
            {[...(financialData || [])]
              .sort((a, b) => b.cost - a.cost)
              .slice(0, 5)
              .map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="font-medium text-red-400">
                    {formatCurrency(item.cost)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOpportunities = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <OpportunityPieChart
          data={distributionData?.statusData || []}
          title="By Status"
        />
      </div>
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <OpportunityPieChart
          data={distributionData?.laneData || []}
          title="By Lane"
        />
      </div>
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <OpportunityPieChart
          data={distributionData?.typeData || []}
          title="By Type"
        />
      </div>
    </div>
  );

  const renderVelocity = () => (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <VelocityChart
          data={velocityData?.data || []}
          averageVelocity={velocityData?.averageVelocity || 0}
          title="Weekly Velocity"
        />
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Performance insights for {activeSprint.name}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-white/5 p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-500 text-white shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Activity className="h-4 w-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'financial'
              ? 'bg-indigo-500 text-white shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Financial
        </button>
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'opportunities'
              ? 'bg-indigo-500 text-white shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Target className="h-4 w-4" />
          Opportunities
        </button>
        <button
          onClick={() => setActiveTab('velocity')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'velocity'
              ? 'bg-indigo-500 text-white shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Velocity
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'financial' && renderFinancial()}
        {activeTab === 'opportunities' && renderOpportunities()}
        {activeTab === 'velocity' && renderVelocity()}
      </div>
    </div>
  );
}
