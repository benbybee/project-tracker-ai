'use client';

import { useMemo } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

type Project = {
  id: string;
  websiteStatus?: string | null;
  type?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export default function WebsiteBoardMetrics({ projects }: { projects: Project[] }) {
  const metrics = useMemo(() => {
    const websiteProjects = projects.filter(p => p.type === 'website');
    const total = websiteProjects.length;

    const statusCounts = {
      discovery: 0,
      development: 0,
      client_review: 0,
      blocked: 0,
      completed: 0,
    };

    let totalDays = 0;
    let reviewOver5Days = 0;

    websiteProjects.forEach(p => {
      const status = p.websiteStatus || 'discovery';
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }

      // Calculate days since creation
      if (p.createdAt) {
        const createdDate = typeof p.createdAt === 'string' ? new Date(p.createdAt) : p.createdAt;
        const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        totalDays += daysSinceCreation;
      }

      // Check if in review for >5 days
      if (status === 'client_review' && p.updatedAt) {
        const updatedDate = typeof p.updatedAt === 'string' ? new Date(p.updatedAt) : p.updatedAt;
        const daysSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 5) {
          reviewOver5Days++;
        }
      }
    });

    const avgLeadTime = total > 0 ? Math.round(totalDays / total) : 0;
    const pctReviewOver5Days = statusCounts.client_review > 0 
      ? Math.round((reviewOver5Days / statusCounts.client_review) * 100) 
      : 0;

    return {
      total,
      statusCounts,
      avgLeadTime,
      reviewOver5Days,
      pctReviewOver5Days,
    };
  }, [projects]);

  if (metrics.total === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Projects */}
      <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-medium text-gray-600">Total</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
      </div>

      {/* Discovery */}
      <div className="rounded-xl border border-gray-200 bg-purple-50/80 backdrop-blur p-3">
        <div className="text-xs font-medium text-purple-700 mb-1">Discovery</div>
        <div className="text-2xl font-bold text-purple-900">{metrics.statusCounts.discovery}</div>
      </div>

      {/* Development */}
      <div className="rounded-xl border border-gray-200 bg-blue-50/80 backdrop-blur p-3">
        <div className="text-xs font-medium text-blue-700 mb-1">Development</div>
        <div className="text-2xl font-bold text-blue-900">{metrics.statusCounts.development}</div>
      </div>

      {/* Client Review */}
      <div className="rounded-xl border border-gray-200 bg-amber-50/80 backdrop-blur p-3">
        <div className="flex items-center gap-1 mb-1">
          <div className="text-xs font-medium text-amber-700">Client Review</div>
          {metrics.reviewOver5Days > 0 && (
            <AlertTriangle className="h-3 w-3 text-amber-600" />
          )}
        </div>
        <div className="text-2xl font-bold text-amber-900">{metrics.statusCounts.client_review}</div>
        {metrics.reviewOver5Days > 0 && (
          <div className="text-xs text-amber-600 mt-1">
            {metrics.reviewOver5Days} over 5 days
          </div>
        )}
      </div>

      {/* Blocked */}
      {metrics.statusCounts.blocked > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50/80 backdrop-blur p-3">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div className="text-xs font-medium text-red-700">Blocked</div>
          </div>
          <div className="text-2xl font-bold text-red-900">{metrics.statusCounts.blocked}</div>
        </div>
      )}

      {/* Avg Lead Time */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/80 backdrop-blur p-3">
        <div className="flex items-center gap-1 mb-1">
          <Clock className="h-4 w-4 text-gray-600" />
          <div className="text-xs font-medium text-gray-600">Avg Lead Time</div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{metrics.avgLeadTime}</div>
        <div className="text-xs text-gray-600">days</div>
      </div>

      {/* Completed */}
      <div className="rounded-xl border border-gray-200 bg-green-50/80 backdrop-blur p-3">
        <div className="flex items-center gap-1 mb-1">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div className="text-xs font-medium text-green-700">Completed</div>
        </div>
        <div className="text-2xl font-bold text-green-900">{metrics.statusCounts.completed}</div>
      </div>
    </div>
  );
}

