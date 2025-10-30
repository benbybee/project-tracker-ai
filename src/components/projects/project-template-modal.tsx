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

interface ProjectTemplateModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'save' | 'use';
  // For saving a project as a template
  projectData?: {
    name: string;
    type: 'general' | 'website';
    description?: string;
    roleId?: string;
    tasks?: Array<{
      title: string;
      description?: string;
      status?: string;
      priorityScore?: string;
    }>;
  };
  // For using a template
  onUseTemplate?: (templateData: any) => void;
}

export function ProjectTemplateModal({
  open,
  onClose,
  mode,
  projectData,
  onUseTemplate,
}: ProjectTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [daysOffset, setDaysOffset] = useState<number>(0);

  const utils = trpc.useUtils();

  // Fetch templates when using mode
  const { data: templates, isLoading } =
    trpc.templates.listProjectTemplates.useQuery(undefined, {
      enabled: mode === 'use' && open,
    });

  // Mutations
  const createTemplate = trpc.templates.createProjectTemplate.useMutation({
    onSuccess: () => {
      utils.templates.listProjectTemplates.invalidate();
      onClose();
    },
  });

  const handleSaveAsTemplate = () => {
    if (!templateName || !projectData) return;

    createTemplate.mutate({
      name: templateName,
      description: templateDescription || undefined,
      category: templateCategory || undefined,
      projectData: {
        name: projectData.name,
        type: projectData.type,
        description: projectData.description,
        tasks: projectData.tasks || [],
      },
    });
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const template = templates?.find((t) => t.id === selectedTemplate);
    if (template && onUseTemplate) {
      const projectDataFromTemplate = template.projectData as any;

      // Substitute variables in project name and description
      const substitutedName = substituteVariables(
        projectDataFromTemplate.name,
        variables
      );
      const substitutedDescription = projectDataFromTemplate.description
        ? substituteVariables(projectDataFromTemplate.description, variables)
        : undefined;

      onUseTemplate({
        name: substitutedName,
        type: projectDataFromTemplate.type,
        description: substitutedDescription,
        roleId: projectDataFromTemplate.roleId,
        tasks: (projectDataFromTemplate.tasks as any[])?.map((task) => ({
          ...task,
          title: substituteVariables(task.title, variables),
          description: task.description
            ? substituteVariables(task.description, variables)
            : undefined,
          // Adjust task dates by offset if needed
          dueDate:
            task.dueDate && daysOffset !== 0
              ? adjustDate(task.dueDate, daysOffset)
              : task.dueDate,
        })),
        daysOffset,
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

  const adjustDate = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Get variables from selected template
  const templateVariables =
    selectedTemplate && templates
      ? (() => {
          const template = templates.find((t) => t.id === selectedTemplate);
          if (!template) return [];
          const projectData = template.projectData as any;
          const vars = new Set<string>();
          extractVariables(projectData.name).forEach((v) => vars.add(v));
          if (projectData.description) {
            extractVariables(projectData.description).forEach((v) =>
              vars.add(v)
            );
          }
          // Also extract from task titles
          (projectData.tasks as any[])?.forEach((task) => {
            extractVariables(task.title).forEach((v) => vars.add(v));
            if (task.description) {
              extractVariables(task.description).forEach((v) => vars.add(v));
            }
          });
          return Array.from(vars);
        })()
      : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'save'
              ? 'Save Project as Template'
              : 'Use Project Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? 'Save this project structure as a reusable template. Use {{variable_name}} for placeholders.'
              : 'Choose a template and customize it for your new project'}
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
                placeholder="e.g., Marketing Campaign, Website Launch"
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
                placeholder="e.g., Development, Marketing, Client Projects"
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-sm font-medium mb-2">Template Content:</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Project:</span>{' '}
                  {projectData?.name}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {projectData?.type}
                </p>
                {projectData?.description && (
                  <p>
                    <span className="font-medium">Description:</span>{' '}
                    {projectData.description}
                  </p>
                )}
                {projectData?.tasks && projectData.tasks.length > 0 && (
                  <div>
                    <span className="font-medium">
                      Tasks: {projectData.tasks.length}
                    </span>
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
                in your project name, description, or task titles. When using
                the template, you'll be prompted to fill in values.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Example: "{'{{client_name}}'} Website Project"
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
                <p className="text-gray-500">No project templates found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create your first template by saving a project
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
                      const projectData = template.projectData as any;
                      const taskCount =
                        (projectData.tasks as any[])?.length || 0;
                      return (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-sm font-medium mb-2">
                            Template Preview:
                          </p>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">Project:</span>{' '}
                              {projectData.name}
                            </p>
                            <p>
                              <span className="font-medium">Type:</span>{' '}
                              {projectData.type}
                            </p>
                            {projectData.description && (
                              <p>
                                <span className="font-medium">
                                  Description:
                                </span>{' '}
                                {projectData.description}
                              </p>
                            )}
                            {taskCount > 0 && (
                              <p>
                                <span className="font-medium">Tasks:</span>{' '}
                                {taskCount} tasks included
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

                    {/* Date offset option */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Adjust Task Dates (Optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={daysOffset}
                          onChange={(e) =>
                            setDaysOffset(parseInt(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                        <span className="text-sm">days from today</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Shift all task due dates by this many days (0 = keep
                        original dates)
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUseTemplate}
                    disabled={!selectedTemplate}
                  >
                    Use Template
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
