'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type RecurrenceConfig,
  getRecurrenceDescription,
  RECURRENCE_PRESETS,
} from '@/lib/recurrence-parser';

interface RecurringTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: RecurrenceConfig) => void;
  initialConfig?: RecurrenceConfig;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RecurringTaskModal({
  open,
  onClose,
  onSave,
  initialConfig,
}: RecurringTaskModalProps) {
  const [config, setConfig] = useState<RecurrenceConfig>(
    initialConfig || {
      pattern: 'daily',
      interval: 1,
      endType: 'never',
    }
  );

  const updateConfig = (updates: Partial<RecurrenceConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handlePresetClick = (preset: RecurrenceConfig) => {
    setConfig(preset);
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const description = getRecurrenceDescription(config);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Set Recurrence Pattern</DialogTitle>
          <DialogDescription>
            Configure how often this task should repeat
          </DialogDescription>
        </DialogHeader>

        {/* Quick Presets */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(RECURRENCE_PRESETS.daily)}
            className={
              config.pattern === 'daily' && config.interval === 1
                ? 'bg-blue-100'
                : ''
            }
          >
            Daily
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(RECURRENCE_PRESETS.weekdays)}
            className={config.daysOfWeek?.length === 5 ? 'bg-blue-100' : ''}
          >
            Weekdays
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(RECURRENCE_PRESETS.weekly)}
            className={
              config.pattern === 'weekly' && config.interval === 1
                ? 'bg-blue-100'
                : ''
            }
          >
            Weekly
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(RECURRENCE_PRESETS.biweekly)}
            className={
              config.pattern === 'weekly' && config.interval === 2
                ? 'bg-blue-100'
                : ''
            }
          >
            Bi-weekly
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(RECURRENCE_PRESETS.monthly)}
            className={config.pattern === 'monthly' ? 'bg-blue-100' : ''}
          >
            Monthly
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(RECURRENCE_PRESETS.yearly)}
            className={config.pattern === 'yearly' ? 'bg-blue-100' : ''}
          >
            Yearly
          </Button>
        </div>

        {/* Pattern Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Repeat</label>
            <div className="flex gap-2">
              <select
                value={config.pattern}
                onChange={(e) =>
                  updateConfig({
                    pattern: e.target.value as any,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>

              <div className="flex items-center gap-2">
                <span className="text-sm">Every</span>
                <Input
                  type="number"
                  min="1"
                  value={config.interval}
                  onChange={(e) =>
                    updateConfig({ interval: parseInt(e.target.value) || 1 })
                  }
                  className="w-20"
                />
                <span className="text-sm">
                  {config.pattern === 'daily' &&
                    (config.interval === 1 ? 'day' : 'days')}
                  {config.pattern === 'weekly' &&
                    (config.interval === 1 ? 'week' : 'weeks')}
                  {config.pattern === 'monthly' &&
                    (config.interval === 1 ? 'month' : 'months')}
                  {config.pattern === 'yearly' &&
                    (config.interval === 1 ? 'year' : 'years')}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly: Days of Week */}
          {config.pattern === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Repeat on
              </label>
              <div className="flex gap-2">
                {dayNames.map((day, index) => {
                  const isSelected =
                    config.daysOfWeek?.includes(index) || false;
                  return (
                    <Button
                      key={day}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = config.daysOfWeek || [];
                        const updated = isSelected
                          ? current.filter((d) => d !== index)
                          : [...current, index].sort();
                        updateConfig({ daysOfWeek: updated });
                      }}
                      className={isSelected ? 'bg-blue-500 text-white' : ''}
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly: Date or Relative */}
          {config.pattern === 'monthly' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Monthly on</label>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="monthlyType"
                  checked={config.monthlyType === 'date'}
                  onChange={() => updateConfig({ monthlyType: 'date' })}
                />
                <span className="text-sm">Day</span>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={config.dayOfMonth || 1}
                  onChange={(e) =>
                    updateConfig({ dayOfMonth: parseInt(e.target.value) })
                  }
                  className="w-20"
                  disabled={config.monthlyType !== 'date'}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="monthlyType"
                  checked={config.monthlyType === 'relative'}
                  onChange={() => updateConfig({ monthlyType: 'relative' })}
                />
                <span className="text-sm">The</span>
                <select
                  value={config.relativeWeekOfMonth || 1}
                  onChange={(e) =>
                    updateConfig({
                      relativeWeekOfMonth: parseInt(e.target.value) as any,
                    })
                  }
                  disabled={config.monthlyType !== 'relative'}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="1">First</option>
                  <option value="2">Second</option>
                  <option value="3">Third</option>
                  <option value="4">Fourth</option>
                  <option value="-1">Last</option>
                </select>
                <select
                  value={config.relativeDayOfWeek || 1}
                  onChange={(e) =>
                    updateConfig({
                      relativeDayOfWeek: parseInt(e.target.value),
                    })
                  }
                  disabled={config.monthlyType !== 'relative'}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {dayNames.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Skip Weekends */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.skipWeekends || false}
              onChange={(e) => updateConfig({ skipWeekends: e.target.checked })}
            />
            <label className="text-sm">Skip weekends</label>
          </div>

          {/* End Condition */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">Ends</label>

            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="endType"
                checked={config.endType === 'never'}
                onChange={() => updateConfig({ endType: 'never' })}
              />
              <span className="text-sm">Never</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="endType"
                checked={config.endType === 'after'}
                onChange={() => updateConfig({ endType: 'after' })}
              />
              <span className="text-sm">After</span>
              <Input
                type="number"
                min="1"
                value={config.occurrenceCount || 10}
                onChange={(e) =>
                  updateConfig({ occurrenceCount: parseInt(e.target.value) })
                }
                className="w-20"
                disabled={config.endType !== 'after'}
              />
              <span className="text-sm">occurrences</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="endType"
                checked={config.endType === 'byDate'}
                onChange={() => updateConfig({ endType: 'byDate' })}
              />
              <span className="text-sm">On</span>
              <Input
                type="date"
                value={
                  config.endDate
                    ? new Date(config.endDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  updateConfig({
                    endDate: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
                className="w-40"
                disabled={config.endType !== 'byDate'}
              />
            </div>
          </div>
        </div>

        {/* Description Preview */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium mb-1">Recurrence Summary:</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Recurrence</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
