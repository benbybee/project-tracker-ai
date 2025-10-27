'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react';

export interface Suggestion {
  id: string;
  type:
    | 'priority'
    | 'schedule'
    | 'focus'
    | 'break'
    | 'completion'
    | 'time_estimate';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  action?: {
    type: string;
    taskId?: string;
    label: string;
    [key: string]: any;
  };
  confidence?: number;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (suggestion: Suggestion) => void;
  onReject: (suggestion: Suggestion) => void;
  onDismiss?: (suggestion: Suggestion) => void;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getIcon = () => {
    switch (suggestion.type) {
      case 'priority':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'schedule':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'focus':
        return <Target className="h-5 w-5 text-purple-500" />;
      case 'break':
        return <Clock className="h-5 w-5 text-green-500" />;
      case 'completion':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'time_estimate':
        return <TrendingUp className="h-5 w-5 text-indigo-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getBorderColor = () => {
    switch (suggestion.priority) {
      case 'high':
        return 'border-red-300 bg-red-50/50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50/50';
      case 'low':
        return 'border-blue-300 bg-blue-50/50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const handleAccept = async () => {
    setIsProcessing(true);
    await onAccept(suggestion);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(suggestion);
    setIsProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg border-2 ${getBorderColor()} p-4 shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {suggestion.title}
            </h4>
            {suggestion.confidence && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {Math.round(suggestion.confidence * 100)}% confident
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700 mt-1">{suggestion.message}</p>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {suggestion.action && (
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {suggestion.action.label || 'Accept'}
              </button>
            )}

            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Dismiss
            </button>

            {!isExpanded && suggestion.type === 'priority' && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline ml-auto"
              >
                Learn more
              </button>
            )}
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-gray-200"
              >
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Suggestion Type:</strong> {suggestion.type}
                  </p>
                  <p>
                    <strong>Priority:</strong> {suggestion.priority}
                  </p>
                  {suggestion.action?.taskId && (
                    <p>
                      <strong>Task ID:</strong> {suggestion.action.taskId}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                >
                  Show less
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
