'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { FileText, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { NoteCard } from '@/components/notes/NoteCard';
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

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
              />
            ))}
          </div>
        )}

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
