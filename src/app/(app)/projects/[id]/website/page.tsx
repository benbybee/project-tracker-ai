'use client';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useParams } from 'next/navigation';

export default function WebsiteProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="px-6 py-4">
      <h1 className="text-2xl font-semibold mb-4">Website Project Board</h1>
      <KanbanBoard projectId={id} variant="website" />
    </div>
  );
}
