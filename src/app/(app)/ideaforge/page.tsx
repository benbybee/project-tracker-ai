'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Lightbulb, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const deleteIdea = trpc.ideaforge.ideas.remove.useMutation({
    onSuccess: () => {
      utils.ideaforge.ideas.list.invalidate();
    },
  });

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

  const handleDelete = (ideaId: string) => {
    const idea = ideas.find((item) => item.id === ideaId);
    setDeleteTarget(
      idea ? { id: idea.id, title: idea.title } : { id: ideaId, title: 'Idea' }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteIdea.mutate({ id: deleteTarget.id });
    setDeleteTarget(null);
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
                <div
                  key={idea.id}
                  className="rounded-lg border border-gray-200 bg-white hover:border-indigo-200 transition-colors p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/ideaforge/${idea.id}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {idea.title}
                      </Link>
                      <span
                        className={cn(
                          'text-xs font-semibold px-2 py-1 rounded-full',
                          statusStyles[idea.status] ?? 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {idea.status}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(idea.id)}
                      aria-label="Delete idea"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  {idea.oneLiner && (
                    <p className="text-sm text-gray-600">{idea.oneLiner}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Updated {new Date(idea.updatedAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/ideaforge/${idea.id}`}
                      className="inline-flex items-center gap-1 text-indigo-600"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete idea?</DialogTitle>
            <DialogDescription>
              This will permanently remove “{deleteTarget?.title}” and its related data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
