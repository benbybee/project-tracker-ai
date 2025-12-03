'use client';

import { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Mic,
  Play,
  Pause,
  Square,
  Trash2,
  Loader2,
  Paperclip,
  X,
} from 'lucide-react';
import type { Note } from '@/types/note';

interface ProjectNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  projectId: string;
  projectName: string;
  editNote?: Note | null;
}

type NoteMode = 'text' | 'audio';

export function ProjectNoteModal({
  isOpen,
  onClose,
  onSaved,
  projectId,
  projectName,
  editNote,
}: ProjectNoteModalProps) {
  const [mode, setMode] = useState<NoteMode>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error: recordingError,
  } = useAudioRecorder();

  // Reset form when modal opens/closes or edit note changes
  useEffect(() => {
    if (isOpen) {
      if (editNote) {
        setTitle(editNote.title);
        setContent(editNote.content);
        setMode(editNote.noteType);
        setAttachments([]);
      } else {
        setTitle('');
        setContent('');
        setMode('text');
        setAttachments([]);
        clearRecording();
      }
    }
  }, [isOpen, editNote, clearRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;

    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (title) {
        formData.append('prompt', `This is a note about: ${title}`);
      }

      const response = await fetch('/api/notes/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const data = await response.json();
      setContent(data.transcript);
    } catch (error: any) {
      console.error('Transcription error:', error);
      alert(error.message || 'Failed to transcribe audio. Please try again.');
    } finally {
      setTranscribing(false);
    }
  };

  // Auto-transcribe when recording stops
  useEffect(() => {
    if (audioBlob && mode === 'audio' && !isRecording) {
      handleTranscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, isRecording]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const endpoint = editNote ? '/api/notes/update' : '/api/notes/create';
      const method = editNote ? 'PUT' : 'POST';

      // For editing, always use JSON (attachments not supported for edits yet)
      if (editNote) {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editNote.id, title, content }),
        });

        if (!response.ok) {
          throw new Error('Failed to save note');
        }
      } else {
        // For creating new notes, use FormData if there are attachments
        if (attachments.length > 0) {
          const formData = new FormData();
          formData.append('projectId', projectId);
          formData.append('title', title);
          formData.append('content', content);
          formData.append('noteType', mode);
          if (mode === 'audio' && duration) {
            formData.append('audioDuration', duration.toString());
          }

          // Add all attachments
          attachments.forEach((file) => {
            formData.append('files', file);
          });

          const response = await fetch(endpoint, {
            method,
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to save note');
          }
        } else {
          // Use JSON if no attachments
          const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              title,
              content,
              noteType: mode,
              audioDuration: mode === 'audio' ? duration : null,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save note');
          }
        }
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canSave = title.trim() && content.trim() && !saving;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Display (Read-only) */}
          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border text-sm text-gray-700">
              {projectName}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
            />
          </div>

          {/* Mode Toggle (only for new notes) */}
          {!editNote && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Input Method
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    mode === 'text'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Text</span>
                </button>
                <button
                  onClick={() => setMode('audio')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    mode === 'audio'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                  <span className="font-medium">Audio</span>
                </button>
              </div>
            </div>
          )}

          {/* Text Mode */}
          {mode === 'text' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your notes here..."
                rows={10}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Audio Mode */}
          {mode === 'audio' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Recording</label>

              {/* Recording Controls */}
              <div className="flex items-center gap-2">
                {!isRecording && !audioBlob && (
                  <Button
                    onClick={startRecording}
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </Button>
                )}

                {isRecording && (
                  <>
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                    <Button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      )}
                    </Button>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  </>
                )}

                {audioBlob && !isRecording && (
                  <Button
                    onClick={clearRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Recording
                  </Button>
                )}
              </div>

              {recordingError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {recordingError}
                </div>
              )}

              {/* Audio Playback */}
              {audioUrl && (
                <div className="p-3 border rounded-lg bg-gray-50">
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              )}

              {/* Transcription */}
              {transcribing && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing audio...
                </div>
              )}

              {content && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transcript{' '}
                    <span className="text-xs text-gray-500">(editable)</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Transcript will appear here..."
                    rows={8}
                    className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* File Attachments (only for new notes) */}
          {!editNote && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Attachments (optional)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="project-note-file-input"
                  />
                  <label
                    htmlFor="project-note-file-input"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Files</span>
                  </label>
                  {attachments.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {attachments.length} file
                      {attachments.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>

                {/* Display selected files */}
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                          type="button"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Note'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
