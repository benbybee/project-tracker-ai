'use client';

import { FileText, Mic, Calendar, FolderOpen } from 'lucide-react';
import type { Note } from '@/types/note';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContentSnippet = (content: string) => {
    return content.length > 150 ? `${content.slice(0, 150)}...` : content;
  };

  return (
    <div
      className="rounded-xl border bg-white/80 backdrop-blur p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {note.noteType === 'audio' ? (
            <Mic className="h-5 w-5 text-purple-600 flex-shrink-0" />
          ) : (
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
          )}
          <h3 className="font-medium text-gray-900 truncate">{note.title}</h3>
        </div>

        {note.noteType === 'audio' && note.audioDuration && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatDuration(note.audioDuration)}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
        {getContentSnippet(note.content)}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <FolderOpen className="h-3.5 w-3.5" />
            <span>{note.projectName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(note.createdAt)}</span>
          </div>
        </div>

        {note.tasksGenerated && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Tasks Generated
          </span>
        )}
      </div>
    </div>
  );
}
