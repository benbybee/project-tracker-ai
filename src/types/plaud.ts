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

