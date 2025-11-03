'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  X,
  Trash2,
  Edit,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmationData {
  action: string;
  projectId?: string;
  projectName?: string;
  projectType?: string;
  taskId?: string;
  taskTitle?: string;
  roleId?: string;
  roleName?: string;
  details: any;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  confirmationData: ConfirmationData | null;
  onConfirm: () => void;
  onReject: () => void;
  isExecuting?: boolean;
}

function getActionIcon(action: string) {
  if (action.startsWith('delete')) return Trash2;
  if (action.startsWith('update')) return Edit;
  if (action.startsWith('create')) return Plus;
  return CheckCircle;
}

function getActionColor(action: string) {
  if (action.startsWith('delete')) return 'text-red-600 bg-red-50';
  if (action.startsWith('update')) return 'text-blue-600 bg-blue-50';
  if (action.startsWith('create')) return 'text-green-600 bg-green-50';
  return 'text-purple-600 bg-purple-50';
}

function getActionTitle(action: string, data: ConfirmationData): string {
  switch (action) {
    case 'create_project':
      return `Create Project: ${data.details.name}`;
    case 'update_project':
      return `Update Project: ${data.projectName}`;
    case 'delete_project':
      return `Delete Project: ${data.projectName}`;
    case 'create_task':
      return `Create Task: ${data.details.title}`;
    case 'update_task':
      return `Update Task: ${data.taskTitle}`;
    case 'delete_task':
      return `Delete Task: ${data.taskTitle}`;
    case 'create_role':
      return `Create Role: ${data.details.name}`;
    case 'update_role':
      return `Update Role: ${data.roleName}`;
    case 'delete_role':
      return `Delete Role: ${data.roleName}`;
    default:
      return 'Confirm Action';
  }
}

function getActionDetails(
  action: string,
  data: ConfirmationData
): React.ReactNode {
  const details = data.details;

  switch (action) {
    case 'create_project':
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Name:</span>
            <span className="font-medium">{details.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Type:</span>
            <span className="font-medium capitalize">{details.type}</span>
          </div>
          {details.description && (
            <div className="flex justify-between">
              <span className="text-slate-600">Description:</span>
              <span className="font-medium text-right">
                {details.description}
              </span>
            </div>
          )}
          {details.domain && (
            <div className="flex justify-between">
              <span className="text-slate-600">Domain:</span>
              <span className="font-medium">{details.domain}</span>
            </div>
          )}
        </div>
      );

    case 'update_project':
    case 'update_task':
    case 'update_role':
      return (
        <div className="space-y-2">
          <div className="text-sm text-slate-600 mb-2">Changes:</div>
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-slate-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="font-medium text-right">
                {typeof value === 'boolean'
                  ? value
                    ? 'Yes'
                    : 'No'
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
      );

    case 'delete_project':
      return (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">This action cannot be undone</span>
          </div>
          <p className="text-sm text-slate-600">
            All tasks in this project will also be deleted.
          </p>
        </div>
      );

    case 'delete_task':
    case 'delete_role':
      return (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">This action cannot be undone</span>
          </div>
        </div>
      );

    case 'create_task':
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Project:</span>
            <span className="font-medium">{data.projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Title:</span>
            <span className="font-medium">{details.title}</span>
          </div>
          {details.description && (
            <div className="flex justify-between">
              <span className="text-slate-600">Description:</span>
              <span className="font-medium text-right">
                {details.description}
              </span>
            </div>
          )}
          {details.dueDate && (
            <div className="flex justify-between">
              <span className="text-slate-600">Due Date:</span>
              <span className="font-medium">{details.dueDate}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-600">Priority:</span>
            <span className="font-medium">
              {details.priorityScore === '1' && 'Low'}
              {details.priorityScore === '2' && 'Medium'}
              {details.priorityScore === '3' && 'High'}
              {details.priorityScore === '4' && 'Urgent'}
            </span>
          </div>
        </div>
      );

    case 'create_role':
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Name:</span>
            <span className="font-medium">{details.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Color:</span>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: details.color }}
              />
              <span className="font-medium">{details.color}</span>
            </div>
          </div>
        </div>
      );

    default:
      return <div className="text-sm text-slate-600">Confirm this action?</div>;
  }
}

export function ConfirmationModal({
  isOpen,
  confirmationData,
  onConfirm,
  onReject,
  isExecuting = false,
}: ConfirmationModalProps) {
  if (!confirmationData) return null;

  const Icon = getActionIcon(confirmationData.action);
  const colorClasses = getActionColor(confirmationData.action);
  const isDelete = confirmationData.action.startsWith('delete');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isExecuting ? undefined : onReject}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-xl', colorClasses)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {getActionTitle(
                        confirmationData.action,
                        confirmationData
                      )}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Please review and confirm this action
                    </p>
                  </div>
                  {!isExecuting && (
                    <button
                      onClick={onReject}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {getActionDetails(confirmationData.action, confirmationData)}
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                <Button
                  onClick={onReject}
                  disabled={isExecuting}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isExecuting}
                  className={cn(
                    'flex-1',
                    isDelete
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  )}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Executing...
                    </>
                  ) : (
                    <>Confirm</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
