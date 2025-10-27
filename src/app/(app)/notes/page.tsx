'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { FileText, Plus, Search, Mic, Eye, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { NoteModal } from '@/components/notes/NoteModal';
import { NoteDetailsModal } from '@/components/notes/NoteDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Note } from '@/types/note';

export const dynamic = 'force-dynamic';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: projects } = trpc.projects.list.useQuery({});

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const url = '/api/notes/list';
      const response = await fetch(url);
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Filter notes based on search and filters
  useEffect(() => {
    let filtered = [...notes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((note) => note.projectId === projectFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((note) => note.noteType === typeFilter);
    }

    setFilteredNotes(filtered);
  }, [notes, searchQuery, projectFilter, typeFilter]);

  const handleCreateNote = () => {
    setEditingNote(null);
    setShowNoteModal(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowNoteModal(true);
    setShowDetailsModal(false);
  };

  const handleNoteClick = (note: Note) => {
    setActiveNote(note);
    setShowDetailsModal(true);
  };

  const handleNoteSaved = () => {
    fetchNotes();
    setShowNoteModal(false);
    setEditingNote(null);
  };

  const handleDeleteNote = async (note: Note) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/delete?id=${note.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      fetchNotes();
      setShowDetailsModal(false);
      setActiveNote(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const handleTasksAccepted = () => {
    fetchNotes();
    setShowDetailsModal(false);
    setActiveNote(null);
  };

  // Get unique projects for filtering
  const uniqueProjects = Array.from(
    new Map(
      notes.map((n) => [n.projectId, { id: n.projectId, name: n.projectName }])
    ).values()
  ).filter((p) => p.name);

  return (
    <div className="px-4 sm:px-6 md:px-2 py-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={FileText}
          title="Notes"
          subtitle="Create and manage project notes with AI task generation"
          badge={notes.length}
          actions={
            <Button
              onClick={handleCreateNote}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          }
        />

        {/* Filters */}
        <div className="rounded-xl border bg-white/80 backdrop-blur p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 lg:gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-sm font-medium flex-shrink-0">
                Project:
              </label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium flex-shrink-0">Type:</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Desktop Notes Table */}
        <div className="hidden md:block rounded-xl border bg-white/80 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content Preview
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    onOpen={() => handleNoteClick(note)}
                    onDelete={() => handleDeleteNote(note)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredNotes.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-2">No notes found</p>
              <p className="text-sm text-gray-500">
                {notes.length === 0 ? (
                  <>
                    Create your first note to get started with AI-powered task
                    generation
                  </>
                ) : (
                  'Try adjusting your filters or search query'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Notes Card View */}
        <div className="block md:hidden">
          {filteredNotes.length === 0 && !loading ? (
            <div className="text-center py-12 rounded-xl border bg-white/80">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                {notes.length === 0 ? 'No notes yet' : 'No notes found'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {notes.length === 0
                  ? 'Create your first note to get started with AI-powered task generation'
                  : 'Try adjusting your filters or search query'}
              </p>
              {notes.length === 0 && (
                <Button
                  onClick={handleCreateNote}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Note
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <MobileNoteCard
                  key={note.id}
                  note={note}
                  onOpen={() => handleNoteClick(note)}
                  onDelete={() => handleDeleteNote(note)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Note Modal */}
        {showNoteModal && (
          <NoteModal
            isOpen={showNoteModal}
            onClose={() => {
              setShowNoteModal(false);
              setEditingNote(null);
            }}
            onSaved={handleNoteSaved}
            editNote={editingNote}
          />
        )}

        {/* Note Details Modal */}
        {showDetailsModal && activeNote && (
          <NoteDetailsModal
            note={activeNote}
            onClose={() => {
              setShowDetailsModal(false);
              setActiveNote(null);
            }}
            onEdit={() => handleEditNote(activeNote)}
            onDelete={() => handleDeleteNote(activeNote)}
            onTasksAccepted={handleTasksAccepted}
          />
        )}
      </div>
    </div>
  );
}

function NoteRow({
  note,
  onOpen,
  onDelete,
}: {
  note: Note;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContentSnippet = (content: string) => {
    return content.length > 100 ? `${content.slice(0, 100)}...` : content;
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm">
        {note.noteType === 'audio' ? (
          <div className="flex items-center gap-1 text-purple-600">
            <Mic className="h-4 w-4" />
            <span className="text-xs">Audio</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-blue-600">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Text</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
        {note.title}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{note.projectName}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
        {getContentSnippet(note.content)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {note.noteType === 'audio' && note.audioDuration
          ? formatDuration(note.audioDuration)
          : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDate(note.createdAt)}
      </td>
      <td className="px-4 py-3">
        {note.tasksGenerated ? (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Tasks Created
          </span>
        ) : (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            No Tasks
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpen}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Open note details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 p-1"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MobileNoteCard({
  note,
  onOpen,
  onDelete,
}: {
  note: Note;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border bg-white/80 backdrop-blur p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {note.noteType === 'audio' ? (
              <Mic className="h-5 w-5 text-purple-600 flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
            <h3 className="font-medium text-gray-900">{note.title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs text-gray-600">📁 {note.projectName}</span>
            <span className="text-xs text-gray-600">
              📅 {formatDate(note.createdAt)}
            </span>
            {note.noteType === 'audio' && note.audioDuration && (
              <span className="text-xs text-gray-600">
                🎙️ {formatDuration(note.audioDuration)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {note.content}
          </p>
          {note.tasksGenerated && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Tasks Created
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
        <button
          onClick={onOpen}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete note"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
