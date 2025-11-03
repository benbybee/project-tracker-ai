'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal';
import { TaskEditModal } from '@/components/tasks/TaskEditModal';
import {
  Plus,
  ExternalLink,
  FileText,
  CheckCircle2,
  Circle,
  Globe,
  Check,
  ChevronRight,
  Key,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { Task } from '@/types/task';
import { parseDateAsLocal, formatDateShort } from '@/lib/date-utils';

interface ProjectDetailsModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailsModal({
  projectId,
  isOpen,
  onClose,
}: ProjectDetailsModalProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);

  const { data: project, isLoading: projectLoading } =
    trpc.projects.get.useQuery({ id: projectId! }, { enabled: !!projectId });

  const { data: tasks = [], isLoading: tasksLoading } =
    trpc.tasks.list.useQuery(
      { projectId: projectId! },
      { enabled: !!projectId }
    );

  const utils = trpc.useUtils();
  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId! });
      utils.dashboard.get.invalidate();
      setIsEditingNotes(false);
    },
  });

  const convertToGeneralMutation = trpc.projects.convertToGeneral.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId! });
      utils.dashboard.get.invalidate();
    },
  });

  // Load notes when project loads
  useEffect(() => {
    if (project?.notes) {
      setNotes(project.notes);
    } else {
      setNotes('');
    }
  }, [project]);

  const handleSaveNotes = () => {
    if (!projectId) return;
    updateProjectMutation.mutate({
      id: projectId,
      notes,
    });
  };

  const handleConvertToGeneral = () => {
    if (!projectId || !project) return;
    if (confirm('Convert this website project back to a general project?')) {
      convertToGeneralMutation.mutate({ id: projectId });
    }
  };

  const handleViewFullProject = () => {
    if (projectId) {
      router.push(`/projects/${projectId}`);
      onClose();
    }
  };

  const handleWordPressLogin = () => {
    if (projectId) {
      window.open(`/api/wordpress/login?projectId=${projectId}`, '_blank');
    }
  };

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full sm:max-w-3xl max-w-[calc(100vw-2rem)] overflow-x-hidden">
          {projectLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : project ? (
            <>
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-xl sm:text-2xl flex flex-wrap items-center gap-2">
                      <span className="truncate">{project.name}</span>
                      {project.type === 'website' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                          <Globe className="h-3 w-3 mr-1" />
                          Website
                        </span>
                      )}
                    </DialogTitle>
                    {project.role && (
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs mt-2"
                        style={{
                          backgroundColor: `${project.role.color}22`,
                          color: project.role.color,
                        }}
                      >
                        {project.role.name}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewFullProject}
                    className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="whitespace-nowrap">View Full Project</span>
                  </Button>
                </div>
              </DialogHeader>

              {/* Progress Section */}
              <GlassCard className="mt-4 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                  <span>{completedTasks} completed</span>
                  <span>{totalTasks} total tasks</span>
                </div>
              </GlassCard>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Button
                  onClick={() => setCreateTaskOpen(true)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span className="whitespace-nowrap">Add Task</span>
                </Button>
                {project.wpOneClickEnabled && (
                  <Button
                    variant="outline"
                    onClick={handleWordPressLogin}
                    className="flex items-center gap-2 flex-shrink-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30"
                  >
                    <Key className="h-4 w-4" />
                    <span className="whitespace-nowrap">
                      Open WordPress Site
                    </span>
                  </Button>
                )}
                {project.type === 'website' && (
                  <Button
                    variant="outline"
                    onClick={handleConvertToGeneral}
                    disabled={convertToGeneralMutation.isPending}
                    className="flex-shrink-0 whitespace-nowrap"
                  >
                    {convertToGeneralMutation.isPending
                      ? 'Converting...'
                      : 'Convert to General'}
                  </Button>
                )}
              </div>

              {/* Tasks Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Tasks ({totalTasks})
                </h3>
                {tasksLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-200 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : tasks.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {tasks.map((task) => (
                        <TaskListItem
                          key={task.id}
                          task={task}
                          onClick={() => {
                            setSelectedTask(task as Task);
                            setEditTaskOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <GlassCard className="text-center py-8">
                    <Circle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No tasks yet</p>
                    <Button
                      variant="link"
                      onClick={() => setCreateTaskOpen(true)}
                      className="mt-2"
                    >
                      Create your first task
                    </Button>
                  </GlassCard>
                )}
              </div>

              {/* Notes Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Notes
                  </h3>
                  {!isEditingNotes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingNotes(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this project..."
                      className="min-h-[120px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveNotes}
                        disabled={updateProjectMutation.isPending}
                      >
                        {updateProjectMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNotes(project.notes || '');
                          setIsEditingNotes(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <GlassCard className="p-4">
                    {notes ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {notes}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No notes yet
                      </p>
                    )}
                  </GlassCard>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Project not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Create Modal */}
      {projectId && (
        <TaskCreateModal
          open={createTaskOpen}
          onClose={() => {
            setCreateTaskOpen(false);
            // Refresh tasks list after creating a task
            utils.tasks.list.invalidate({ projectId });
          }}
          projectId={projectId}
        />
      )}

      {/* Task Edit Modal */}
      {selectedTask && (
        <TaskEditModal
          task={selectedTask}
          open={editTaskOpen}
          onClose={() => {
            setEditTaskOpen(false);
            setSelectedTask(null);
            // Refresh tasks list after editing a task
            if (projectId) {
              utils.tasks.list.invalidate({ projectId });
            }
          }}
        />
      )}
    </>
  );
}

// Simple list-style task item component
function TaskListItem({ task, onClick }: { task: any; onClick: () => void }) {
  const isCompleted = task.status === 'completed';
  const due = task.dueDate ? parseDateAsLocal(task.dueDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = due ? new Date(due) : null;
  if (dueDate) dueDate.setHours(0, 0, 0, 0);
  const overdue = dueDate && dueDate < today;
  const dueToday = dueDate && dueDate.getTime() === today.getTime();

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
        isCompleted && 'opacity-60'
      )}
    >
      {/* Checkbox/Status indicator */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        )}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              'font-medium text-sm truncate',
              isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
            )}
          >
            {task.title}
          </p>
          {overdue && !isCompleted && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium flex-shrink-0 whitespace-nowrap">
              Overdue
            </span>
          )}
          {dueToday && !isCompleted && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium flex-shrink-0 whitespace-nowrap">
              Due Today
            </span>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-gray-600 truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Due date and role */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
        {task.dueDate && (
          <span
            className={cn(
              'text-xs px-2 py-1 rounded whitespace-nowrap',
              overdue && !isCompleted
                ? 'text-red-600 bg-red-50'
                : 'text-gray-600 bg-gray-100'
            )}
          >
            {formatDateShort(task.dueDate)}
          </span>
        )}
        {task.role && (
          <span
            className="text-xs px-2 py-1 rounded whitespace-nowrap"
            style={{
              backgroundColor: `${task.role.color}15`,
              color: task.role.color,
            }}
          >
            {task.role.name}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}
