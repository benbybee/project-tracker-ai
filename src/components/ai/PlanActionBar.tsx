'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  BarChart3,
  Brain,
  RefreshCw,
  Settings,
} from 'lucide-react';

interface PlanActionBarProps {
  onGeneratePlan: () => void;
  onViewAnalytics?: () => void;
  onUpdatePatterns?: () => void;
  isLoading?: boolean;
  lastUpdated?: Date;
}

export function PlanActionBar({
  onGeneratePlan,
  onViewAnalytics,
  onUpdatePatterns,
  isLoading = false,
  lastUpdated,
}: PlanActionBarProps) {
  const [showSettings, setShowSettings] = useState(false);

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-blue-200 p-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left Side: AI Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onGeneratePlan}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Plan
              </>
            )}
          </button>

          {onUpdatePatterns && (
            <button
              onClick={onUpdatePatterns}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 disabled:opacity-50 transition-colors"
              title="Update your productivity patterns"
            >
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Update Patterns</span>
            </button>
          )}

          {onViewAnalytics && (
            <button
              onClick={onViewAnalytics}
              className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors"
              title="View your productivity analytics"
            >
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Analytics</span>
            </button>
          )}
        </div>

        {/* Right Side: Info & Settings */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>Patterns updated {formatLastUpdated(lastUpdated)}</span>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
            title="AI settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900">AI Model</h4>
              <p className="text-gray-600">GPT-4 Turbo (Planning)</p>
              <p className="text-gray-600">GPT-3.5 (Quick Suggestions)</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900">Rate Limit</h4>
              <p className="text-gray-600">10 requests per hour</p>
              <p className="text-xs text-gray-500 mt-1">Resets every hour</p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-900">Learning Status</h4>
              <p className="text-gray-600">
                {lastUpdated ? 'Active' : 'Not started'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                AI learns from your task completion patterns
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
