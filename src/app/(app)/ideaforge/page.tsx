'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Lightbulb, Plus, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const statusStyles: Record<string, string> = {
  INBOX: 'bg-slate-100 text-slate-700',
  EXPLORING: 'bg-indigo-100 text-indigo-700',
  VALIDATING: 'bg-amber-100 text-amber-700',
  PLANNED: 'bg-blue-100 text-blue-700',
  EXECUTING: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-gray-200 text-gray-700',
};

export default function IdeaForgePage() {
  const utils = trpc.useUtils();
  const { data: ideas = [], isLoading } = trpc.ideaforge.ideas.list.useQuery();

  const [title, setTitle] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const createIdea = trpc.ideaforge.ideas.create.useMutation({
    onSuccess: () => {
      utils.ideaforge.ideas.list.invalidate();
      setTitle('');
      setOneLiner('');
      setNotes('');
      setSaving(false);
    },
    onError: () => setSaving(false),
  });

  const sortedIdeas = useMemo(
    () =>
      [...ideas].sort((a, b) => {
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return bTime - aTime;
      }),
    [ideas]
  );

  const handleCreate = () => {
    if (!title.trim()) return;
    setSaving(true);
    createIdea.mutate({
      title: title.trim(),
      oneLiner: oneLiner.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Lightbulb}
          title="IdeaForge"
          subtitle="Capture, explore, and commit ideas into execution."
          badge={ideas.length}
        />

        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-3">
          <h3 className="text-sm font-semibold">New Idea</h3>
          <div className="grid gap-3">
            <Input
              placeholder="Idea title (required)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="One-liner (optional)"
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
            />
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[110px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={saving || !title.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Idea
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Ideas</h3>
            <span className="text-xs text-gray-500">
              {sortedIdeas.length} total
            </span>
          </div>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading ideas...</div>
          ) : sortedIdeas.length === 0 ? (
            <div className="text-sm text-gray-500">
              No ideas yet. Capture your first idea above.
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideaforge/${idea.id}`}
                  className="rounded-lg border border-gray-200 bg-white hover:border-indigo-200 transition-colors p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-gray-900">
                      {idea.title}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-1 rounded-full',
                        statusStyles[idea.status] ?? 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {idea.status}
                    </span>
                  </div>
                  {idea.oneLiner && (
                    <p className="text-sm text-gray-600">{idea.oneLiner}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Updated {new Date(idea.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-indigo-600">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
