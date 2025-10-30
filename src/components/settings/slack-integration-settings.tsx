'use client';

/**
 * Slack Integration Settings Component
 * Manage Slack workspace connection and settings
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Slack, Check, X } from 'lucide-react';

export function SlackIntegrationSettings() {
  const [isConnecting, setIsConnecting] = useState(false);

  // Query integration status
  const {
    data: integration,
    isLoading,
    refetch,
  } = trpc.slack.getIntegration.useQuery();

  // Disconnect mutation
  const disconnectMutation = trpc.slack.disconnect.useMutation({
    onSuccess: () => {
      toast.success('Slack disconnected');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to disconnect Slack');
    },
  });

  // Handle connect
  const handleConnect = () => {
    setIsConnecting(true);

    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/slack/oauth/callback`;
    const scopes = [
      'commands',
      'chat:write',
      'channels:read',
      'groups:read',
      'im:read',
      'mpim:read',
      'reactions:read',
      'users:read',
    ].join(',');

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = authUrl;
  };

  // Handle disconnect
  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Slack?')) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Slack className="w-5 h-5" />
          Slack Integration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Connect your Slack workspace to manage tasks directly from Slack.
        </p>
      </div>

      {integration ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Slack className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium">{integration.teamName}</div>
                <div className="text-sm text-gray-500">
                  {integration.isActive ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <X className="w-3 h-3" />
                      Disconnected
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              disabled={disconnectMutation.isLoading}
            >
              {disconnectMutation.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-3">Available Commands</h4>
            <div className="space-y-2 text-sm">
              <div className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                /task create [project] [title]
              </div>
              <div className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                /task list [project]
              </div>
              <div className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                /task complete [task-id]
              </div>
              <div className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                /task search [query]
              </div>
              <div className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                /task today
              </div>
              <div className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                /task overdue
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2">Features</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Slash commands for task management</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Interactive task cards with action buttons</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  React with :memo: emoji to create tasks from messages
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Daily standup notifications</span>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
            <Slack className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-medium mb-1">Connect your Slack workspace</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage tasks directly from Slack with slash commands, interactive
              messages, and more.
            </p>
          </div>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="gap-2"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Slack className="w-4 h-4" />
            )}
            Connect to Slack
          </Button>
        </div>
      )}
    </div>
  );
}
