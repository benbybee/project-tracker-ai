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
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';

interface TaskTemplateModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'save' | 'use';
  // For saving a task as a template
  taskData?: {
    title: string;
    description?: string;
    priorityScore?: '1' | '2' | '3' | '4';
    subtasks?: Array<{ title: string; completed?: boolean; position: number }>;
  };
  // For using a template
  onUseTemplate?: (templateData: any) => void;
}

export function TaskTemplateModal({
  open,
  onClose,
  mode,
  taskData,
  onUseTemplate,
}: TaskTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const utils = trpc.useUtils();

  // Fetch templates when using mode
  const { data: templates, isLoading } =
    trpc.templates.listTaskTemplates.useQuery(undefined, {
      enabled: mode === 'use' && open,
    });

  // Mutations
  const createTemplate = trpc.templates.createTaskTemplate.useMutation({
    onSuccess: () => {
      utils.templates.listTaskTemplates.invalidate();
      onClose();
    },
  });

  const useTemplate = trpc.templates.createFromTaskTemplate.useMutation({
    onSuccess: (data) => {
      if (onUseTemplate) {
        onUseTemplate(data);
      }
      onClose();
    },
  });

  const handleSaveAsTemplate = () => {
    if (!templateName || !taskData) return;

    createTemplate.mutate({
      name: templateName,
      description: templateDescription || undefined,
      category: templateCategory || undefined,
      taskData: {
        title: taskData.title,
        description: taskData.description,
        priorityScore: taskData.priorityScore,
      },
      subtasks: taskData.subtasks,
    });
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    // For now, we'll pass the template ID and variables back to the parent
    const template = templates?.find((t) => t.id === selectedTemplate);
    if (template && onUseTemplate) {
      // Extract variables from template
      const taskDataFromTemplate = template.taskData as any;
      onUseTemplate({
        title: substituteVariables(taskDataFromTemplate.title, variables),
        description: taskDataFromTemplate.description
          ? substituteVariables(taskDataFromTemplate.description, variables)
          : undefined,
        priorityScore: taskDataFromTemplate.priorityScore,
        subtasks: (template.subtasks as any[])?.map((st) => ({
          ...st,
          title: substituteVariables(st.title, variables),
        })),
      });
    }
    onClose();
  };

  const substituteVariables = (
    text: string,
    vars: Record<string, string>
  ): string => {
    let result = text;
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const extractVariables = (text: string): string[] => {
    const regex = /{{(\w+)}}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  // Get variables from selected template
  const templateVariables =
    selectedTemplate && templates
      ? (() => {
          const template = templates.find((t) => t.id === selectedTemplate);
          if (!template) return [];
          const taskData = template.taskData as any;
          const vars = new Set<string>();
          extractVariables(taskData.title).forEach((v) => vars.add(v));
          if (taskData.description) {
            extractVariables(taskData.description).forEach((v) => vars.add(v));
          }
          return Array.from(vars);
        })()
      : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'save' ? 'Save as Template' : 'Use Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? 'Save this task as a reusable template. Use {{variable_name}} for placeholders.'
              : 'Choose a template and fill in any variables'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'save' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Template Name *
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Weekly Review, Bug Fix Workflow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Input
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                placeholder="e.g., Development, Marketing, Personal"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-sm font-medium mb-2">Template Content:</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Title:</span> {taskData?.title}
                </p>
                {taskData?.description && (
                  <p>
                    <span className="font-medium">Description:</span>{' '}
                    {taskData.description}
                  </p>
                )}
                {taskData?.subtasks && taskData.subtasks.length > 0 && (
                  <div>
                    <span className="font-medium">Subtasks:</span>
                    <ul className="list-disc list-inside ml-2">
                      {taskData.subtasks.map((st, i) => (
                        <li key={i}>{st.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p className="font-medium mb-1">💡 Tip: Use Variables</p>
              <p className="text-gray-600 dark:text-gray-400">
                Add{' '}
                <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded">
                  {'{{variable_name}}'}
                </code>{' '}
                in your task title or description. When using the template,
                you'll be prompted to fill in values.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Example: "Fix {'{{bug_type}}'} in {'{{project_name}}'}"
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsTemplate}
                disabled={!templateName || createTemplate.isLoading}
              >
                {createTemplate.isLoading ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-center py-8">Loading templates...</p>
            ) : !templates || templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No templates found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create your first template by saving a task
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplate || ''}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      setVariables({});
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Choose a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                        {template.category && ` (${template.category})`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <>
                    {/* Show template preview */}
                    {(() => {
                      const template = templates.find(
                        (t) => t.id === selectedTemplate
                      );
                      if (!template) return null;
                      const taskData = template.taskData as any;
                      return (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-sm font-medium mb-2">
                            Template Preview:
                          </p>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Title:</span>{' '}
                              {taskData.title}
                            </p>
                            {taskData.description && (
                              <p>
                                <span className="font-medium">
                                  Description:
                                </span>{' '}
                                {taskData.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Variable inputs */}
                    {templateVariables.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">
                          Fill in Variables:
                        </p>
                        {templateVariables.map((varName) => (
                          <div key={varName}>
                            <label className="block text-sm mb-1 capitalize">
                              {varName.replace(/_/g, ' ')}
                            </label>
                            <Input
                              value={variables[varName] || ''}
                              onChange={(e) =>
                                setVariables((prev) => ({
                                  ...prev,
                                  [varName]: e.target.value,
                                }))
                              }
                              placeholder={`Enter ${varName.replace(/_/g, ' ')}...`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUseTemplate}
                    disabled={!selectedTemplate || useTemplate.isLoading}
                  >
                    {useTemplate.isLoading ? 'Using...' : 'Use Template'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
