'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Lightbulb,
  Loader2,
  Mic,
  Plus,
  Save,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedAiChatEmbedded } from '@/components/ai/unified-ai-chat-embedded';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export const dynamic = 'force-dynamic';

const ideaStatuses = [
  'INBOX',
  'EXPLORING',
  'VALIDATING',
  'PLANNED',
  'EXECUTING',
  'ARCHIVED',
] as const;

type PlanDraftTask = {
  title: string;
  description?: string;
  priority?: number;
  dueDate?: string | null;
  budgetPlanned?: string;
  dependencies?: string;
};

export default function IdeaForgeDetailPage() {
  const params = useParams();
  const ideaId = params.ideaId as string;

  const utils = trpc.useUtils();
  const { data: idea, isLoading: ideaLoading } =
    trpc.ideaforge.ideas.get.useQuery({ id: ideaId });
  const { data: transcripts = [] } =
    trpc.ideaforge.transcripts.list.useQuery({ ideaId });
  const { data: plans = [] } = trpc.ideaforge.plans.listByIdea.useQuery({
    ideaId,
  });
  const { data: memory } = trpc.ideaforge.memory.get.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery({});
  const { data: sprints = [] } = trpc.pattern4.sprints.list.useQuery();

  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('');
  const { data: sprintWeeks = [] } = trpc.pattern4.weeks.list.useQuery(
    { sprintId: selectedSprintId },
    { enabled: !!selectedSprintId }
  );
  const { data: opportunities = [] } = trpc.pattern4.opportunities.list.useQuery(
    selectedSprintId ? { sprintId: selectedSprintId } : undefined
  );

  const [title, setTitle] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<(typeof ideaStatuses)[number]>('INBOX');

  const [memoryJson, setMemoryJson] = useState('');
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const [exploreMode, setExploreMode] =
    useState<'freeform' | 'guided' | 'critical'>('freeform');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);

  const [scheduleMode, setScheduleMode] =
    useState<'realistic' | 'aggressive' | 'deadline'>('realistic');
  const [projectId, setProjectId] = useState('');
  const [planTasks, setPlanTasks] = useState<PlanDraftTask[]>([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [committingPlan, setCommittingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: committedPlanTasks = [] } = trpc.ideaforge.planTasks.listByPlan.useQuery(
    { planId: selectedPlanId ?? '' },
    { enabled: !!selectedPlanId }
  );

  const updateIdea = trpc.ideaforge.ideas.update.useMutation({
    onSuccess: () => {
      utils.ideaforge.ideas.get.invalidate({ id: ideaId });
      utils.ideaforge.ideas.list.invalidate();
    },
  });

  const commitPlan = trpc.ideaforge.plans.commit.useMutation({
    onSuccess: () => {
      utils.ideaforge.plans.listByIdea.invalidate({ ideaId });
      utils.ideaforge.planTasks.listByPlan.invalidate();
      utils.ideaforge.ideas.get.invalidate({ id: ideaId });
      setPlanTasks([]);
      setCommittingPlan(false);
    },
    onError: () => setCommittingPlan(false),
  });

  const updateMemory = trpc.ideaforge.memory.upsert.useMutation({
    onSuccess: () => {
      utils.ideaforge.memory.get.invalidate();
    },
  });

  useEffect(() => {
    if (!idea) return;
    setTitle(idea.title);
    setOneLiner(idea.oneLiner || '');
    setNotes(idea.notes || '');
    setStatus(idea.status as (typeof ideaStatuses)[number]);
  }, [idea]);

  useEffect(() => {
    if (!memory?.profile) return;
    setMemoryJson(JSON.stringify(memory.profile, null, 2));
  }, [memory?.profile]);

  useEffect(() => {
    setSelectedWeekId('');
    setSelectedOpportunityId('');
  }, [selectedSprintId]);

  useEffect(() => {
    if (plans.length && !selectedPlanId) {
      setSelectedPlanId(plans[0]?.id ?? null);
    }
  }, [plans, selectedPlanId]);

  useEffect(() => {
    return () => {
      if (ttsUrl) {
        URL.revokeObjectURL(ttsUrl);
      }
    };
  }, [ttsUrl]);

  const { isRecording, audioBlob, startRecording, stopRecording, clearRecording } =
    useAudioRecorder();
  const [transcribing, setTranscribing] = useState(false);

  const handleSaveIdea = () => {
    if (!idea) return;
    updateIdea.mutate({
      id: idea.id,
      title: title.trim(),
      oneLiner: oneLiner.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    });
  };

  const handleMemorySave = () => {
    try {
      const parsed = memoryJson.trim() ? JSON.parse(memoryJson) : {};
      setMemoryError(null);
      updateMemory.mutate({ profile: parsed });
    } catch (error: any) {
      setMemoryError(error?.message || 'Invalid JSON');
    }
  };

  const handleExploreSend = async (message: string) => {
    const response = await fetch('/api/ideaforge/ai/explore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ideaId,
        message,
        mode: exploreMode,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to explore idea');
    }

    const data = await response.json();
    utils.ideaforge.transcripts.list.invalidate({ ideaId });

    if (ttsEnabled && data.reply) {
      const ttsRes = await fetch('/api/ideaforge/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.reply }),
      });

      if (ttsRes.ok) {
        const blob = await ttsRes.blob();
        const url = URL.createObjectURL(blob);
        setTtsUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    }

    return data.reply || '';
  };

  const handleVoiceExplore = async () => {
    if (!audioBlob) return;
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'ideaforge-voice.webm');
      const response = await fetch('/api/notes/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      await handleExploreSend(data.transcript);
      clearRecording();
    } catch (error) {
      console.error('Voice explore failed:', error);
    } finally {
      setTranscribing(false);
    }
  };

  const generatePlan = async () => {
    if (!ideaId) return;
    setGeneratingPlan(true);
    try {
      const response = await fetch('/api/ideaforge/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId, scheduleMode }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      const data = await response.json();
      const tasks = (data.tasks || []).map((task: any) => ({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority ? Number(task.priority) : undefined,
        dueDate: task.dueDate || null,
        budgetPlanned: task.budgetPlanned || '',
        dependencies: task.dependencies || '',
      }));
      setPlanTasks(tasks);
    } catch (error) {
      console.error('Plan generation failed:', error);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleCommitPlan = () => {
    const normalizedTasks = planTasks.filter((task) => task.title.trim().length);
    if (!projectId || normalizedTasks.length === 0) return;
    setCommittingPlan(true);
    commitPlan.mutate({
      ideaId,
      scheduleMode,
      projectId,
      tasks: normalizedTasks.map((task) => ({
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
        budgetPlanned: task.budgetPlanned || undefined,
        dueDate: task.dueDate || undefined,
        dependencies: task.dependencies || undefined,
        sprintId: selectedSprintId || undefined,
        sprintWeekId: selectedWeekId || undefined,
        opportunityId: selectedOpportunityId || undefined,
      })),
    });
  };

  const addEmptyTask = () => {
    setPlanTasks((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        priority: 2,
        dueDate: null,
        budgetPlanned: '',
        dependencies: '',
      },
    ]);
  };

  const updateTask = (index: number, updates: Partial<PlanDraftTask>) => {
    setPlanTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...updates } : task))
    );
  };

  const removeTask = (index: number) => {
    setPlanTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const transcriptsByTime = useMemo(
    () => [...transcripts].reverse(),
    [transcripts]
  );

  if (ideaLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading idea...</div>;
  }

  if (!idea) {
    return <div className="p-6 text-sm text-gray-500">Idea not found.</div>;
  }

  return (
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Link href="/ideaforge" className="inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Ideas
          </Link>
        </div>

        <PageHeader
          icon={Lightbulb}
          title={idea.title}
          subtitle="Explore, plan, and commit this idea into execution."
        />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-3">
                <h3 className="text-sm font-semibold">Idea Details</h3>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Idea title"
                />
                <Input
                  value={oneLiner}
                  onChange={(e) => setOneLiner(e.target.value)}
                  placeholder="One-liner"
                />
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes"
                  className="min-h-[140px]"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Status
                    </label>
                    <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ideaStatuses.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button onClick={handleSaveIdea}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-3">
                <h3 className="text-sm font-semibold">User Memory Profile</h3>
                <Textarea
                  value={memoryJson}
                  onChange={(e) => setMemoryJson(e.target.value)}
                  placeholder='{"strengths":[],"weaknesses":[]}'
                  className="min-h-[180px] font-mono text-xs"
                />
                {memoryError && (
                  <p className="text-xs text-red-600">{memoryError}</p>
                )}
                <Button onClick={handleMemorySave} variant="secondary">
                  <Check className="h-4 w-4 mr-2" />
                  Save Memory
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explore">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">AI Exploration</h3>
                    <p className="text-xs text-gray-500">
                      Use the IdeaForge assistant to pressure-test this idea.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={exploreMode}
                      onValueChange={(value) =>
                        setExploreMode(value as 'freeform' | 'guided' | 'critical')
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freeform">Freeform</SelectItem>
                        <SelectItem value="guided">Guided</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <UnifiedAiChatEmbedded
                  onSendMessage={handleExploreSend}
                  className="bg-transparent"
                  height="h-[520px]"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant="secondary"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {isRecording ? 'Stop Recording' : 'Voice Note'}
                  </Button>
                  <Button
                    onClick={handleVoiceExplore}
                    disabled={!audioBlob || transcribing}
                    variant="outline"
                  >
                    {transcribing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Send Voice to AI
                  </Button>
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={ttsEnabled}
                      onChange={(e) => setTtsEnabled(e.target.checked)}
                    />
                    Speak responses
                  </label>
                  {ttsUrl && (
                    <audio controls src={ttsUrl} className="h-8" />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-3">
                <h3 className="text-sm font-semibold">Transcript History</h3>
                {transcriptsByTime.length === 0 ? (
                  <p className="text-xs text-gray-500">No transcripts yet.</p>
                ) : (
                  <div className="space-y-3 text-xs text-gray-700 max-h-[520px] overflow-auto">
                    {transcriptsByTime.map((item) => (
                      <div key={item.id} className="rounded-lg border p-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{item.role.toUpperCase()}</span>
                          <span>
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plan">
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Plan Draft</h3>
                    <p className="text-xs text-gray-500">
                      Generate tasks, adjust, then commit to Pattern 4.
                    </p>
                  </div>
                  <Button onClick={generatePlan} disabled={generatingPlan}>
                    {generatingPlan ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Plan
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Schedule mode
                    </label>
                    <Select
                      value={scheduleMode}
                      onValueChange={(value) =>
                        setScheduleMode(value as typeof scheduleMode)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Realistic</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                        <SelectItem value="deadline">Deadline-first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Project
                    </label>
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Sprint
                    </label>
                    <Select
                      value={selectedSprintId}
                      onValueChange={(value) => setSelectedSprintId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        {sprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Week
                    </label>
                    <Select
                      value={selectedWeekId}
                      onValueChange={(value) => setSelectedWeekId(value)}
                      disabled={!selectedSprintId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional week" />
                      </SelectTrigger>
                      <SelectContent>
                        {sprintWeeks.map((week) => (
                          <SelectItem key={week.id} value={week.id}>
                            Week {week.weekIndex}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Opportunity
                    </label>
                    <Select
                      value={selectedOpportunityId}
                      onValueChange={(value) => setSelectedOpportunityId(value)}
                      disabled={!selectedSprintId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional opportunity" />
                      </SelectTrigger>
                      <SelectContent>
                        {opportunities.map((opp) => (
                          <SelectItem key={opp.id} value={opp.id}>
                            {opp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  {planTasks.length === 0 ? (
                    <div className="text-xs text-gray-500">
                      No draft tasks yet. Generate a plan or add tasks manually.
                    </div>
                  ) : (
                    planTasks.map((task, index) => (
                      <div
                        key={`task-${index}`}
                        className="rounded-lg border border-gray-200 bg-white p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            value={task.title}
                            onChange={(e) =>
                              updateTask(index, { title: e.target.value })
                            }
                            placeholder="Task title"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(index)}
                          >
                            Remove
                          </Button>
                        </div>
                        <Textarea
                          value={task.description}
                          onChange={(e) =>
                            updateTask(index, { description: e.target.value })
                          }
                          placeholder="Description"
                          className="min-h-[80px]"
                        />
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500">
                              Priority
                            </label>
                            <Select
                              value={task.priority ? String(task.priority) : ''}
                              onValueChange={(value) =>
                                updateTask(index, {
                                  priority: value ? Number(value) : undefined,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500">
                              Due date
                            </label>
                            <Input
                              type="date"
                              value={task.dueDate || ''}
                              onChange={(e) =>
                                updateTask(index, { dueDate: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-gray-500">
                              Budget planned
                            </label>
                            <Input
                              value={task.budgetPlanned}
                              onChange={(e) =>
                                updateTask(index, {
                                  budgetPlanned: e.target.value,
                                })
                              }
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        <Input
                          value={task.dependencies}
                          onChange={(e) =>
                            updateTask(index, { dependencies: e.target.value })
                          }
                          placeholder="Dependencies (comma-separated)"
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={addEmptyTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                  <Button
                    onClick={handleCommitPlan}
                    disabled={!projectId || planTasks.length === 0 || committingPlan}
                  >
                    {committingPlan ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Commit to Pattern 4
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-3">
                <h3 className="text-sm font-semibold">Plan History</h3>
                {plans.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No committed plans yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full text-left rounded-lg border px-3 py-2 text-xs ${
                          plan.id === selectedPlanId
                            ? 'border-indigo-300 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>v{plan.version}</span>
                          <span className="text-gray-500">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-500">
                          Mode: {plan.scheduleMode}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedPlanId && committedPlanTasks.length > 0 && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="text-xs font-semibold text-gray-600">
                      Tasks
                    </div>
                    {committedPlanTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-gray-200 p-2"
                      >
                        <div className="text-xs font-semibold">{task.title}</div>
                        {task.description && (
                          <p className="text-[11px] text-gray-500">
                            {task.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}