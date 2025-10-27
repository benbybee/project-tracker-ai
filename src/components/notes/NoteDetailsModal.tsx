'use client';

import { useState } from 'react';
import type { Note, ProposedTask } from '@/types/note';
import { Sparkles, Loader2, Edit, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteDetailsModalProps {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTasksAccepted: () => void;
}

export function NoteDetailsModal({
  note,
  onClose,
  onEdit,
  onDelete,
  onTasksAccepted,
}: NoteDetailsModalProps) {
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [summary, setSummary] = useState('');
  const [proposed, setProposed] = useState<ProposedTask[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/notes/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const data = await response.json();
      setSummary(data.summary || '');
      setProposed(
        (data.tasks || []).map((t: any) => ({ ...t, accepted: false }))
      );
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      alert('Failed to generate tasks. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptSelected = async () => {
    const selected = proposed.filter((p) => p.accepted);
    if (selected.length === 0) return;

    setAccepting(true);
    try {
      const response = await fetch('/api/notes/tasks/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id, tasks: selected }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tasks');
      }

      // Clear state and notify parent
      setSummary('');
      setProposed([]);
      onTasksAccepted();
    } catch (error) {
      console.error('Failed to accept tasks:', error);
      alert('Failed to create tasks. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{note.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>📁 {note.projectName}</span>
                <span>📅 {formatDate(note.createdAt)}</span>
                {note.noteType === 'audio' && note.audioDuration && (
                  <span>🎙️ {formatDuration(note.audioDuration)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateTasks}
                  disabled={generating}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Tasks
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Audio Player */}
            {note.noteType === 'audio' && note.audioUrl && (
              <section className="rounded-lg border p-3 bg-purple-50">
                <div className="text-xs text-purple-700 mb-2 font-medium flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Audio Recording
                </div>
                <audio src={note.audioUrl} controls className="w-full" />
              </section>
            )}

            {/* Content */}
            <section className="rounded-lg border p-4 bg-gray-50">
              <div className="text-xs text-gray-600 mb-2 font-medium">
                {note.noteType === 'audio' ? 'Transcript' : 'Content'}
              </div>
              <div className="text-sm whitespace-pre-wrap">{note.content}</div>
            </section>

            {/* AI Summary */}
            {summary && (
              <section className="rounded-lg border p-3 bg-blue-50">
                <div className="text-xs text-blue-700 mb-1 font-medium">
                  AI Analysis
                </div>
                <div className="text-sm whitespace-pre-wrap">{summary}</div>
              </section>
            )}

            {/* Proposed Tasks */}
            {proposed.length > 0 && (
              <section className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">
                    Proposed Tasks ({proposed.length})
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const updated = proposed.map((p) => ({
                          ...p,
                          accepted: true,
                        }));
                        setProposed(updated);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        const updated = proposed.map((p) => ({
                          ...p,
                          accepted: false,
                        }));
                        setProposed(updated);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleAcceptSelected}
                      disabled={!proposed.some((p) => p.accepted) || accepting}
                      className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Accept Selected (
                          {proposed.filter((p) => p.accepted).length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {proposed.map((p, idx) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-1 lg:grid-cols-[1fr_100px_80px] gap-3 rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-sm">{p.title}</div>
                        {p.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {p.description}
                          </div>
                        )}
                        {p.estimatedHours && (
                          <div className="text-xs text-blue-600 mt-1">
                            ⏱️ ~{p.estimatedHours}h estimated
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newProposed = [...proposed];
                            newProposed[idx].title =
                              prompt('Edit task title:', p.title) || p.title;
                            setProposed(newProposed);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            const newProposed = proposed.filter(
                              (_, i) => i !== idx
                            );
                            setProposed(newProposed);
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-sm justify-center">
                        <input
                          type="checkbox"
                          checked={!!p.accepted}
                          onChange={(e) => {
                            const newProposed = [...proposed];
                            newProposed[idx].accepted = e.target.checked;
                            setProposed(newProposed);
                          }}
                          className="rounded border-gray-300"
                        />
                        Accept
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={onEdit}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Note
              </Button>
              <Button
                onClick={onDelete}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Note
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
