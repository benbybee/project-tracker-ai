export type NoteType = 'text' | 'audio';

export type NoteAttachment = {
  id: string;
  noteId: string;
  createdAt: string;
  fileName: string;
  fileSize?: number | null;
  url?: string | null;
};

export type Note = {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  content: string;
  noteType: NoteType;
  audioUrl?: string | null;
  audioDuration?: number | null;
  tasksGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  projectName?: string;
  attachments?: NoteAttachment[];
};

export type CreateNoteInput = {
  projectId: string;
  title: string;
  content: string;
  noteType: NoteType;
  audioUrl?: string;
  audioDuration?: number;
};

export type UpdateNoteInput = {
  id: string;
  title?: string;
  content?: string;
};

export type ProposedTask = {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  accepted?: boolean;
  estimatedHours?: number;
};
