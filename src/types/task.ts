export type TaskStatus =
  | 'not_started'
  | 'content'
  | 'design'
  | 'dev'
  | 'qa'
  | 'launch'
  | 'in_progress'
  | 'blocked'
  | 'completed';

export type Role = {
  id: string;
  name: string;
  color: string;
};

export type Subtask = {
  id: number | string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  projectId?: string | null;
  projectName?: string | null;
  roleId?: string | null;
  role?: Role | string | null;
  ticketId?: string | null; // Associated support ticket
  ticketStatus?: string; // Status of associated ticket
  ticketTaskCount?: number; // Number of tasks in ticket
  dueDate?: string | null; // ISO
  updatedAt?: string | null; // ISO
  createdAt?: string | null; // ISO
  version?: number;
  priorityScore?: 1 | 2 | 3 | 4 | '1' | '2' | '3' | '4' | null;
  isDaily?: boolean;
  archived?: boolean;
  subtasks?: Subtask[];
  isRecurring?: boolean;
  recurrenceRule?: any;
};
