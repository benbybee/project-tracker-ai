'use client';

import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { GlassCard } from '@/components/ui/glass-card';
import { Activity, Clock } from 'lucide-react';

export default function ActivityPage() {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
              <p className="text-gray-600">Track all project activities and updates</p>
            </div>
          </div>
        </div>

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
