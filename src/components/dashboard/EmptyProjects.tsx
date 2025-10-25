import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { Plus } from 'lucide-react';

export function EmptyProjects() {
  return (
    <GlassCard className="text-center py-10">
      <div className="text-lg font-semibold">No projects yet</div>
      <p className="text-sm text-slate-500 mt-1">
        Create a project to start organizing tasks, roles, and boards.
      </p>
      <Link
        href="/projects/new"
        className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-white"
        style={{ backgroundImage: 'var(--grad-primary)' }}
      >
        <Plus className="h-4 w-4" /> Create Project
      </Link>
    </GlassCard>
  );
}
