'use client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function QuickAddTask({
  projectId,
  defaultRoleId,
}: {
  projectId: number | string;
  defaultRoleId?: number | string | null;
}) {
  const [title, setTitle] = useState('');
  const utils = trpc.useUtils();
  const create = trpc.tasks.create.useMutation({
    onSuccess: async () => {
      setTitle('');
      await utils.tasks.invalidate();
    },
  });

  return (
    <div className="flex items-center gap-2 pt-6 pb-4">
      <Input
        placeholder="Quick add task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && title.trim()) handleCreate();
        }}
        className="bg-white/60 border-white/50 backdrop-blur"
      />
      <Button onClick={handleCreate} disabled={!title.trim()}>
        Add
      </Button>
    </div>
  );

  function handleCreate() {
    if (!title.trim()) return;
    create.mutate({
      projectId: String(projectId),
      title: title.trim(),
      roleId: defaultRoleId ? String(defaultRoleId) : undefined, // server will inherit if undefined
      status: 'not_started',
      priorityScore: '2',
      isDaily: false,
    });
  }
}
