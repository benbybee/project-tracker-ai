'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentAction {
  id: string;
  function: string;
  parameters: Record<string, any>;
  description: string;
  impact?: string;
}

interface AgentResult {
  actionId: string;
  function: string;
  success: boolean;
  data?: any;
  error?: string;
  retries?: number;
}

interface AgentMessageBubbleProps {
  type:
    | 'thinking'
    | 'executing'
    | 'completed'
    | 'failed'
    | 'approval_needed'
    | 'response';
  intent?: string;
  actions?: AgentAction[];
  results?: AgentResult[];
  message?: string;
  error?: string;
  onApprove?: (actions: AgentAction[]) => void;
  onReject?: () => void;
}

export function AgentMessageBubble({
  type,
  intent,
  actions,
  results,
  message,
  error,
  onApprove,
  onReject,
}: AgentMessageBubbleProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set(actions?.map((a) => a.id) || [])
  );

  const toggleAction = (actionId: string) => {
    const newSelected = new Set(selectedActions);
    if (newSelected.has(actionId)) {
      newSelected.delete(actionId);
    } else {
      newSelected.add(actionId);
    }
    setSelectedActions(newSelected);
  };

  const handleApprove = () => {
    if (actions && onApprove) {
      const approved = actions.filter((a) => selectedActions.has(a.id));
      onApprove(approved);
    }
  };

  const getStatusIcon = () => {
    switch (type) {
      case 'thinking':
        return <Loader2 className="h-4 w-4 animate-spin text-purple-400" />;
      case 'executing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'approval_needed':
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      default:
        return <Bot className="h-4 w-4 text-purple-400" />;
    }
  };

  const getStatusText = () => {
    switch (type) {
      case 'thinking':
        return 'Analyzing your request...';
      case 'executing':
        return 'Executing actions...';
      case 'completed':
        return 'Completed successfully';
      case 'failed':
        return 'Action failed';
      case 'approval_needed':
        return 'Approval required';
      default:
        return 'Response';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
        <Bot className="h-4 w-4 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-[80%]">
        {/* Status Header */}
        <div className="flex items-center gap-2 mb-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        </div>

        {/* Main Message */}
        {(intent || message) && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 mb-2">
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {intent || message}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 mb-2">
            <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Approval Needed */}
        {type === 'approval_needed' && actions && actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              The following actions require your approval:
            </p>
            {actions.map((action) => (
              <div
                key={action.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedActions.has(action.id)}
                    onChange={() => toggleAction(action.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {action.function}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                    {action.impact && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ {action.impact}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleApprove}
                disabled={selectedActions.size === 0}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Approve{' '}
                {selectedActions.size > 0 && `(${selectedActions.size})`}
              </Button>
              <Button onClick={onReject} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span>
                {results.filter((r) => r.success).length} / {results.length}{' '}
                actions completed
              </span>
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mt-2"
                >
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-2 rounded ${
                        result.success
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-200'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span className="font-medium">{result.function}</span>
                      </div>
                      {result.error && <p className="mt-1">{result.error}</p>}
                      {result.retries && result.retries > 1 && (
                        <p className="mt-1 opacity-75">
                          Retried {result.retries} times
                        </p>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          {new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
