export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'new' | 'in_review' | 'responded' | 'converted' | 'closed';

export type Ticket = {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  projectName: string;
  domain?: string | null;
  details: string;
  dueDateSuggested?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  aiEta?: string | null;     // ISO date
  aiSummary?: string | null;
  suggestedProjectId?: string | null;
  attachments?: Array<{ id: string; name: string; url?: string; size?: number }> | null;
};

export type TicketReply = {
  id: string;
  ticketId: string;
  createdAt: string;
  author: 'admin' | 'requester';
  message: string;
};

export type TicketAttachment = {
  id: string;
  ticketId: string;
  createdAt: string;
  fileName: string;
  fileSize?: number | null;
  url?: string | null;
};

