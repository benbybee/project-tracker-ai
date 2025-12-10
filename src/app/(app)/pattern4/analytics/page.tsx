'use client';

import { trpc } from '@/lib/trpc';
import { format, subDays } from 'date-fns';
import {
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Download,
} from 'lucide-react';
import { ProgressLineChart } from '@/components/pattern4/charts/progress-line-chart';
import { FinancialBarChart } from '@/components/pattern4/charts/financial-bar-chart';
import { OpportunityPieChart } from '@/components/pattern4/charts/opportunity-pie-chart';
import { BurndownChart } from '@/components/pattern4/charts/burndown-chart';
import { VelocityChart } from '@/components/pattern4/charts/velocity-chart';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'financial' | 'opportunities' | 'velocity';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Fetch active sprint for context
  const { data: activeSprint } = trpc.pattern4.sprints.getActive.useQuery();

  // Fetch analytics data
  const { data: sprintTrends } =
    trpc.analyticsPattern4.getSprintTrends.useQuery(
      { sprintId: activeSprint?.id! },
      { enabled: !!activeSprint }
    );

  const { data: financialData } =
    trpc.analyticsPattern4.getFinancialSummary.useQuery(
      { sprintId: activeSprint?.id },
      { enabled: !!activeSprint }
    );

  const { data: distributionData } =
    trpc.analyticsPattern4.getOpportunityDistribution.useQuery(
      { sprintId: activeSprint?.id },
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
        <h1 className="text-2xl font-bold text-foreground mb-2">
          No Active Sprint
        </h1>
        <p className="text-muted-foreground">
          Start a sprint to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Performance insights for {activeSprint.name}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors">
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'financial', label: 'Financial', icon: DollarSign },
          { id: 'opportunities', label: 'Opportunities', icon: PieChartIcon },
          { id: 'velocity', label: 'Velocity', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <BurndownChart
                data={burndownData || []}
                title="Sprint Burndown"
              />
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <ProgressLineChart
                data={sprintTrends || []}
                title="Completion Trend"
              />
            </div>
            {financialData && (
              <div className="lg:col-span-2 p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="grid grid-cols-3 gap-8 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      ${financialData.totals.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Cost
                    </p>
                    <p className="text-2xl font-bold text-red-400">
                      ${financialData.totals.totalCost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Net Profit
                    </p>
                    <p className="text-2xl font-bold text-indigo-400">
                      ${financialData.totals.totalProfit.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financial' && financialData && (
          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <FinancialBarChart
                data={financialData.chartData}
                title="Opportunity Financial Performance"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {financialData.chartData.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <h3 className="font-semibold text-foreground mb-2 truncate">
                    {item.name}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="text-green-400">${item.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span className="text-indigo-400">${item.profit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && distributionData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <OpportunityPieChart
                data={distributionData.statusData}
                title="Distribution by Status"
              />
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <OpportunityPieChart
                data={distributionData.laneData}
                title="Distribution by Lane"
              />
            </div>
          </div>
        )}

        {activeTab === 'velocity' && velocityData && (
          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <VelocityChart
                data={velocityData.velocityData}
                averageVelocity={velocityData.averageVelocity}
                title="Weekly Velocity"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-muted-foreground mb-1">
                  Average Velocity
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {velocityData.averageVelocity} tasks/week
                </p>
              </div>
              {/* Add more metrics here if needed */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
