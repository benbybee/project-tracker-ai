'use client';

import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { GlassCard } from '@/components/ui/glass-card';
import { Activity, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

export default function ActivityPage() {
  return (
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Activity}
          title="Activity Feed"
          subtitle="Track all project activities and updates in real-time"
        />

        {/* Activity Feed */}
        <GlassCard className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-4 w-4 text-gray-500" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>

          <ActivityFeed />
        </GlassCard>
      </div>
    </div>
  );
}
