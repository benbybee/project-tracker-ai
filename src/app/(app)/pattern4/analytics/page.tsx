'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { ProgressLineChart } from '@/components/pattern4/charts/progress-line-chart';
import { FinancialBarChart } from '@/components/pattern4/charts/financial-bar-chart';
import { OpportunityPieChart } from '@/components/pattern4/charts/opportunity-pie-chart';
import { BurndownChart } from '@/components/pattern4/charts/burndown-chart';
import { VelocityChart } from '@/components/pattern4/charts/velocity-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, DollarSign, Target, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch active sprint
  const { data: activeSprint } = trpc.pattern4.sprints.getActive.useQuery();

  // Fetch analytics data
  const { data: sprintTrends } = trpc.analyticsPattern4.getSprintTrends.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  const { data: financialSummary } = trpc.analyticsPattern4.getFinancialSummary.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  const { data: oppDistribution } = trpc.analyticsPattern4.getOpportunityDistribution.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  const { data: burndownData } = trpc.analyticsPattern4.getBurndownData.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  const { data: velocityData } = trpc.analyticsPattern4.getVelocityData.useQuery(
    { sprintId: activeSprint?.id! },
    { enabled: !!activeSprint }
  );

  if (!activeSprint) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No Active Sprint</h1>
        <p className="text-muted-foreground">Start a sprint to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Sprint Analytics</h1>
        <p className="text-muted-foreground">
          Performance insights for {activeSprint.name}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-8">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-indigo-500">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="data-[state=active]:bg-indigo-500">
            <Target className="h-4 w-4 mr-2" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="velocity" className="data-[state=active]:bg-indigo-500">
            <TrendingUp className="h-4 w-4 mr-2" />
            Velocity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BurndownChart
              data={burndownData || []}
              title="Sprint Burndown"
              className="h-80"
            />
            <ProgressLineChart
              data={sprintTrends || []}
              title="Weekly Progress Trends"
              className="h-80"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Completion Rate</h3>
              <p className="text-3xl font-bold text-foreground">
                {sprintTrends && sprintTrends.length > 0
                  ? Math.round(
                      (sprintTrends[sprintTrends.length - 1].completed /
                        sprintTrends[sprintTrends.length - 1].total) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Velocity</h3>
              <p className="text-3xl font-bold text-foreground">
                {Math.round(velocityData?.averageVelocity || 0)} tasks/week
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Opportunities</h3>
              <p className="text-3xl font-bold text-foreground">
                {oppDistribution?.statusData.find(s => s.name === 'ACTIVE')?.value || 0}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialBarChart
            data={financialSummary || []}
            title="Opportunity Financial Performance"
            className="h-96"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Profit</h3>
              <p className="text-3xl font-bold text-green-400">
                ${financialSummary?.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString()}
              </p>
            </div>
            {/* Add more financial metrics here */}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OpportunityPieChart
              data={oppDistribution?.statusData || []}
              title="Distribution by Status"
              className="h-80"
            />
            <OpportunityPieChart
              data={oppDistribution?.laneData || []}
              title="Distribution by Lane"
              className="h-80"
            />
          </div>
        </TabsContent>

        <TabsContent value="velocity" className="space-y-6">
          <VelocityChart
            data={velocityData?.data || []}
            averageVelocity={velocityData?.averageVelocity || 0}
            title="Weekly Velocity"
            className="h-96"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

