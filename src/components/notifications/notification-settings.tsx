'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassCard } from '@/components/ui/glass-card';
import { Bell, Mail, Moon, Volume2, Clock, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const { data: settings, refetch } = trpc.notifications.getSettings.useQuery();
  const updateSettingsMutation = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      toast.success('Notification settings saved successfully');
      refetch();
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  const [localSettings, setLocalSettings] = useState({
    typePreferences: {} as Record<string, boolean>,
    emailEnabled: false,
    emailFrequency: 'never' as 'realtime' | 'daily' | 'weekly' | 'never',
    emailDigestTime: 8,
    pushEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    soundEnabled: true,
    soundType: 'default',
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        typePreferences: (settings.typePreferences as Record<string, boolean>) || {},
        emailEnabled: settings.emailEnabled || false,
        emailFrequency: settings.emailFrequency || 'never',
        emailDigestTime: settings.emailDigestTime || 8,
        pushEnabled: settings.pushEnabled ?? true,
        quietHoursEnabled: settings.quietHoursEnabled || false,
        quietHoursStart: settings.quietHoursStart || 22,
        quietHoursEnd: settings.quietHoursEnd || 8,
        soundEnabled: settings.soundEnabled ?? true,
        soundType: settings.soundType || 'default',
      });
    }
  }, [settings]);

  const handleSave = () => {
    setIsSaving(true);
    updateSettingsMutation.mutate(localSettings);
  };

  const notificationTypes = [
    { key: 'task_reminder', label: 'Task Reminders', description: 'Reminders for tasks you need to complete' },
    { key: 'due_date_approaching', label: 'Due Date Alerts', description: 'Notifications when tasks are due soon' },
    { key: 'task_assigned', label: 'Task Assignments', description: 'When a task is assigned to you' },
    { key: 'task_updated', label: 'Task Updates', description: 'When a task you\'re watching is updated' },
    { key: 'task_completed', label: 'Task Completions', description: 'When a task is marked as complete' },
    { key: 'project_updated', label: 'Project Updates', description: 'When a project you\'re watching is updated' },
    { key: 'comment_added', label: 'Comments', description: 'When someone comments on a task' },
    { key: 'mention', label: 'Mentions', description: 'When someone mentions you' },
    { key: 'sync_conflict', label: 'Sync Conflicts', description: 'When data sync conflicts occur' },
    { key: 'collaboration', label: 'Collaboration', description: 'Collaboration activity notifications' },
    { key: 'ai_suggestion', label: 'AI Suggestions', description: 'AI-powered task and schedule suggestions' },
  ];

  return (
    <div className="space-y-6">
      {/* Notification Types */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Notification Types</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Choose which types of notifications you want to receive
        </p>

        <div className="space-y-4">
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <Label htmlFor={type.key} className="text-sm font-medium cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </div>
              <Switch
                id={type.key}
                checked={localSettings.typePreferences[type.key] ?? true}
                onCheckedChange={(checked) =>
                  setLocalSettings({
                    ...localSettings,
                    typePreferences: {
                      ...localSettings.typePreferences,
                      [type.key]: checked,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Email Notifications */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Email Notifications</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Control how you receive email notifications
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailEnabled" className="text-sm font-medium">
              Enable email notifications
            </Label>
            <Switch
              id="emailEnabled"
              checked={localSettings.emailEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, emailEnabled: checked })
              }
            />
          </div>

          {localSettings.emailEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailFrequency" className="text-sm font-medium">
                  Email Frequency
                </Label>
                <Select
                  value={localSettings.emailFrequency}
                  onValueChange={(value: 'realtime' | 'daily' | 'weekly' | 'never') =>
                    setLocalSettings({ ...localSettings, emailFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time (immediate)</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(localSettings.emailFrequency === 'daily' || localSettings.emailFrequency === 'weekly') && (
                <div className="space-y-2">
                  <Label htmlFor="emailDigestTime" className="text-sm font-medium">
                    Digest Time (Hour of day: 0-23)
                  </Label>
                  <Select
                    value={localSettings.emailDigestTime.toString()}
                    onValueChange={(value) =>
                      setLocalSettings({ ...localSettings, emailDigestTime: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      </GlassCard>

      {/* Push & Sound */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Volume2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Push & Sound</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Configure push notifications and sounds
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="pushEnabled" className="text-sm font-medium">
              Enable push notifications
            </Label>
            <Switch
              id="pushEnabled"
              checked={localSettings.pushEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, pushEnabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="soundEnabled" className="text-sm font-medium">
              Enable notification sounds
            </Label>
            <Switch
              id="soundEnabled"
              checked={localSettings.soundEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, soundEnabled: checked })
              }
            />
          </div>
        </div>
      </GlassCard>

      {/* Quiet Hours */}
      <GlassCard className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Moon className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Quiet Hours</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Disable notifications during specific hours
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quietHoursEnabled" className="text-sm font-medium">
              Enable quiet hours
            </Label>
            <Switch
              id="quietHoursEnabled"
              checked={localSettings.quietHoursEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, quietHoursEnabled: checked })
              }
            />
          </div>

          {localSettings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quietHoursStart" className="text-sm font-medium">
                  Start Time
                </Label>
                <Select
                  value={localSettings.quietHoursStart.toString()}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, quietHoursStart: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quietHoursEnd" className="text-sm font-medium">
                  End Time
                </Label>
                <Select
                  value={localSettings.quietHoursEnd.toString()}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, quietHoursEnd: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

