export type PlaudPendingItem = {
  id: string;
  createdAt: string;
  title: string;
  description?: string | null;
  confidence?: number | null;
  sourceId?: string | null; // e.g., Drive file id or transcript id
  suggestedProjectName?: string | null;
};

export type PlaudAcceptTask = {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectNameNew?: string;
};

// Plaud share link import types
export type PlaudShareLink = string;

export type PlaudImportRequest = {
  shareUrl: string;
  projectId?: string;
};

export type PlaudImportResponse = {
  success: boolean;
  tasksCreated: number;
  summary?: string;
  transcript?: string;
  title?: string;
  tasks?: Array<{
    id: string;
    title: string;
    description?: string;
    confidence?: number;
  }>;
};

export type PlaudAudioData = {
  audioUrl: string;
  title?: string;
  transcript?: string;
  duration?: number;
};
